import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { contactMessageSchema } from "@/lib/validations";
import { createNotification, logActivity, readDb, writeDb } from "@/lib/db";
import { ContactMessage } from "@/types/database";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = contactMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid contact submission." },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const db = readDb();
    const now = new Date().toISOString();

    const newMessage: ContactMessage = {
      id: `msg-${crypto.randomUUID().slice(0, 8)}`,
      name: data.name.trim(),
      email: data.email.trim(),
      subject: data.subject.trim(),
      message: data.message.trim(),
      status: "unread",
      created_at: now,
      updated_at: now,
    };

    db.contact_messages.unshift(newMessage);

    // Notify all active administrators
    const admins = db.profiles.filter((p) => p.role === "admin" && p.status === "active");
    for (const admin of admins) {
      createNotification(db, {
        recipient_profile_id: admin.id,
        title: "New Contact Inquiry",
        message: `${newMessage.name} (${newMessage.email}) sent a message: "${newMessage.subject}".`,
        type: "info",
        link_url: "/admin/messages",
      });
    }

    logActivity(db, {
      actor_name: newMessage.name,
      actor_role: "visitor",
      action: "Submitted Contact Form",
      entity_type: "contact_messages",
      entity_id: newMessage.id,
      details: `Subject: ${newMessage.subject} (${newMessage.email})`,
    });

    writeDb(db);

    return NextResponse.json({
      success: true,
      message: "Your message has been received. Our academic team will respond shortly.",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit contact message." },
      { status: 500 }
    );
  }
}

