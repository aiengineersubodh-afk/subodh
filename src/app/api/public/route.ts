import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import {
  getEnrichedInternshipById,
  getEnrichedInternships,
  getEnrichedScholarById,
  getEnrichedScholars,
  getStudentApplicationMap,
  hasActivePremiumAccess,
  readDb,
  writeDb,
} from "@/lib/db";
import { LockedScholarPreview } from "@/types/database";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scholarId = searchParams.get("scholarId");
  const internshipId = searchParams.get("internshipId");
  const incrementView = searchParams.get("incrementView") === "true";

  const db = readDb();
  const session = await getSessionContext();
  const isPremiumUnlocked = hasActivePremiumAccess(
    db,
    session?.user.id,
    session?.user.role
  );
  const freeScholarLimit = db.website_settings.free_scholar_limit || 5;
  const activePlans = (db.subscription_plans || [])
    .filter((p) => p.is_active)
    .sort((a, b) => a.display_order - b.display_order);

  // Derive authenticated student's existing applications keyed by internship_id
  const studentApplications =
    session?.user.role === "student"
      ? getStudentApplicationMap(session.user.id)
      : {};

  // Single Internship Details lookup
  if (internshipId) {
    const enrichedInternship = getEnrichedInternshipById(internshipId, false);
    if (!enrichedInternship) {
      return NextResponse.json(
        { error: "Research internship not found." },
        { status: 404 }
      );
    }
    return NextResponse.json({
      internship: enrichedInternship,
      studentApplication: studentApplications[internshipId] || null,
      studentApplications,
      isPremiumUnlocked,
    });
  }

  const allApprovedScholars = getEnrichedScholars(true);
  const freeVisibleIds = new Set(
    allApprovedScholars.slice(0, freeScholarLimit).map((item) => item.scholar.id)
  );

  if (scholarId) {
    const isOwnScholarProfile =
      session?.user.role === "scholar" &&
      session.scholarProfile?.id === scholarId;

    if (
      !isPremiumUnlocked &&
      !isOwnScholarProfile &&
      !freeVisibleIds.has(scholarId)
    ) {
      const targetItem = allApprovedScholars.find(
        (item) => item.scholar.id === scholarId
      );
      const lockedPreview: LockedScholarPreview | null = targetItem
        ? {
            id: targetItem.scholar.id,
            research_field: targetItem.scholar.research_field,
            specialization: targetItem.scholar.specialization,
            domain_id: targetItem.scholar.domain_id,
            specialization_id: targetItem.scholar.specialization_id,
            university_institution: targetItem.scholar.university_institution,
            department: targetItem.scholar.department,
            internship_availability: targetItem.scholar.internship_availability,
            locked: true,
          }
        : null;

      return NextResponse.json(
        {
          error:
            "Unlock STARSKY Premium to view this verified PhD scholar profile and connect directly.",
          requiresPremium: true,
          isPremiumUnlocked: false,
          lockedPreview,
          subscriptionPlans: activePlans,
          studentApplications,
        },
        { status: 403 }
      );
    }

    if (incrementView) {
      const target = db.phd_scholar_profiles.find((s) => s.id === scholarId);
      if (target) {
        target.profile_views += 1;
        writeDb(db);
      }
    }

    const enriched = getEnrichedScholarById(scholarId, false);
    if (!enriched) {
      return NextResponse.json(
        { error: "Scholar not found or not yet verified." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      scholar: enriched,
      isPremiumUnlocked,
      subscriptionPlans: activePlans,
      studentApplications,
    });
  }

  const domains = db.academic_domains
    .filter((d) => d.is_active)
    .sort((a, b) => a.display_order - b.display_order);

  const specializations = db.specializations
    .filter((s) => s.is_active)
    .sort((a, b) => a.display_order - b.display_order);

  const visibleScholars = isPremiumUnlocked
    ? allApprovedScholars
    : allApprovedScholars.slice(0, freeScholarLimit);

  const lockedScholars = isPremiumUnlocked
    ? []
    : allApprovedScholars.slice(freeScholarLimit);

  const lockedScholarPreviews: LockedScholarPreview[] = lockedScholars.map(
    ({ scholar }) => ({
      id: scholar.id,
      research_field: scholar.research_field,
      specialization: scholar.specialization,
      domain_id: scholar.domain_id,
      specialization_id: scholar.specialization_id,
      university_institution: scholar.university_institution,
      department: scholar.department,
      internship_availability: scholar.internship_availability,
      locked: true,
    })
  );

  const internships = getEnrichedInternships(true);
  const careers = db.career_listings.filter((c) => c.is_published);
  const testimonials = db.testimonials
    .filter((t) => t.is_featured)
    .sort((a, b) => a.display_order - b.display_order);
  const announcements = db.announcements.filter((a) => a.is_active);

  const registeredStudents = db.profiles.filter(
    (p) => p.role === "student" && p.status === "active" && !p.deleted_at
  ).length;

  return NextResponse.json({
    settings: db.website_settings,
    domains,
    specializations,
    scholars: visibleScholars,
    totalApprovedScholarsCount: allApprovedScholars.length,
    lockedScholarsCount: lockedScholars.length,
    lockedScholarPreviews,
    isPremiumUnlocked,
    freeScholarLimit,
    subscriptionPlans: activePlans,
    internships,
    studentApplications,
    careers,
    testimonials,
    announcements,
    stats: {
      verifiedScholars: allApprovedScholars.length,
      activeInternships: internships.length,
      registeredStudents,
      academicDomains: domains.length,
      specializationsCount: specializations.length,
      totalApplications: db.internship_applications.length,
    },
  });
}
