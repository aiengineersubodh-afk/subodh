import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validations";
import { hashPassword, logActivity, readDb, sanitizeProfile, writeDb } from "@/lib/db";
import { createSignedToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { ensureAdminBootstrapped, syncAdminToSupabaseAuth } from "@/lib/admin-bootstrap";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid login credentials." },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const isAdminPortal = Boolean(body.adminPortal);

    const db = readDb();
    let profile = db.profiles.find(
      (p) => p.email.toLowerCase() === email.toLowerCase() && !p.deleted_at
    );

    let authPassed = false;

    // Check environment-configured Admin credentials bootstrap & authentication
    const envAdminEmail = process.env.STARSKY_ADMIN_EMAIL?.trim();
    const envAdminPassword = process.env.STARSKY_ADMIN_PASSWORD?.trim();

    if (
      envAdminEmail &&
      envAdminPassword &&
      email.trim().toLowerCase() === envAdminEmail.toLowerCase() &&
      (password === envAdminPassword || password.trim() === envAdminPassword)
    ) {
      // 1. Guarantee Admin is bootstrapped and up-to-date in database store
      if (ensureAdminBootstrapped(db)) {
        writeDb(db);
      }

      // Re-fetch profile to ensure accurate state
      profile =
        db.profiles.find(
          (p) => p.email.toLowerCase() === envAdminEmail.toLowerCase() && !p.deleted_at
        ) || db.profiles.find((p) => p.role === "admin" && !p.deleted_at);

      if (profile) {
        authPassed = true;

        // Sync to Supabase Auth in background if Supabase is active
        if (isSupabaseConfigured()) {
          syncAdminToSupabaseAuth(
            envAdminEmail,
            envAdminPassword,
            profile.id,
            profile.full_name
          ).catch((e) => {
            console.warn(
              "[Admin Supabase Sync Background]",
              e instanceof Error ? e.message : String(e)
            );
          });
        }
      }
    }

    // 1. Try Supabase Auth verification if configured (for non-env-admin or general accounts)
    if (!authPassed && isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { error: supaErr } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (!supaErr) {
            authPassed = true;
          }
        } catch {
          // fallback to local password verification
        }
      }
    }

    // 2. Fallback to Local Password Hash Verification
    if (!authPassed) {
      if (profile && profile.password_hash === hashPassword(password)) {
        authPassed = true;
      }
    }

    if (!profile) {
      return NextResponse.json(
        {
          error:
            "We couldn't find an account matching those details. Please check your email or create a new STARSKY account.",
          code: "ACCOUNT_NOT_FOUND",
          accountNotFound: true,
        },
        { status: 404 }
      );
    }

    if (!authPassed) {
      return NextResponse.json(
        { error: "Invalid email or password. Please check your credentials." },
        { status: 401 }
      );
    }

    if (profile.status === "suspended") {
      return NextResponse.json(
        { error: "Your account has been suspended by the platform administrator." },
        { status: 403 }
      );
    }

    if (profile.status === "inactive") {
      return NextResponse.json(
        { error: "Your account is currently deactivated. Please contact support." },
        { status: 403 }
      );
    }

    if (isAdminPortal && profile.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Only authorized administrators can sign in through the Admin Portal." },
        { status: 403 }
      );
    }

    logActivity(db, {
      actor_profile_id: profile.id,
      actor_name: profile.full_name,
      actor_role: profile.role,
      action: "User Login",
      entity_type: "profiles",
      entity_id: profile.id,
      details: `${profile.full_name} (${profile.role}) signed in.`,
    });
    writeDb(db);

    const token = createSignedToken(profile.id, profile.role);
    const requestedRedirect =
      body.redirect &&
      typeof body.redirect === "string" &&
      body.redirect.startsWith("/") &&
      !body.redirect.startsWith("//")
        ? body.redirect
        : null;

    let defaultDashboardUrl = "/dashboard/student";
    if (profile.role === "admin") {
      defaultDashboardUrl = "/admin";
    } else if (profile.role === "scholar") {
      defaultDashboardUrl = profile.onboarding_completed
        ? "/dashboard/scholar"
        : "/onboarding/scholar";
    } else {
      defaultDashboardUrl = profile.onboarding_completed
        ? "/dashboard/student"
        : "/onboarding/student";
    }

    let redirectUrl = defaultDashboardUrl;
    if (requestedRedirect) {
      const isTargetingAdmin =
        requestedRedirect.startsWith("/admin") && requestedRedirect !== "/admin/login";
      const isTargetingScholar = requestedRedirect.startsWith("/dashboard/scholar");
      const isTargetingStudent = requestedRedirect.startsWith("/dashboard/student");

      if (isTargetingAdmin) {
        redirectUrl = profile.role === "admin" ? requestedRedirect : defaultDashboardUrl;
      } else if (isTargetingScholar) {
        redirectUrl = profile.role === "scholar" ? requestedRedirect : defaultDashboardUrl;
      } else if (isTargetingStudent) {
        redirectUrl = profile.role === "student" ? requestedRedirect : defaultDashboardUrl;
      } else {
        redirectUrl = requestedRedirect;
      }
    }

    const rememberMe = Boolean(parsed.data.remember_me);
    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7;

    const res = NextResponse.json({
      user: sanitizeProfile(profile),
      redirectUrl,
    });

    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "An unexpected server error occurred during login." },
      { status: 500 }
    );
  }
}

