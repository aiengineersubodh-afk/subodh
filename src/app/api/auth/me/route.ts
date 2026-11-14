import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  const session = await getSessionContext();
  const db = readDb();
  const notifications = session
    ? db.notifications.filter((n) => n.recipient_profile_id === session.user.id)
    : [];

  return NextResponse.json({
    session,
    notifications,
    supabaseConnected: isSupabaseConfigured(),
    settings: db.website_settings,
  });
}

