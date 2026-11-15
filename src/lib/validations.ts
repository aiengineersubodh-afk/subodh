import { z } from "zod";
import { AcademicDomain, Specialization } from "@/types/database";

export function getGraduationYearRange(savedYear?: number): number[] {
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 10;
  const maxYear = currentYear + 50;
  const years: number[] = [];
  for (let yr = minYear; yr <= maxYear; yr++) {
    years.push(yr);
  }
  if (savedYear && Number.isFinite(savedYear) && !years.includes(savedYear)) {
    years.push(savedYear);
    years.sort((a, b) => a - b);
  }
  return years;
}

const optionalUrlSchema = z
  .string()
  .optional()
  .default("")
  .refine(
    (val) => {
      if (!val || !val.trim()) return true;
      try {
        const u = new URL(val.trim());
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Please enter a valid URL starting with https:// or http://" }
  );

export const studentProjectInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2, "Project Title is required when adding a project."),
  description: z.string().min(5, "Project Description is required when adding a project."),
  technologies: z.string().optional().default(""),
  project_url: optionalUrlSchema,
  github_url: optionalUrlSchema,
  duration: z.string().optional().default(""),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  remember_me: z.boolean().optional(),
});

export const registerSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Please enter a valid institutional or personal email."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Must include at least one uppercase letter.")
    .regex(/[0-9]/, "Must include at least one number."),
  role: z.enum(["student", "scholar"], {
    required_error: "Please select your account type.",
  }),
  phone: z.string().min(7, "Please enter a valid phone number."),
  country: z.string().min(2, "Country is required."),
  state: z.string().min(2, "State is required."),
  city: z.string().min(2, "City is required."),
});

export const studentOnboardingSchema = z.object({
  full_name: z.string().min(2, "Full name is required."),
  phone: z.string().min(7, "Phone number is required."),
  gender: z.string().optional(),
  country: z.string().min(2, "Country is required."),
  state: z.string().min(2, "State is required."),
  city: z.string().min(2, "City is required."),
  avatar_url: z.string().optional(),
  college_university: z.string().min(2, "College/University is required."),
  degree: z.string().min(2, "Degree is required."),
  department: z.string().min(2, "Department is required."),
  domain_id: z.string().optional(),
  specialization_id: z.string().optional(),
  academic_domain_id: z.string().optional(),
  specialization: z.string().optional(),
  current_year_semester: z.string().min(1, "Current year/semester is required."),
  graduation_year: z.coerce
    .number()
    .refine(
      (yr) => {
        const currentYear = new Date().getFullYear();
        return yr >= currentYear - 25 && yr <= currentYear + 55;
      },
      { message: "Please select a valid Graduation Year." }
    ),
  academic_interests: z.array(z.string()).min(1, "Select or add at least one academic interest."),
  preferred_domains: z.array(z.string()).min(1, "Select at least one preferred research domain."),
  skills: z.array(z.string()).min(1, "Add at least one technical or research skill."),
  programming_languages: z.array(z.string()).default([]),
  previous_projects: z.string().optional().default(""),
  projects: z.array(studentProjectInputSchema).optional().default([]),
  research_experience: z.string().optional().default(""),
  certifications: z.array(z.string()).default([]),
  resume_url: z.string().optional().default(""),
  linkedin_url: optionalUrlSchema,
  github_url: optionalUrlSchema,
  portfolio_url: optionalUrlSchema,
  bio: z.string().optional().default(""),
});

export const scholarOnboardingSchema = z.object({
  full_name: z.string().min(2, "Full name is required."),
  phone: z.string().min(7, "Phone number is required."),
  country: z.string().min(2, "Country is required."),
  state: z.string().min(2, "State is required."),
  city: z.string().min(2, "City is required."),
  avatar_url: z.string().optional(),
  university_institution: z.string().min(2, "University/Institution is required."),
  department: z.string().min(2, "Department is required."),
  domain_id: z.string().min(1, "Primary academic domain is required."),
  specialization_id: z.string().min(1, "Primary specialization is required."),
  research_field: z.string().min(2, "Research field is required."),
  specialization: z.string().min(2, "Specialization name is required."),
  enrollment_year: z.coerce.number().min(2010).max(2027),
  expected_completion_year: z.coerce.number().min(2024).max(2035),
  current_research_topic: z.string().min(10, "Current research topic is required."),
  biography: z.string().min(20, "Please provide a short academic biography (min 20 chars)."),
  education_summary: z.string().optional().default(""),
  research_interests: z.array(z.string()).min(1, "Add at least one research interest."),
  technical_skills: z.array(z.string()).min(1, "Add at least one technical skill."),
  research_tools: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  google_scholar_url: z.string().optional().default(""),
  orcid_id: z.string().optional().default(""),
  linkedin_url: z.string().optional().default(""),
  github_url: z.string().optional().default(""),
  personal_website_url: z.string().optional().default(""),
  internship_availability: z.boolean().default(true),
  // Optional initial internship creation during onboarding
  create_initial_internship: z.boolean().optional().default(false),
  internship_title: z.string().optional(),
  internship_description: z.string().optional(),
  required_student_skills: z.array(z.string()).optional(),
  eligibility_criteria: z.string().optional(),
  duration: z.string().optional(),
  available_positions: z.coerce.number().optional(),
  internship_mode: z.enum(["Remote", "On-site", "Hybrid"]).optional(),
  application_deadline: z.string().optional(),
  stipend: z.string().optional(),
  internship_status: z.enum(["Open", "Closed", "Draft"]).optional(),
});

export const internshipSchema = z.object({
  title: z.string().min(5, "Internship title must be at least 5 characters."),
  domain_id: z.string().optional(),
  specialization_id: z.string().optional(),
  description: z.string().min(20, "Please provide a detailed research project description."),
  required_skills: z.array(z.string()).min(1, "Specify at least one required student skill."),
  eligibility_criteria: z.string().min(5, "Eligibility criteria are required."),
  duration: z.string().min(2, "Duration is required (e.g., 8 Weeks, 3 Months)."),
  available_positions: z.coerce.number().min(1, "At least 1 position is required."),
  mode: z.enum(["Remote", "On-site", "Hybrid"]),
  application_deadline: z.string().min(4, "Application deadline is required."),
  stipend: z.string().optional().default("Unpaid / Academic Credit"),
  status: z.enum(["Open", "Closed", "Draft"]).default("Open"),
});

export const applicationSchema = z.object({
  internship_id: z.string().min(1, "Internship selection is required."),
  scholar_profile_id: z.string().min(1, "Scholar selection is required."),
  student_full_name: z.string().min(2, "Full name is required."),
  student_email: z.string().email("Valid email is required."),
  student_phone: z.string().min(7, "Valid phone number is required."),
  college_university: z.string().min(2, "College/University is required."),
  degree: z.string().min(2, "Degree is required."),
  department: z.string().min(2, "Department is required."),
  current_academic_year: z.string().min(1, "Current academic year is required."),
  research_interests: z.array(z.string()).min(1, "At least one research interest is required."),
  technical_skills: z.array(z.string()).min(1, "At least one technical skill is required."),
  statement_of_purpose: z
    .string()
    .min(30, "Please explain why you want to join this research internship (at least 30 characters)."),
  relevant_experience: z.string().min(10, "Please describe your relevant experience or coursework."),
  expected_availability: z.string().min(2, "Expected availability (hours/week or start date) is required."),
  preferred_duration: z.string().min(2, "Preferred internship duration is required."),
  resume_url: z.string().min(1, "Please upload or provide your Resume/CV."),
  portfolio_url: z.string().optional().default(""),
  linkedin_url: z.string().optional().default(""),
  additional_message: z.string().optional().default(""),
});

export const contactMessageSchema = z.object({
  name: z.string().min(2, "Your name is required."),
  email: z.string().email("Please enter a valid email address."),
  subject: z.string().min(3, "Subject is required."),
  message: z.string().min(10, "Message must be at least 10 characters."),
});

/**
 * Validates that an academic domain and specialization exist, are active,
 * and that the specialization actually belongs to the parent domain.
 */
export function validateAcademicDomainAndSpecialization(
  domains: AcademicDomain[],
  specializations: Specialization[],
  domainId?: string,
  specializationId?: string,
  required = true
): { valid: boolean; error?: string; domain?: AcademicDomain; specialization?: Specialization } {
  if (!domainId && !specializationId) {
    if (required) {
      return { valid: false, error: "Academic domain and specialization are required." };
    }
    return { valid: true };
  }

  if (!domainId) {
    return { valid: false, error: "Parent academic domain is required." };
  }

  const domain = domains.find((d) => d.id === domainId);
  if (!domain) {
    return { valid: false, error: "Selected academic domain was not found in the STARSKY taxonomy." };
  }
  if (!domain.is_active) {
    return { valid: false, error: `The academic domain "${domain.name}" is currently deactivated.` };
  }

  if (!specializationId) {
    return { valid: false, error: `Please select a specialization under "${domain.name}".` };
  }

  const specialization = specializations.find((s) => s.id === specializationId);
  if (!specialization) {
    return { valid: false, error: "Selected specialization was not found in the STARSKY taxonomy." };
  }
  if (!specialization.is_active) {
    return { valid: false, error: `The specialization "${specialization.name}" is currently deactivated.` };
  }
  if (specialization.domain_id !== domainId) {
    return {
      valid: false,
      error: `Specialization "${specialization.name}" does not belong to the selected domain "${domain.name}".`,
    };
  }

  return { valid: true, domain, specialization };
}

