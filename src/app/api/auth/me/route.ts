import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { checkSupabaseHealth, isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  const session = await getSessionContext();
  const db = readDb();
  const notifications = session
    ? db.notifications.filter((n) => n.recipient_profile_id === session.user.id)
    : [];

  const health = await checkSupabaseHealth();

  return NextResponse.json({
    session,
    notifications,
    supabaseConnected: health.tablesReady,
    supabaseConfigured: isSupabaseConfigured(),
    supabaseHealth: health,
    settings: db.website_settings,
  });
}


