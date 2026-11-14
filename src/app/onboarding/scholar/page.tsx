"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  Check,
  CheckCircle2,
  Edit3,
  ExternalLink,
  FlaskConical,
  GraduationCap,
  Loader2,
  Lock,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { TagInput } from "@/components/TagInput";
import { FileUploadField } from "@/components/FileUploadField";
import { AcademicDomain, Specialization } from "@/types/database";
import { CascadingAcademicSelector } from "@/components/CascadingAcademicSelector";

const STEPS = [
  {
    number: 1,
    shortLabel: "Personal",
    title: "Personal Information",
    description: "Let's begin with your contact details, location, and profile photograph.",
    icon: User,
  },
  {
    number: 2,
    shortLabel: "Academic",
    title: "Academic Information",
    description: "Provide your doctoral institution, department, qualification, and research specialization.",
    icon: GraduationCap,
  },
  {
    number: 3,
    shortLabel: "Research",
    title: "Research Profile",
    description: "Detail your doctoral research biography, methodologies, laboratory background, and technical stack.",
    icon: FlaskConical,
  },
  {
    number: 4,
    shortLabel: "Publications",
    title: "Publications & Professional Experience",
    description: "Add your peer-reviewed publications, certifications, mentoring background, and academic achievements.",
    icon: BookOpen,
  },
  {
    number: 5,
    shortLabel: "Internships & Links",
    title: "Internship Information & Professional Links",
    description: "Configure your research mentorship availability and link your academic profiles.",
    icon: Briefcase,
  },
  {
    number: 6,
    shortLabel: "Review",
    title: "Review & Submit",
    description: "Verify all sections of your PhD Scholar profile before submitting for verification.",
    icon: Award,
  },
];

const HIGHEST_QUALIFICATIONS = ["M.Tech", "M.E.", "M.Sc.", "MBBS", "M.Phil", "Other"];

const ENROLLMENT_YEARS = Array.from({ length: 16 }, (_, i) => 2012 + i);
const COMPLETION_YEARS = Array.from({ length: 12 }, (_, i) => 2025 + i);

function isValidOptionalUrl(val: string): boolean {
  if (!val || !val.trim()) return true;
  try {
    const parsed = new URL(val.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export default function ScholarOnboardingPage() {
  const router = useRouter();
  const { session, loading: authLoading, refreshSession } = useAuth();

  const [domains, setDomains] = useState<AcademicDomain[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [verificationStatusResult, setVerificationStatusResult] = useState<string>("pending");
  const [confirmedAccurate, setConfirmedAccurate] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Step 1: Personal Information
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [country, setCountry] = useState("India");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Step 2: Academic Information
  const [university, setUniversity] = useState("");
  const [department, setDepartment] = useState("");
  const [highestQualification, setHighestQualification] = useState("M.Tech");
  const [enrollmentYear, setEnrollmentYear] = useState<number>(2023);
  const [expectedCompletionYear, setExpectedCompletionYear] = useState<number>(2027);
  const [domainId, setDomainId] = useState("dom-engineering");
  const [specializationId, setSpecializationId] = useState("");
  const [currentResearchTopic, setCurrentResearchTopic] = useState("");

  // Step 3: Research Profile
  const [biography, setBiography] = useState("");
  const [researchInterests, setResearchInterests] = useState<string[]>([]);
  const [currentResearchDescription, setCurrentResearchDescription] = useState("");
  const [researchMethodologies, setResearchMethodologies] = useState("");
  const [projectsSummary, setProjectsSummary] = useState("");
  const [laboratoryExperience, setLaboratoryExperience] = useState("");
  const [researchTools, setResearchTools] = useState<string[]>([]);
  const [technicalSkills, setTechnicalSkills] = useState<string[]>([]);

  // Step 4: Publications & Professional Experience
  const [publications, setPublications] = useState<
    Array<{ title: string; journal_conference: string; publication_year: number; doi_or_url: string }>
  >([
    {
      title: "",
      journal_conference: "",
      publication_year: 2025,
      doi_or_url: "",
    },
  ]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [teachingMentoringExperience, setTeachingMentoringExperience] = useState("");
  const [researchAchievements, setResearchAchievements] = useState("");

  // Step 5: Internship Information & Professional Links
  const [offeringInternships, setOfferingInternships] = useState<boolean>(true);
  const [internshipTitle, setInternshipTitle] = useState("");
  const [internshipDescription, setInternshipDescription] = useState("");
  const [requiredStudentSkills, setRequiredStudentSkills] = useState<string[]>([
    "Python",
    "Literature Analysis",
  ]);
  const [eligibilityCriteria, setEligibilityCriteria] = useState(
    "3rd/4th year Undergraduate or Postgraduate students in relevant disciplines."
  );
  const [duration, setDuration] = useState("8 Weeks");
  const [availablePositions, setAvailablePositions] = useState(2);
  const [internshipMode, setInternshipMode] = useState<"Remote" | "On-site" | "Hybrid">("Remote");
  const [applicationDeadline, setApplicationDeadline] = useState("2027-03-31");
  const [stipend, setStipend] = useState("Academic Credit + Publication Co-authorship");

  const [googleScholarUrl, setGoogleScholarUrl] = useState("");
  const [orcidId, setOrcidId] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [personalWebsiteUrl, setPersonalWebsiteUrl] = useState("");

  // Role guard
  useEffect(() => {
    if (!authLoading) {
      if (!session) {
        router.replace("/login");
        return;
      }
      if (session.user.role === "student") {
        router.replace("/onboarding/student");
        return;
      }
      if (session.user.role === "admin") {
        router.replace("/admin");
        return;
      }
    }
  }, [authLoading, session, router]);

  // Load domains and specializations
  useEffect(() => {
    fetch("/api/public")
      .then((r) => r.json())
      .then((d) => {
        const fetchedDomains: AcademicDomain[] = d.domains || [];
        const fetchedSpecs: Specialization[] = d.specializations || [];
        setDomains(fetchedDomains);
        setSpecializations(fetchedSpecs);
        setSpecializationId((prev) => {
          if (prev) return prev;
          const firstSpec = fetchedSpecs.find((s) => s.domain_id === "dom-engineering");
          return firstSpec ? firstSpec.id : fetchedSpecs[0]?.id || "";
        });
      });
  }, []);

  // Hydrate scholar profile from API + localStorage draft
  useEffect(() => {
    if (authLoading || !session || hydrated) return;

    const u = session.user;
    setFullName(u.full_name || "");
    setEmail(u.email || "");
    setPhone(u.phone || "");
    setGender(u.gender || "");
    setCountry(u.country || "India");
    setState(u.state || "");
    setCity(u.city || "");
    setAvatarUrl(u.avatar_url || "");

    fetch("/api/onboarding/scholar")
      .then((r) => r.json())
      .then((data) => {
        const sc = data.scholarProfile || session.scholarProfile;
        if (sc) {
          if (sc.university_institution) setUniversity(sc.university_institution);
          if (sc.department) setDepartment(sc.department);
          if (sc.highest_qualification) setHighestQualification(sc.highest_qualification);
          if (sc.enrollment_year) setEnrollmentYear(sc.enrollment_year);
          if (sc.expected_completion_year) setExpectedCompletionYear(sc.expected_completion_year);
          if (sc.domain_id) setDomainId(sc.domain_id);
          if (sc.specialization_id) setSpecializationId(sc.specialization_id);
          if (sc.current_research_topic) setCurrentResearchTopic(sc.current_research_topic);
          if (sc.biography) setBiography(sc.biography);
          if (sc.research_interests?.length) setResearchInterests(sc.research_interests);
          if (sc.current_research_description)
            setCurrentResearchDescription(sc.current_research_description);
          if (sc.research_methodologies) setResearchMethodologies(sc.research_methodologies);
          if (sc.projects_summary) setProjectsSummary(sc.projects_summary);
          if (sc.laboratory_experience) setLaboratoryExperience(sc.laboratory_experience);
          if (sc.research_tools?.length) setResearchTools(sc.research_tools);
          if (sc.technical_skills?.length) setTechnicalSkills(sc.technical_skills);
          if (sc.certifications?.length) setCertifications(sc.certifications);
          if (sc.teaching_mentoring_experience)
            setTeachingMentoringExperience(sc.teaching_mentoring_experience);
          if (sc.research_achievements) setResearchAchievements(sc.research_achievements);
          if (typeof sc.internship_availability === "boolean")
            setOfferingInternships(sc.internship_availability);
          if (sc.google_scholar_url) setGoogleScholarUrl(sc.google_scholar_url);
          if (sc.orcid_id) setOrcidId(sc.orcid_id);
          if (sc.linkedin_url) setLinkedinUrl(sc.linkedin_url);
          if (sc.github_url) setGithubUrl(sc.github_url);
          if (sc.personal_website_url) setPersonalWebsiteUrl(sc.personal_website_url);

          if (sc.onboarding_step && sc.onboarding_step >= 1 && sc.onboarding_step <= 6) {
            setCurrentStep(sc.onboarding_step);
            const done: number[] = [];
            for (let i = 1; i < sc.onboarding_step; i++) done.push(i);
            setCompletedSteps(done);
          }
        }

        if (Array.isArray(data.publications) && data.publications.length > 0) {
          setPublications(
            data.publications.map(
              (p: {
                title: string;
                journal_conference: string;
                publication_year: number;
                doi_or_url: string;
              }) => ({
                title: p.title || "",
                journal_conference: p.journal_conference || "",
                publication_year: p.publication_year || 2025,
                doi_or_url: p.doi_or_url || "",
              })
            )
          );
        }

        if (Array.isArray(data.internships) && data.internships.length > 0) {
          const firstInt = data.internships[0];
          setInternshipTitle(firstInt.title || "");
          setInternshipDescription(firstInt.description || "");
          if (firstInt.required_skills?.length) setRequiredStudentSkills(firstInt.required_skills);
          if (firstInt.eligibility_criteria) setEligibilityCriteria(firstInt.eligibility_criteria);
          if (firstInt.duration) setDuration(firstInt.duration);
          if (firstInt.available_positions) setAvailablePositions(firstInt.available_positions);
          if (firstInt.mode) setInternshipMode(firstInt.mode);
          if (firstInt.application_deadline) setApplicationDeadline(firstInt.application_deadline);
          if (firstInt.stipend) setStipend(firstInt.stipend);
        }

        // Check localStorage draft
        try {
          const storageKey = `starsky_scholar_onboarding_${u.id}`;
          const raw = localStorage.getItem(storageKey);
          if (raw) {
            const draft = JSON.parse(raw);
            if (draft.fullName) setFullName(draft.fullName);
            if (draft.phone) setPhone(draft.phone);
            if (draft.gender !== undefined) setGender(draft.gender);
            if (draft.country) setCountry(draft.country);
            if (draft.state) setState(draft.state);
            if (draft.city) setCity(draft.city);
            if (draft.avatarUrl) setAvatarUrl(draft.avatarUrl);
            if (draft.university) setUniversity(draft.university);
            if (draft.department) setDepartment(draft.department);
            if (draft.highestQualification) setHighestQualification(draft.highestQualification);
            if (draft.enrollmentYear) setEnrollmentYear(Number(draft.enrollmentYear));
            if (draft.expectedCompletionYear)
              setExpectedCompletionYear(Number(draft.expectedCompletionYear));
            if (draft.domainId) setDomainId(draft.domainId);
            if (draft.specializationId) setSpecializationId(draft.specializationId);
            if (draft.currentResearchTopic) setCurrentResearchTopic(draft.currentResearchTopic);
            if (draft.biography) setBiography(draft.biography);
            if (Array.isArray(draft.researchInterests))
              setResearchInterests(draft.researchInterests);
            if (draft.currentResearchDescription !== undefined)
              setCurrentResearchDescription(draft.currentResearchDescription);
            if (draft.researchMethodologies !== undefined)
              setResearchMethodologies(draft.researchMethodologies);
            if (draft.projectsSummary !== undefined) setProjectsSummary(draft.projectsSummary);
            if (draft.laboratoryExperience !== undefined)
              setLaboratoryExperience(draft.laboratoryExperience);
            if (Array.isArray(draft.researchTools)) setResearchTools(draft.researchTools);
            if (Array.isArray(draft.technicalSkills)) setTechnicalSkills(draft.technicalSkills);
            if (Array.isArray(draft.publications) && draft.publications.length > 0)
              setPublications(draft.publications);
            if (Array.isArray(draft.certifications)) setCertifications(draft.certifications);
            if (draft.teachingMentoringExperience !== undefined)
              setTeachingMentoringExperience(draft.teachingMentoringExperience);
            if (draft.researchAchievements !== undefined)
              setResearchAchievements(draft.researchAchievements);
            if (typeof draft.offeringInternships === "boolean")
              setOfferingInternships(draft.offeringInternships);
            if (draft.internshipTitle !== undefined) setInternshipTitle(draft.internshipTitle);
            if (draft.internshipDescription !== undefined)
              setInternshipDescription(draft.internshipDescription);
            if (Array.isArray(draft.requiredStudentSkills))
              setRequiredStudentSkills(draft.requiredStudentSkills);
            if (draft.eligibilityCriteria !== undefined)
              setEligibilityCriteria(draft.eligibilityCriteria);
            if (draft.duration) setDuration(draft.duration);
            if (draft.availablePositions) setAvailablePositions(Number(draft.availablePositions));
            if (draft.internshipMode) setInternshipMode(draft.internshipMode);
            if (draft.applicationDeadline) setApplicationDeadline(draft.applicationDeadline);
            if (draft.stipend !== undefined) setStipend(draft.stipend);
            if (draft.googleScholarUrl !== undefined) setGoogleScholarUrl(draft.googleScholarUrl);
            if (draft.orcidId !== undefined) setOrcidId(draft.orcidId);
            if (draft.linkedinUrl !== undefined) setLinkedinUrl(draft.linkedinUrl);
            if (draft.githubUrl !== undefined) setGithubUrl(draft.githubUrl);
            if (draft.personalWebsiteUrl !== undefined)
              setPersonalWebsiteUrl(draft.personalWebsiteUrl);
            if (draft.currentStep && draft.currentStep >= 1 && draft.currentStep <= 6) {
              setCurrentStep(draft.currentStep);
            }
            if (Array.isArray(draft.completedSteps)) {
              setCompletedSteps(draft.completedSteps);
            }
          }
        } catch {
          // ignore storage parse errors
        }
      })
      .finally(() => {
        setHydrated(true);
      });
  }, [authLoading, session, hydrated]);

  // Save to localStorage on state changes
  useEffect(() => {
    if (!hydrated || !session) return;
    try {
      const storageKey = `starsky_scholar_onboarding_${session.user.id}`;
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          fullName,
          phone,
          gender,
          country,
          state,
          city,
          avatarUrl,
          university,
          department,
          highestQualification,
          enrollmentYear,
          expectedCompletionYear,
          domainId,
          specializationId,
          currentResearchTopic,
          biography,
          researchInterests,
          currentResearchDescription,
          researchMethodologies,
          projectsSummary,
          laboratoryExperience,
          researchTools,
          technicalSkills,
          publications,
          certifications,
          teachingMentoringExperience,
          researchAchievements,
          offeringInternships,
          internshipTitle,
          internshipDescription,
          requiredStudentSkills,
          eligibilityCriteria,
          duration,
          availablePositions,
          internshipMode,
          applicationDeadline,
          stipend,
          googleScholarUrl,
          orcidId,
          linkedinUrl,
          githubUrl,
          personalWebsiteUrl,
          currentStep,
          completedSteps,
        })
      );
    } catch {
      // ignore storage quota errors
    }
  }, [
    hydrated,
    session,
    fullName,
    phone,
    gender,
    country,
    state,
    city,
    avatarUrl,
    university,
    department,
    highestQualification,
    enrollmentYear,
    expectedCompletionYear,
    domainId,
    specializationId,
    currentResearchTopic,
    biography,
    researchInterests,
    currentResearchDescription,
    researchMethodologies,
    projectsSummary,
    laboratoryExperience,
    researchTools,
    technicalSkills,
    publications,
    certifications,
    teachingMentoringExperience,
    researchAchievements,
    offeringInternships,
    internshipTitle,
    internshipDescription,
    requiredStudentSkills,
    eligibilityCriteria,
    duration,
    availablePositions,
    internshipMode,
    applicationDeadline,
    stipend,
    googleScholarUrl,
    orcidId,
    linkedinUrl,
    githubUrl,
    personalWebsiteUrl,
    currentStep,
    completedSteps,
  ]);

  const filteredSpecs = specializations.filter((s) => s.domain_id === domainId);

  const handleDomainChange = (nextDomId: string) => {
    setDomainId(nextDomId);
    const first = specializations.find((s) => s.domain_id === nextDomId);
    setSpecializationId(first ? first.id : "");
  };

  const buildPayload = (isDraft: boolean, nextStepNum: number) => {
    const selectedDom = domains.find((d) => d.id === domainId);
    const selectedSpec = specializations.find((s) => s.id === specializationId);

    return {
      is_draft: isDraft,
      onboarding_step: nextStepNum,
      full_name: fullName.trim(),
      phone: phone.trim(),
      gender,
      country: country.trim(),
      state: state.trim(),
      city: city.trim(),
      avatar_url: avatarUrl,
      university_institution: university.trim(),
      department: department.trim(),
      highest_qualification: highestQualification,
      domain_id: domainId,
      specialization_id: specializationId,
      research_field: selectedDom?.name || "Engineering",
      specialization: selectedSpec?.name || "Computer Science Engineering",
      enrollment_year: Number(enrollmentYear),
      expected_completion_year: Number(expectedCompletionYear),
      current_research_topic: currentResearchTopic.trim(),
      biography: biography.trim(),
      education_summary: `${highestQualification} • Ph.D. Scholar (${enrollmentYear}–${expectedCompletionYear}), ${university.trim()}`,
      research_interests: researchInterests,
      current_research_description: currentResearchDescription.trim(),
      research_methodologies: researchMethodologies.trim(),
      projects_summary: projectsSummary.trim(),
      laboratory_experience: laboratoryExperience.trim(),
      research_tools: researchTools,
      technical_skills: technicalSkills,
      certifications,
      teaching_mentoring_experience: teachingMentoringExperience.trim(),
      research_achievements: researchAchievements.trim(),
      publications: publications.filter((p) => p.title.trim().length > 0),
      google_scholar_url: googleScholarUrl.trim(),
      orcid_id: orcidId.trim(),
      linkedin_url: linkedinUrl.trim(),
      github_url: githubUrl.trim(),
      personal_website_url: personalWebsiteUrl.trim(),
      internship_availability: offeringInternships,
      create_initial_internship:
        offeringInternships &&
        internshipTitle.trim().length > 0 &&
        internshipDescription.trim().length > 0,
      internship_title: internshipTitle.trim(),
      internship_description: internshipDescription.trim(),
      required_student_skills: requiredStudentSkills,
      eligibility_criteria: eligibilityCriteria.trim(),
      duration: duration.trim(),
      available_positions: Number(availablePositions) || 1,
      internship_mode: internshipMode,
      application_deadline: applicationDeadline,
      stipend: stipend.trim(),
      internship_status: "Open" as const,
    };
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!fullName.trim()) errors.fullName = "Full Name is required.";
      if (!phone.trim() || phone.trim().length < 7)
        errors.phone = "Please enter a valid phone number.";
      if (!country.trim()) errors.country = "Country is required.";
      if (!state.trim()) errors.state = "State / Province is required.";
      if (!city.trim()) errors.city = "City is required.";
    } else if (step === 2) {
      if (!university.trim()) errors.university = "University / Institution is required.";
      if (!domainId || !specializationId) {
        errors.department = "Please select an Academic Domain and Specialization.";
      }
      if (!highestQualification) errors.highestQualification = "Highest Qualification is required.";
      if (!enrollmentYear) errors.enrollmentYear = "PhD Enrollment Year is required.";
      if (!expectedCompletionYear)
        errors.expectedCompletionYear = "Expected PhD Completion Year is required.";
      if (Number(expectedCompletionYear) < Number(enrollmentYear)) {
        errors.expectedCompletionYear = "Completion year must be on or after enrollment year.";
      }
      if (!currentResearchTopic.trim())
        errors.currentResearchTopic = "Current Research Topic is required.";
    } else if (step === 3) {
      if (!biography.trim() || biography.trim().length < 20) {
        errors.biography =
          "Please provide a Research Biography (at least 20 characters) summarizing your focus.";
      }
      if (researchInterests.length === 0) {
        errors.researchInterests = "Please add at least one research interest.";
      }
    } else if (step === 4) {
      // Validate any partially entered publication rows
      publications.forEach((pub, idx) => {
        if (pub.title.trim() && !pub.journal_conference.trim()) {
          errors[`pub_${idx}`] = "Please specify the Journal or Conference name.";
        }
      });
    } else if (step === 5) {
      if (offeringInternships) {
        if (!internshipTitle.trim()) {
          errors.internshipTitle =
            "Please enter an Internship Title (or switch 'Offering research internships' to No).";
        }
        if (!internshipDescription.trim()) {
          errors.internshipDescription = "Please provide an Internship Description.";
        }
      }
      if (!isValidOptionalUrl(googleScholarUrl)) {
        errors.googleScholarUrl = "Please enter a valid URL starting with https://";
      }
      if (!isValidOptionalUrl(linkedinUrl)) {
        errors.linkedinUrl = "Please enter a valid URL starting with https://";
      }
      if (!isValidOptionalUrl(githubUrl)) {
        errors.githubUrl = "Please enter a valid URL starting with https://";
      }
      if (!isValidOptionalUrl(personalWebsiteUrl)) {
        errors.personalWebsiteUrl = "Please enter a valid URL starting with https://";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const persistToBackend = async (isDraft: boolean, targetStep: number) => {
    const res = await fetch("/api/onboarding/scholar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(isDraft, targetStep)),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to save PhD Scholar profile.");
    }
    return data;
  };

  const handleSaveDraft = async () => {
    setGlobalError("");
    setDraftMessage("");
    setSavingDraft(true);
    try {
      await persistToBackend(true, currentStep);
      setDraftMessage("Draft saved! You can safely resume from Step " + currentStep + " anytime.");
      setTimeout(() => setDraftMessage(""), 4000);
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Could not save draft.");
    } finally {
      setSavingDraft(false);
    }
  };

  const handleContinue = async () => {
    setGlobalError("");
    setDraftMessage("");
    if (!validateStep(currentStep)) {
      return;
    }

    const nextStep = Math.min(6, currentStep + 1);
    setCompletedSteps((prev) => (prev.includes(currentStep) ? prev : [...prev, currentStep]));
    setCurrentStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Background autosave to database
    try {
      await persistToBackend(true, nextStep);
    } catch {
      // localStorage already preserves state if offline
    }
  };

  const handleBack = () => {
    setGlobalError("");
    setFieldErrors({});
    const prevStep = Math.max(1, currentStep - 1);
    setCurrentStep(prevStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const jumpToStep = (targetStep: number) => {
    setGlobalError("");
    setFieldErrors({});
    setCurrentStep(targetStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError("");

    // Validate all required steps 1-5
    for (let s = 1; s <= 5; s++) {
      if (!validateStep(s)) {
        setCurrentStep(s);
        setGlobalError("Please complete the highlighted fields in Step " + s + " before submitting.");
        return;
      }
    }

    if (!confirmedAccurate) {
      setGlobalError("Please confirm that all the information provided is accurate.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await persistToBackend(false, 6);
      if (session) {
        localStorage.removeItem(`starsky_scholar_onboarding_${session.user.id}`);
      }
      if (result.verification_status) {
        setVerificationStatusResult(result.verification_status);
      }
      await refreshSession();
      setSubmittedSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => {
        router.push("/dashboard/scholar");
      }, 2600);
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Failed to submit PhD Scholar profile.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !hydrated) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 max-w-md w-full text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#202124]">
            Loading your PhD Scholar Onboarding Workspace...
          </p>
          <p className="text-xs text-[#666666]">Restoring your saved progress and academic domains</p>
        </div>
      </div>
    );
  }

  if (submittedSuccess) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-lg w-full bg-white rounded-2xl border border-[#E5E7EB] p-10 text-center shadow-xs space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9 text-green-600" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] text-[#2563EB] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> PhD Scholar Profile Submitted
          </span>
          <h1 className="text-2xl font-extrabold text-[#202124]">
            Welcome to STARSKY, {fullName}!
          </h1>
          {verificationStatusResult === "pending" ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-left space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" /> Awaiting Admin Verification
              </p>
              <p className="text-xs text-amber-900 leading-relaxed">
                Your doctoral profile and credentials have been saved with status{" "}
                <strong>Pending Verification</strong>. Once approved by a STARSKY administrator, your
                profile and internships will be published in the public researcher directory.
              </p>
            </div>
          ) : (
            <p className="text-sm text-[#666666] leading-relaxed">
              Your verified PhD Scholar profile and research internship settings have been updated.
            </p>
          )}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => router.push("/dashboard/scholar")}
              className="w-full py-3.5 px-6 rounded-lg bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] transition-colors inline-flex items-center justify-center gap-2"
            >
              <span>Go to PhD Scholar Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progressPercentage = Math.round((currentStep / STEPS.length) * 100);
  const activeStepMeta = STEPS[currentStep - 1];
  const selectedDomainObj = domains.find((d) => d.id === domainId);
  const selectedSpecObj = specializations.find((s) => s.id === specializationId);
  const validPublications = publications.filter((p) => p.title.trim().length > 0);

  return (
    <div className="bg-[#F7F8FA] min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Onboarding Header Card */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-3.5">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-10 h-10 rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-bold text-lg shadow-xs">
                  S
                </div>
                <div>
                  <span className="text-lg font-extrabold tracking-tight text-[#202124] block leading-none">
                    STARSKY
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#2563EB]">
                    PhD Scholar Onboarding
                  </span>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-xs font-bold uppercase tracking-wider text-[#666666] block">
                  Step {currentStep} of {STEPS.length}
                </span>
                <span className="text-sm font-extrabold text-[#2563EB]">
                  {progressPercentage}% Complete
                </span>
              </div>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={savingDraft}
                className="px-3.5 py-2 rounded-lg border border-[#E5E7EB] bg-[#F7F8FA] hover:border-[#2563EB] text-xs font-semibold text-[#202124] inline-flex items-center gap-1.5 transition-colors"
              >
                {savingDraft ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2563EB]" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-[#2563EB]" />
                )}
                <span>Save as Draft</span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="w-full h-2 bg-[#F7F8FA] rounded-full overflow-hidden border border-[#E5E7EB]">
              <div
                className="h-full bg-[#2563EB] transition-all duration-300 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {/* Horizontal 6-Step Indicator */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-6 gap-2">
              {STEPS.map((step) => {
                const isActive = step.number === currentStep;
                const isCompleted =
                  completedSteps.includes(step.number) || step.number < currentStep;
                return (
                  <button
                    key={step.number}
                    type="button"
                    onClick={() => {
                      if (isCompleted || step.number <= currentStep) {
                        jumpToStep(step.number);
                      }
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                      isActive
                        ? "bg-[#EFF6FF] border-[#2563EB] text-[#202124] shadow-2xs"
                        : isCompleted
                        ? "bg-white border-green-500/40 text-[#202124] hover:border-[#2563EB]"
                        : "bg-[#F7F8FA] border-[#E5E7EB] text-[#666666] opacity-75 cursor-default"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isActive
                          ? "bg-[#2563EB] text-white"
                          : isCompleted
                          ? "bg-green-600 text-white"
                          : "bg-white border border-[#D1D5DB] text-[#666666]"
                      }`}
                    >
                      {isCompleted && !isActive ? <Check className="w-3.5 h-3.5" /> : step.number}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-[11px] font-bold truncate ${
                          isActive ? "text-[#2563EB]" : "text-[#202124]"
                        }`}
                      >
                        {step.shortLabel}
                      </p>
                      <p className="text-[10px] text-[#666666] truncate">
                        {isActive ? "In Progress" : isCompleted ? "Completed" : "Remaining"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Status Alerts */}
        {draftMessage && (
          <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-center gap-2.5 text-xs font-semibold text-green-800">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span>{draftMessage}</span>
          </div>
        )}

        {globalError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs font-semibold text-red-700">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{globalError}</span>
          </div>
        )}

        {/* Active Step Form Card */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8 shadow-xs">
          <div className="border-b border-[#E5E7EB] pb-5 mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
              Step {activeStepMeta.number} of {STEPS.length}
            </span>
            <h1 className="text-2xl font-extrabold text-[#202124] mt-1">
              {activeStepMeta.title}
            </h1>
            <p className="text-sm text-[#666666] mt-1">{activeStepMeta.description}</p>
          </div>

          <form onSubmit={handleFinalSubmit} noValidate>
            {/* STEP 1: PERSONAL INFORMATION */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                      Full Name <span className="text-[#2563EB]">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (fieldErrors.fullName)
                          setFieldErrors({ ...fieldErrors, fullName: "" });
                      }}
                      placeholder="e.g., Dr. / Scholar Ananya Raghavan"
                      className={`w-full px-3.5 py-2.5 rounded-lg border text-sm ${
                        fieldErrors.fullName ? "border-red-500 bg-red-50/20" : "border-[#E5E7EB]"
                      }`}
                    />
                    {fieldErrors.fullName && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                      Institutional / Verified Email{" "}
                      <span className="text-green-700 font-bold">(Verified)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        readOnly
                        disabled
                        className="w-full px-3.5 py-2.5 pr-9 rounded-lg border border-[#E5E7EB] bg-[#F7F8FA] text-sm text-[#666666] cursor-not-allowed"
                      />
                      <Lock className="w-4 h-4 text-[#666666] absolute right-3 top-3" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                      Phone Number <span className="text-[#2563EB]">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: "" });
                      }}
                      placeholder="+91 98450 11223"
                      className={`w-full px-3.5 py-2.5 rounded-lg border text-sm ${
                        fieldErrors.phone ? "border-red-500 bg-red-50/20" : "border-[#E5E7EB]"
                      }`}
                    />
                    {fieldErrors.phone && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                      Gender <span className="text-[#666666] font-normal">(Optional)</span>
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm bg-white"
                    >
                      <option value="">Prefer not to say</option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                      Country <span className="text-[#2563EB]">*</span>
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => {
                        setCountry(e.target.value);
                        if (fieldErrors.country)
                          setFieldErrors({ ...fieldErrors, country: "" });
                      }}
                      placeholder="India"
                      className={`w-full px-3.5 py-2.5 rounded-lg border text-sm ${
                        fieldErrors.country ? "border-red-500 bg-red-50/20" : "border-[#E5E7EB]"
                      }`}
                    />
                    {fieldErrors.country && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.country}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                      State <span className="text-[#2563EB]">*</span>
                    </label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => {
                        setState(e.target.value);
                        if (fieldErrors.state) setFieldErrors({ ...fieldErrors, state: "" });
                      }}
                      placeholder="e.g., Karnataka"
                      className={`w-full px-3.5 py-2.5 rounded-lg border text-sm ${
                        fieldErrors.state ? "border-red-500 bg-red-50/20" : "border-[#E5E7EB]"
                      }`}
                    />
                    {fieldErrors.state && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.state}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                      City <span className="text-[#2563EB]">*</span>
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        if (fieldErrors.city) setFieldErrors({ ...fieldErrors, city: "" });
                      }}
                      placeholder="e.g., Bengaluru"
                      className={`w-full px-3.5 py-2.5 rounded-lg border text-sm ${
                        fieldErrors.city ? "border-red-500 bg-red-50/20" : "border-[#E5E7EB]"
                      }`}
                    />
                    {fieldErrors.city && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.city}</p>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <FileUploadField
                    label="Profile Photograph (Optional)"
                    category="avatar"
                    value={avatarUrl}
                    onChange={setAvatarUrl}
                    helperText="Upload a professional headshot (JPG, PNG, or WebP, max 5MB)"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: ACADEMIC INFORMATION */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {/* University / Institution */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                    University / Institution <span className="text-[#2563EB]">*</span>
                  </label>
                  <input
                    type="text"
                    value={university}
                    onChange={(e) => {
                      setUniversity(e.target.value);
                      if (fieldErrors.university)
                        setFieldErrors({ ...fieldErrors, university: "" });
                    }}
                    placeholder="e.g., Indian Institute of Science (IISc), Bengaluru"
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm ${
                      fieldErrors.university
                        ? "border-red-500 bg-red-50/20"
                        : "border-[#E5E7EB]"
                    }`}
                  />
                  {fieldErrors.university && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.university}</p>
                  )}
                </div>

                {/* Cascading Academic Domain & Specialization Selector */}
                <div>
                  <CascadingAcademicSelector
                    label="Academic Domain & Research Specialization"
                    domainId={domainId}
                    specializationId={specializationId}
                    currentDepartmentText={department}
                    domains={domains}
                    specializations={specializations}
                    error={fieldErrors.department || fieldErrors.specializationId}
                    onChange={(sel) => {
                      setDomainId(sel.domainId);
                      setSpecializationId(sel.specializationId);
                      setDepartment(sel.formattedDepartment);
                      if (fieldErrors.department || fieldErrors.specializationId) {
                        setFieldErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.department;
                          delete copy.specializationId;
                          return copy;
                        });
                      }
                    }}
                    helperText="Select your parent academic domain and doctoral research specialization track."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                      Highest Qualification Prior to PhD <span className="text-[#2563EB]">*</span>
                    </label>
                    <select
                      value={highestQualification}
                      onChange={(e) => setHighestQualification(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm bg-white"
                    >
                      {HIGHEST_QUALIFICATIONS.map((q) => (
                        <option key={q} value={q}>
                          {q}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                      PhD Enrollment Year <span className="text-[#2563EB]">*</span>
                    </label>
                    <select
                      value={enrollmentYear}
                      onChange={(e) => setEnrollmentYear(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm bg-white"
                    >
                      {ENROLLMENT_YEARS.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                      Expected PhD Completion Year <span className="text-[#2563EB]">*</span>
                    </label>
                    <select
                      value={expectedCompletionYear}
                      onChange={(e) => {
                        setExpectedCompletionYear(Number(e.target.value));
                        if (fieldErrors.expectedCompletionYear)
                          setFieldErrors({ ...fieldErrors, expectedCompletionYear: "" });
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white ${
                        fieldErrors.expectedCompletionYear
                          ? "border-red-500 bg-red-50/20"
                          : "border-[#E5E7EB]"
                      }`}
                    >
                      {COMPLETION_YEARS.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.expectedCompletionYear && (
                      <p className="text-xs text-red-600 mt-1">
                        {fieldErrors.expectedCompletionYear}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                    Current Research Topic / Doctoral Thesis Title{" "}
                    <span className="text-[#2563EB]">*</span>
                  </label>
                  <input
                    type="text"
                    value={currentResearchTopic}
                    onChange={(e) => {
                      setCurrentResearchTopic(e.target.value);
                      if (fieldErrors.currentResearchTopic)
                        setFieldErrors({ ...fieldErrors, currentResearchTopic: "" });
                    }}
                    placeholder="e.g., Interpretable Multimodal Foundation Models for Scientific Discovery"
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm ${
                      fieldErrors.currentResearchTopic
                        ? "border-red-500 bg-red-50/20"
                        : "border-[#E5E7EB]"
                    }`}
                  />
                  {fieldErrors.currentResearchTopic && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.currentResearchTopic}</p>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: RESEARCH PROFILE */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                    Research Biography <span className="text-[#2563EB]">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={biography}
                    onChange={(e) => {
                      setBiography(e.target.value);
                      if (fieldErrors.biography)
                        setFieldErrors({ ...fieldErrors, biography: "" });
                    }}
                    placeholder="Summarize your doctoral research focus, laboratory affiliation, and mentorship philosophy for prospective student interns..."
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm ${
                      fieldErrors.biography ? "border-red-500 bg-red-50/20" : "border-[#E5E7EB]"
                    }`}
                  />
                  {fieldErrors.biography && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.biography}</p>
                  )}
                </div>

                <div>
                  <TagInput
                    label="Research Interests"
                    required
                    values={researchInterests}
                    onChange={(vals) => {
                      setResearchInterests(vals);
                      if (fieldErrors.researchInterests)
                        setFieldErrors({ ...fieldErrors, researchInterests: "" });
                    }}
                    placeholder="Type a research interest and press Enter..."
                    suggestions={[
                      "Multimodal Learning",
                      "Visual SLAM",
                      "Clinical Biostatistics",
                      "Causal Inference",
                      "Quantum Information",
                      "Bioinformatics",
                      "Medical Imaging",
                      "Computational Neuroscience",
                    ]}
                  />
                  {fieldErrors.researchInterests && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.researchInterests}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                      Current Research Description
                    </label>
                    <textarea
                      rows={3}
                      value={currentResearchDescription}
                      onChange={(e) => setCurrentResearchDescription(e.target.value)}
                      placeholder="Describe the core problem statements and objectives of your ongoing PhD research..."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                      Research Methodologies
                    </label>
                    <textarea
                      rows={3}
                      value={researchMethodologies}
                      onChange={(e) => setResearchMethodologies(e.target.value)}
                      placeholder="e.g., Empirical ablation studies, randomized clinical cohort analysis, finite element modeling..."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                      Research Projects Summary
                    </label>
                    <textarea
                      rows={3}
                      value={projectsSummary}
                      onChange={(e) => setProjectsSummary(e.target.value)}
                      placeholder="Highlight key sponsored or doctoral research projects you lead or collaborate on..."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                      Laboratory Experience
                    </label>
                    <textarea
                      rows={3}
                      value={laboratoryExperience}
                      onChange={(e) => setLaboratoryExperience(e.target.value)}
                      placeholder="Describe your research group, lab instrumentation, or HPC cluster environment..."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <TagInput
                    label="Research Tools & Technologies"
                    values={researchTools}
                    onChange={setResearchTools}
                    placeholder="Add a tool and press Enter..."
                    suggestions={[
                      "HuggingFace",
                      "Weights & Biases",
                      "Slurm HPC",
                      "FreeSurfer",
                      "Overleaf",
                      "Gazebo",
                      "SPSS",
                      "Docker",
                    ]}
                  />

                  <TagInput
                    label="Technical Skills"
                    values={technicalSkills}
                    onChange={setTechnicalSkills}
                    placeholder="Add a technical skill and press Enter..."
                    suggestions={[
                      "PyTorch",
                      "Python",
                      "ROS2",
                      "R",
                      "C++",
                      "MONAI",
                      "Stata",
                      "MATLAB",
                    ]}
                  />
                </div>
              </div>
            )}

            {/* STEP 4: PUBLICATIONS & PROFESSIONAL EXPERIENCE */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124]">
                        Research Publications
                      </label>
                      <p className="text-xs text-[#666666] mt-0.5">
                        Add your published or accepted conference and journal papers.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setPublications([
                          ...publications,
                          {
                            title: "",
                            journal_conference: "",
                            publication_year: 2025,
                            doi_or_url: "",
                          },
                        ])
                      }
                      className="px-3.5 py-2 rounded-lg bg-[#EFF6FF] border border-[#2563EB]/30 text-xs font-semibold text-[#2563EB] inline-flex items-center gap-1.5 hover:bg-[#2563EB] hover:text-white transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Publication
                    </button>
                  </div>

                  {publications.map((pub, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#202124]">
                          Publication #{idx + 1}
                        </span>
                        {publications.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setPublications(publications.filter((_, i) => i !== idx))
                            }
                            className="text-xs font-semibold text-red-600 hover:underline inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-6">
                          <label className="block text-[11px] font-semibold text-[#666666] mb-1">
                            Publication Title
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., Cross-Modal Attention for Scientific Table Understanding"
                            value={pub.title}
                            onChange={(e) => {
                              const next = [...publications];
                              next[idx].title = e.target.value;
                              setPublications(next);
                            }}
                            className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white text-xs"
                          />
                        </div>

                        <div className="sm:col-span-4">
                          <label className="block text-[11px] font-semibold text-[#666666] mb-1">
                            Journal / Conference
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., NeurIPS 2025 / IEEE TPAMI"
                            value={pub.journal_conference}
                            onChange={(e) => {
                              const next = [...publications];
                              next[idx].journal_conference = e.target.value;
                              setPublications(next);
                              if (fieldErrors[`pub_${idx}`]) {
                                setFieldErrors({ ...fieldErrors, [`pub_${idx}`]: "" });
                              }
                            }}
                            className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white text-xs"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-[#666666] mb-1">
                            Year
                          </label>
                          <input
                            type="number"
                            min={2000}
                            max={2030}
                            value={pub.publication_year}
                            onChange={(e) => {
                              const next = [...publications];
                              next[idx].publication_year = Number(e.target.value);
                              setPublications(next);
                            }}
                            className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#666666] mb-1">
                          DOI or URL (Optional)
                        </label>
                        <input
                          type="url"
                          placeholder="https://doi.org/10.1109/..."
                          value={pub.doi_or_url}
                          onChange={(e) => {
                            const next = [...publications];
                            next[idx].doi_or_url = e.target.value;
                            setPublications(next);
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white text-xs"
                        />
                      </div>

                      {fieldErrors[`pub_${idx}`] && (
                        <p className="text-xs text-red-600">{fieldErrors[`pub_${idx}`]}</p>
                      )}
                    </div>
                  ))}
                </div>

                <TagInput
                  label="Academic & Professional Certifications"
                  values={certifications}
                  onChange={setCertifications}
                  placeholder="Add a certification or fellowship and press Enter..."
                  suggestions={[
                    "PMRF Fellow (Prime Minister's Research Fellowship)",
                    "UGC-NET JRF Qualified",
                    "GATE 99.5+ Percentile",
                    "INSPIRE Fellow",
                    "NVIDIA Deep Learning Institute Certified",
                  ]}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                      Previous Teaching or Mentoring Experience
                    </label>
                    <textarea
                      rows={3}
                      value={teachingMentoringExperience}
                      onChange={(e) => setTeachingMentoringExperience(e.target.value)}
                      placeholder="Describe Teaching Assistantships (TA), undergraduate thesis supervision, or lab mentoring..."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                      Research Achievements & Honors
                    </label>
                    <textarea
                      rows={3}
                      value={researchAchievements}
                      onChange={(e) => setResearchAchievements(e.target.value)}
                      placeholder="Best Paper awards, travel grants, patents, or competitive fellowships..."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: INTERNSHIP INFORMATION & PROFESSIONAL LINKS */}
            {currentStep === 5 && (
              <div className="space-y-8">
                {/* Internship Offering Toggle */}
                <div className="space-y-4">
                  <div className="p-5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-[#202124]">
                        Are you currently offering research internships?
                      </h3>
                      <p className="text-xs text-[#666666] mt-0.5">
                        Select &ldquo;Yes&rdquo; to publish an open research internship opportunity now, or
                        &ldquo;No&rdquo; to skip and post internships later from your dashboard.
                      </p>
                    </div>

                    <div className="inline-flex rounded-lg border border-[#E5E7EB] bg-white p-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setOfferingInternships(true)}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${
                          offeringInternships
                            ? "bg-[#2563EB] text-white"
                            : "text-[#666666] hover:text-[#202124]"
                        }`}
                      >
                        Yes, Offering
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOfferingInternships(false);
                          setFieldErrors({
                            ...fieldErrors,
                            internshipTitle: "",
                            internshipDescription: "",
                          });
                        }}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${
                          !offeringInternships
                            ? "bg-[#202124] text-white"
                            : "text-[#666666] hover:text-[#202124]"
                        }`}
                      >
                        No (Skip for Now)
                      </button>
                    </div>
                  </div>

                  {offeringInternships && (
                    <div className="p-6 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] space-y-5">
                      <div className="border-b border-[#E5E7EB] pb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                          Initial Research Internship Listing
                        </span>
                        <p className="text-xs text-[#666666] mt-0.5">
                          Students will be able to apply to this opportunity once your profile is verified.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                          Internship Title <span className="text-[#2563EB]">*</span>
                        </label>
                        <input
                          type="text"
                          value={internshipTitle}
                          onChange={(e) => {
                            setInternshipTitle(e.target.value);
                            if (fieldErrors.internshipTitle)
                              setFieldErrors({ ...fieldErrors, internshipTitle: "" });
                          }}
                          placeholder="e.g., Research Intern — Multimodal Deep Learning for Scientific Reasoning"
                          className={`w-full px-3.5 py-2.5 rounded-lg border bg-white text-sm ${
                            fieldErrors.internshipTitle
                              ? "border-red-500"
                              : "border-[#E5E7EB]"
                          }`}
                        />
                        {fieldErrors.internshipTitle && (
                          <p className="text-xs text-red-600 mt-1">{fieldErrors.internshipTitle}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                          Internship Description <span className="text-[#2563EB]">*</span>
                        </label>
                        <textarea
                          rows={3}
                          value={internshipDescription}
                          onChange={(e) => {
                            setInternshipDescription(e.target.value);
                            if (fieldErrors.internshipDescription)
                              setFieldErrors({ ...fieldErrors, internshipDescription: "" });
                          }}
                          placeholder="Describe the research problem, student responsibilities, and expected outcomes..."
                          className={`w-full px-3.5 py-2.5 rounded-lg border bg-white text-sm ${
                            fieldErrors.internshipDescription
                              ? "border-red-500"
                              : "border-[#E5E7EB]"
                          }`}
                        />
                        {fieldErrors.internshipDescription && (
                          <p className="text-xs text-red-600 mt-1">
                            {fieldErrors.internshipDescription}
                          </p>
                        )}
                      </div>

                      <TagInput
                        label="Required Skills"
                        values={requiredStudentSkills}
                        onChange={setRequiredStudentSkills}
                        suggestions={[
                          "Python",
                          "PyTorch",
                          "Literature Analysis",
                          "LaTeX",
                          "Data Preprocessing",
                          "Statistical Modeling",
                        ]}
                      />

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                          Eligibility Criteria
                        </label>
                        <input
                          type="text"
                          value={eligibilityCriteria}
                          onChange={(e) => setEligibilityCriteria(e.target.value)}
                          placeholder="e.g., 3rd/4th year B.Tech or M.Tech students with strong linear algebra background"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1">
                            Duration
                          </label>
                          <input
                            type="text"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            placeholder="e.g., 8 Weeks / 3 Months"
                            className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1">
                            Available Positions
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={availablePositions}
                            onChange={(e) => setAvailablePositions(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1">
                            Mode
                          </label>
                          <select
                            value={internshipMode}
                            onChange={(e) =>
                              setInternshipMode(
                                e.target.value as "Remote" | "On-site" | "Hybrid"
                              )
                            }
                            className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white text-sm"
                          >
                            <option value="Remote">Remote</option>
                            <option value="On-site">On-site</option>
                            <option value="Hybrid">Hybrid</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1">
                            Application Deadline
                          </label>
                          <input
                            type="date"
                            value={applicationDeadline}
                            onChange={(e) => setApplicationDeadline(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1">
                            Stipend (Optional)
                          </label>
                          <input
                            type="text"
                            value={stipend}
                            onChange={(e) => setStipend(e.target.value)}
                            placeholder="e.g., Unpaid / Co-authorship / ₹10,000 per month"
                            className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Professional Links */}
                <div className="space-y-4 pt-2 border-t border-[#E5E7EB]">
                  <div>
                    <h3 className="text-sm font-bold text-[#202124]">
                      Academic & Professional Links
                    </h3>
                    <p className="text-xs text-[#666666] mt-0.5">
                      Provide links to your academic indices and research repositories for credential verification.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                        Google Scholar Profile URL
                      </label>
                      <input
                        type="url"
                        value={googleScholarUrl}
                        onChange={(e) => {
                          setGoogleScholarUrl(e.target.value);
                          if (fieldErrors.googleScholarUrl)
                            setFieldErrors({ ...fieldErrors, googleScholarUrl: "" });
                        }}
                        placeholder="https://scholar.google.com/citations?user=..."
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-sm ${
                          fieldErrors.googleScholarUrl
                            ? "border-red-500 bg-red-50/20"
                            : "border-[#E5E7EB]"
                        }`}
                      />
                      {fieldErrors.googleScholarUrl && (
                        <p className="text-xs text-red-600 mt-1">{fieldErrors.googleScholarUrl}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                        ORCID ID
                      </label>
                      <input
                        type="text"
                        value={orcidId}
                        onChange={(e) => setOrcidId(e.target.value)}
                        placeholder="0000-0002-1825-0097"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                        LinkedIn Profile
                      </label>
                      <input
                        type="url"
                        value={linkedinUrl}
                        onChange={(e) => {
                          setLinkedinUrl(e.target.value);
                          if (fieldErrors.linkedinUrl)
                            setFieldErrors({ ...fieldErrors, linkedinUrl: "" });
                        }}
                        placeholder="https://linkedin.com/in/..."
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-sm ${
                          fieldErrors.linkedinUrl
                            ? "border-red-500 bg-red-50/20"
                            : "border-[#E5E7EB]"
                        }`}
                      />
                      {fieldErrors.linkedinUrl && (
                        <p className="text-xs text-red-600 mt-1">{fieldErrors.linkedinUrl}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                        GitHub Profile
                      </label>
                      <input
                        type="url"
                        value={githubUrl}
                        onChange={(e) => {
                          setGithubUrl(e.target.value);
                          if (fieldErrors.githubUrl)
                            setFieldErrors({ ...fieldErrors, githubUrl: "" });
                        }}
                        placeholder="https://github.com/..."
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-sm ${
                          fieldErrors.githubUrl
                            ? "border-red-500 bg-red-50/20"
                            : "border-[#E5E7EB]"
                        }`}
                      />
                      {fieldErrors.githubUrl && (
                        <p className="text-xs text-red-600 mt-1">{fieldErrors.githubUrl}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                        Personal Website / Lab Page
                      </label>
                      <input
                        type="url"
                        value={personalWebsiteUrl}
                        onChange={(e) => {
                          setPersonalWebsiteUrl(e.target.value);
                          if (fieldErrors.personalWebsiteUrl)
                            setFieldErrors({ ...fieldErrors, personalWebsiteUrl: "" });
                        }}
                        placeholder="https://..."
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-sm ${
                          fieldErrors.personalWebsiteUrl
                            ? "border-red-500 bg-red-50/20"
                            : "border-[#E5E7EB]"
                        }`}
                      />
                      {fieldErrors.personalWebsiteUrl && (
                        <p className="text-xs text-red-600 mt-1">
                          {fieldErrors.personalWebsiteUrl}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: REVIEW & SUBMIT */}
            {currentStep === 6 && (
              <div className="space-y-6">
                {/* 1. Personal Information Summary Card */}
                <div className="p-5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                    <h3 className="text-sm font-bold text-[#202124]">1. Personal Information</h3>
                    <button
                      type="button"
                      onClick={() => jumpToStep(1)}
                      className="text-xs font-semibold text-[#2563EB] hover:underline inline-flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-[#666666] block">Full Name</span>
                      <span className="font-semibold text-[#202124]">{fullName || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[#666666] block">Verified Email</span>
                      <span className="font-semibold text-[#202124]">{email}</span>
                    </div>
                    <div>
                      <span className="text-[#666666] block">Phone Number</span>
                      <span className="font-semibold text-[#202124]">{phone || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[#666666] block">Gender</span>
                      <span className="font-semibold text-[#202124]">
                        {gender || "Not specified"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#666666] block">Location</span>
                      <span className="font-semibold text-[#202124]">
                        {[city, state, country].filter(Boolean).join(", ") || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#666666] block">Profile Photograph</span>
                      <span className="font-semibold text-[#202124]">
                        {avatarUrl ? "Uploaded" : "Default Avatar"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Academic Information Summary Card */}
                <div className="p-5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                    <h3 className="text-sm font-bold text-[#202124]">2. Academic Information</h3>
                    <button
                      type="button"
                      onClick={() => jumpToStep(2)}
                      className="text-xs font-semibold text-[#2563EB] hover:underline inline-flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-[#666666] block">University / Institution</span>
                      <span className="font-semibold text-[#202124]">{university || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[#666666] block">Department</span>
                      <span className="font-semibold text-[#202124]">{department || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[#666666] block">Highest Qualification</span>
                      <span className="font-semibold text-[#202124]">{highestQualification}</span>
                    </div>
                    <div>
                      <span className="text-[#666666] block">PhD Timeline</span>
                      <span className="font-semibold text-[#202124]">
                        {enrollmentYear} – {expectedCompletionYear}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#666666] block">Research Field</span>
                      <span className="font-semibold text-[#202124]">
                        {selectedDomainObj?.name || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#666666] block">Specialization</span>
                      <span className="font-semibold text-[#2563EB]">
                        {selectedSpecObj?.name || "—"}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 text-xs">
                    <span className="text-[#666666] block">Current Research Topic</span>
                    <p className="font-semibold text-[#202124] mt-0.5">
                      {currentResearchTopic || "—"}
                    </p>
                  </div>
                </div>

                {/* 3. Research Profile Summary Card */}
                <div className="p-5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                    <h3 className="text-sm font-bold text-[#202124]">3. Research Profile</h3>
                    <button
                      type="button"
                      onClick={() => jumpToStep(3)}
                      className="text-xs font-semibold text-[#2563EB] hover:underline inline-flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>
                  <div className="text-xs space-y-2.5">
                    <div>
                      <span className="text-[#666666] block">Research Biography</span>
                      <p className="text-[#202124] mt-0.5 leading-relaxed">{biography || "—"}</p>
                    </div>
                    <div>
                      <span className="text-[#666666] block mb-1">Research Interests</span>
                      <div className="flex flex-wrap gap-1.5">
                        {researchInterests.map((item) => (
                          <span
                            key={item}
                            className="px-2.5 py-0.5 rounded-full bg-white border border-[#E5E7EB] font-medium text-[#202124]"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-[#666666] block mb-1">Technical Skills</span>
                        <div className="flex flex-wrap gap-1">
                          {technicalSkills.length > 0 ? (
                            technicalSkills.map((sk) => (
                              <span
                                key={sk}
                                className="px-2 py-0.5 rounded bg-white border border-[#E5E7EB] text-[#202124]"
                              >
                                {sk}
                              </span>
                            ))
                          ) : (
                            <span className="text-[#666666]">None added</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-[#666666] block mb-1">
                          Research Tools & Technologies
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {researchTools.length > 0 ? (
                            researchTools.map((tl) => (
                              <span
                                key={tl}
                                className="px-2 py-0.5 rounded bg-white border border-[#E5E7EB] text-[#202124]"
                              >
                                {tl}
                              </span>
                            ))
                          ) : (
                            <span className="text-[#666666]">None added</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Publications and Experience Summary Card */}
                <div className="p-5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                    <h3 className="text-sm font-bold text-[#202124]">
                      4. Publications and Experience
                    </h3>
                    <button
                      type="button"
                      onClick={() => jumpToStep(4)}
                      className="text-xs font-semibold text-[#2563EB] hover:underline inline-flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>
                  <div className="text-xs space-y-2.5">
                    <div>
                      <span className="text-[#666666] block mb-1">
                        Publications ({validPublications.length})
                      </span>
                      {validPublications.length > 0 ? (
                        <ul className="space-y-1.5">
                          {validPublications.map((p, i) => (
                            <li
                              key={i}
                              className="p-2.5 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-between gap-2"
                            >
                              <div>
                                <p className="font-semibold text-[#202124]">{p.title}</p>
                                <p className="text-[11px] text-[#666666]">
                                  {p.journal_conference} • {p.publication_year}
                                </p>
                              </div>
                              {p.doi_or_url && (
                                <a
                                  href={p.doi_or_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#2563EB] hover:underline inline-flex items-center gap-1 shrink-0"
                                >
                                  DOI <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[#666666]">No publications listed yet.</p>
                      )}
                    </div>
                    {certifications.length > 0 && (
                      <div>
                        <span className="text-[#666666] block mb-1">Certifications</span>
                        <p className="text-[#202124] font-medium">{certifications.join(" • ")}</p>
                      </div>
                    )}
                    {teachingMentoringExperience && (
                      <div>
                        <span className="text-[#666666] block">
                          Teaching & Mentoring Experience
                        </span>
                        <p className="text-[#202124] mt-0.5">{teachingMentoringExperience}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. Internship Preferences Summary Card */}
                <div className="p-5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                    <h3 className="text-sm font-bold text-[#202124]">5. Internship Preferences</h3>
                    <button
                      type="button"
                      onClick={() => jumpToStep(5)}
                      className="text-xs font-semibold text-[#2563EB] hover:underline inline-flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>
                  <div className="text-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[#666666]">Offering Research Internships:</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold ${
                          offeringInternships
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-200 text-[#202124]"
                        }`}
                      >
                        {offeringInternships ? "Yes — Active" : "No — Not Currently"}
                      </span>
                    </div>
                    {offeringInternships && internshipTitle && (
                      <div className="p-3 rounded-lg bg-white border border-[#E5E7EB] space-y-1">
                        <p className="font-bold text-[#202124]">{internshipTitle}</p>
                        <p className="text-[#666666]">{internshipDescription}</p>
                        <p className="text-[11px] font-semibold text-[#2563EB] pt-1">
                          {internshipMode} • {duration} • {availablePositions} Position(s) •
                          Deadline: {applicationDeadline}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 6. Professional Links Summary Card */}
                <div className="p-5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                    <h3 className="text-sm font-bold text-[#202124]">6. Professional Links</h3>
                    <button
                      type="button"
                      onClick={() => jumpToStep(5)}
                      className="text-xs font-semibold text-[#2563EB] hover:underline inline-flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[#666666] block">Google Scholar</span>
                      <span className="font-semibold text-[#202124] break-all">
                        {googleScholarUrl || "Not provided"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#666666] block">ORCID ID</span>
                      <span className="font-semibold text-[#202124]">
                        {orcidId || "Not provided"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#666666] block">LinkedIn</span>
                      <span className="font-semibold text-[#202124] break-all">
                        {linkedinUrl || "Not provided"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#666666] block">GitHub</span>
                      <span className="font-semibold text-[#202124] break-all">
                        {githubUrl || "Not provided"}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[#666666] block">Personal Website</span>
                      <span className="font-semibold text-[#202124] break-all">
                        {personalWebsiteUrl || "Not provided"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Accuracy Confirmation Checkbox */}
                <label className="flex items-start gap-3 p-4 rounded-xl bg-[#EFF6FF] border border-[#2563EB]/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmedAccurate}
                    onChange={(e) => setConfirmedAccurate(e.target.checked)}
                    className="w-4 h-4 accent-[#2563EB] mt-0.5"
                  />
                  <span className="text-xs font-semibold text-[#202124] leading-relaxed">
                    I confirm that all the information provided is accurate.
                  </span>
                </label>
              </div>
            )}

            {/* Step Navigation Footer */}
            <div className="mt-8 pt-6 border-t border-[#E5E7EB] flex flex-wrap items-center justify-between gap-4">
              <div>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-5 py-3 rounded-lg border border-[#D1D5DB] bg-white text-xs font-bold text-[#202124] hover:border-[#2563EB] hover:text-[#2563EB] inline-flex items-center gap-2 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={savingDraft}
                  className="px-4 py-3 rounded-lg border border-[#E5E7EB] bg-[#F7F8FA] text-xs font-semibold text-[#202124] hover:border-[#2563EB] inline-flex items-center gap-1.5 transition-colors"
                >
                  <Save className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Save as Draft</span>
                </button>

                {currentStep < 6 ? (
                  <button
                    type="button"
                    onClick={handleContinue}
                    className="px-6 py-3 rounded-lg bg-[#2563EB] text-white text-xs font-bold hover:bg-[#1D4ED8] inline-flex items-center gap-2 transition-colors shadow-xs"
                  >
                    <span>Save &amp; Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-7 py-3.5 rounded-lg bg-[#2563EB] text-white text-sm font-bold hover:bg-[#1D4ED8] inline-flex items-center gap-2 transition-colors shadow-xs disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting PhD Scholar Profile...</span>
                      </>
                    ) : (
                      <>
                        <span>Complete PhD Scholar Profile</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
