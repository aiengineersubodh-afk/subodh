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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Validation failed." },
        { status: 400 }
      );
    }

    const data = parsed.data;
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

