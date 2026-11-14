import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import {
  readDb,
  writeDb,
  hasActivePremiumAccess,
  createNotification,
  logActivity,
} from "@/lib/db";
import { ScholarContactRequest } from "@/types/database";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionContext();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = readDb();
    const { searchParams } = new URL(req.url);
    const scholarId = searchParams.get("scholarId");

    let requests = db.scholar_contact_requests || [];

    if (session.user.role === "student") {
      requests = requests.filter((r) => r.student_user_id === session.user.id);
      if (scholarId) {
        requests = requests.filter((r) => r.scholar_profile_id === scholarId);
      }
    } else if (session.user.role === "scholar") {
      const scholar = db.phd_scholar_profiles.find(
        (s) => s.profile_id === session.user.id
      );
      if (!scholar) {
        return NextResponse.json({ contactRequests: [] });
      }
      requests = requests.filter((r) => r.scholar_profile_id === scholar.id);
    } else if (session.user.role === "admin") {
      if (scholarId) {
        requests = requests.filter((r) => r.scholar_profile_id === scholarId);
      }
    }

    return NextResponse.json({
      contactRequests: requests,
    });
  } catch (error) {
    console.error("Scholar contact GET error:", error);
    return NextResponse.json(
      { error: "Failed to load contact requests" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionContext();
    if (!session) {
      return NextResponse.json(
        { error: "Please sign in to contact PhD scholars." },
        { status: 401 }
      );
    }

    if (session.user.role !== "student" && session.user.role !== "admin") {
      return NextResponse.json(
        {
          error:
            "Only students with an active STARSKY Premium membership can send direct contact inquiries to PhD scholars.",
        },
        { status: 403 }
      );
    }

    const db = readDb();

    // Server-side verification of active Premium membership
    const isPremium = hasActivePremiumAccess(
      db,
      session.user.id,
      session.user.role
    );

    if (!isPremium) {
      return NextResponse.json(
        {
          error:
            "Direct Scholar Contact is a STARSKY Premium feature. Upgrade to Premium to message verified PhD scholars directly.",
          requiresPremium: true,
        },
        { status: 403 }
      );
    }

    const student = db.student_profiles.find(
      (s) => s.profile_id === session.user.id
    );
    if (!student && session.user.role === "student") {
      return NextResponse.json(
        {
          error:
            "Please complete your student onboarding profile before contacting PhD scholars.",
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { scholarId, subject, researchInterestTopic, message } = body as {
      scholarId?: string;
      subject?: string;
      researchInterestTopic?: string;
      message?: string;
    };

    if (!scholarId || !subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        {
          error: "Scholar, subject, and message are required.",
        },
        { status: 400 }
      );
    }

    if (message.trim().length < 20) {
      return NextResponse.json(
        {
          error:
            "Please write a clear academic inquiry of at least 20 characters.",
        },
        { status: 400 }
      );
    }

    const scholar = db.phd_scholar_profiles.find(
      (s) => s.id === scholarId && s.verification_status === "approved"
    );

    if (!scholar) {
      return NextResponse.json(
        { error: "Verified PhD scholar not found." },
        { status: 404 }
      );
    }

    const scholarUser = db.profiles.find((p) => p.id === scholar.profile_id);
    const scholarFullName = scholarUser?.full_name || "Verified PhD Scholar";

    const now = new Date().toISOString();
    const contactRequest: ScholarContactRequest = {
      id: `scontact-${crypto.randomUUID().slice(0, 8)}`,
      student_profile_id: student?.id || "admin-student",
      student_user_id: session.user.id,
      student_name: session.user.full_name,
      student_email: session.user.email,
      scholar_profile_id: scholar.id,
      scholar_user_id: scholar.profile_id,
      scholar_name: scholarFullName,
      subject: subject.trim(),
      research_interest_topic:
        researchInterestTopic?.trim() || scholar.specialization,
      message: message.trim(),
      status: "sent",
      created_at: now,
      updated_at: now,
    };

    db.scholar_contact_requests.unshift(contactRequest);

    createNotification(db, {
      recipient_profile_id: scholar.profile_id,
      title: "New Direct Research Inquiry",
      message: `${contactRequest.student_name} sent you a direct research inquiry: "${contactRequest.subject}"`,
      type: "info",
      link_url: "/dashboard/scholar",
    });

    logActivity(db, {
      actor_profile_id: session.user.id,
      actor_name: session.user.full_name,
      actor_role: session.user.role,
      action: "CONTACT_SCHOLAR_DIRECT",
      entity_type: "scholar_contact_request",
      entity_id: contactRequest.id,
      details: `${contactRequest.student_name} sent a direct inquiry to ${scholarFullName}`,
    });

    writeDb(db);

    return NextResponse.json({
      message: `Your research inquiry has been sent directly to ${scholarFullName}.`,
      contactRequest,
    });
  } catch (error) {
    console.error("Scholar contact POST error:", error);
    return NextResponse.json(
      { error: "Failed to send contact inquiry" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionContext();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { contactRequestId, replyMessage, status } = body as {
      contactRequestId?: string;
      replyMessage?: string;
      status?: "read" | "replied";
    };

    const db = readDb();
    const reqIndex = (db.scholar_contact_requests || []).findIndex(
      (r) => r.id === contactRequestId
    );

    if (reqIndex === -1) {
      return NextResponse.json(
        { error: "Contact request not found" },
        { status: 404 }
      );
    }

    const existing = db.scholar_contact_requests[reqIndex];
    if (
      session.user.role !== "admin" &&
      existing.scholar_user_id !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date().toISOString();
    if (replyMessage && replyMessage.trim()) {
      existing.scholar_reply = replyMessage.trim();
      existing.status = "replied";
      existing.updated_at = now;

      createNotification(db, {
        recipient_profile_id: existing.student_user_id,
        title: `Reply from ${existing.scholar_name}`,
        message: `${existing.scholar_name} replied to your research inquiry "${existing.subject}".`,
        type: "success",
        link_url: `/scholars/${existing.scholar_profile_id}`,
      });
    } else if (status) {
      existing.status = status;
      existing.updated_at = now;
    }

    db.scholar_contact_requests[reqIndex] = existing;
    writeDb(db);

    return NextResponse.json({
      message: "Contact inquiry updated",
      contactRequest: existing,
    });
  } catch (error) {
    console.error("Scholar contact PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update contact inquiry" },
      { status: 500 }
    );
  }
}
