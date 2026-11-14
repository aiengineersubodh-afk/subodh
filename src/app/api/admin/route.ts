import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSessionContext } from "@/lib/auth";
import { validateAcademicDomainAndSpecialization } from "@/lib/validations";
import {
  createNotification,
  getActiveStudentSubscription,
  getEnrichedApplications,
  getEnrichedInternships,
  getEnrichedScholars,
  hasActivePremiumAccess,
  hashPassword,
  logActivity,
  readDb,
  sanitizeProfile,
  writeDb,
} from "@/lib/db";
import {
  AcademicDomain,
  AdminPermissionKey,
  Announcement,
  CareerListing,
  Specialization,
  SubscriptionPlan,
  SubscriptionStatus,
  Testimonial,
  UserSubscription,
} from "@/types/database";

export async function GET() {
  const session = await getSessionContext();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json(
      { error: "Unauthorized: Administrator access required." },
      { status: 403 }
    );
  }

  const db = readDb();
  const activeProfiles = db.profiles.filter((p) => !p.deleted_at);

  const students = activeProfiles
    .filter((p) => p.role === "student")
    .map((profile) => {
      const studentProfile = db.student_profiles.find(
        (s) => s.profile_id === profile.id
      );
      const subscription = getActiveStudentSubscription(db, profile.id);
      const isPremium = hasActivePremiumAccess(db, profile.id, "student");
      return {
        profile: sanitizeProfile(profile),
        studentProfile,
        subscription,
        isPremium,
        applicationsCount: db.internship_applications.filter(
          (a) => studentProfile && a.student_profile_id === studentProfile.id
        ).length,
      };
    });

  const scholars = getEnrichedScholars(false).map((item) => ({
    ...item,
    profile: sanitizeProfile(item.profile),
  }));

  const internships = getEnrichedInternships(false);
  const applications = getEnrichedApplications();

  const admins = activeProfiles
    .filter((p) => p.role === "admin")
    .map((profile) => ({
      profile: sanitizeProfile(profile),
      adminRole: db.admin_roles.find((r) => r.profile_id === profile.id),
    }));

  const premiumMembersCount = (db.user_subscriptions || []).filter(
    (s) => s.status === "active" && new Date(s.expiry_date).getTime() > Date.now()
  ).length;

  const pendingSubscriptionsCount = (db.user_subscriptions || []).filter(
    (s) => s.status === "pending_approval"
  ).length;

  return NextResponse.json({
    overview: {
      totalUsers: activeProfiles.length,
      totalStudents: students.length,
      totalScholars: scholars.length,
      approvedScholars: scholars.filter(
        (s) => s.scholar.verification_status === "approved"
      ).length,
      pendingScholars: scholars.filter(
        (s) => s.scholar.verification_status === "pending"
      ).length,
      totalActiveInternships: db.internships.filter((i) => i.status === "Open")
        .length,
      totalInternships: db.internships.length,
      totalApplications: db.internship_applications.length,
      pendingApplications: db.internship_applications.filter(
        (a) => a.status === "Submitted" || a.status === "Under Review"
      ).length,
      acceptedApplications: db.internship_applications.filter(
        (a) => a.status === "Accepted"
      ).length,
      totalContactMessages: db.contact_messages.length,
      unreadContactMessages: db.contact_messages.filter(
        (m) => m.status === "unread"
      ).length,
      premiumMembersCount,
      pendingSubscriptionsCount,
    },
    students,
    scholars,
    internships,
    applications,
    domains: db.academic_domains.sort(
      (a, b) => a.display_order - b.display_order
    ),
    specializations: db.specializations.sort(
      (a, b) => a.display_order - b.display_order
    ),
    subscriptionPlans: (db.subscription_plans || []).sort(
      (a, b) => a.display_order - b.display_order
    ),
    userSubscriptions: db.user_subscriptions || [],
    subscriptionTransactions: db.subscription_transactions || [],
    scholarContactRequests: db.scholar_contact_requests || [],
    careers: db.career_listings,
    contactMessages: db.contact_messages,
    testimonials: db.testimonials.sort(
      (a, b) => a.display_order - b.display_order
    ),
    announcements: db.announcements,
    settings: db.website_settings,
    admins,
    activityLogs: db.activity_logs.slice(0, 100),
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionContext();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Administrator privileges required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, payload } = body;
    const db = readDb();
    const now = new Date().toISOString();

    const hasPermission = (perm: AdminPermissionKey): boolean => {
      if (!session.adminRole) return true;
      if (session.adminRole.is_super_admin) return true;
      return session.adminRole.permissions.includes(perm);
    };

    switch (action) {
      // -----------------------------------------------------------------------
      // A. USER MANAGEMENT & SCHOLAR VERIFICATION
      // -----------------------------------------------------------------------
      case "update_user_status": {
        if (!hasPermission("manage_users")) {
          return NextResponse.json(
            { error: "Insufficient admin permissions." },
            { status: 403 }
          );
        }
        const { profileId, status, deleteAccount } = payload;
        const user = db.profiles.find((p) => p.id === profileId);
        if (!user) {
          return NextResponse.json(
            { error: "User not found." },
            { status: 404 }
          );
        }
        if (user.id === session.user.id) {
          return NextResponse.json(
            {
              error:
                "You cannot deactivate or delete your own active admin account.",
            },
            { status: 400 }
          );
        }

        if (deleteAccount) {
          user.deleted_at = now;
          user.status = "inactive";
          logActivity(db, {
            actor_profile_id: session.user.id,
            actor_name: session.user.full_name,
            actor_role: "admin",
            action: "Deleted User Account",
            entity_type: "profiles",
            entity_id: user.id,
            details: `Deleted account for ${user.full_name} (${user.email}).`,
          });
        } else if (status) {
          user.status = status;
          user.updated_at = now;
          logActivity(db, {
            actor_profile_id: session.user.id,
            actor_name: session.user.full_name,
            actor_role: "admin",
            action: `Changed User Status to ${status}`,
            entity_type: "profiles",
            entity_id: user.id,
            details: `Updated status of ${user.full_name} to ${status}.`,
          });
        }
        writeDb(db);
        return NextResponse.json({ success: true });
      }

      case "edit_user_details": {
        if (!hasPermission("manage_users")) {
          return NextResponse.json(
            { error: "Insufficient admin permissions." },
            { status: 403 }
          );
        }
        const {
          profileId,
          full_name,
          phone,
          city,
          state,
          country,
          institution,
          department,
        } = payload;
        const user = db.profiles.find((p) => p.id === profileId);
        if (!user) {
          return NextResponse.json(
            { error: "User not found." },
            { status: 404 }
          );
        }
        if (full_name) user.full_name = String(full_name);
        if (phone) user.phone = String(phone);
        if (city) user.city = String(city);
        if (state) user.state = String(state);
        if (country) user.country = String(country);
        user.updated_at = now;

        if (user.role === "student") {
          const st = db.student_profiles.find((s) => s.profile_id === user.id);
          if (st) {
            if (institution) st.college_university = String(institution);
            if (department) st.department = String(department);
            st.updated_at = now;
          }
        } else if (user.role === "scholar") {
          const sc = db.phd_scholar_profiles.find(
            (s) => s.profile_id === user.id
          );
          if (sc) {
            if (institution) sc.university_institution = String(institution);
            if (department) sc.department = String(department);
            sc.updated_at = now;
          }
        }

        logActivity(db, {
          actor_profile_id: session.user.id,
          actor_name: session.user.full_name,
          actor_role: "admin",
          action: "Edited User Profile",
          entity_type: "profiles",
          entity_id: user.id,
          details: `Admin updated profile details for ${user.full_name}.`,
        });

        writeDb(db);
        return NextResponse.json({ success: true });
      }

      case "verify_scholar": {
        if (!hasPermission("verify_scholars")) {
          return NextResponse.json(
            { error: "Insufficient admin permissions." },
            { status: 403 }
          );
        }
        const {
          scholarId,
          verification_status,
          verification_notes,
          is_featured,
        } = payload;
        const scholar = db.phd_scholar_profiles.find((s) => s.id === scholarId);
        if (!scholar) {
          return NextResponse.json(
            { error: "Scholar profile not found." },
            { status: 404 }
          );
        }

        if (verification_status) {
          scholar.verification_status = verification_status;
          scholar.verified_by = session.user.id;
          scholar.verified_at = now;
        }
        if (verification_notes !== undefined) {
          scholar.verification_notes = String(verification_notes);
        }
        if (is_featured !== undefined) {
          scholar.is_featured = Boolean(is_featured);
        }
        scholar.updated_at = now;

        if (verification_status) {
          createNotification(db, {
            recipient_profile_id: scholar.profile_id,
            title:
              verification_status === "approved"
                ? "PhD Scholar Profile Verified & Approved!"
                : "PhD Scholar Verification Update",
            message:
              verification_status === "approved"
                ? "Your institutional credentials have been verified. Your profile and internships are now publicly visible to students."
                : `Your scholar profile status was set to '${verification_status}'. ${
                    verification_notes || ""
                  }`,
            type: verification_status === "approved" ? "success" : "warning",
            link_url: "/dashboard/scholar",
          });
        }

        logActivity(db, {
          actor_profile_id: session.user.id,
          actor_name: session.user.full_name,
          actor_role: "admin",
          action: `Scholar Verification (${scholar.verification_status})`,
          entity_type: "phd_scholar_profiles",
          entity_id: scholar.id,
          details: `Updated scholar ${scholar.id} verification status to ${scholar.verification_status}.`,
        });

        writeDb(db);
        return NextResponse.json({ success: true });
      }

      // -----------------------------------------------------------------------
      // B. ACADEMIC DOMAIN & SPECIALIZATION MANAGEMENT
      // -----------------------------------------------------------------------
      case "create_domain": {
        if (!hasPermission("manage_domains")) {
          return NextResponse.json(
            { error: "Insufficient admin permissions." },
            { status: 403 }
          );
        }
        const { name, description, icon_name, image_url, display_order } =
          payload;
        if (!name || !description) {
          return NextResponse.json(
            { error: "Domain name and description are required." },
            { status: 400 }
          );
        }
        const slug = String(name)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        const newDomain: AcademicDomain = {
          id: `dom-${slug}-${crypto.randomUUID().slice(0, 4)}`,
          name: String(name).trim(),
          slug,
          description: String(description).trim(),
          icon_name: icon_name || "BookOpen",
          image_url:
            image_url ||
            "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=900&q=80",
          display_order:
            Number(display_order) || db.academic_domains.length + 1,
          is_active: true,
          created_at: now,
          updated_at: now,
        };
        db.academic_domains.push(newDomain);
        logActivity(db, {
          actor_profile_id: session.user.id,
          actor_name: session.user.full_name,
          actor_role: "admin",
          action: "Created Academic Domain",
          entity_type: "academic_domains",
          entity_id: newDomain.id,
          details: `Added domain '${newDomain.name}'.`,
        });
        writeDb(db);
        return NextResponse.json({ success: true, domain: newDomain });
      }

      case "update_domain": {
        if (!hasPermission("manage_domains")) {
          return NextResponse.json(
            { error: "Insufficient admin permissions." },
            { status: 403 }
          );
        }
        const {
          id,
          name,
          description,
          icon_name,
          image_url,
          display_order,
          is_active,
        } = payload;
        const dom = db.academic_domains.find((d) => d.id === id);
        if (!dom) {
          return NextResponse.json(
            { error: "Domain not found." },
            { status: 404 }
          );
        }
        if (name !== undefined) dom.name = String(name).trim();
        if (description !== undefined)
          dom.description = String(description).trim();
        if (icon_name !== undefined) dom.icon_name = String(icon_name);
        if (image_url !== undefined) dom.image_url = String(image_url);
        if (display_order !== undefined)
          dom.display_order = Number(display_order);
        if (is_active !== undefined) dom.is_active = Boolean(is_active);
        dom.updated_at = now;
        writeDb(db);
        return NextResponse.json({ success: true, domain: dom });
      }

      case "delete_domain": {
        if (!hasPermission("manage_domains")) {
          return NextResponse.json(
            { error: "Insufficient admin permissions." },
            { status: 403 }
          );
        }
        const { id } = payload;
        db.academic_domains = db.academic_domains.filter((d) => d.id !== id);
        db.specializations = db.specializations.filter(
          (s) => s.domain_id !== id
        );
        logActivity(db, {
          actor_profile_id: session.user.id,
          actor_name: session.user.full_name,
          actor_role: "admin",
          action: "Deleted Academic Domain",
          entity_type: "academic_domains",
          entity_id: id,
          details: `Deleted domain ${id} and its associated specializations.`,
        });
        writeDb(db);
        return NextResponse.json({ success: true });
      }

      case "create_specialization": {
        if (!hasPermission("manage_domains")) {
          return NextResponse.json(
            { error: "Insufficient admin permissions." },
            { status: 403 }
          );
        }
        const { domain_id, name, description, display_order } = payload;
        if (!domain_id || !name) {
          return NextResponse.json(
            { error: "Domain and specialization name are required." },
            { status: 400 }
          );
        }
        const slug = `${domain_id.replace("dom-", "")}-${String(name)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")}`;
        const newSpec: Specialization = {
          id: `spec-${slug}-${crypto.randomUUID().slice(0, 4)}`,
          domain_id: String(domain_id),
          name: String(name).trim(),
          slug,
          description:
            description ||
            `Focused research programs, publications, and academic mentorship in ${name}.`,
          display_order:
            Number(display_order) ||
            db.specializations.filter((s) => s.domain_id === domain_id).length +
              1,
          is_active: true,
          created_at: now,
          updated_at: now,
        };
        db.specializations.push(newSpec);
        logActivity(db, {
          actor_profile_id: session.user.id,
          actor_name: session.user.full_name,
          actor_role: "admin",
          action: "Created Specialization",
          entity_type: "specializations",
          entity_id: newSpec.id,
          details: `Added specialization '${newSpec.name}' under domain ${domain_id}.`,
        });
        writeDb(db);
        return NextResponse.json({ success: true, specialization: newSpec });
      }

      case "update_specialization": {
        if (!hasPermission("manage_domains")) {
          return NextResponse.json(
            { error: "Insufficient admin permissions." },
            { status: 403 }
          );
        }
        const { id, domain_id, name, description, display_order, is_active } =
          payload;
        const spec = db.specializations.find((s) => s.id === id);
        if (!spec) {
          return NextResponse.json(
            { error: "Specialization not found." },
            { status: 404 }
          );
        }
        if (domain_id !== undefined) spec.domain_id = String(domain_id);
        if (name !== undefined) spec.name = String(name).trim();
        if (description !== undefined)
          spec.description = String(description).trim();
        if (display_order !== undefined)
          spec.display_order = Number(display_order);
        if (is_active !== undefined) spec.is_active = Boolean(is_active);
        spec.updated_at = now;
        writeDb(db);
        return NextResponse.json({ success: true, specialization: spec });
      }

      case "delete_specialization": {
        if (!hasPermission("manage_domains")) {
          return NextResponse.json(
            { error: "Insufficient admin permissions." },
            { status: 403 }
          );
        }
        const { id } = payload;
        db.specializations = db.specializations.filter((s) => s.id !== id);
        writeDb(db);
        return NextResponse.json({ success: true });
      }

      // -----------------------------------------------------------------------
      // C. INTERNSHIP MODERATION
      // -----------------------------------------------------------------------
      case "moderate_internship": {
        if (!hasPermission("manage_internships")) {
          return NextResponse.json(
            { error: "Insufficient admin permissions." },
            { status: 403 }
          );
        }
        const {
          internshipId,
          moderation_status,
          status,
          title,
          stipend,
          duration,
          domain_id,
          specialization_id,
        } = payload;
        const internship = db.internships.find((i) => i.id === internshipId);
        if (!internship) {
          return NextResponse.json(
            { error: "Internship not found." },
            { status: 404 }
          );
        }
        if (domain_id || specialization_id) {
          const targetDomId = domain_id ? String(domain_id) : internship.domain_id;
          const targetSpecId = specialization_id ? String(specialization_id) : internship.specialization_id;
          const v = validateAcademicDomainAndSpecialization(
            db.academic_domains,
            db.specializations,
            targetDomId,
            targetSpecId,
            true
          );
          if (!v.valid) {
            return NextResponse.json(
              { error: v.error || "Invalid domain or specialization for reclassification." },
              { status: 400 }
            );
          }
          internship.domain_id = targetDomId;
          internship.specialization_id = targetSpecId;
        }
        if (moderation_status) internship.moderation_status = moderation_status;
        if (status) internship.status = status;
        if (title) internship.title = String(title);
        if (stipend) internship.stipend = String(stipend);
        if (duration) internship.duration = String(duration);
        internship.updated_at = now;

        logActivity(db, {
          actor_profile_id: session.user.id,
          actor_name: session.user.full_name,
          actor_role: "admin",
          action: `Moderated Internship (${internship.moderation_status} / ${internship.status})`,
          entity_type: "internships",
          entity_id: internship.id,
          details: `Updated internship '${internship.title}'.`,
        });

        writeDb(db);
        return NextResponse.json({ success: true });
      }

      // -----------------------------------------------------------------------
      // D. WEBSITE CMS & PLATFORM SETTINGS
      // -----------------------------------------------------------------------
      case "update_website_settings": {
        if (!hasPermission("manage_cms") && !hasPermission("manage_settings")) {
          return NextResponse.json(
            { error: "Insufficient admin permissions." },
            { status: 403 }
          );
        }
        db.website_settings = {
          ...db.website_settings,
          ...payload,
          social_links: {
            ...db.website_settings.social_links,
            ...(payload.social_links || {}),
          },
          updated_at: now,
        };
        logActivity(db, {
          actor_profile_id: session.user.id,
          actor_name: session.user.full_name,
          actor_role: "admin",
          action: "Updated Website CMS / Settings",
          entity_type: "website_settings",
          entity_id: db.website_settings.id,
          details: "Updated public website content or platform settings.",
        });
        writeDb(db);
        return NextResponse.json({
          success: true,
          settings: db.website_settings,
        });
      }

      // -----------------------------------------------------------------------
      // E. CAREERS MANAGEMENT
      // -----------------------------------------------------------------------
      case "save_career": {
        if (!hasPermission("manage_cms")) {
          return NextResponse.json(
            { error: "Insufficient admin permissions." },
            { status: 403 }
          );
        }
        const {
          id,
          title,
          department,
          location,
          employment_type,
          description,
          requirements,
          application_email,
          is_published,
          closing_date,
        } = payload;

        if (id) {
          const item = db.career_listings.find((c) => c.id === id);
          if (item) {
            if (title !== undefined) item.title = String(title);
            if (department !== undefined) item.department = String(department);
            if (location !== undefined) item.location = String(location);
            if (employment_type !== undefined)
              item.employment_type = String(employment_type);
            if (description !== undefined)
              item.description = String(description);
            if (Array.isArray(requirements)) item.requirements = requirements;
            if (application_email !== undefined)
              item.application_email = String(application_email);
            if (is_published !== undefined)
              item.is_published = Boolean(is_published);
            if (closing_date !== undefined)
              item.closing_date = String(closing_date);
            item.updated_at = now;
          }
        } else {
          const newCareer: CareerListing = {
            id: `car-${crypto.randomUUID().slice(0, 8)}`,
            title: String(title),
            department: String(department || "General"),
            location: String(location || "Remote"),
            employment_type: String(employment_type || "Full-time"),
            description: String(description),
            requirements: Array.isArray(requirements) ? requirements : [],
            application_email: String(
              application_email || "careers@starsky.edu"
            ),
            is_published: is_published ?? true,
            closing_date: String(closing_date || "2027-06-30"),
            created_at: now,
            updated_at: now,
          };
          db.career_listings.unshift(newCareer);
        }
        writeDb(db);
        return NextResponse.json({ success: true });
      }

      case "delete_career": {
        const { id } = payload;
        db.career_listings = db.career_listings.filter((c) => c.id !== id);
        writeDb(db);
        return NextResponse.json({ success: true });
      }

      // -----------------------------------------------------------------------
      // F. CONTACT MESSAGES, TESTIMONIALS & ANNOUNCEMENTS
      // -----------------------------------------------------------------------
      case "update_contact_message": {
        const { id, status, admin_notes } = payload;
        const msg = db.contact_messages.find((m) => m.id === id);
        if (msg) {
          if (status) msg.status = status;
          if (admin_notes !== undefined) msg.admin_notes = String(admin_notes);
          msg.updated_at = now;
        }
        writeDb(db);
        return NextResponse.json({ success: true });
      }

      case "delete_contact_message": {
        const { id } = payload;
        db.contact_messages = db.contact_messages.filter((m) => m.id !== id);
        writeDb(db);
        return NextResponse.json({ success: true });
      }

      case "save_testimonial": {
        const {
          id,
          author_name,
          author_role,
          institution,
          quote,
          rating,
          is_featured,
        } = payload;
        if (id) {
          const t = db.testimonials.find((x) => x.id === id);
          if (t) {
            if (author_name !== undefined) t.author_name = String(author_name);
            if (author_role !== undefined) t.author_role = String(author_role);
            if (institution !== undefined) t.institution = String(institution);
            if (quote !== undefined) t.quote = String(quote);
            if (rating !== undefined) t.rating = Number(rating);
            if (is_featured !== undefined)
              t.is_featured = Boolean(is_featured);
          }
        } else {
          const newT: Testimonial = {
            id: `test-${crypto.randomUUID().slice(0, 8)}`,
            author_name: String(author_name),
            author_role: String(author_role),
            institution: String(institution),
            quote: String(quote),
            avatar_url:
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
            rating: Number(rating) || 5,
            is_featured: is_featured ?? true,
            display_order: db.testimonials.length + 1,
            created_at: now,
          };
          db.testimonials.push(newT);
        }
        writeDb(db);
        return NextResponse.json({ success: true });
      }

      case "delete_testimonial": {
        const { id } = payload;
        db.testimonials = db.testimonials.filter((t) => t.id !== id);
        writeDb(db);
        return NextResponse.json({ success: true });
      }

      case "save_announcement": {
        const { id, title, content, audience, priority, is_active } = payload;
        if (id) {
          const a = db.announcements.find((x) => x.id === id);
          if (a) {
            if (title !== undefined) a.title = String(title);
            if (content !== undefined) a.content = String(content);
            if (audience !== undefined) a.audience = audience;
            if (priority !== undefined) a.priority = priority;
            if (is_active !== undefined) a.is_active = Boolean(is_active);
          }
        } else {
          const newAnn: Announcement = {
            id: `ann-${crypto.randomUUID().slice(0, 8)}`,
            title: String(title),
            content: String(content),
            audience: audience || "all",
            priority: priority || "normal",
            is_active: is_active ?? true,
            created_at: now,
          };
          db.announcements.unshift(newAnn);
        }
        writeDb(db);
        return NextResponse.json({ success: true });
      }

      case "delete_announcement": {
        const { id } = payload;
        db.announcements = db.announcements.filter((a) => a.id !== id);
        writeDb(db);
        return NextResponse.json({ success: true });
      }

      // -----------------------------------------------------------------------
      // G. ADMIN MANAGEMENT
      // -----------------------------------------------------------------------
      case "create_admin": {
        if (!hasPermission("manage_admins")) {
          return NextResponse.json(
            {
              error:
                "Only Super Administrators can create or manage administrator accounts.",
            },
            { status: 403 }
          );
        }
        const { full_name, email, password, role_title, permissions } = payload;
        if (!full_name || !email || !password) {
          return NextResponse.json(
            { error: "Name, email, and password are required." },
            { status: 400 }
          );
        }
        const existing = db.profiles.find(
          (p) =>
            p.email.toLowerCase() === String(email).toLowerCase() &&
            !p.deleted_at
        );
        if (existing) {
          return NextResponse.json(
            { error: "An account with this email already exists." },
            { status: 409 }
          );
        }
        const adminProfileId = `usr-admin-${crypto.randomUUID().slice(0, 6)}`;
        db.profiles.push({
          id: adminProfileId,
          email: String(email).trim(),
          password_hash: hashPassword(String(password)),
          full_name: String(full_name).trim(),
          avatar_url:
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
          phone: "+91 800 555 0100",
          country: "India",
          state: "Karnataka",
          city: "Bengaluru",
          role: "admin",
          status: "active",
          email_verified: true,
          onboarding_completed: true,
          created_at: now,
          updated_at: now,
        });

        db.admin_roles.push({
          id: `adm-role-${crypto.randomUUID().slice(0, 6)}`,
          profile_id: adminProfileId,
          role_title: String(role_title || "Platform Moderator"),
          is_super_admin: false,
          permissions: Array.isArray(permissions)
            ? permissions
            : ["manage_users", "verify_scholars", "manage_internships"],
          created_by: session.user.id,
          created_at: now,
        });

        logActivity(db, {
          actor_profile_id: session.user.id,
          actor_name: session.user.full_name,
          actor_role: "admin",
          action: "Created Administrator Account",
          entity_type: "admin_roles",
          entity_id: adminProfileId,
          details: `Authorized new admin ${full_name} (${email}).`,
        });

        writeDb(db);
        return NextResponse.json({ success: true });
      }

      case "update_admin_permissions": {
        if (!hasPermission("manage_admins")) {
          return NextResponse.json(
            {
              error:
                "Only Super Administrators can modify admin permissions.",
            },
            { status: 403 }
          );
        }
        const { profileId, role_title, permissions } = payload;
        const roleRec = db.admin_roles.find((r) => r.profile_id === profileId);
        if (roleRec) {
          if (role_title) roleRec.role_title = String(role_title);
          if (Array.isArray(permissions)) roleRec.permissions = permissions;
        }
        logActivity(db, {
          actor_profile_id: session.user.id,
          actor_name: session.user.full_name,
          actor_role: "admin",
          action: "Updated Admin Permissions",
          entity_type: "admin_roles",
          entity_id: profileId,
          details: `Updated permissions for admin ${profileId}.`,
        });
        writeDb(db);
        return NextResponse.json({ success: true });
      }

      // -----------------------------------------------------------------------
      // H. PREMIUM MEMBERSHIP & SUBSCRIPTION MANAGEMENT
      // -----------------------------------------------------------------------
      case "grant_premium_access": {
        if (!hasPermission("manage_users") && !hasPermission("manage_settings")) {
          return NextResponse.json(
            { error: "Insufficient admin permissions." },
            { status: 403 }
          );
        }
        const { studentUserId, planId, customDays, notes } = payload;
        const studentUser = db.profiles.find((p) => p.id === studentUserId);
        if (!studentUser) {
          return NextResponse.json(
            { error: "Student account not found." },
            { status: 404 }
          );
        }

        const studentProf = db.student_profiles.find(
          (s) => s.profile_id === studentUser.id
        );
        const plan =
          (db.subscription_plans || []).find((p) => p.id === planId) ||
          db.subscription_plans[0];

        const durationDays =
          Number(customDays) > 0
            ? Number(customDays)
            : plan?.duration_days || 90;

        const startDate = new Date();
        const expiryDate = new Date(
          startDate.getTime() + durationDays * 24 * 60 * 60 * 1000
        );

        // Expire/replace any existing active or pending subscription for this student
        const existingIdx = (db.user_subscriptions || []).findIndex(
          (s) =>
            s.student_id === studentUser.id &&
            (s.status === "active" || s.status === "pending_approval")
        );

        let subscription: UserSubscription;
        if (existingIdx >= 0) {
          subscription = {
            ...db.user_subscriptions[existingIdx],
            plan_id: plan?.id || "plan-quarterly",
            plan_name: plan?.name || "Quarterly Research Pass",
            status: "active",
            start_date: startDate.toISOString(),
            expiry_date: expiryDate.toISOString(),
            payment_status: "admin_granted",
            granted_by_admin_id: session.user.id,
            notes:
              notes ||
              `Activated by Administrator (${session.user.full_name}) for ${durationDays} days.`,
            updated_at: now,
          };
          db.user_subscriptions[existingIdx] = subscription;
        } else {
          subscription = {
            id: `sub-${crypto.randomUUID().slice(0, 8)}`,
            student_id: studentUser.id,
            student_profile_id: studentProf?.id,
            plan_id: plan?.id || "plan-quarterly",
            plan_name: plan?.name || "Quarterly Research Pass",
            status: "active",
            start_date: startDate.toISOString(),
            expiry_date: expiryDate.toISOString(),
            payment_status: "admin_granted",
            granted_by_admin_id: session.user.id,
            notes:
              notes ||
              `Granted by Administrator (${session.user.full_name}) for ${durationDays} days.`,
            created_at: now,
            updated_at: now,
          };
          db.user_subscriptions.unshift(subscription);
        }

        db.subscription_transactions.unshift({
          id: `subtx-${crypto.randomUUID().slice(0, 8)}`,
          subscription_id: subscription.id,
          student_id: studentUser.id,
          student_name: studentUser.full_name,
          student_email: studentUser.email,
          plan_id: subscription.plan_id,
          plan_name: subscription.plan_name,
          amount: plan?.price || 0,
          currency: plan?.currency || "INR",
          transaction_type: "admin_grant",
          payment_status: "admin_granted",
          notes:
            notes ||
            `Admin granted ${subscription.plan_name} (${durationDays} days).`,
          actor_id: session.user.id,
          actor_name: session.user.full_name,
          created_at: now,
        });

        createNotification(db, {
          recipient_profile_id: studentUser.id,
          title: "STARSKY Premium Membership Activated!",
          message: `Your STARSKY Premium membership (${subscription.plan_name}) is now active until ${expiryDate.toLocaleDateString()}. You now have full access to the PhD scholar directory and direct scholar messaging.`,
          type: "success",
          link_url: "/explore?tab=scholars",
        });

        logActivity(db, {
          actor_profile_id: session.user.id,
          actor_name: session.user.full_name,
          actor_role: "admin",
          action: "Granted Premium Membership",
          entity_type: "user_subscriptions",
          entity_id: subscription.id,
          details: `Granted ${subscription.plan_name} to ${studentUser.full_name} (${studentUser.email}) until ${expiryDate.toISOString().slice(0, 10)}.`,
        });

        writeDb(db);
        return NextResponse.json({ success: true, subscription });
      }

      case "update_subscription_status": {
        if (!hasPermission("manage_users") && !hasPermission("manage_settings")) {
          return NextResponse.json(
            { error: "Insufficient admin permissions." },
            { status: 403 }
          );
        }
        const { subscriptionId, studentUserId, status, notes } = payload as {
          subscriptionId?: string;
          studentUserId?: string;
          status: SubscriptionStatus;
          notes?: string;
        };

        const sub = (db.user_subscriptions || []).find(
          (s) =>
            (subscriptionId && s.id === subscriptionId) ||
            (studentUserId && s.student_id === studentUserId)
        );
        if (!sub) {
          return NextResponse.json(
            { error: "Subscription record not found." },
            { status: 404 }
          );
        }

        sub.status = status;
        if (notes !== undefined) sub.notes = String(notes);
        if (status === "active" && new Date(sub.expiry_date).getTime() <= Date.now()) {
          // Extend by 30 days if re-activating an expired record
          sub.expiry_date = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString();
        }
        sub.updated_at = now;

        const studentUser = db.profiles.find((p) => p.id === sub.student_id);

        db.subscription_transactions.unshift({
          id: `subtx-${crypto.randomUUID().slice(0, 8)}`,
          subscription_id: sub.id,
          student_id: sub.student_id,
          student_name: studentUser?.full_name || "Student",
          student_email: studentUser?.email || "",
          plan_id: sub.plan_id,
          plan_name: sub.plan_name,
          amount: 0,
          currency: "INR",
          transaction_type:
            status === "revoked" ? "admin_revoke" : "status_change",
          payment_status: sub.payment_status,
          notes:
            notes ||
            `Admin updated subscription status to '${status}'.`,
          actor_id: session.user.id,
          actor_name: session.user.full_name,
          created_at: now,
        });

        createNotification(db, {
          recipient_profile_id: sub.student_id,
          title: `STARSKY Premium Status Updated (${status.toUpperCase()})`,
          message:
            status === "active"
              ? `Your STARSKY Premium membership (${sub.plan_name}) is active.`
              : `Your STARSKY Premium membership status has been updated to '${status}'.`,
          type: status === "active" ? "success" : "warning",
          link_url: "/dashboard/student",
        });

        logActivity(db, {
          actor_profile_id: session.user.id,
          actor_name: session.user.full_name,
          actor_role: "admin",
          action: `Updated Subscription Status (${status})`,
          entity_type: "user_subscriptions",
          entity_id: sub.id,
          details: `Updated subscription ${sub.id} for ${
            studentUser?.full_name || sub.student_id
          } to ${status}.`,
        });

        writeDb(db);
        return NextResponse.json({ success: true, subscription: sub });
      }

      case "save_subscription_plan": {
        if (!hasPermission("manage_settings")) {
          return NextResponse.json(
            { error: "Insufficient admin permissions." },
            { status: 403 }
          );
        }
        const {
          id,
          name,
          billing_cycle,
          price,
          currency,
          duration_days,
          description,
          features,
          is_active,
          is_popular,
        } = payload;

        if (id) {
          const plan = db.subscription_plans.find((p) => p.id === id);
          if (plan) {
            if (name !== undefined) plan.name = String(name);
            if (billing_cycle !== undefined) plan.billing_cycle = billing_cycle;
            if (price !== undefined) plan.price = Number(price);
            if (currency !== undefined) plan.currency = String(currency);
            if (duration_days !== undefined)
              plan.duration_days = Number(duration_days);
            if (description !== undefined)
              plan.description = String(description);
            if (Array.isArray(features)) plan.features = features;
            if (is_active !== undefined) plan.is_active = Boolean(is_active);
            if (is_popular !== undefined) plan.is_popular = Boolean(is_popular);
            plan.updated_at = now;
          }
        } else {
          const newPlan: SubscriptionPlan = {
            id: `plan-${crypto.randomUUID().slice(0, 6)}`,
            name: String(name || "Custom Research Plan"),
            billing_cycle: billing_cycle || "monthly",
            price: Number(price) || 499,
            currency: String(currency || "INR"),
            duration_days: Number(duration_days) || 30,
            description: String(
              description || "Full PhD scholar directory and direct contact."
            ),
            features: Array.isArray(features)
              ? features
              : [
                  "Full PhD scholar directory",
                  "Direct scholar contact",
                  "Advanced researcher discovery",
                ],
            is_active: is_active ?? true,
            is_popular: Boolean(is_popular),
            display_order: (db.subscription_plans || []).length + 1,
            created_at: now,
            updated_at: now,
          };
          db.subscription_plans.push(newPlan);
        }

        logActivity(db, {
          actor_profile_id: session.user.id,
          actor_name: session.user.full_name,
          actor_role: "admin",
          action: "Saved Subscription Plan",
          entity_type: "subscription_plans",
          entity_id: id || "new",
          details: `Saved subscription plan '${name}'.`,
        });

        writeDb(db);
        return NextResponse.json({
          success: true,
          plans: db.subscription_plans,
        });
      }

      case "toggle_premium_system": {
        if (!hasPermission("manage_settings")) {
          return NextResponse.json(
            { error: "Insufficient admin permissions." },
            { status: 403 }
          );
        }
        const { enable_premium_system, free_scholar_limit } = payload;
        if (enable_premium_system !== undefined) {
          db.website_settings.enable_premium_system = Boolean(
            enable_premium_system
          );
        }
        if (free_scholar_limit !== undefined && Number(free_scholar_limit) >= 1) {
          db.website_settings.free_scholar_limit = Number(free_scholar_limit);
        }
        db.website_settings.updated_at = now;

        logActivity(db, {
          actor_profile_id: session.user.id,
          actor_name: session.user.full_name,
          actor_role: "admin",
          action: "Updated Global Premium System Settings",
          entity_type: "website_settings",
          entity_id: db.website_settings.id,
          details: `Set enable_premium_system=${db.website_settings.enable_premium_system}, free_scholar_limit=${db.website_settings.free_scholar_limit}.`,
        });

        writeDb(db);
        return NextResponse.json({
          success: true,
          settings: db.website_settings,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown admin action: ${action}` },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error("Admin API error:", err);
    return NextResponse.json(
      { error: "Failed to process administrative request." },
      { status: 500 }
    );
  }
}
