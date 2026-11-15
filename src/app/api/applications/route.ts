import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSessionContext } from "@/lib/auth";
import { applicationSchema } from "@/lib/validations";
import {
  createNotification,
  getEnrichedApplications,
  getStudentApplicationMap,
  logActivity,
  readDb,
  sanitizePublicScholarProfile,
  writeDb,
} from "@/lib/db";
import {
  ApplicationStatus,
  EnrichedApplication,
  InternshipApplication,
} from "@/types/database";

// Transaction-safe in-process mutex to prevent race conditions from simultaneous application submissions
const submissionQueue = new Map<string, Promise<unknown>>();

async function withSubmissionLock<T>(
  lockKey: string,
  fn: () => Promise<T>
): Promise<T> {
  const prev = submissionQueue.get(lockKey) || Promise.resolve();
  let release!: () => void;
  const next = new Promise<void>((resolve) => {
    release = resolve;
  });
  submissionQueue.set(
    lockKey,
    prev.then(() => next)
  );
  await prev;
  try {
    return await fn();
  } finally {
    release();
    if (submissionQueue.get(lockKey) === next) {
      submissionQueue.delete(lockKey);
    }
  }
}

export async function GET(req: NextRequest) {
  const session = await getSessionContext();
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const internshipId = searchParams.get("internshipId");

  const allEnriched = getEnrichedApplications();

  if (session.user.role === "student") {
    const byInternshipId = getStudentApplicationMap(session.user.id);
    if (!session.studentProfile) {
      return NextResponse.json({
        applications: [],
        byInternshipId: {},
        applicationForInternship: null,
      });
    }
    const mine = allEnriched
      .filter(
        (item) =>
          item.application.student_profile_id === session.studentProfile!.id
      )
      .map((item) => ({
        ...item,
        scholarUser: sanitizePublicScholarProfile(item.scholarUser),
        // Never expose scholar_private_notes to students
        application: {
          ...item.application,
          scholar_private_notes: "",
        },
      }));

    return NextResponse.json({
      applications: internshipId
        ? mine.filter((m) => m.application.internship_id === internshipId)
        : mine,
      byInternshipId,
      applicationForInternship: internshipId
        ? byInternshipId[internshipId] || null
        : null,
    });
  }

  if (session.user.role === "scholar") {
    if (!session.scholarProfile) {
      return NextResponse.json({ applications: [] });
    }
    const scholarApps = allEnriched.filter(
      (item) =>
        item.application.scholar_profile_id === session.scholarProfile!.id &&
        (!internshipId || item.application.internship_id === internshipId)
    );
    return NextResponse.json({ applications: scholarApps });
  }

  if (session.user.role === "admin") {
    return NextResponse.json({
      applications: internshipId
        ? allEnriched.filter(
            (item) => item.application.internship_id === internshipId
          )
        : allEnriched,
    });
  }

  return NextResponse.json({ applications: [] });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionContext();
    if (!session || session.user.role !== "student") {
      return NextResponse.json(
        { error: "Only logged-in students can apply for research internships." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = applicationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ||
            "Please complete all required application fields.",
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    // Derive student identity strictly from authenticated session, never from client body
    const authenticatedUserId = session.user.id;
    const lockKey = `${authenticatedUserId}:${data.internship_id}`;

    return await withSubmissionLock(lockKey, async () => {
      const db = readDb();
      let studentProfile = db.student_profiles.find(
        (s) => s.profile_id === authenticatedUserId
      );

      const now = new Date().toISOString();

      // Auto-create student profile record if student applied directly before visiting onboarding
      if (!studentProfile) {
        studentProfile = {
          id: `stu-${crypto.randomUUID().slice(0, 8)}`,
          profile_id: authenticatedUserId,
          college_university: data.college_university,
          degree: data.degree,
          department: data.department,
          current_year_semester: data.current_academic_year,
          graduation_year: 2027,
          academic_interests: data.research_interests,
          preferred_domains: [],
          skills: data.technical_skills,
          programming_languages: [],
          previous_projects: data.relevant_experience,
          research_experience: data.relevant_experience,
          certifications: [],
          resume_url: data.resume_url,
          linkedin_url: data.linkedin_url || "",
          github_url: "",
          portfolio_url: data.portfolio_url || "",
          bio: "",
          created_at: now,
          updated_at: now,
        };
        db.student_profiles.push(studentProfile);
        const u = db.profiles.find((p) => p.id === authenticatedUserId);
        if (u) u.onboarding_completed = true;
      }

      const internship = db.internships.find((i) => i.id === data.internship_id);
      if (!internship || internship.status !== "Open") {
        return NextResponse.json(
          { error: "This internship is no longer open for applications." },
          { status: 400 }
        );
      }

      const scholar = db.phd_scholar_profiles.find(
        (s) => s.id === internship.scholar_profile_id
      );
      if (!scholar) {
        return NextResponse.json(
          { error: "Associated PhD Scholar profile not found." },
          { status: 404 }
        );
      }

      // Check existing applications using authenticated studentProfile.id and internship.id
      // Prevent duplicate applications for any non-Withdrawn status
      const duplicate = db.internship_applications.find(
        (a) =>
          a.internship_id === internship.id &&
          a.student_profile_id === studentProfile!.id &&
          a.status !== "Withdrawn"
      );

      if (duplicate) {
        return NextResponse.json(
          {
            error: `You have already applied for this research internship (Current status: ${duplicate.status}).`,
            existingStatus: duplicate.status,
            applicationId: duplicate.id,
          },
          { status: 409 }
        );
      }

      const newApp: InternshipApplication = {
        id: `app-${crypto.randomUUID().slice(0, 8)}`,
        internship_id: internship.id,
        student_profile_id: studentProfile.id,
        scholar_profile_id: scholar.id,
        student_full_name: data.student_full_name.trim(),
        student_email: data.student_email.trim(),
        student_phone: data.student_phone.trim(),
        college_university: data.college_university.trim(),
        degree: data.degree.trim(),
        department: data.department.trim(),
        current_academic_year: data.current_academic_year.trim(),
        research_interests: data.research_interests,
        technical_skills: data.technical_skills,
        statement_of_purpose: data.statement_of_purpose.trim(),
        relevant_experience: data.relevant_experience.trim(),
        expected_availability: data.expected_availability.trim(),
        preferred_duration: data.preferred_duration.trim(),
        resume_url: data.resume_url,
        portfolio_url: data.portfolio_url || "",
        linkedin_url: data.linkedin_url || "",
        additional_message: data.additional_message || "",
        status: "Submitted",
        scholar_private_notes: "",
        is_reported: false,
        submitted_at: now,
        updated_at: now,
      };

      db.internship_applications.unshift(newApp);

      // 1. Notify Student
      createNotification(db, {
        recipient_profile_id: authenticatedUserId,
        title: "Application Submitted Successfully",
        message: `Your application for '${internship.title}' has been sent to the PhD scholar.`,
        type: "success",
        link_url: "/dashboard/student/applications",
      });

      // 2. Notify PhD Scholar
      createNotification(db, {
        recipient_profile_id: scholar.profile_id,
        title: "New Research Internship Application",
        message: `${newApp.student_full_name} (${newApp.college_university}) applied for '${internship.title}'.`,
        type: "info",
        link_url: "/dashboard/scholar/applications",
      });

      logActivity(db, {
        actor_profile_id: authenticatedUserId,
        actor_name: session.user.full_name,
        actor_role: "student",
        action: "Submitted Internship Application",
        entity_type: "internship_applications",
        entity_id: newApp.id,
        details: `${newApp.student_full_name} applied to '${internship.title}'.`,
      });

      writeDb(db);

      const scholarUserRaw = db.profiles.find(
        (p) => p.id === scholar.profile_id
      );
      const studentUserRaw = db.profiles.find(
        (p) => p.id === authenticatedUserId
      );

      const enrichedApplication: EnrichedApplication | undefined =
        scholarUserRaw && studentUserRaw
          ? {
              application: {
                ...newApp,
                scholar_private_notes: "",
              },
              internship,
              scholar,
              scholarUser: sanitizePublicScholarProfile(scholarUserRaw),
              student: studentProfile,
              studentUser: studentUserRaw,
            }
          : undefined;

      return NextResponse.json({
        success: true,
        application: newApp,
        enrichedApplication,
      });
    });
  } catch (err) {
    console.error("Application submission error:", err);
    return NextResponse.json(
      { error: "Failed to submit internship application." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionContext();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const applicationId = body.applicationId || body.id;
    const {
      status,
      scholar_private_notes,
      is_reported,
      report_reason,
    } = body;

    if (!applicationId) {
      return NextResponse.json(
        { error: "Application ID is required." },
        { status: 400 }
      );
    }

    const db = readDb();
    const app = db.internship_applications.find((a) => a.id === applicationId);
    if (!app) {
      return NextResponse.json(
        { error: "Application not found." },
        { status: 404 }
      );
    }

    const internship = db.internships.find((i) => i.id === app.internship_id);
    const scholar = db.phd_scholar_profiles.find(
      (s) => s.id === app.scholar_profile_id
    );
    const student = db.student_profiles.find(
      (st) => st.id === app.student_profile_id
    );

    // Student Withdrawal Flow
    if (session.user.role === "student") {
      if (!student || student.profile_id !== session.user.id) {
        return NextResponse.json(
          { error: "Forbidden: You can only manage your own applications." },
          { status: 403 }
        );
      }
      if (status !== "Withdrawn") {
        return NextResponse.json(
          { error: "Students can only withdraw applications." },
          { status: 403 }
        );
      }
      if (app.status === "Accepted" || app.status === "Rejected") {
        return NextResponse.json(
          { error: "Finalized applications cannot be withdrawn." },
          { status: 400 }
        );
      }

      app.status = "Withdrawn";
      app.updated_at = new Date().toISOString();

      if (scholar) {
        createNotification(db, {
          recipient_profile_id: scholar.profile_id,
          title: "Application Withdrawn",
          message: `${app.student_full_name} withdrew their application for '${
            internship?.title || "Internship"
          }'.`,
          type: "warning",
          link_url: "/dashboard/scholar/applications",
        });
      }

      logActivity(db, {
        actor_profile_id: session.user.id,
        actor_name: session.user.full_name,
        actor_role: "student",
        action: "Withdrew Internship Application",
        entity_type: "internship_applications",
        entity_id: app.id,
        details: `Withdrew application for '${
          internship?.title || app.internship_id
        }'.`,
      });

      writeDb(db);
      return NextResponse.json({ success: true, application: app });
    }

    // PhD Scholar or Admin Application Management Flow
    if (session.user.role === "scholar") {
      if (!scholar || scholar.profile_id !== session.user.id) {
        return NextResponse.json(
          {
            error:
              "Forbidden: You can only access and update applications submitted to your own internships.",
          },
          { status: 403 }
        );
      }
    }

    const validStatuses: ApplicationStatus[] = [
      "Submitted",
      "Under Review",
      "Shortlisted",
      "Accepted",
      "Rejected",
      "Withdrawn",
    ];

    if (status && validStatuses.includes(status)) {
      const oldStatus = app.status;
      app.status = status;

      if (student && oldStatus !== status) {
        const notifType =
          status === "Accepted" || status === "Shortlisted"
            ? "success"
            : status === "Rejected"
            ? "error"
            : "info";

        createNotification(db, {
          recipient_profile_id: student.profile_id,
          title: `Application ${status}`,
          message: `Your application for '${
            internship?.title || "Research Internship"
          }' has been updated to '${status}'.`,
          type: notifType,
          link_url: "/dashboard/student/applications",
        });
      }
    }

    if (scholar_private_notes !== undefined) {
      app.scholar_private_notes = String(scholar_private_notes);
    }

    if (is_reported !== undefined) {
      app.is_reported = Boolean(is_reported);
      if (report_reason !== undefined) {
        app.report_reason = String(report_reason);
      }
    }

    app.updated_at = new Date().toISOString();

    logActivity(db, {
      actor_profile_id: session.user.id,
      actor_name: session.user.full_name,
      actor_role: session.user.role,
      action: `Updated Application (${app.status})`,
      entity_type: "internship_applications",
      entity_id: app.id,
      details: `Updated ${app.student_full_name}'s application status to ${app.status}.`,
    });

    writeDb(db);
    return NextResponse.json({ success: true, application: app });
  } catch {
    return NextResponse.json(
      { error: "Failed to update application." },
      { status: 500 }
    );
  }
}
