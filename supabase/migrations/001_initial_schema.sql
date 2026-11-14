-- =============================================================================
-- STARSKY — Normalized PostgreSQL Schema & Row-Level Security (RLS) Migration
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. CORE PROFILES & USER ROLES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  gender TEXT,
  country TEXT DEFAULT 'India',
  state TEXT,
  city TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'scholar', 'admin')),
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (profile_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_profile_id ON public.user_roles(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- -----------------------------------------------------------------------------
-- 2. ACADEMIC DOMAINS & SPECIALIZATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academic_domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'BookOpen',
  image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_academic_domains_slug ON public.academic_domains(slug);
CREATE INDEX IF NOT EXISTS idx_academic_domains_order ON public.academic_domains(display_order) WHERE is_active = TRUE AND deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.specializations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_id UUID NOT NULL REFERENCES public.academic_domains(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (domain_id, name)
);

CREATE INDEX IF NOT EXISTS idx_specializations_domain_id ON public.specializations(domain_id);
CREATE INDEX IF NOT EXISTS idx_specializations_slug ON public.specializations(slug);

-- -----------------------------------------------------------------------------
-- 3. STUDENT PROFILES & INTERESTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  college_university TEXT NOT NULL,
  degree TEXT NOT NULL,
  department TEXT NOT NULL,
  current_year_semester TEXT NOT NULL,
  graduation_year INTEGER NOT NULL,
  academic_interests TEXT[] NOT NULL DEFAULT '{}',
  preferred_domains TEXT[] NOT NULL DEFAULT '{}',
  skills TEXT[] NOT NULL DEFAULT '{}',
  programming_languages TEXT[] NOT NULL DEFAULT '{}',
  previous_projects TEXT,
  research_experience TEXT,
  certifications TEXT[] NOT NULL DEFAULT '{}',
  resume_url TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_student_profiles_profile_id ON public.student_profiles(profile_id);

CREATE TABLE IF NOT EXISTS public.student_interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_profile_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  domain_id UUID REFERENCES public.academic_domains(id) ON DELETE CASCADE,
  specialization_id UUID REFERENCES public.specializations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_profile_id, specialization_id)
);

-- -----------------------------------------------------------------------------
-- 4. PHD SCHOLAR PROFILES, SPECIALIZATIONS, PUBLICATIONS & PROJECTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.phd_scholar_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  university_institution TEXT NOT NULL,
  department TEXT NOT NULL,
  research_field TEXT NOT NULL,
  specialization TEXT NOT NULL,
  domain_id UUID REFERENCES public.academic_domains(id) ON DELETE SET NULL,
  specialization_id UUID REFERENCES public.specializations(id) ON DELETE SET NULL,
  enrollment_year INTEGER NOT NULL,
  expected_completion_year INTEGER NOT NULL,
  current_research_topic TEXT NOT NULL,
  biography TEXT NOT NULL,
  education_summary TEXT,
  research_interests TEXT[] NOT NULL DEFAULT '{}',
  technical_skills TEXT[] NOT NULL DEFAULT '{}',
  research_tools TEXT[] NOT NULL DEFAULT '{}',
  certifications TEXT[] NOT NULL DEFAULT '{}',
  google_scholar_url TEXT,
  orcid_id TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  personal_website_url TEXT,
  internship_availability BOOLEAN NOT NULL DEFAULT TRUE,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  verification_notes TEXT,
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  profile_views INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_phd_scholar_profiles_domain ON public.phd_scholar_profiles(domain_id);
CREATE INDEX IF NOT EXISTS idx_phd_scholar_profiles_spec ON public.phd_scholar_profiles(specialization_id);
CREATE INDEX IF NOT EXISTS idx_phd_scholar_profiles_verification ON public.phd_scholar_profiles(verification_status) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.scholar_specializations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scholar_profile_id UUID NOT NULL REFERENCES public.phd_scholar_profiles(id) ON DELETE CASCADE,
  domain_id UUID NOT NULL REFERENCES public.academic_domains(id) ON DELETE CASCADE,
  specialization_id UUID NOT NULL REFERENCES public.specializations(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (scholar_profile_id, specialization_id)
);

CREATE TABLE IF NOT EXISTS public.publications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scholar_profile_id UUID NOT NULL REFERENCES public.phd_scholar_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  journal_conference TEXT NOT NULL,
  publication_year INTEGER NOT NULL,
  doi_or_url TEXT,
  co_authors TEXT,
  abstract TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_publications_scholar ON public.publications(scholar_profile_id);

CREATE TABLE IF NOT EXISTS public.research_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scholar_profile_id UUID NOT NULL REFERENCES public.phd_scholar_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed', 'upcoming')),
  technologies TEXT[] NOT NULL DEFAULT '{}',
  start_year INTEGER,
  end_year INTEGER,
  project_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_research_projects_scholar ON public.research_projects(scholar_profile_id);

-- -----------------------------------------------------------------------------
-- 5. INTERNSHIPS & INTERNSHIP APPLICATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.internships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scholar_profile_id UUID NOT NULL REFERENCES public.phd_scholar_profiles(id) ON DELETE CASCADE,
  domain_id UUID REFERENCES public.academic_domains(id) ON DELETE SET NULL,
  specialization_id UUID REFERENCES public.specializations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  required_skills TEXT[] NOT NULL DEFAULT '{}',
  eligibility_criteria TEXT NOT NULL,
  duration TEXT NOT NULL,
  available_positions INTEGER NOT NULL DEFAULT 1 CHECK (available_positions >= 1),
  mode TEXT NOT NULL DEFAULT 'Remote' CHECK (mode IN ('Remote', 'On-site', 'Hybrid')),
  application_deadline DATE NOT NULL,
  stipend TEXT,
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Closed', 'Draft')),
  moderation_status TEXT NOT NULL DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_internships_scholar ON public.internships(scholar_profile_id);
CREATE INDEX IF NOT EXISTS idx_internships_status ON public.internships(status, moderation_status) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.internship_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  internship_id UUID NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
  student_profile_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  scholar_profile_id UUID NOT NULL REFERENCES public.phd_scholar_profiles(id) ON DELETE CASCADE,
  student_full_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  student_phone TEXT NOT NULL,
  college_university TEXT NOT NULL,
  degree TEXT NOT NULL,
  department TEXT NOT NULL,
  current_academic_year TEXT NOT NULL,
  research_interests TEXT[] NOT NULL DEFAULT '{}',
  technical_skills TEXT[] NOT NULL DEFAULT '{}',
  statement_of_purpose TEXT NOT NULL,
  relevant_experience TEXT NOT NULL,
  expected_availability TEXT NOT NULL,
  preferred_duration TEXT NOT NULL,
  resume_url TEXT NOT NULL,
  portfolio_url TEXT,
  linkedin_url TEXT,
  additional_message TEXT,
  status TEXT NOT NULL DEFAULT 'Submitted' CHECK (
    status IN ('Submitted', 'Under Review', 'Shortlisted', 'Accepted', 'Rejected', 'Withdrawn')
  ),
  scholar_private_notes TEXT,
  is_reported BOOLEAN NOT NULL DEFAULT FALSE,
  report_reason TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Prevent duplicate applications to the same internship by the same student (unless previously withdrawn)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_application
  ON public.internship_applications(internship_id, student_profile_id)
  WHERE status <> 'Withdrawn' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_applications_student ON public.internship_applications(student_profile_id);
CREATE INDEX IF NOT EXISTS idx_applications_scholar ON public.internship_applications(scholar_profile_id);
CREATE INDEX IF NOT EXISTS idx_applications_internship ON public.internship_applications(internship_id);

-- -----------------------------------------------------------------------------
-- 6. SAVED SCHOLARS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_scholars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_profile_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  scholar_profile_id UUID NOT NULL REFERENCES public.phd_scholar_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_profile_id, scholar_profile_id)
);

-- -----------------------------------------------------------------------------
-- 7. PUBLIC WEBSITE CMS, CAREERS, CONTACT, TESTIMONIALS, ANNOUNCEMENTS, SETTINGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.career_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  employment_type TEXT NOT NULL DEFAULT 'Full-time',
  description TEXT NOT NULL,
  requirements TEXT[] NOT NULL DEFAULT '{}',
  application_email TEXT NOT NULL DEFAULT 'careers@starsky.edu',
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  closing_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'archived')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  institution TEXT NOT NULL,
  quote TEXT NOT NULL,
  avatar_url TEXT,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  is_featured BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'all' CHECK (audience IN ('all', 'students', 'scholars')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'important', 'urgent')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.website_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_name TEXT NOT NULL DEFAULT 'STARSKY',
  tagline TEXT NOT NULL DEFAULT 'Connecting Research Minds. Creating Opportunities.',
  logo_text TEXT NOT NULL DEFAULT 'STARSKY',
  hero_heading TEXT NOT NULL DEFAULT 'Where Student Ambitions Meet Research Excellence.',
  hero_description TEXT NOT NULL DEFAULT 'Discover research opportunities, connect with experienced PhD scholars, and turn your academic curiosity into real-world research experience.',
  hero_image_url TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=85',
  about_title TEXT NOT NULL DEFAULT 'Bridging the Gap Between Academic Curiosity and Research Mentorship',
  about_content TEXT NOT NULL,
  mission_statement TEXT NOT NULL,
  vision_statement TEXT NOT NULL,
  contact_email TEXT NOT NULL DEFAULT 'contact@starsky.edu',
  contact_phone TEXT NOT NULL DEFAULT '+91 (800) 555-0199',
  contact_address TEXT NOT NULL DEFAULT 'STARSKY Academic Innovation Hub, Research Park, Bengaluru, India',
  footer_text TEXT NOT NULL DEFAULT 'Empowering undergraduate and postgraduate students to collaborate with verified PhD scholars across multidisciplinary domains.',
  social_links JSONB NOT NULL DEFAULT '{"linkedin":"https://linkedin.com","twitter":"https://x.com","github":"https://github.com"}',
  seo_title TEXT NOT NULL DEFAULT 'STARSKY — Connecting Research Minds. Creating Opportunities.',
  seo_description TEXT NOT NULL DEFAULT 'Research collaboration and internship discovery platform connecting PhD scholars with ambitious students.',
  maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
  allow_registrations BOOLEAN NOT NULL DEFAULT TRUE,
  allow_student_registrations BOOLEAN NOT NULL DEFAULT TRUE,
  allow_scholar_registrations BOOLEAN NOT NULL DEFAULT TRUE,
  enable_email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 8. ADMIN ROLES, PERMISSIONS, ACTIVITY LOGS & NOTIFICATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_title TEXT NOT NULL DEFAULT 'Super Administrator',
  is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_role_id UUID NOT NULL REFERENCES public.admin_roles(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL CHECK (
    permission_key IN (
      'manage_users',
      'verify_scholars',
      'manage_domains',
      'manage_internships',
      'manage_applications',
      'manage_cms',
      'manage_settings',
      'manage_admins'
    )
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (admin_role_id, permission_key)
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  link_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_profile_id, is_read, created_at DESC);

-- -----------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phd_scholar_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholar_specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_scholars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.profile_id = p.id
    WHERE p.auth_user_id = auth.uid()
      AND ur.role = 'admin'
      AND p.status = 'active'
      AND p.deleted_at IS NULL
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Public read access to active domains, specializations, approved scholars, published internships, CMS settings
CREATE POLICY "Public view active domains" ON public.academic_domains
  FOR SELECT USING (is_active = TRUE AND deleted_at IS NULL OR public.is_admin());

CREATE POLICY "Public view active specializations" ON public.specializations
  FOR SELECT USING (is_active = TRUE AND deleted_at IS NULL OR public.is_admin());

CREATE POLICY "Public view approved scholar profiles" ON public.phd_scholar_profiles
  FOR SELECT USING (
    (verification_status = 'approved' AND deleted_at IS NULL)
    OR profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Scholars edit own profile" ON public.phd_scholar_profiles
  FOR UPDATE USING (
    profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Students view and edit own profile" ON public.student_profiles
  FOR ALL USING (
    profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Public view open approved internships" ON public.internships
  FOR SELECT USING (
    (status = 'Open' AND moderation_status = 'approved' AND deleted_at IS NULL)
    OR scholar_profile_id IN (
      SELECT sp.id FROM public.phd_scholar_profiles sp
      JOIN public.profiles p ON p.id = sp.profile_id
      WHERE p.auth_user_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "Scholars manage own internships" ON public.internships
  FOR ALL USING (
    scholar_profile_id IN (
      SELECT sp.id FROM public.phd_scholar_profiles sp
      JOIN public.profiles p ON p.id = sp.profile_id
      WHERE p.auth_user_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "Students view own applications and scholars view applications to their internships"
  ON public.internship_applications
  FOR SELECT USING (
    student_profile_id IN (
      SELECT st.id FROM public.student_profiles st
      JOIN public.profiles p ON p.id = st.profile_id
      WHERE p.auth_user_id = auth.uid()
    )
    OR scholar_profile_id IN (
      SELECT sc.id FROM public.phd_scholar_profiles sc
      JOIN public.profiles p ON p.id = sc.profile_id
      WHERE p.auth_user_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "Users view own notifications" ON public.notifications
  FOR ALL USING (
    recipient_profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    OR public.is_admin()
  );

