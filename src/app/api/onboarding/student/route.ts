import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSessionContext } from "@/lib/auth";
import {
  studentOnboardingSchema,
  validateAcademicDomainAndSpecialization,
} from "@/lib/validations";
import { getStudentProjects, logActivity, readDb, writeDb } from "@/lib/db";
import { StudentProfile, StudentProject } from "@/types/database";

export async function GET() {
  const session = await getSessionContext();
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const db = readDb();
  const studentProfile = db.student_profiles.find((s) => s.profile_id === session.user.id);
  const projects = studentProfile ? getStudentProjects(db, studentProfile.id) : [];

  return NextResponse.json({
    user: session.user,
    studentProfile: studentProfile ? { ...studentProfile, projects } : null,
    projects,
  });
}

function syncStudentProjects(
  db: ReturnType<typeof readDb>,
  studentProfileId: string,
  incomingProjects: unknown,
  now: string
): StudentProject[] {
  if (!Array.isArray(incomingProjects)) {
    return getStudentProjects(db, studentProfileId);
  }

  const existingProjects = getStudentProjects(db, studentProfileId);
  // Remove old project rows for this student and replace with updated array
  db.student_projects = (db.student_projects || []).filter(
    (p) => p.student_id !== studentProfileId
  );

  const saved: StudentProject[] = [];
  for (const raw of incomingProjects) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const title = String(item.title || "").trim();
    const description = String(item.description || "").trim();
    const technologies = String(item.technologies || "").trim();
    const projectUrl = String(item.project_url || "").trim();
    const githubUrl = String(item.github_url || "").trim();
    const duration = String(item.duration || "").trim();

    // Skip completely blank cards in draft mode
    if (!title && !description && !technologies && !projectUrl && !githubUrl && !duration) {
      continue;
    }

    const prevMatch = item.id
      ? existingProjects.find((ep) => ep.id === String(item.id))
      : undefined;

    const record: StudentProject = {
      id: prevMatch ? prevMatch.id : `stu-proj-${crypto.randomUUID().slice(0, 8)}`,
      student_id: studentProfileId,
      title,
      description,
      technologies,
      project_url: projectUrl,
      github_url: githubUrl,
      duration,
      created_at: prevMatch ? prevMatch.created_at : now,
      updated_at: now,
    };

    db.student_projects.push(record);
    saved.push(record);
  }

  return saved;
}

function formatProjectsSummaryText(projects: StudentProject[], fallbackText?: string): string {
  if (projects.length > 0) {
    return projects
      .map(
        (p, idx) =>
          `${idx + 1}. ${p.title}${p.duration ? ` (${p.duration})` : ""}: ${p.description}${
            p.technologies ? ` [Tech: ${p.technologies}]` : ""
          }`
      )
      .join("\n");
  }
  return fallbackText || "";
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionContext();
    if (!session || session.user.role !== "student") {
      return NextResponse.json(
        { error: "Unauthorized: Only registered students can update student profiles." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const isDraft = Boolean(body.is_draft);
    const onboardingStep = Number(body.onboarding_step) || 1;

    const db = readDb();
    const now = new Date().toISOString();

    const userRecord = db.profiles.find((p) => p.id === session.user.id);
    if (!userRecord) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    const existingIdx = db.student_profiles.findIndex(
      (s) => s.profile_id === session.user.id
    );
    const existing = existingIdx >= 0 ? db.student_profiles[existingIdx] : null;
    const studentId = existing ? existing.id : `stu-${crypto.randomUUID().slice(0, 8)}`;

    if (isDraft) {
      // Validate domain & specialization if provided in draft
      if (body.domain_id || body.specialization_id) {
        const val = validateAcademicDomainAndSpecialization(
          db.academic_domains,
          db.specializations,
          body.domain_id ? String(body.domain_id) : undefined,
          body.specialization_id ? String(body.specialization_id) : undefined,
          false
        );
        if (!val.valid) {
          return NextResponse.json({ error: val.error }, { status: 400 });
        }
      }

      if (body.full_name) userRecord.full_name = String(body.full_name).trim();
      if (body.phone) userRecord.phone = String(body.phone).trim();
      if (body.gender !== undefined) userRecord.gender = String(body.gender);
      if (body.country) userRecord.country = String(body.country).trim();
      if (body.state !== undefined) userRecord.state = String(body.state).trim();
      if (body.city !== undefined) userRecord.city = String(body.city).trim();
      if (body.avatar_url !== undefined) userRecord.avatar_url = String(body.avatar_url);
      userRecord.updated_at = now;

      const savedProjects = syncStudentProjects(db, studentId, body.projects, now);
      const summaryText =
        savedProjects.length > 0
          ? formatProjectsSummaryText(savedProjects)
          : body.previous_projects !== undefined
          ? String(body.previous_projects)
          : existing?.previous_projects || "";

      const draftStudent: StudentProfile = {
        id: studentId,
        profile_id: session.user.id,
        college_university:
          body.college_university !== undefined
            ? String(body.college_university)
            : existing?.college_university || "",
        degree:
          body.degree !== undefined ? String(body.degree) : existing?.degree || "B.Tech",
        department:
          body.department !== undefined
            ? String(body.department)
            : existing?.department || "",
        domain_id:
          body.domain_id !== undefined
            ? String(body.domain_id)
            : existing?.domain_id || undefined,
        specialization_id:
          body.specialization_id !== undefined
            ? String(body.specialization_id)
            : existing?.specialization_id || undefined,
        academic_domain_id:
          body.domain_id !== undefined
            ? String(body.domain_id)
            : existing?.academic_domain_id || undefined,
        specialization:
          body.specialization !== undefined
            ? String(body.specialization)
            : existing?.specialization || undefined,
        current_year_semester:
          body.current_year_semester !== undefined
            ? String(body.current_year_semester)
            : existing?.current_year_semester || "3rd Year",
        graduation_year:
          Number(body.graduation_year) ||
          existing?.graduation_year ||
          new Date().getFullYear() + 1,
        academic_interests: Array.isArray(body.academic_interests)
          ? body.academic_interests
          : existing?.academic_interests || [],
        preferred_domains: Array.isArray(body.preferred_domains)
          ? body.preferred_domains
          : existing?.preferred_domains || [],
        skills: Array.isArray(body.skills) ? body.skills : existing?.skills || [],
        programming_languages: Array.isArray(body.programming_languages)
          ? body.programming_languages
          : existing?.programming_languages || [],
        previous_projects: summaryText,
        projects: savedProjects,
        research_experience:
          body.research_experience !== undefined
            ? String(body.research_experience)
            : existing?.research_experience || "",
        certifications: Array.isArray(body.certifications)
          ? body.certifications
          : existing?.certifications || [],
        resume_url:
          body.resume_url !== undefined
            ? String(body.resume_url)
            : existing?.resume_url || "",
        linkedin_url:
          body.linkedin_url !== undefined
            ? String(body.linkedin_url)
            : existing?.linkedin_url || "",
        github_url:
          body.github_url !== undefined
            ? String(body.github_url)
            : existing?.github_url || "",
        portfolio_url:
          body.portfolio_url !== undefined
            ? String(body.portfolio_url)
            : existing?.portfolio_url || "",
        bio: body.bio !== undefined ? String(body.bio) : existing?.bio || "",
        onboarding_step: onboardingStep,
        created_at: existing ? existing.created_at : now,
        updated_at: now,
      };

      if (existingIdx >= 0) {
        db.student_profiles[existingIdx] = draftStudent;
      } else {
        db.student_profiles.push(draftStudent);
      }

      writeDb(db);
      return NextResponse.json({
        success: true,
        isDraft: true,
        studentProfile: draftStudent,
        projects: savedProjects,
      });
    }

    // Final Submission Validation
    const parsed = studentOnboardingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid student profile data." },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Validate cascading academic domain and specialization if provided
    let finalDepartment = data.department;
    if (data.domain_id || data.specialization_id) {
      const val = validateAcademicDomainAndSpecialization(
        db.academic_domains,
        db.specializations,
        data.domain_id,
        data.specialization_id,
        true
      );
      if (!val.valid) {
        return NextResponse.json({ error: val.error }, { status: 400 });
      }
      if (val.domain && val.specialization) {
        finalDepartment = `${val.domain.name} — ${val.specialization.name}`;
      }
    }

    userRecord.full_name = data.full_name;
    userRecord.phone = data.phone;
    userRecord.gender = data.gender || userRecord.gender;
    userRecord.country = data.country;
    userRecord.state = data.state;
    userRecord.city = data.city;
    if (data.avatar_url !== undefined && data.avatar_url !== "") {
      userRecord.avatar_url = data.avatar_url;
    }
    userRecord.onboarding_completed = true;
    userRecord.updated_at = now;

    const savedProjects = syncStudentProjects(db, studentId, data.projects, now);
    const summaryText = formatProjectsSummaryText(savedProjects, data.previous_projects);

    const updatedStudent: StudentProfile = {
      id: studentId,
      profile_id: session.user.id,
      college_university: data.college_university,
      degree: data.degree,
      department: finalDepartment,
      domain_id: data.domain_id,
      specialization_id: data.specialization_id,
      academic_domain_id: data.domain_id,
      specialization: data.specialization,
      current_year_semester: data.current_year_semester,
      graduation_year: data.graduation_year,
      academic_interests: data.academic_interests,
      preferred_domains: data.preferred_domains,
      skills: data.skills,
      programming_languages: data.programming_languages,
      previous_projects: summaryText,
      projects: savedProjects,
      research_experience: data.research_experience || "",
      certifications: data.certifications,
      resume_url: data.resume_url || "/sample-documents/student-cv.pdf",
      linkedin_url: data.linkedin_url || "",
      github_url: data.github_url || "",
      portfolio_url: data.portfolio_url || "",
      bio: data.bio || "",
      onboarding_step: 6,
      created_at: existing ? existing.created_at : now,
      updated_at: now,
    };

    if (existingIdx >= 0) {
      db.student_profiles[existingIdx] = updatedStudent;
    } else {
      db.student_profiles.push(updatedStudent);
    }

    logActivity(db, {
      actor_profile_id: session.user.id,
      actor_name: userRecord.full_name,
      actor_role: "student",
      action: existing ? "Updated Student Profile" : "Completed Student Onboarding",
      entity_type: "student_profiles",
      entity_id: updatedStudent.id,
      details: `${userRecord.full_name} (${updatedStudent.college_university}) completed student profile (${savedProjects.length} projects).`,
    });

    writeDb(db);

    return NextResponse.json({
      success: true,
      studentProfile: updatedStudent,
      projects: savedProjects,
    });
  } catch (err) {
    console.error("Student onboarding error:", err);
    return NextResponse.json(
      { error: "Failed to save student profile." },
      { status: 500 }
    );
  }
}
