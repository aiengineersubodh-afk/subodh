import { NextRequest, NextResponse } from "next/server";
import { hashPassword, logActivity, readDb, writeDb } from "@/lib/db";
import { getSessionContext } from "@/lib/auth";
import { getSupabaseServiceClient, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, newPassword } = body;

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const session = await getSessionContext();
    const db = readDb();

    const targetEmail = session ? session.user.email : email;
    if (!targetEmail) {
      return NextResponse.json(
        { error: "Email address is required for password reset." },
        { status: 400 }
      );
    }

    const profile = db.profiles.find(
      (p) => p.email.toLowerCase() === String(targetEmail).toLowerCase() && !p.deleted_at
    );

    if (!profile) {
      return NextResponse.json(
        { error: "No active account found with that email address." },
        { status: 404 }
      );
    }

    // 1. Supabase Auth sync
    if (isSupabaseConfigured()) {
      const supabaseAdmin = getSupabaseServiceClient();
      if (supabaseAdmin) {
        try {
          const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
          const authUser = userList?.users?.find(
            (u) => u.email?.toLowerCase() === profile.email.toLowerCase()
          );
          if (authUser) {
            await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
              password: newPassword,
            });
          }
        } catch (supaErr) {
          console.warn("Supabase auth password update error, local fallback active:", supaErr);
        }
      }
    }

    // 2. Local store update
    profile.password_hash = hashPassword(newPassword);
    profile.updated_at = new Date().toISOString();

    logActivity(db, {
      actor_profile_id: profile.id,
      actor_name: profile.full_name,
      actor_role: profile.role,
      action: "Password Updated",
      entity_type: "profiles",
      entity_id: profile.id,
      details: `Password updated for ${profile.email}.`,
    });

    writeDb(db);

    return NextResponse.json({
      success: true,
      message: "Your password has been updated successfully.",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to reset password." },
      { status: 500 }
    );
  }
}

