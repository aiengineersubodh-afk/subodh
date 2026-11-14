import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  const session = await getSessionContext();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { notificationId, markAllRead } = await req.json();
  const db = readDb();

  if (markAllRead) {
    for (const n of db.notifications) {
      if (n.recipient_profile_id === session.user.id) {
        n.is_read = true;
      }
    }
  } else if (notificationId) {
    const item = db.notifications.find(
      (n) => n.id === notificationId && n.recipient_profile_id === session.user.id
    );
    if (item) {
      item.is_read = true;
    }
  }

  writeDb(db);
  return NextResponse.json({ success: true });
}

