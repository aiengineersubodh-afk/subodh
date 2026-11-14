import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSessionContext } from "@/lib/auth";
import { scholarOnboardingSchema } from "@/lib/validations";
import { createNotification, logActivity, readDb, writeDb } from "@/lib/db";
import { Internship, PhdScholarProfile, Publication, ResearchProject } from "@/types/database";

export async function GET() {
  const session = await getSessionContext();
  if (!session || session.user.role !== "scholar") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const db = readDb();
  const scholarProfile = db.phd_scholar_profiles.find(
    (s) => s.profile_id === session.user.id
  );
  const publications = scholarProfile
    ? db.publications.filter((p) => p.scholar_profile_id === scholarProfile.id)
    : [];
  const researchProjects = scholarProfile
    ? db.research_projects.filter((p) => p.scholar_profile_id === scholarProfile.id)
    : [];
  const internships = scholarProfile
    ? db.internships.filter((i) => i.scholar_profile_id === scholarProfile.id)
    : [];

  return NextResponse.json({
    user: session.user,
    scholarProfile: scholarProfile || null,
    publications,
    researchProjects,
    internships,
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionContext();
    if (!session || session.user.role !== "scholar") {
      return NextResponse.json(
        { error: "Unauthorized: Only registered PhD Scholars can update scholar profiles." },
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

    const existingIdx = db.phd_scholar_profiles.findIndex(
      (s) => s.profile_id === session.user.id
    );
    const existing = existingIdx >= 0 ? db.phd_scholar_profiles[existingIdx] : null;
    const scholarId = existing ? existing.id : `sch-${crypto.randomUUID().slice(0, 8)}`;

    if (isDraft) {
      if (body.full_name) userRecord.full_name = String(body.full_name).trim();
      if (body.phone) userRecord.phone = String(body.phone).trim();
      if (body.gender !== undefined) userRecord.gender = String(body.gender);
      if (body.country) userRecord.country = String(body.country).trim();
      if (body.state !== undefined) userRecord.state = String(body.state).trim();
      if (body.city !== undefined) userRecord.city = String(body.city).trim();
      if (body.avatar_url) userRecord.avatar_url = String(body.avatar_url);
      userRecord.updated_at = now;

      const draftScholar: PhdScholarProfile = {
        id: scholarId,
        profile_id: session.user.id,
        university_institution:
          body.university_institution !== undefined
            ? String(body.university_institution)
            : existing?.university_institution || "",
        department:
          body.department !== undefined
            ? String(body.department)
            : existing?.department || "",
        highest_qualification:
          body.highest_qualification !== undefined
            ? String(body.highest_qualification)
            : existing?.highest_qualification || "M.Tech",
        research_field:
          body.research_field !== undefined
            ? String(body.research_field)
            : existing?.research_field || "Engineering",
        specialization:
          body.specialization !== undefined
            ? String(body.specialization)
            : existing?.specialization || "",
        domain_id:
          body.domain_id !== undefined
            ? String(body.domain_id)
            : existing?.domain_id || "dom-engineering",
        specialization_id:
          body.specialization_id !== undefined
            ? String(body.specialization_id)
            : existing?.specialization_id || "",
        enrollment_year:
          Number(body.enrollment_year) || existing?.enrollment_year || 2023,
        expected_completion_year:
          Number(body.expected_completion_year) ||
          existing?.expected_completion_year ||
          2027,
        current_research_topic:
          body.current_research_topic !== undefined
            ? String(body.current_research_topic)
            : existing?.current_research_topic || "",
        biography:
          body.biography !== undefined
            ? String(body.biography)
            : existing?.biography || "",
        current_research_description:
          body.current_research_description !== undefined
            ? String(body.current_research_description)
            : existing?.current_research_description || "",
        research_methodologies:
          body.research_methodologies !== undefined
            ? String(body.research_methodologies)
            : existing?.research_methodologies || "",
        projects_summary:
          body.projects_summary !== undefined
            ? String(body.projects_summary)
            : existing?.projects_summary || "",
        laboratory_experience:
          body.laboratory_experience !== undefined
            ? String(body.laboratory_experience)
            : existing?.laboratory_experience || "",
        teaching_mentoring_experience:
          body.teaching_mentoring_experience !== undefined
            ? String(body.teaching_mentoring_experience)
            : existing?.teaching_mentoring_experience || "",
        research_achievements:
          body.research_achievements !== undefined
            ? String(body.research_achievements)
            : existing?.research_achievements || "",
        education_summary:
          body.education_summary !== undefined
            ? String(body.education_summary)
            : existing?.education_summary || "",
        research_interests: Array.isArray(body.research_interests)
          ? body.research_interests
          : existing?.research_interests || [],
        technical_skills: Array.isArray(body.technical_skills)
          ? body.technical_skills
          : existing?.technical_skills || [],
        research_tools: Array.isArray(body.research_tools)
          ? body.research_tools
          : existing?.research_tools || [],
        certifications: Array.isArray(body.certifications)
          ? body.certifications
          : existing?.certifications || [],
        google_scholar_url:
          body.google_scholar_url !== undefined
            ? String(body.google_scholar_url)
            : existing?.google_scholar_url || "",
        orcid_id:
          body.orcid_id !== undefined ? String(body.orcid_id) : existing?.orcid_id || "",
        linkedin_url:
          body.linkedin_url !== undefined
            ? String(body.linkedin_url)
            : existing?.linkedin_url || "",
        github_url:
          body.github_url !== undefined
            ? String(body.github_url)
            : existing?.github_url || "",
        personal_website_url:
          body.personal_website_url !== undefined
            ? String(body.personal_website_url)
            : existing?.personal_website_url || "",
        internship_availability:
          body.internship_availability !== undefined
            ? Boolean(body.internship_availability)
            : existing?.internship_availability ?? true,
        verification_status: existing?.verification_status || "pending",
        profile_views: existing?.profile_views || 0,
        is_featured: existing?.is_featured || false,
        onboarding_step: onboardingStep,
        created_at: existing ? existing.created_at : now,
        updated_at: now,
      };

      if (existingIdx >= 0) {
        db.phd_scholar_profiles[existingIdx] = draftScholar;
      } else {
        db.phd_scholar_profiles.push(draftScholar);
      }

      if (Array.isArray(body.publications)) {
        db.publications = db.publications.filter((p) => p.scholar_profile_id !== scholarId);
        for (const pub of body.publications) {
          if (pub.title && pub.journal_conference) {
            db.publications.push({
              id: pub.id || `pub-${crypto.randomUUID().slice(0, 8)}`,
              scholar_profile_id: scholarId,
              title: String(pub.title),
              journal_conference: String(pub.journal_conference),
              publication_year: Number(pub.publication_year) || 2025,
              doi_or_url: pub.doi_or_url ? String(pub.doi_or_url) : undefined,
              created_at: now,
            });
          }
        }
      }

      writeDb(db);
      return NextResponse.json({
        success: true,
        isDraft: true,
        scholarProfile: draftScholar,
      });
    }

    const parsed = scholarOnboardingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid PhD scholar profile data." },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const wasAlreadyApproved = existing?.verification_status === "approved";

    userRecord.full_name = data.full_name;
    userRecord.phone = data.phone;
    if (body.gender) userRecord.gender = String(body.gender);
    userRecord.country = data.country;
    userRecord.state = data.state;
    userRecord.city = data.city;
    if (data.avatar_url) {
      userRecord.avatar_url = data.avatar_url;
    }
    userRecord.onboarding_completed = true;
    userRecord.updated_at = now;

    const updatedScholar: PhdScholarProfile = {
      id: scholarId,
      profile_id: session.user.id,
      university_institution: data.university_institution,
      department: data.department,
      highest_qualification: body.highest_qualification
        ? String(body.highest_qualification)
        : existing?.highest_qualification || "M.Tech",
      research_field: data.research_field,
      specialization: data.specialization,
      domain_id: data.domain_id,
      specialization_id: data.specialization_id,
      enrollment_year: data.enrollment_year,
      expected_completion_year: data.expected_completion_year,
      current_research_topic: data.current_research_topic,
      biography: data.biography,
      current_research_description: body.current_research_description
        ? String(body.current_research_description)
        : existing?.current_research_description || "",
      research_methodologies: body.research_methodologies
        ? String(body.research_methodologies)
        : existing?.research_methodologies || "",
      projects_summary: body.projects_summary
        ? String(body.projects_summary)
        : existing?.projects_summary || "",
      laboratory_experience: body.laboratory_experience
        ? String(body.laboratory_experience)
        : existing?.laboratory_experience || "",
      teaching_mentoring_experience: body.teaching_mentoring_experience
        ? String(body.teaching_mentoring_experience)
        : existing?.teaching_mentoring_experience || "",
      research_achievements: body.research_achievements
        ? String(body.research_achievements)
        : existing?.research_achievements || "",
      education_summary:
        data.education_summary ||
        `${body.highest_qualification || "Master's"} • Ph.D. Candidate at ${
          data.university_institution
        } (${data.enrollment_year}–${data.expected_completion_year})`,
      research_interests: data.research_interests,
      technical_skills: data.technical_skills,
      research_tools: data.research_tools,
      certifications: data.certifications,
      google_scholar_url: data.google_scholar_url || "",
      orcid_id: data.orcid_id || "",
      linkedin_url: data.linkedin_url || "",
      github_url: data.github_url || "",
      personal_website_url: data.personal_website_url || "",
      internship_availability: data.internship_availability,
      // New onboarding submissions start as "pending" awaiting admin verification; already approved scholars editing their profile stay approved unless specified
      verification_status: wasAlreadyApproved ? "approved" : "pending",
      profile_views: existing ? existing.profile_views : 1,
      is_featured: existing ? existing.is_featured : false,
      onboarding_step: 6,
      created_at: existing ? existing.created_at : now,
      updated_at: now,
    };

    if (existingIdx >= 0) {
      db.phd_scholar_profiles[existingIdx] = updatedScholar;
    } else {
      db.phd_scholar_profiles.push(updatedScholar);
    }

    // Save publications
    if (Array.isArray(body.publications)) {
      db.publications = db.publications.filter((p) => p.scholar_profile_id !== scholarId);
      for (const pub of body.publications) {
        if (pub.title && pub.journal_conference) {
          const newPub: Publication = {
            id: pub.id || `pub-${crypto.randomUUID().slice(0, 8)}`,
            scholar_profile_id: scholarId,
            title: String(pub.title),
            journal_conference: String(pub.journal_conference),
            publication_year: Number(pub.publication_year) || 2025,
            doi_or_url: pub.doi_or_url ? String(pub.doi_or_url) : undefined,
            co_authors: pub.co_authors ? String(pub.co_authors) : undefined,
            abstract: pub.abstract ? String(pub.abstract) : undefined,
            created_at: now,
          };
          db.publications.push(newPub);
        }
      }
    }

    // Save research projects
    if (Array.isArray(body.research_projects)) {
      db.research_projects = db.research_projects.filter(
        (p) => p.scholar_profile_id !== scholarId
      );
      for (const proj of body.research_projects) {
        if (proj.title && proj.description) {
          const newProj: ResearchProject = {
            id: proj.id || `proj-${crypto.randomUUID().slice(0, 8)}`,
            scholar_profile_id: scholarId,
            title: String(proj.title),
            description: String(proj.description),
            status: proj.status || "ongoing",
            technologies: Array.isArray(proj.technologies) ? proj.technologies : [],
            start_year: proj.start_year ? Number(proj.start_year) : 2025,
            project_url: proj.project_url ? String(proj.project_url) : undefined,
            created_at: now,
          };
          db.research_projects.push(newProj);
        }
      }
    }

    // Create initial internship if scholar opted in
    if (
      data.internship_availability &&
      data.create_initial_internship &&
      data.internship_title &&
      data.internship_description
    ) {
      const newInternship: Internship = {
        id: `int-${crypto.randomUUID().slice(0, 8)}`,
        scholar_profile_id: scholarId,
        domain_id: data.domain_id,
        specialization_id: data.specialization_id,
        title: data.internship_title,
        description: data.internship_description,
        required_skills: data.required_student_skills?.length
          ? data.required_student_skills
          : data.technical_skills,
        eligibility_criteria:
          data.eligibility_criteria ||
          "Undergraduate or Postgraduate students in relevant disciplines.",
        duration: data.duration || "8 Weeks",
        available_positions: data.available_positions || 2,
        mode: data.internship_mode || "Remote",
        application_deadline: data.application_deadline || "2027-03-31",
        stipend: data.stipend || "Academic Credit / Fellowship",
        status: data.internship_status || "Open",
        moderation_status: "approved",
        created_at: now,
        updated_at: now,
      };
      db.internships.unshift(newInternship);
    }

    // Notify Admins if pending verification
    if (updatedScholar.verification_status === "pending") {
      const admins = db.profiles.filter((p) => p.role === "admin" && p.status === "active");
      for (const admin of admins) {
        createNotification(db, {
          recipient_profile_id: admin.id,
          title: "PhD Scholar Profile Submitted for Verification",
          message: `${userRecord.full_name} (${updatedScholar.university_institution}) completed onboarding and awaits verification.`,
          type: "warning",
          link_url: "/admin/scholars",
        });
      }
    }

    logActivity(db, {
      actor_profile_id: session.user.id,
      actor_name: userRecord.full_name,
      actor_role: "scholar",
      action: wasAlreadyApproved
        ? "Updated PhD Scholar Profile"
        : "Submitted PhD Scholar Profile for Verification",
      entity_type: "phd_scholar_profiles",
      entity_id: scholarId,
      details: `${userRecord.full_name} (${updatedScholar.university_institution}) saved research profile (Status: ${updatedScholar.verification_status}).`,
    });

    writeDb(db);

    return NextResponse.json({
      success: true,
      scholarProfile: updatedScholar,
    });
  } catch (err) {
    console.error("Scholar onboarding error:", err);
    return NextResponse.json(
      { error: "Failed to save PhD Scholar profile." },
      { status: 500 }
    );
  }
}
