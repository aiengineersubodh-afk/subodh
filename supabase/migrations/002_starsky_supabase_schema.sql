-- =============================================================================
-- STARSKY — Normalized PostgreSQL Schema, Auth Hooks & RLS Policies (Migration 002)
-- Compatible with Supabase PostgreSQL, Supabase Auth, and Semantic String IDs
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. CORE PROFILES & USER ROLES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
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
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user ON public.profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  profile_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'scholar', 'admin')),
  assigned_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (profile_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_profile_id ON public.user_roles(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Helper functions for RLS
CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.profile_id
    WHERE p.auth_user_id = auth.uid() AND ur.role = 'admin'
  );
$$;

-- -----------------------------------------------------------------------------
-- 2. ACADEMIC DOMAINS & SPECIALIZATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academic_domains (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
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
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  domain_id TEXT NOT NULL REFERENCES public.academic_domains(id) ON DELETE CASCADE,
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
-- 3. STUDENT PROFILES & PROJECTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  profile_id TEXT NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  college_university TEXT NOT NULL,
  degree TEXT NOT NULL,
  department TEXT NOT NULL,
  domain_id TEXT REFERENCES public.academic_domains(id) ON DELETE SET NULL,
  specialization_id TEXT REFERENCES public.specializations(id) ON DELETE SET NULL,
  specialization TEXT,
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_profiles_profile_id ON public.student_profiles(profile_id);

CREATE TABLE IF NOT EXISTS public.student_projects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_profile_id TEXT NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  skills_used TEXT[] NOT NULL DEFAULT '{}',
  github_url TEXT,
  live_demo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_projects_student ON public.student_projects(student_profile_id);

-- -----------------------------------------------------------------------------
-- 4. PHD SCHOLAR PROFILES, PUBLICATIONS & PROJECTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.phd_scholar_profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  profile_id TEXT NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  domain_id TEXT NOT NULL REFERENCES public.academic_domains(id) ON DELETE RESTRICT,
  specialization_id TEXT NOT NULL REFERENCES public.specializations(id) ON DELETE RESTRICT,
  university_institution TEXT NOT NULL,
  department TEXT NOT NULL,
  current_phd_year INTEGER NOT NULL DEFAULT 1,
  expected_completion_year INTEGER NOT NULL,
  supervisor_name TEXT,
  supervisor_email TEXT,
  doctoral_research_topic TEXT NOT NULL,
  research_abstract TEXT NOT NULL,
  research_field TEXT NOT NULL,
  specialization TEXT NOT NULL,
  methodologies TEXT[] NOT NULL DEFAULT '{}',
  tools_software TEXT[] NOT NULL DEFAULT '{}',
  orcid_id TEXT,
  google_scholar_url TEXT,
  researchgate_url TEXT,
  linkedin_url TEXT,
  lab_institution_url TEXT,
  institutional_id_card_url TEXT,
  enrollment_proof_url TEXT,
  is_profile_approved BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  is_available_for_mentorship BOOLEAN NOT NULL DEFAULT TRUE,
  max_interns_capacity INTEGER NOT NULL DEFAULT 3,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phd_scholar_domain ON public.phd_scholar_profiles(domain_id);
CREATE INDEX IF NOT EXISTS idx_phd_scholar_spec ON public.phd_scholar_profiles(specialization_id);
CREATE INDEX IF NOT EXISTS idx_phd_scholar_approved ON public.phd_scholar_profiles(is_profile_approved);

CREATE TABLE IF NOT EXISTS public.publications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  scholar_profile_id TEXT NOT NULL REFERENCES public.phd_scholar_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  journal_conference_name TEXT NOT NULL,
  publication_year INTEGER NOT NULL,
  doi TEXT,
  paper_url TEXT,
  citation_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_publications_scholar ON public.publications(scholar_profile_id);

CREATE TABLE IF NOT EXISTS public.research_projects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  scholar_profile_id TEXT NOT NULL REFERENCES public.phd_scholar_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  funded_by TEXT,
  start_date DATE,
  end_date DATE,
  is_ongoing BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_research_projects_scholar ON public.research_projects(scholar_profile_id);

-- -----------------------------------------------------------------------------
-- 5. INTERNSHIPS & APPLICATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.internships (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  scholar_profile_id TEXT NOT NULL REFERENCES public.phd_scholar_profiles(id) ON DELETE CASCADE,
  domain_id TEXT NOT NULL REFERENCES public.academic_domains(id) ON DELETE RESTRICT,
  specialization_id TEXT NOT NULL REFERENCES public.specializations(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  required_skills TEXT[] NOT NULL DEFAULT '{}',
  preferred_qualifications TEXT,
  mode TEXT NOT NULL CHECK (mode IN ('remote', 'on-site', 'hybrid')),
  location TEXT,
  duration_weeks INTEGER NOT NULL DEFAULT 8,
  weekly_hours INTEGER NOT NULL DEFAULT 15,
  stipend_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  stipend_currency TEXT NOT NULL DEFAULT 'INR',
  max_applicants INTEGER NOT NULL DEFAULT 20,
  application_deadline TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'open', 'closed', 'completed')),
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_internships_scholar ON public.internships(scholar_profile_id);
CREATE INDEX IF NOT EXISTS idx_internships_status ON public.internships(status, is_published);

CREATE TABLE IF NOT EXISTS public.internship_applications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  internship_id TEXT NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
  student_profile_id TEXT NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  statement_of_purpose TEXT NOT NULL,
  resume_url TEXT NOT NULL,
  relevant_coursework TEXT,
  available_hours_per_week INTEGER NOT NULL DEFAULT 15,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'shortlisted', 'accepted', 'rejected', 'withdrawn')),
  reviewer_notes TEXT,
  decision_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (internship_id, student_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_internship ON public.internship_applications(internship_id);
CREATE INDEX IF NOT EXISTS idx_applications_student ON public.internship_applications(student_profile_id);

-- -----------------------------------------------------------------------------
-- 6. SAVED SCHOLARS, CONTACT REQUESTS & NOTIFICATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_scholars (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_profile_id TEXT NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  scholar_profile_id TEXT NOT NULL REFERENCES public.phd_scholar_profiles(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_profile_id, scholar_profile_id)
);

CREATE TABLE IF NOT EXISTS public.scholar_contact_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_profile_id TEXT NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  scholar_profile_id TEXT NOT NULL REFERENCES public.phd_scholar_profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'responded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'action_required')),
  link_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 7. SUBSCRIPTION PLANS, SETTINGS, ANNOUNCEMENTS & TESTIMONIALS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('one_time', 'monthly', 'quarterly', 'annual')),
  description TEXT NOT NULL,
  features TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  profile_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'canceled')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscription_transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  profile_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  transaction_ref TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.website_settings (
  id TEXT PRIMARY KEY DEFAULT 'settings-default',
  site_name TEXT NOT NULL DEFAULT 'STARSKY',
  tagline TEXT NOT NULL DEFAULT 'Connecting Research Minds. Creating Opportunities.',
  support_email TEXT NOT NULL DEFAULT 'support@starsky.edu',
  admin_notification_email TEXT NOT NULL DEFAULT 'admin@starsky.edu',
  allow_student_registration BOOLEAN NOT NULL DEFAULT TRUE,
  allow_scholar_registration BOOLEAN NOT NULL DEFAULT TRUE,
  require_scholar_approval BOOLEAN NOT NULL DEFAULT TRUE,
  maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('update', 'event', 'alert')),
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.testimonials (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  author_name TEXT NOT NULL,
  author_title TEXT NOT NULL,
  institution TEXT NOT NULL,
  quote TEXT NOT NULL,
  avatar_url TEXT,
  rating INTEGER NOT NULL DEFAULT 5,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.career_listings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  employment_type TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT[] NOT NULL DEFAULT '{}',
  application_email TEXT NOT NULL,
  closing_date DATE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phd_scholar_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_scholars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholar_contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- 1. Academic Domains & Specializations (Public Read, Admin Write)
CREATE POLICY "Public domains read" ON public.academic_domains FOR SELECT USING (is_active = TRUE AND deleted_at IS NULL);
CREATE POLICY "Admin domains manage" ON public.academic_domains FOR ALL USING (public.is_admin());

CREATE POLICY "Public specializations read" ON public.specializations FOR SELECT USING (is_active = TRUE AND deleted_at IS NULL);
CREATE POLICY "Admin specializations manage" ON public.specializations FOR ALL USING (public.is_admin());

-- 2. Profiles
CREATE POLICY "Profiles read own or public approved scholars" ON public.profiles FOR SELECT USING (
  auth_user_id = auth.uid() OR
  id IN (SELECT profile_id FROM public.phd_scholar_profiles WHERE is_profile_approved = TRUE) OR
  public.is_admin()
);
CREATE POLICY "Profiles update own" ON public.profiles FOR UPDATE USING (auth_user_id = auth.uid());
CREATE POLICY "Admin profiles manage" ON public.profiles FOR ALL USING (public.is_admin());

-- 3. User Roles (No self-assigning admin)
CREATE POLICY "Roles read own" ON public.user_roles FOR SELECT USING (
  profile_id = public.current_profile_id() OR public.is_admin()
);
CREATE POLICY "Admin roles manage" ON public.user_roles FOR ALL USING (public.is_admin());

-- 4. PhD Scholar Profiles
CREATE POLICY "Public approved scholars read" ON public.phd_scholar_profiles FOR SELECT USING (
  is_profile_approved = TRUE OR profile_id = public.current_profile_id() OR public.is_admin()
);
CREATE POLICY "Scholars update own profile" ON public.phd_scholar_profiles FOR UPDATE USING (
  profile_id = public.current_profile_id()
);
CREATE POLICY "Admin scholars manage" ON public.phd_scholar_profiles FOR ALL USING (public.is_admin());

-- 5. Publications & Research Projects
CREATE POLICY "Public publications read" ON public.publications FOR SELECT USING (
  scholar_profile_id IN (SELECT id FROM public.phd_scholar_profiles WHERE is_profile_approved = TRUE) OR
  scholar_profile_id IN (SELECT id FROM public.phd_scholar_profiles WHERE profile_id = public.current_profile_id()) OR
  public.is_admin()
);
CREATE POLICY "Scholar publications manage own" ON public.publications FOR ALL USING (
  scholar_profile_id IN (SELECT id FROM public.phd_scholar_profiles WHERE profile_id = public.current_profile_id())
);

CREATE POLICY "Public research projects read" ON public.research_projects FOR SELECT USING (
  scholar_profile_id IN (SELECT id FROM public.phd_scholar_profiles WHERE is_profile_approved = TRUE) OR
  scholar_profile_id IN (SELECT id FROM public.phd_scholar_profiles WHERE profile_id = public.current_profile_id()) OR
  public.is_admin()
);
CREATE POLICY "Scholar research projects manage own" ON public.research_projects FOR ALL USING (
  scholar_profile_id IN (SELECT id FROM public.phd_scholar_profiles WHERE profile_id = public.current_profile_id())
);

-- 6. Student Profiles & Projects
CREATE POLICY "Student read own profile" ON public.student_profiles FOR SELECT USING (
  profile_id = public.current_profile_id() OR public.is_admin()
);
CREATE POLICY "Student update own profile" ON public.student_profiles FOR UPDATE USING (
  profile_id = public.current_profile_id()
);
CREATE POLICY "Student manage own projects" ON public.student_projects FOR ALL USING (
  student_profile_id IN (SELECT id FROM public.student_profiles WHERE profile_id = public.current_profile_id())
);

-- 7. Internships
CREATE POLICY "Public open internships read" ON public.internships FOR SELECT USING (
  (is_published = TRUE AND status = 'open') OR
  scholar_profile_id IN (SELECT id FROM public.phd_scholar_profiles WHERE profile_id = public.current_profile_id()) OR
  public.is_admin()
);
CREATE POLICY "Scholars manage own internships" ON public.internships FOR ALL USING (
  scholar_profile_id IN (SELECT id FROM public.phd_scholar_profiles WHERE profile_id = public.current_profile_id())
);

-- 8. Internship Applications
CREATE POLICY "Applications student read own" ON public.internship_applications FOR SELECT USING (
  student_profile_id IN (SELECT id FROM public.student_profiles WHERE profile_id = public.current_profile_id()) OR
  internship_id IN (
    SELECT i.id FROM public.internships i
    JOIN public.phd_scholar_profiles s ON s.id = i.scholar_profile_id
    WHERE s.profile_id = public.current_profile_id()
  ) OR
  public.is_admin()
);
CREATE POLICY "Students insert own application" ON public.internship_applications FOR INSERT WITH CHECK (
  student_profile_id IN (SELECT id FROM public.student_profiles WHERE profile_id = public.current_profile_id())
);
CREATE POLICY "Scholars update application status" ON public.internship_applications FOR UPDATE USING (
  internship_id IN (
    SELECT i.id FROM public.internships i
    JOIN public.phd_scholar_profiles s ON s.id = i.scholar_profile_id
    WHERE s.profile_id = public.current_profile_id()
  ) OR public.is_admin()
);

-- 9. Settings, Announcements, Testimonials (Public Read, Admin Write)
CREATE POLICY "Public settings read" ON public.website_settings FOR SELECT USING (TRUE);
CREATE POLICY "Admin settings manage" ON public.website_settings FOR ALL USING (public.is_admin());

CREATE POLICY "Public announcements read" ON public.announcements FOR SELECT USING (is_published = TRUE);
CREATE POLICY "Admin announcements manage" ON public.announcements FOR ALL USING (public.is_admin());

CREATE POLICY "Public testimonials read" ON public.testimonials FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admin testimonials manage" ON public.testimonials FOR ALL USING (public.is_admin());

CREATE POLICY "Public career listings read" ON public.career_listings FOR SELECT USING (is_published = TRUE);
CREATE POLICY "Admin career listings manage" ON public.career_listings FOR ALL USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- STORAGE BUCKET CREATION (Supabase Storage)
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('documents', 'documents', false, 10485760, ARRAY['application/pdf']::text[])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS: Avatars are publicly readable
CREATE POLICY "Avatars are publicly readable" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Storage RLS: Documents are private (only owner student & reviewing scholar/admin can read)
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users can read their own documents or admin" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND 
  (auth.uid() = owner OR public.is_admin())
);

