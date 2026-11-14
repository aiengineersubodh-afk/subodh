import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { registerSchema } from "@/lib/validations";
import {
  createNotification,
  hashPassword,
  logActivity,
  readDb,
  sanitizeProfile,
  writeDb,
} from "@/lib/db";
import { createSignedToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { Profile } from "@/types/database";
import { getSupabaseServiceClient, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Security Gate: Strict prevention of self-assigned administrative role
    if (body.role === "admin" || (body as Record<string, unknown>).is_admin) {
      return NextResponse.json(
        { error: "Self-assignment of administrative privileges is forbidden." },
        { status: 403 }
      );
    }

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Validation failed." },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Additional defense against role tampering
    if (data.role !== "student" && data.role !== "scholar") {
      return NextResponse.json(
        { error: "Invalid role selected for registration." },
        { status: 400 }
      );
    }

    const db = readDb();

    // Check platform registration settings
    if (!db.website_settings.allow_registrations) {
      return NextResponse.json(
        { error: "New registrations are currently disabled by the administrator." },
        { status: 403 }
      );
    }
    if (data.role === "student" && !db.website_settings.allow_student_registrations) {
      return NextResponse.json(
        { error: "Student registrations are currently paused." },
        { status: 403 }
      );
    }
    if (data.role === "scholar" && !db.website_settings.allow_scholar_registrations) {
      return NextResponse.json(
        { error: "PhD Scholar registrations are currently paused." },
        { status: 403 }
      );
    }

    const existing = db.profiles.find(
      (p) => p.email.toLowerCase() === data.email.toLowerCase() && !p.deleted_at
    );
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const profileId = `usr-${data.role}-${crypto.randomUUID().slice(0, 8)}`;

    const newProfile: Profile = {
      id: profileId,
      email: data.email.trim(),
      password_hash: hashPassword(data.password),
      full_name: data.full_name.trim(),
      avatar_url:
        data.role === "scholar"
          ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
          : "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80",
      phone: data.phone.trim(),
      country: data.country.trim(),
      state: data.state.trim(),
      city: data.city.trim(),
      role: data.role,
      status: "active",
      email_verified: true,
      onboarding_completed: false,
      created_at: now,
      updated_at: now,
    };

    // 1. Supabase Auth Sync
    if (isSupabaseConfigured()) {
      const supabaseAdmin = getSupabaseServiceClient();
      if (supabaseAdmin) {
        try {
          const { data: authUser, error: authErr } =
            await supabaseAdmin.auth.admin.createUser({
              email: data.email.trim(),
              password: data.password,
              email_confirm: true,
              user_metadata: {
                full_name: data.full_name.trim(),
                role: data.role,
                profile_id: profileId,
              },
            });

          if (!authErr && authUser?.user) {
            // Also upsert profile and user_roles to Supabase PostgreSQL if tables exist
            await supabaseAdmin.from("profiles").upsert(
              {
                id: profileId,
                email: newProfile.email,
                full_name: newProfile.full_name,
                avatar_url: newProfile.avatar_url,
                phone: newProfile.phone,
                country: newProfile.country,
                state: newProfile.state,
                city: newProfile.city,
                role: newProfile.role,
                status: newProfile.status,
                email_verified: newProfile.email_verified,
                onboarding_completed: newProfile.onboarding_completed,
                created_at: now,
                updated_at: now,
              },
              { onConflict: "id" }
            );

            await supabaseAdmin.from("user_roles").upsert(
              {
                id: `role-${crypto.randomUUID().slice(0, 8)}`,
                user_id: profileId,
                role: data.role,
                granted_at: now,
              },
              { onConflict: "id" }
            );
          }
        } catch (supabaseAuthErr) {
          console.warn("Supabase auth sync encountered error, fallback active:", supabaseAuthErr);
        }
      }
    }

    db.profiles.push(newProfile);

    // Welcome notification
    createNotification(db, {
      recipient_profile_id: profileId,
      title: "Welcome to STARSKY!",
      message:
        data.role === "scholar"
          ? "Complete your PhD Scholar research profile to publish internships and mentor students."
          : "Complete your Student academic profile to explore researchers and apply for internships.",
      type: "info",
      link_url: data.role === "scholar" ? "/onboarding/scholar" : "/onboarding/student",
    });

    // Notify Admins if a new PhD Scholar registers
    if (data.role === "scholar") {
      const admins = db.profiles.filter((p) => p.role === "admin" && p.status === "active");
      for (const admin of admins) {
        createNotification(db, {
          recipient_profile_id: admin.id,
          title: "New PhD Scholar Registration",
          message: `${newProfile.full_name} (${newProfile.email}) registered as a PhD Scholar.`,
          type: "warning",
          link_url: "/admin/scholars",
        });
      }
    }

    logActivity(db, {
      actor_profile_id: profileId,
      actor_name: newProfile.full_name,
      actor_role: newProfile.role,
      action: `Registered as ${newProfile.role === "scholar" ? "PhD Scholar" : "Student"}`,
      entity_type: "profiles",
      entity_id: profileId,
      details: `New ${newProfile.role} account created (${newProfile.email}).`,
    });

    writeDb(db);

    const token = createSignedToken(profileId, newProfile.role);
    const redirectUrl =
      newProfile.role === "scholar" ? "/onboarding/scholar" : "/onboarding/student";

    const res = NextResponse.json({
      user: sanitizeProfile(newProfile),
      redirectUrl,
    });

    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration." },
      { status: 500 }
    );
  }
}

