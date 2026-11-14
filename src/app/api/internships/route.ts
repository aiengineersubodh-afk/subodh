import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSessionContext } from "@/lib/auth";
import {
  internshipSchema,
  validateAcademicDomainAndSpecialization,
} from "@/lib/validations";
import { createNotification, logActivity, readDb, writeDb } from "@/lib/db";
import { Internship } from "@/types/database";

export async function GET() {
  const session = await getSessionContext();
  if (!session || session.user.role !== "scholar") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const db = readDb();
  const scholar = db.phd_scholar_profiles.find((s) => s.profile_id === session.user.id);
  if (!scholar) {
    return NextResponse.json({ internships: [] });
  }
  const internships = db.internships.filter((i) => i.scholar_profile_id === scholar.id);
  return NextResponse.json({ internships });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionContext();
    if (!session || session.user.role !== "scholar") {
      return NextResponse.json(
        { error: "Unauthorized: Only PhD Scholars can create research internships." },
        { status: 403 }
      );
    }

    const db = readDb();
    const scholar = db.phd_scholar_profiles.find((s) => s.profile_id === session.user.id);
    if (!scholar) {
      return NextResponse.json(
        { error: "Please complete your PhD Scholar profile before publishing internships." },
        { status: 400 }
      );
    }

    // Automatically derive & validate Academic Domain and Specialization from verified scholar profile
    if (!scholar.domain_id || !scholar.specialization_id) {
      return NextResponse.json(
        {
          error:
            "Your PhD Scholar profile is missing required academic domain and specialization details. Please complete your academic profile first.",
        },
        { status: 400 }
      );
    }

    const acadValidation = validateAcademicDomainAndSpecialization(
      db.academic_domains,
      db.specializations,
      scholar.domain_id,
      scholar.specialization_id,
      true
    );
    if (!acadValidation.valid) {
      return NextResponse.json(
        { error: acadValidation.error || "Academic domain or specialization is invalid." },
        { status: 400 }
      );
    }

    const domain = acadValidation.domain!;
    const specialization = acadValidation.specialization!;

    const body = await req.json();
    const parsed = internshipSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid internship details." },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const now = new Date().toISOString();

    // Server-enforced classification: always bound to the verified scholar's profile
    const newInternship: Internship = {
      id: `int-${crypto.randomUUID().slice(0, 8)}`,
      scholar_profile_id: scholar.id,
      domain_id: scholar.domain_id,
      specialization_id: scholar.specialization_id,
      title: data.title.trim(),
      description: data.description.trim(),
      required_skills: data.required_skills,
      eligibility_criteria: data.eligibility_criteria.trim(),
      duration: data.duration.trim(),
      available_positions: data.available_positions,
      mode: data.mode,
      application_deadline: data.application_deadline,
      stipend: data.stipend || "Unpaid / Academic Credit",
      status: data.status,
      moderation_status: "approved",
      created_at: now,
      updated_at: now,
    };

    db.internships.unshift(newInternship);

    // Notify Admins
    const admins = db.profiles.filter((p) => p.role === "admin" && p.status === "active");
    for (const admin of admins) {
      createNotification(db, {
        recipient_profile_id: admin.id,
        title: "New Research Internship Created",
        message: `${session.user.full_name} posted '${newInternship.title}' under ${domain.name} → ${specialization.name}.`,
        type: "info",
        link_url: "/admin/internships",
      });
    }

    logActivity(db, {
      actor_profile_id: session.user.id,
      actor_name: session.user.full_name,
      actor_role: "scholar",
      action: "Created Research Internship",
      entity_type: "internships",
      entity_id: newInternship.id,
      details: `Published '${newInternship.title}' under ${domain.name} → ${specialization.name} (${newInternship.mode}).`,
    });

    writeDb(db);

    return NextResponse.json({
      success: true,
      internship: newInternship,
      domain,
      specialization,
      scholar: {
        id: scholar.id,
        research_field: scholar.research_field,
        specialization: scholar.specialization,
        university_institution: scholar.university_institution,
        department: scholar.department,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to create internship." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionContext();
    if (!session || (session.user.role !== "scholar" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ error: "Internship ID is required." }, { status: 400 });
    }

    const db = readDb();
    const internship = db.internships.find((i) => i.id === id);
    if (!internship) {
      return NextResponse.json({ error: "Internship not found." }, { status: 404 });
    }

    if (session.user.role === "scholar") {
      const scholar = db.phd_scholar_profiles.find((s) => s.profile_id === session.user.id);
      if (!scholar || internship.scholar_profile_id !== scholar.id) {
        return NextResponse.json(
          { error: "Forbidden: You can only manage your own internships." },
          { status: 403 }
        );
      }
    }

    if (updates.title !== undefined) internship.title = String(updates.title);
    if (updates.description !== undefined) internship.description = String(updates.description);
    if (session.user.role === "admin") {
      if (updates.domain_id !== undefined) internship.domain_id = String(updates.domain_id);
      if (updates.specialization_id !== undefined)
        internship.specialization_id = String(updates.specialization_id);
    }
    if (Array.isArray(updates.required_skills))
      internship.required_skills = updates.required_skills;
    if (updates.eligibility_criteria !== undefined)
      internship.eligibility_criteria = String(updates.eligibility_criteria);
    if (updates.duration !== undefined) internship.duration = String(updates.duration);
    if (updates.available_positions !== undefined)
      internship.available_positions = Number(updates.available_positions);
    if (updates.mode !== undefined) internship.mode = updates.mode;
    if (updates.application_deadline !== undefined)
      internship.application_deadline = String(updates.application_deadline);
    if (updates.stipend !== undefined) internship.stipend = String(updates.stipend);
    if (updates.status !== undefined) internship.status = updates.status;
    internship.updated_at = new Date().toISOString();

    // Notify applicants of internship status changes
    if (updates.status) {
      const apps = db.internship_applications.filter((a) => a.internship_id === internship.id);
      for (const app of apps) {
        const st = db.student_profiles.find((s) => s.id === app.student_profile_id);
        if (st) {
          createNotification(db, {
            recipient_profile_id: st.profile_id,
            title: "Internship Status Updated",
            message: `The internship '${internship.title}' is now marked as ${internship.status}.`,
            type: "info",
            link_url: "/dashboard/student/applications",
          });
        }
      }
    }

    logActivity(db, {
      actor_profile_id: session.user.id,
      actor_name: session.user.full_name,
      actor_role: session.user.role,
      action: "Updated Research Internship",
      entity_type: "internships",
      entity_id: internship.id,
      details: `Updated '${internship.title}' (Status: ${internship.status}).`,
    });

    writeDb(db);

    return NextResponse.json({
      success: true,
      internship,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update internship." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionContext();
    if (!session || (session.user.role !== "scholar" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Internship ID is required." }, { status: 400 });
    }

    const db = readDb();
    const internship = db.internships.find((i) => i.id === id);
    if (!internship) {
      return NextResponse.json({ error: "Internship not found." }, { status: 404 });
    }

    if (session.user.role === "scholar") {
      const scholar = db.phd_scholar_profiles.find((s) => s.profile_id === session.user.id);
      if (!scholar || internship.scholar_profile_id !== scholar.id) {
        return NextResponse.json(
          { error: "Forbidden: You can only delete your own internships." },
          { status: 403 }
        );
      }
    }

    db.internships = db.internships.filter((i) => i.id !== id);
    db.internship_applications = db.internship_applications.filter(
      (a) => a.internship_id !== id
    );

    logActivity(db, {
      actor_profile_id: session.user.id,
      actor_name: session.user.full_name,
      actor_role: session.user.role,
      action: "Deleted Research Internship",
      entity_type: "internships",
      entity_id: id,
      details: `Removed internship '${internship.title}'.`,
    });

    writeDb(db);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete internship." }, { status: 500 });
  }
}

