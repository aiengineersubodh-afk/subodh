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
import { EnrichedScholar, LockedScholarPreview } from "@/types/database";

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
    const scholarDetails = enrichedInternship.scholar?.id
      ? getEnrichedScholarById(enrichedInternship.scholar.id, false)
      : null;

    return NextResponse.json({
      internship: enrichedInternship,
      scholarDetails,
      studentApplication: studentApplications[internshipId] || null,
      studentApplications,
      isPremiumUnlocked,
    });
  }

  const allApprovedScholars = getEnrichedScholars(true);

  if (scholarId) {
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required to view detailed PhD Scholar profiles." },
        { status: 401 }
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

  const visibleScholars = allApprovedScholars;
  const lockedScholars: EnrichedScholar[] = [];
  const lockedScholarPreviews: LockedScholarPreview[] = [];

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
