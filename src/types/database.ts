export type AccountRole = "student" | "scholar" | "admin";

export type AccountStatus = "active" | "inactive" | "suspended";

export type VerificationStatus = "pending" | "approved" | "rejected";

export type InternshipMode = "Remote" | "On-site" | "Hybrid";

export type InternshipStatus = "Open" | "Closed" | "Draft";

export type ApplicationStatus =
  | "Submitted"
  | "Under Review"
  | "Shortlisted"
  | "Accepted"
  | "Rejected"
  | "Withdrawn";

export type AdminPermissionKey =
  | "manage_users"
  | "verify_scholars"
  | "manage_domains"
  | "manage_internships"
  | "manage_applications"
  | "manage_cms"
  | "manage_settings"
  | "manage_admins";

export type SubscriptionStatus = "active" | "expired" | "revoked" | "pending_approval";

export type PaymentStatus =
  | "paid"
  | "pending_gateway_or_approval"
  | "admin_granted"
  | "waived"
  | "failed";

export interface Profile {
  id: string;
  email: string;
  password_hash?: string;
  full_name: string;
  avatar_url: string;
  phone: string;
  gender?: string;
  country: string;
  state: string;
  city: string;
  role: AccountRole;
  status: AccountStatus;
  email_verified: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface StudentProject {
  id: string;
  student_id: string;
  title: string;
  description: string;
  technologies: string;
  project_url?: string;
  github_url?: string;
  duration?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentProfile {
  id: string;
  profile_id: string;
  college_university: string;
  degree: string;
  department: string;
  current_year_semester: string;
  graduation_year: number;
  academic_interests: string[];
  preferred_domains: string[];
  skills: string[];
  programming_languages: string[];
  previous_projects: string;
  projects?: StudentProject[];
  research_experience: string;
  certifications: string[];
  resume_url: string;
  linkedin_url: string;
  github_url: string;
  portfolio_url: string;
  bio: string;
  onboarding_step?: number;
  created_at: string;
  updated_at: string;
}

export interface Publication {
  id: string;
  scholar_profile_id: string;
  title: string;
  journal_conference: string;
  publication_year: number;
  doi_or_url?: string;
  co_authors?: string;
  abstract?: string;
  created_at: string;
}

export interface ResearchProject {
  id: string;
  scholar_profile_id: string;
  title: string;
  description: string;
  status: "ongoing" | "completed" | "upcoming";
  technologies: string[];
  start_year?: number;
  end_year?: number;
  project_url?: string;
  created_at: string;
}

export interface PhdScholarProfile {
  id: string;
  profile_id: string;
  university_institution: string;
  department: string;
  highest_qualification?: string;
  research_field: string;
  specialization: string;
  domain_id: string;
  specialization_id: string;
  enrollment_year: number;
  expected_completion_year: number;
  current_research_topic: string;
  biography: string;
  current_research_description?: string;
  research_methodologies?: string;
  projects_summary?: string;
  laboratory_experience?: string;
  teaching_mentoring_experience?: string;
  research_achievements?: string;
  education_summary: string;
  research_interests: string[];
  technical_skills: string[];
  research_tools: string[];
  certifications: string[];
  google_scholar_url: string;
  orcid_id: string;
  linkedin_url: string;
  github_url: string;
  personal_website_url: string;
  internship_availability: boolean;
  verification_status: VerificationStatus;
  verification_notes?: string;
  verified_by?: string;
  verified_at?: string;
  profile_views: number;
  is_featured: boolean;
  onboarding_step?: number;
  created_at: string;
  updated_at: string;
}

export interface AcademicDomain {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon_name: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Specialization {
  id: string;
  domain_id: string;
  name: string;
  slug: string;
  description: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Internship {
  id: string;
  scholar_profile_id: string;
  domain_id: string;
  specialization_id: string;
  title: string;
  description: string;
  required_skills: string[];
  eligibility_criteria: string;
  duration: string;
  available_positions: number;
  mode: InternshipMode;
  application_deadline: string;
  stipend: string;
  status: InternshipStatus;
  moderation_status: VerificationStatus;
  created_at: string;
  updated_at: string;
}

export interface InternshipApplication {
  id: string;
  internship_id: string;
  student_profile_id: string;
  scholar_profile_id: string;
  student_full_name: string;
  student_email: string;
  student_phone: string;
  college_university: string;
  degree: string;
  department: string;
  current_academic_year: string;
  research_interests: string[];
  technical_skills: string[];
  statement_of_purpose: string;
  relevant_experience: string;
  expected_availability: string;
  preferred_duration: string;
  resume_url: string;
  portfolio_url: string;
  linkedin_url: string;
  additional_message: string;
  status: ApplicationStatus;
  scholar_private_notes: string;
  is_reported: boolean;
  report_reason?: string;
  submitted_at: string;
  updated_at: string;
}

export interface SavedScholar {
  id: string;
  student_profile_id: string;
  scholar_profile_id: string;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  billing_cycle: "monthly" | "quarterly" | "yearly";
  price: number;
  currency: string;
  duration_days: number;
  description: string;
  features: string[];
  is_active: boolean;
  is_popular?: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  student_id: string;
  student_profile_id?: string;
  plan_id: string;
  plan_name: string;
  status: SubscriptionStatus;
  start_date: string;
  expiry_date: string;
  payment_status: PaymentStatus;
  granted_by_admin_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionTransaction {
  id: string;
  subscription_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  plan_id: string;
  plan_name: string;
  amount: number;
  currency: string;
  transaction_type: "subscription_request" | "admin_grant" | "admin_revoke" | "status_change";
  payment_status: PaymentStatus;
  notes: string;
  actor_id: string;
  actor_name: string;
  created_at: string;
}

export interface ScholarContactRequest {
  id: string;
  student_profile_id: string;
  student_user_id: string;
  student_name: string;
  student_email: string;
  scholar_profile_id: string;
  scholar_user_id: string;
  scholar_name: string;
  subject: string;
  research_interest_topic: string;
  message: string;
  status: "sent" | "read" | "replied";
  scholar_reply?: string;
  created_at: string;
  updated_at: string;
}

export interface CareerListing {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  description: string;
  requirements: string[];
  application_email: string;
  is_published: boolean;
  closing_date: string;
  created_at: string;
  updated_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "unread" | "read" | "replied" | "archived";
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Testimonial {
  id: string;
  author_name: string;
  author_role: string;
  institution: string;
  quote: string;
  avatar_url: string;
  rating: number;
  is_featured: boolean;
  display_order: number;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  audience: "all" | "students" | "scholars";
  priority: "normal" | "important" | "urgent";
  is_active: boolean;
  expires_at?: string;
  created_at: string;
}

export interface WebsiteSettings {
  id: string;
  site_name: string;
  tagline: string;
  logo_text: string;
  hero_heading: string;
  hero_description: string;
  hero_image_url: string;
  about_title: string;
  about_content: string;
  mission_statement: string;
  vision_statement: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  footer_text: string;
  social_links: {
    linkedin: string;
    twitter: string;
    github: string;
  };
  seo_title: string;
  seo_description: string;
  maintenance_mode: boolean;
  allow_registrations: boolean;
  allow_student_registrations: boolean;
  allow_scholar_registrations: boolean;
  enable_email_notifications: boolean;
  enable_premium_system?: boolean;
  free_scholar_limit?: number;
  updated_at: string;
}

export interface AdminRoleRecord {
  id: string;
  profile_id: string;
  role_title: string;
  is_super_admin: boolean;
  permissions: AdminPermissionKey[];
  created_by?: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  actor_profile_id?: string;
  actor_name: string;
  actor_role: AccountRole | "system" | "visitor";
  action: string;
  entity_type: string;
  entity_id?: string;
  details: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  recipient_profile_id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  link_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface LockedScholarPreview {
  id: string;
  research_field: string;
  specialization: string;
  domain_id: string;
  specialization_id: string;
  university_institution: string;
  department: string;
  internship_availability: boolean;
  locked: true;
}

export interface EnrichedScholar {
  scholar: PhdScholarProfile;
  profile: Profile;
  domain?: AcademicDomain;
  specializationObj?: Specialization;
  publications: Publication[];
  projects: ResearchProject[];
  internships: Internship[];
}

export interface EnrichedInternship {
  internship: Internship;
  scholar: PhdScholarProfile;
  scholarUser: Profile;
  domain?: AcademicDomain;
  specialization?: Specialization;
}

export interface EnrichedApplication {
  application: InternshipApplication;
  internship: Internship;
  scholar: PhdScholarProfile;
  scholarUser: Profile;
  student: StudentProfile;
  studentUser: Profile;
}

export interface DatabaseStore {
  profiles: Profile[];
  student_profiles: StudentProfile[];
  student_projects: StudentProject[];
  phd_scholar_profiles: PhdScholarProfile[];
  academic_domains: AcademicDomain[];
  specializations: Specialization[];
  publications: Publication[];
  research_projects: ResearchProject[];
  internships: Internship[];
  internship_applications: InternshipApplication[];
  saved_scholars: SavedScholar[];
  subscription_plans: SubscriptionPlan[];
  user_subscriptions: UserSubscription[];
  subscription_transactions: SubscriptionTransaction[];
  scholar_contact_requests: ScholarContactRequest[];
  career_listings: CareerListing[];
  contact_messages: ContactMessage[];
  testimonials: Testimonial[];
  announcements: Announcement[];
  website_settings: WebsiteSettings;
  admin_roles: AdminRoleRecord[];
  activity_logs: ActivityLog[];
  notifications: NotificationItem[];
}
