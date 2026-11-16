"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Edit3,
  ExternalLink,
  FileText,
  FolderGit2,
  Loader2,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { TagInput } from "@/components/TagInput";
import { FileUploadField } from "@/components/FileUploadField";
import { AcademicDomain, Specialization } from "@/types/database";
import { CascadingAcademicSelector } from "@/components/CascadingAcademicSelector";
import { getGraduationYearRange } from "@/lib/validations";
import { InternationalPhoneInput, validateInternationalPhone } from "@/components/PhoneInput";
import { getAcademicInterestSuggestions } from "@/lib/academic-interests";

const STUDENT_STEPS = [
  { number: 1, shortLabel: "Personal", title: "Personal Information" },
  { number: 2, shortLabel: "Academic", title: "Academic Information" },
  { number: 3, shortLabel: "Research", title: "Research Interests & Experience" },
  { number: 4, shortLabel: "Skills", title: "Skills & Certifications" },
  { number: 5, shortLabel: "Documents", title: "Documents & Professional Links" },
  { number: 6, shortLabel: "Review", title: "Review Your Student Profile" },
];

const DEFAULT_DOMAINS = [
  "Engineering",
  "Medical and Healthcare",
  "Science",
  "Management",
  "Commerce",
  "Arts and Humanities",
  "Law",
  "Agriculture",
  "Interdisciplinary Research",
];

export interface StudentProjectDraft {
  id?: string;
  title: string;
  description: string;
  technologies: string;
  project_url: string;
  github_url: string;
  duration: string;
}

function isValidOptionalUrl(val: string): boolean {
  if (!val || !val.trim()) return true;
  try {
    const u = new URL(val.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function StudentOnboardingPage() {
  const router = useRouter();
  const { session, loading: authLoading, refreshSession } = useAuth();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [highestCompletedStep, setHighestCompletedStep] = useState<number>(0);
  const [domains, setDomains] = useState<AcademicDomain[]>([]);
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSavedToast, setDraftSavedToast] = useState("");
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [confirmedAccurate, setConfirmedAccurate] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // Step 1: Personal Information
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("Prefer not to say");
  const [country, setCountry] = useState("India");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Step 2: Academic Information
  const [college, setCollege] = useState("");
  const [degree, setDegree] = useState("B.Tech");
  const [department, setDepartment] = useState("");
  const [domainId, setDomainId] = useState("");
  const [specializationId, setSpecializationId] = useState("");
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [currentYearSemester, setCurrentYearSemester] = useState("3rd Year");
  const [graduationYear, setGraduationYear] = useState<number>(() => new Date().getFullYear() + 1);
  const [gradYearSearch, setGradYearSearch] = useState("");
  const [academicInterests, setAcademicInterests] = useState<string[]>([]);

  // Step 3: Research Interests & Experience (with Optional & Repeatable Projects)
  const [preferredDomains, setPreferredDomains] = useState<string[]>([]);
  const [projects, setProjects] = useState<StudentProjectDraft[]>([]);
  const [researchExperience, setResearchExperience] = useState("");

  // Step 4: Technical Skills & Certifications
  const [skills, setSkills] = useState<string[]>([]);
  const [programmingLanguages, setProgrammingLanguages] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);

  // Step 5: Documents & Professional Links
  const [resumeUrl, setResumeUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  // Dynamic Graduation Years (Current Year - 10 to Current Year + 50, plus saved year)
  const availableGradYears = useMemo(
    () => getGraduationYearRange(graduationYear),
    [graduationYear]
  );

  const filteredGradYears = useMemo(() => {
    if (!gradYearSearch.trim()) return availableGradYears;
    return availableGradYears.filter((yr) => String(yr).includes(gradYearSearch.trim()));
  }, [availableGradYears, gradYearSearch]);

  const dynamicInterestSuggestions = useMemo(() => {
    return getAcademicInterestSuggestions(domainId, specializationId);
  }, [domainId, specializationId]);

  // Load Academic Domains & Specializations
  useEffect(() => {
    fetch("/api/public")
      .then((r) => r.json())
      .then((d) => {
        setDomains(d.domains || []);
        setSpecializations(d.specializations || []);
      })
      .catch(() => {});
  }, []);

  // Role Guard & Load Existing Profile / Projects / Draft
  useEffect(() => {
    if (authLoading || hydrated) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (session.user.role === "scholar") {
      router.replace("/onboarding/scholar");
      return;
    }
    if (session.user.role === "admin") {
      router.replace("/admin");
      return;
    }

    setFullName(session.user.full_name || "");
    setPhone(session.user.phone || "");
    setGender(session.user.gender || "Prefer not to say");
    setCountry(session.user.country || "India");
    setState(session.user.state || "");
    setCity(session.user.city || "");
    setAvatarUrl(session.user.avatar_url || "");

    fetch("/api/onboarding/student")
      .then((r) => r.json())
      .then((apiData) => {
        const sp = apiData.studentProfile || session.studentProfile;
        if (sp) {
          if (sp.college_university) setCollege(sp.college_university);
          if (sp.degree) setDegree(sp.degree);
          if (sp.department) setDepartment(sp.department);
          if (sp.domain_id) setDomainId(sp.domain_id);
          if (sp.specialization_id) setSpecializationId(sp.specialization_id);
          if (sp.current_year_semester) setCurrentYearSemester(sp.current_year_semester);
          if (sp.graduation_year) setGraduationYear(Number(sp.graduation_year));
          if (sp.academic_interests?.length) setAcademicInterests(sp.academic_interests);
          if (sp.preferred_domains?.length) setPreferredDomains(sp.preferred_domains);
          if (sp.research_experience) setResearchExperience(sp.research_experience);
          if (sp.skills?.length) setSkills(sp.skills);
          if (sp.programming_languages?.length) setProgrammingLanguages(sp.programming_languages);
          if (sp.certifications?.length) setCertifications(sp.certifications);
          if (sp.resume_url) setResumeUrl(sp.resume_url);
          if (sp.linkedin_url) setLinkedinUrl(sp.linkedin_url);
          if (sp.github_url) setGithubUrl(sp.github_url);
          if (sp.portfolio_url) setPortfolioUrl(sp.portfolio_url);

          const dbProjects = apiData.projects || sp.projects || [];
          if (Array.isArray(dbProjects) && dbProjects.length > 0) {
            setProjects(
              dbProjects.map((p: Record<string, unknown>) => ({
                id: p.id ? String(p.id) : undefined,
                title: String(p.title || ""),
                description: String(p.description || ""),
                technologies: String(p.technologies || ""),
                project_url: String(p.project_url || ""),
                github_url: String(p.github_url || ""),
                duration: String(p.duration || ""),
              }))
            );
          }

          if (session.user.onboarding_completed) {
            setHighestCompletedStep(5);
          } else if (sp.onboarding_step && sp.onboarding_step >= 1 && sp.onboarding_step <= 6) {
            setCurrentStep(sp.onboarding_step);
            setHighestCompletedStep(sp.onboarding_step - 1);
          }
        }

        // Check localStorage draft for instant browser refresh recovery
        try {
          const storageKey = `starsky_student_draft_${session.user.id}`;
          const rawDraft = localStorage.getItem(storageKey);
          if (rawDraft && !session.user.onboarding_completed) {
            const draft = JSON.parse(rawDraft);
            if (draft.fullName) setFullName(draft.fullName);
            if (draft.phone) setPhone(draft.phone);
            if (draft.gender) setGender(draft.gender);
            if (draft.country) setCountry(draft.country);
            if (draft.state) setState(draft.state);
            if (draft.city) setCity(draft.city);
            if (draft.avatarUrl) setAvatarUrl(draft.avatarUrl);
            if (draft.college) setCollege(draft.college);
            if (draft.degree) setDegree(draft.degree);
            if (draft.department) setDepartment(draft.department);
            if (draft.domainId) setDomainId(draft.domainId);
            if (draft.specializationId) setSpecializationId(draft.specializationId);
            if (draft.currentYearSemester) setCurrentYearSemester(draft.currentYearSemester);
            if (draft.graduationYear) setGraduationYear(Number(draft.graduationYear));
            if (Array.isArray(draft.academicInterests) && draft.academicInterests.length)
              setAcademicInterests(draft.academicInterests);
            if (Array.isArray(draft.preferredDomains) && draft.preferredDomains.length)
              setPreferredDomains(draft.preferredDomains);
            if (Array.isArray(draft.projects)) setProjects(draft.projects);
            if (draft.researchExperience !== undefined)
              setResearchExperience(draft.researchExperience);
            if (Array.isArray(draft.skills) && draft.skills.length) setSkills(draft.skills);
            if (Array.isArray(draft.programmingLanguages))
              setProgrammingLanguages(draft.programmingLanguages);
            if (Array.isArray(draft.certifications)) setCertifications(draft.certifications);
            if (draft.resumeUrl) setResumeUrl(draft.resumeUrl);
            if (draft.linkedinUrl) setLinkedinUrl(draft.linkedinUrl);
            if (draft.githubUrl) setGithubUrl(draft.githubUrl);
            if (draft.portfolioUrl) setPortfolioUrl(draft.portfolioUrl);
            if (draft.currentStep && draft.currentStep >= 1 && draft.currentStep <= 6) {
              setCurrentStep(draft.currentStep);
              setHighestCompletedStep((prev) => Math.max(prev, draft.currentStep - 1));
            }
          }
        } catch {
          // ignore storage parse error
        }
      })
      .finally(() => setHydrated(true));
  }, [authLoading, session, router, hydrated]);

  const buildPayload = (stepToSave: number, isDraft: boolean) => ({
    is_draft: isDraft,
    onboarding_step: stepToSave,
    full_name: fullName.trim(),
    phone: phone.trim(),
    gender,
    country: country.trim(),
    state: state.trim(),
    city: city.trim(),
    avatar_url: avatarUrl,
    college_university: college.trim(),
    degree,
    department: department.trim(),
    domain_id: domainId,
    specialization_id: specializationId,
    academic_domain_id: domainId,
    specialization: specializations.find((s) => s.id === specializationId)?.name || "",
    current_year_semester: currentYearSemester,
    graduation_year: Number(graduationYear),
    academic_interests: academicInterests,
    preferred_domains: preferredDomains,
    skills,
    programming_languages: programmingLanguages,
    projects: projects.map((p) => ({
      id: p.id,
      title: p.title.trim(),
      description: p.description.trim(),
      technologies: p.technologies.trim(),
      project_url: p.project_url.trim(),
      github_url: p.github_url.trim(),
      duration: p.duration.trim(),
    })),
    previous_projects: projects
      .map(
        (p, idx) =>
          `${idx + 1}. ${p.title.trim()}${p.duration.trim() ? ` (${p.duration.trim()})` : ""}: ${p.description.trim()}`
      )
      .join("\n"),
    research_experience: researchExperience.trim(),
    certifications,
    resume_url: resumeUrl,
    linkedin_url: linkedinUrl.trim(),
    github_url: githubUrl.trim(),
    portfolio_url: portfolioUrl.trim(),
    bio: "",
  });

  const saveLocalDraft = (nextStepNum: number) => {
    if (!session) return;
    try {
      const storageKey = `starsky_student_draft_${session.user.id}`;
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          currentStep: nextStepNum,
          fullName,
          phone,
          gender,
          country,
          state,
          city,
          avatarUrl,
          college,
          degree,
          department,
          domainId,
          specializationId,
          currentYearSemester,
          graduationYear,
          academicInterests,
          preferredDomains,
          projects,
          researchExperience,
          skills,
          programmingLanguages,
          certifications,
          resumeUrl,
          linkedinUrl,
          githubUrl,
          portfolioUrl,
        })
      );
    } catch {
      // ignore
    }
  };

  const persistDraftToServer = async (stepNum: number, showFeedback = false) => {
    saveLocalDraft(stepNum);
    if (showFeedback) setSavingDraft(true);
    try {
      const res = await fetch("/api/onboarding/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(stepNum, true)),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.projects)) {
        setProjects(
          data.projects.map((p: Record<string, unknown>) => ({
            id: p.id ? String(p.id) : undefined,
            title: String(p.title || ""),
            description: String(p.description || ""),
            technologies: String(p.technologies || ""),
            project_url: String(p.project_url || ""),
            github_url: String(p.github_url || ""),
            duration: String(p.duration || ""),
          }))
        );
      }
      if (showFeedback) {
        setDraftSavedToast("Draft saved! You can resume anytime.");
        setTimeout(() => setDraftSavedToast(""), 3000);
      }
    } finally {
      if (showFeedback) setSavingDraft(false);
    }
  };

  // Validate only the active step
  const validateStep = (step: number): boolean => {
    const errs: Record<string, string> = {};
    const currentYear = new Date().getFullYear();

    if (step === 1) {
      if (fullName.trim().length < 2) {
        errs.fullName = "Full Name is required (minimum 2 characters).";
      }
      const phoneValidation = validateInternationalPhone(phone, country);
      if (!phoneValidation.isValid) {
        errs.phone = phoneValidation.error || "Please enter a valid phone number.";
      }
      if (country.trim().length < 2) {
        errs.country = "Country is required.";
      }
      if (state.trim().length < 2) {
        errs.state = "State is required.";
      }
      if (city.trim().length < 2) {
        errs.city = "City is required.";
      }
    } else if (step === 2) {
      if (college.trim().length < 2) {
        errs.college = "Current College / University is required.";
      }
      if (!degree.trim()) {
        errs.degree = "Degree selection is required.";
      }
      if (!domainId || !specializationId) {
        errs.department = "Please select an Academic Domain and Specialization.";
      } else if (department.trim().length < 2) {
        errs.department = "Department is required.";
      }
      if (!currentYearSemester.trim()) {
        errs.currentYearSemester = "Current Year / Semester is required.";
      }
      if (
        !graduationYear ||
        graduationYear < currentYear - 25 ||
        graduationYear > currentYear + 55
      ) {
        errs.graduationYear = `Please select a valid Graduation Year (${currentYear - 10}–${currentYear + 50}).`;
      }
      if (academicInterests.length === 0) {
        errs.academicInterests = "Please add at least one academic interest.";
      }
    } else if (step === 3) {
      if (preferredDomains.length === 0) {
        errs.preferredDomains = "Please select at least one preferred research domain.";
      }
      // Projects are OPTIONAL. If the student added project cards, validate each added card.
      projects.forEach((proj, idx) => {
        if (proj.title.trim().length < 2) {
          errs[`proj_title_${idx}`] = `Project ${idx + 1}: Project Title is required.`;
        }
        if (proj.description.trim().length < 5) {
          errs[`proj_desc_${idx}`] = `Project ${idx + 1}: Project Description is required.`;
        }
        if (!isValidOptionalUrl(proj.project_url)) {
          errs[`proj_url_${idx}`] =
            `Project ${idx + 1}: Please enter a valid Project Link (https://...).`;
        }
        if (!isValidOptionalUrl(proj.github_url)) {
          errs[`proj_github_${idx}`] =
            `Project ${idx + 1}: Please enter a valid GitHub Repository URL (https://...).`;
        }
      });
    } else if (step === 4) {
      if (skills.length === 0) {
        errs.skills = "Please add at least one technical or research skill.";
      }
    } else if (step === 5) {
      if (!resumeUrl.trim()) {
        errs.resumeUrl = "Please upload your Resume / CV (PDF).";
      }
      if (!isValidOptionalUrl(linkedinUrl)) {
        errs.linkedinUrl = "Please enter a valid URL starting with https:// or http://";
      }
      if (!isValidOptionalUrl(githubUrl)) {
        errs.githubUrl = "Please enter a valid URL starting with https:// or http://";
      }
      if (!isValidOptionalUrl(portfolioUrl)) {
        errs.portfolioUrl = "Please enter a valid URL starting with https:// or http://";
      }
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddProject = () => {
    setProjects((prev) => [
      ...prev,
      {
        title: "",
        description: "",
        technologies: "",
        project_url: "",
        github_url: "",
        duration: "",
      },
    ]);
  };

  const handleUpdateProject = (
    index: number,
    field: keyof StudentProjectDraft,
    value: string
  ) => {
    setProjects((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleRemoveProject = (index: number) => {
    setProjects((prev) => prev.filter((_, i) => i !== index));
    setFieldErrors({});
  };

  const handleSaveAndContinue = async () => {
    setGlobalError("");
    if (!validateStep(currentStep)) {
      return;
    }
    const nextStep = Math.min(6, currentStep + 1);
    setHighestCompletedStep((prev) => Math.max(prev, currentStep));
    setCurrentStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
    await persistDraftToServer(nextStep, false);
  };

  const handleBack = () => {
    setGlobalError("");
    setFieldErrors({});
    const prevStep = Math.max(1, currentStep - 1);
    setCurrentStep(prevStep);
    saveLocalDraft(prevStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const jumpToStep = (targetStep: number) => {
    setGlobalError("");
    setFieldErrors({});
    setCurrentStep(targetStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleDomain = (domainName: string) => {
    if (preferredDomains.includes(domainName)) {
      setPreferredDomains(preferredDomains.filter((d) => d !== domainName));
    } else {
      setPreferredDomains([...preferredDomains, domainName]);
    }
  };

  const handleFinalSubmit = async () => {
    setGlobalError("");
    for (let s = 1; s <= 5; s++) {
      if (!validateStep(s)) {
        setCurrentStep(s);
        setGlobalError(`Please complete the highlighted fields in Step ${s}.`);
        return;
      }
    }
    if (!confirmedAccurate) {
      setGlobalError("Please check the confirmation box to verify your information is accurate.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/onboarding/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(6, false)),
      });
      const data = await res.json();
      if (!res.ok) {
        setGlobalError(data.error || "Failed to submit student profile.");
      } else {
        if (session) {
          localStorage.removeItem(`starsky_student_draft_${session.user.id}`);
        }
        await refreshSession();
        setSubmittedSuccess(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => {
          router.push("/dashboard/student");
        }, 2000);
      }
    } catch {
      setGlobalError("Network error while saving student profile.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !hydrated) {
    return (
      <div className="p-16 text-center text-sm text-[#666666]">
        Loading Student Profile Onboarding...
      </div>
    );
  }

  if (submittedSuccess) {
    return (
      <div className="min-h-[82vh] bg-[#F7F8FA] py-16 px-4 flex items-center justify-center">
        <div className="max-w-lg w-full bg-white rounded-2xl border border-[#E5E7EB] p-10 text-center space-y-5 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 text-green-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full bg-[#EFF6FF] text-[#2563EB] text-xs font-bold uppercase tracking-wider">
            Student Onboarding Complete
          </span>
          <h1 className="text-2xl font-extrabold text-[#202124]">
            Your Student Profile Is Live!
          </h1>
          <p className="text-sm text-[#666666] leading-relaxed">
            Your academic background, research interests, projects, technical skills, and Resume/CV
            have been saved. Redirecting you to your Student Dashboard...
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard/student"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] transition-colors"
            >
              <span>Go to Student Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const progressPercentage = Math.round((currentStep / STUDENT_STEPS.length) * 100);
  const domainNamesList =
    domains.length > 0 ? domains.map((d) => d.name) : DEFAULT_DOMAINS;
  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-[#F7F8FA] min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* TOP HEADER & PROGRESS INDICATOR */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#202124] flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-[#2563EB]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold tracking-tight text-[#202124]">
                    STARSKY
                  </span>
                  <span className="text-[#E5E7EB]">•</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                    Student Profile Onboarding
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#202124] mt-0.5">
                  Build Your Student Research Profile
                </h1>
                <p className="text-xs text-[#666666] mt-0.5">
                  Complete the 6 steps below to connect with verified PhD scholars and apply for
                  research internships.
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="inline-block px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#2563EB]/30 text-xs font-bold text-[#2563EB]">
                Step {currentStep} of {STUDENT_STEPS.length} • {progressPercentage}%
              </span>
            </div>
          </div>

          {/* Progress Bar Track */}
          <div className="w-full h-2 bg-[#F7F8FA] rounded-full overflow-hidden border border-[#E5E7EB]">
            <div
              className="h-full bg-[#2563EB] transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Horizontal 6-Step Stepper */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1">
            {STUDENT_STEPS.map((step) => {
              const isCompleted =
                step.number < currentStep || step.number <= highestCompletedStep;
              const isActive = step.number === currentStep;

              return (
                <button
                  key={step.number}
                  type="button"
                  onClick={() => {
                    if (isCompleted || step.number <= currentStep) {
                      jumpToStep(step.number);
                    }
                  }}
                  disabled={!isCompleted && step.number > currentStep}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                    isActive
                      ? "bg-[#EFF6FF] border-[#2563EB] text-[#202124] shadow-2xs"
                      : isCompleted
                      ? "bg-white border-green-200 text-[#202124] hover:border-[#2563EB] cursor-pointer"
                      : "bg-[#F7F8FA] border-[#E5E7EB] text-[#666666] opacity-70 cursor-not-allowed"
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
                    {isCompleted && !isActive ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-bold truncate ${
                        isActive ? "text-[#2563EB]" : "text-[#202124]"
                      }`}
                    >
                      {step.shortLabel}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Toast & Global Error */}
        {draftSavedToast && (
          <div className="p-3.5 rounded-xl bg-green-50 border border-green-200 text-xs font-semibold text-green-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span>{draftSavedToast}</span>
          </div>
        )}

        {globalError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
            {globalError}
          </div>
        )}

        {/* ACTIVE STEP FORM CARD */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8 shadow-xs space-y-6">
          {/* STEP 1 — PERSONAL INFORMATION */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="border-b border-[#E5E7EB] pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                  Step 1 of 6
                </span>
                <h2 className="text-xl font-extrabold text-[#202124] mt-0.5">
                  Personal Information
                </h2>
                <p className="text-xs text-[#666666] mt-1">
                  Let&apos;s start with your basic personal details.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                    Full Name <span className="text-[#2563EB]">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g., Aarav Sharma"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm focus:outline-none focus:border-[#2563EB]"
                  />
                  {fieldErrors.fullName && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                    Email (Verified & Read-Only)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={session?.user.email || ""}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] bg-[#F7F8FA] text-sm text-[#666666]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InternationalPhoneInput
                  label="Phone Number"
                  required
                  value={phone}
                  onChange={(val) => {
                    setPhone(val);
                    if (fieldErrors.phone) {
                      setFieldErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.phone;
                        return copy;
                      });
                    }
                  }}
                  countryPreference={country || "India"}
                  error={fieldErrors.phone}
                />

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                    Gender (Optional)
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm bg-white focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
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
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm focus:outline-none focus:border-[#2563EB]"
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
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g., Karnataka"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm focus:outline-none focus:border-[#2563EB]"
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
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g., Bengaluru"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm focus:outline-none focus:border-[#2563EB]"
                  />
                  {fieldErrors.city && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.city}</p>
                  )}
                </div>
              </div>

              <FileUploadField
                label="Profile Photograph (Optional)"
                category="avatar"
                value={avatarUrl}
                onChange={setAvatarUrl}
              />
            </div>
          )}

          {/* STEP 2 — ACADEMIC INFORMATION */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="border-b border-[#E5E7EB] pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                  Step 2 of 6
                </span>
                <h2 className="text-xl font-extrabold text-[#202124] mt-0.5">
                  Academic Information
                </h2>
                <p className="text-xs text-[#666666] mt-1">
                  Provide your university, degree program, graduation year, and core academic
                  interests.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                    Current College / University <span className="text-[#2563EB]">*</span>
                  </label>
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g., National Institute of Technology Karnataka"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm focus:outline-none focus:border-[#2563EB]"
                  />
                  {fieldErrors.college && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.college}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                    Degree <span className="text-[#2563EB]">*</span>
                  </label>
                  <select
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm bg-white focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="B.Tech">B.Tech</option>
                    <option value="B.E.">B.E.</option>
                    <option value="B.Sc.">B.Sc.</option>
                    <option value="BCA">BCA</option>
                    <option value="M.Tech">M.Tech</option>
                    <option value="M.Sc.">M.Sc.</option>
                    <option value="MCA">MCA</option>
                    <option value="MBBS">MBBS</option>
                    <option value="Other">Other</option>
                  </select>
                  {fieldErrors.degree && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.degree}</p>
                  )}
                </div>
              </div>

              {/* Cascading Academic Domain & Specialization Selector */}
              <div>
                <CascadingAcademicSelector
                  label="Department / Academic Field"
                  domainId={domainId}
                  specializationId={specializationId}
                  currentDepartmentText={department}
                  domains={domains}
                  specializations={specializations}
                  error={fieldErrors.department}
                  onChange={(sel) => {
                    setDomainId(sel.domainId);
                    setSpecializationId(sel.specializationId);
                    setDepartment(sel.formattedDepartment);
                    if (fieldErrors.department) {
                      setFieldErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.department;
                        return copy;
                      });
                    }
                  }}
                  helperText="Click to select your parent academic domain and specialized subject track."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                    Current Year / Semester <span className="text-[#2563EB]">*</span>
                  </label>
                  <select
                    value={currentYearSemester}
                    onChange={(e) => setCurrentYearSemester(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm bg-white focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Final Year">Final Year</option>
                    <option value="Postgraduate">Postgraduate</option>
                    <option value="Other">Other</option>
                  </select>
                  {fieldErrors.currentYearSemester && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.currentYearSemester}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124]">
                      Graduation Year <span className="text-[#2563EB]">*</span>
                    </label>
                    <span className="text-[10px] font-medium text-[#666666]">
                      {currentYear - 10}–{currentYear + 50}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <select
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm bg-white focus:outline-none focus:border-[#2563EB]"
                    >
                      {filteredGradYears.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                    <div className="relative">
                      <Search className="w-3 h-3 text-[#666666] absolute left-2.5 top-2" />
                      <input
                        type="text"
                        value={gradYearSearch}
                        onChange={(e) => {
                          const val = e.target.value;
                          setGradYearSearch(val);
                          const exact = Number(val.trim());
                          if (availableGradYears.includes(exact)) {
                            setGraduationYear(exact);
                          }
                        }}
                        placeholder="Quick search year (e.g., 2028)..."
                        className="w-full pl-7 pr-2.5 py-1 rounded-md border border-[#E5E7EB] bg-[#F7F8FA] text-[11px] text-[#202124] focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>
                  </div>
                  {fieldErrors.graduationYear && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.graduationYear}</p>
                  )}
                </div>
              </div>

              <div>
                <TagInput
                  label="Academic Interests"
                  required
                  values={academicInterests}
                  onChange={setAcademicInterests}
                  suggestions={dynamicInterestSuggestions}
                />
                {fieldErrors.academicInterests && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.academicInterests}</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 3 — RESEARCH-RELATED INFORMATION (WITH OPTIONAL & REPEATABLE PROJECTS) */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="border-b border-[#E5E7EB] pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                  Step 3 of 6
                </span>
                <h2 className="text-xl font-extrabold text-[#202124] mt-0.5">
                  Research Interests & Experience
                </h2>
                <p className="text-xs text-[#666666] mt-1">
                  Select your preferred research domains and optionally add your academic or
                  technical projects.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-2">
                  Preferred Research Domains <span className="text-[#2563EB]">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {domainNamesList.map((domName) => {
                    const selected = preferredDomains.includes(domName);
                    return (
                      <button
                        key={domName}
                        type="button"
                        onClick={() => toggleDomain(domName)}
                        className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                          selected
                            ? "bg-[#EFF6FF] border-[#2563EB] text-[#2563EB] font-semibold"
                            : "bg-white border-[#E5E7EB] text-[#666666] hover:border-[#202124]"
                        }`}
                      >
                        {selected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>{domName}</span>
                      </button>
                    );
                  })}
                </div>
                {fieldErrors.preferredDomains && (
                  <p className="text-xs text-red-600 mt-1.5">{fieldErrors.preferredDomains}</p>
                )}
              </div>

              {/* Dynamic Optional & Repeatable Projects Section */}
              <div className="space-y-4 pt-2 border-t border-[#E5E7EB]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124]">
                      Previous Projects{" "}
                      <span className="text-[#666666] font-normal">(Optional)</span>
                    </label>
                    <p className="text-xs text-[#666666] mt-0.5">
                      Have you worked on academic, research, or personal projects? Add as many as
                      you like, or skip this section if you haven&apos;t completed any yet.
                    </p>
                  </div>
                  {projects.length === 0 && (
                    <button
                      type="button"
                      onClick={handleAddProject}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#EFF6FF] border border-[#2563EB]/30 text-xs font-bold text-[#2563EB] hover:bg-[#2563EB] hover:text-white transition-colors shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Project</span>
                    </button>
                  )}
                </div>

                {projects.length === 0 ? (
                  <div className="p-6 rounded-xl bg-[#F7F8FA] border border-dashed border-[#D1D5DB] text-center space-y-2.5">
                    <FolderGit2 className="w-7 h-7 text-[#2563EB] mx-auto" />
                    <p className="text-xs font-semibold text-[#202124]">
                      No projects added yet (Optional)
                    </p>
                    <p className="text-[11px] text-[#666666] max-w-md mx-auto">
                      You can proceed directly to the next step without adding projects, or click
                      below to showcase your work.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddProject}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-[#E5E7EB] text-xs font-bold text-[#2563EB] hover:border-[#2563EB] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Another Project</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projects.map((proj, idx) => (
                      <div
                        key={proj.id || idx}
                        className="p-5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] space-y-4"
                      >
                        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#EFF6FF] border border-[#2563EB]/30 text-xs font-bold text-[#2563EB]">
                            Project {idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveProject(idx)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove Project</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-[#202124] mb-1">
                              Project Title <span className="text-[#2563EB]">*</span>
                            </label>
                            <input
                              type="text"
                              value={proj.title}
                              onChange={(e) =>
                                handleUpdateProject(idx, "title", e.target.value)
                              }
                              placeholder="e.g., Chest X-Ray Pneumonia Classification using Vision Transformers"
                              className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB] bg-white text-xs focus:outline-none focus:border-[#2563EB]"
                            />
                            {fieldErrors[`proj_title_${idx}`] && (
                              <p className="text-xs text-red-600 mt-1">
                                {fieldErrors[`proj_title_${idx}`]}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#202124] mb-1">
                              Project Duration{" "}
                              <span className="text-[#666666] font-normal">(Optional)</span>
                            </label>
                            <input
                              type="text"
                              value={proj.duration}
                              onChange={(e) =>
                                handleUpdateProject(idx, "duration", e.target.value)
                              }
                              placeholder="e.g., 3 Months / Jan–Apr 2026"
                              className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB] bg-white text-xs focus:outline-none focus:border-[#2563EB]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#202124] mb-1">
                            Project Description <span className="text-[#2563EB]">*</span>
                          </label>
                          <textarea
                            rows={3}
                            value={proj.description}
                            onChange={(e) =>
                              handleUpdateProject(idx, "description", e.target.value)
                            }
                            placeholder="Describe the problem statement, methodology, dataset, and key results..."
                            className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB] bg-white text-xs focus:outline-none focus:border-[#2563EB]"
                          />
                          {fieldErrors[`proj_desc_${idx}`] && (
                            <p className="text-xs text-red-600 mt-1">
                              {fieldErrors[`proj_desc_${idx}`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#202124] mb-1">
                            Technologies / Tools Used
                          </label>
                          <input
                            type="text"
                            value={proj.technologies}
                            onChange={(e) =>
                              handleUpdateProject(idx, "technologies", e.target.value)
                            }
                            placeholder="e.g., Python, PyTorch, OpenCV, Docker"
                            className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB] bg-white text-xs focus:outline-none focus:border-[#2563EB]"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-[#202124] mb-1">
                              Project Link{" "}
                              <span className="text-[#666666] font-normal">(Optional)</span>
                            </label>
                            <input
                              type="url"
                              value={proj.project_url}
                              onChange={(e) =>
                                handleUpdateProject(idx, "project_url", e.target.value)
                              }
                              placeholder="https://yourprojectdemo.com"
                              className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB] bg-white text-xs focus:outline-none focus:border-[#2563EB]"
                            />
                            {fieldErrors[`proj_url_${idx}`] && (
                              <p className="text-xs text-red-600 mt-1">
                                {fieldErrors[`proj_url_${idx}`]}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#202124] mb-1">
                              GitHub Repository{" "}
                              <span className="text-[#666666] font-normal">(Optional)</span>
                            </label>
                            <input
                              type="url"
                              value={proj.github_url}
                              onChange={(e) =>
                                handleUpdateProject(idx, "github_url", e.target.value)
                              }
                              placeholder="https://github.com/username/repo"
                              className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB] bg-white text-xs focus:outline-none focus:border-[#2563EB]"
                            />
                            {fieldErrors[`proj_github_${idx}`] && (
                              <p className="text-xs text-red-600 mt-1">
                                {fieldErrors[`proj_github_${idx}`]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddProject}
                      className="w-full py-3 rounded-xl border border-dashed border-[#2563EB] bg-[#EFF6FF]/60 hover:bg-[#EFF6FF] text-xs font-bold text-[#2563EB] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Add Another Project</span>
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                  Prior Research Experience (Optional)
                </label>
                <textarea
                  rows={4}
                  value={researchExperience}
                  onChange={(e) => setResearchExperience(e.target.value)}
                  placeholder="Describe any prior research internships, lab work, paper implementations, or fellowships..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>
          )}

          {/* STEP 4 — TECHNICAL SKILLS & CERTIFICATIONS */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="border-b border-[#E5E7EB] pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                  Step 4 of 6
                </span>
                <h2 className="text-xl font-extrabold text-[#202124] mt-0.5">
                  Skills & Certifications
                </h2>
                <p className="text-xs text-[#666666] mt-1">
                  Add your technical skills, programming languages, and academic certifications.
                </p>
              </div>

              <div>
                <TagInput
                  label="1. Technical & Research Skills"
                  required
                  values={skills}
                  onChange={setSkills}
                  suggestions={[
                    "Python",
                    "Machine Learning",
                    "Deep Learning",
                    "Research Writing",
                    "Data Analysis",
                    "PyTorch",
                    "TensorFlow",
                    "Computer Vision",
                    "Statistics",
                    "LaTeX",
                  ]}
                />
                {fieldErrors.skills && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.skills}</p>
                )}
              </div>

              <TagInput
                label="2. Programming Languages (Optional)"
                values={programmingLanguages}
                onChange={setProgrammingLanguages}
                suggestions={[
                  "C",
                  "C++",
                  "Python",
                  "Java",
                  "JavaScript",
                  "R",
                  "MATLAB",
                  "SQL",
                  "Julia",
                ]}
              />

              <TagInput
                label="3. Certifications (Optional)"
                values={certifications}
                onChange={setCertifications}
                suggestions={[
                  "NPTEL",
                  "Deep Learning Specialization",
                  "Coursera Research Methods",
                  "AWS Certifications",
                ]}
              />
            </div>
          )}

          {/* STEP 5 — DOCUMENTS & PROFESSIONAL LINKS */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="border-b border-[#E5E7EB] pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                  Step 5 of 6
                </span>
                <h2 className="text-xl font-extrabold text-[#202124] mt-0.5">
                  Documents & Professional Links
                </h2>
                <p className="text-xs text-[#666666] mt-1">
                  Upload your academic Resume/CV (PDF) and add your professional portfolio links.
                </p>
              </div>

              <div>
                <FileUploadField
                  label="Upload Resume / CV (PDF) *"
                  category="document"
                  value={resumeUrl}
                  onChange={setResumeUrl}
                  helperText="PDF format only (Max file size: 10 MB)"
                />
                {fieldErrors.resumeUrl && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.resumeUrl}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm focus:outline-none focus:border-[#2563EB]"
                  />
                  {fieldErrors.linkedinUrl && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.linkedinUrl}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                    GitHub Profile URL
                  </label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm focus:outline-none focus:border-[#2563EB]"
                  />
                  {fieldErrors.githubUrl && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.githubUrl}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                    Personal Portfolio URL
                  </label>
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://yourportfolio.dev"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm focus:outline-none focus:border-[#2563EB]"
                  />
                  {fieldErrors.portfolioUrl && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.portfolioUrl}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6 — REVIEW & SUBMIT */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="border-b border-[#E5E7EB] pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                  Step 6 of 6
                </span>
                <h2 className="text-xl font-extrabold text-[#202124] mt-0.5">
                  Review Your Student Profile
                </h2>
                <p className="text-xs text-[#666666] mt-1">
                  Verify all details below before completing your student profile. Click Edit on
                  any section to make adjustments.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Card 1: Personal Information */}
                <div className="p-5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2.5">
                    <h3 className="text-sm font-bold text-[#202124]">1. Personal Information</h3>
                    <button
                      type="button"
                      onClick={() => jumpToStep(1)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white border border-[#E5E7EB] text-[#2563EB] font-semibold hover:border-[#2563EB]"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-[#666666] block">Full Name</span>
                      <strong className="text-[#202124]">{fullName}</strong>
                    </div>
                    <div>
                      <span className="text-[#666666] block">Email</span>
                      <strong className="text-[#202124]">{session?.user.email}</strong>
                    </div>
                    <div>
                      <span className="text-[#666666] block">Phone & Gender</span>
                      <strong className="text-[#202124]">
                        {phone} ({gender})
                      </strong>
                    </div>
                    <div className="sm:col-span-3">
                      <span className="text-[#666666] block">Location</span>
                      <strong className="text-[#202124]">
                        {city}, {state}, {country}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Card 2: Academic Information */}
                <div className="p-5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2.5">
                    <h3 className="text-sm font-bold text-[#202124]">2. Academic Information</h3>
                    <button
                      type="button"
                      onClick={() => jumpToStep(2)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white border border-[#E5E7EB] text-[#2563EB] font-semibold hover:border-[#2563EB]"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[#666666] block">College / University</span>
                      <strong className="text-[#202124]">{college}</strong>
                    </div>
                    <div>
                      <span className="text-[#666666] block">Degree & Academic Department</span>
                      <strong className="text-[#202124]">
                        {degree} — {department}
                      </strong>
                    </div>
                    {domainId && (
                      <div>
                        <span className="text-[#666666] block">Parent Academic Domain</span>
                        <strong className="text-[#2563EB]">
                          {domains.find((d) => d.id === domainId)?.name || domainId}
                        </strong>
                      </div>
                    )}
                    {specializationId && (
                      <div>
                        <span className="text-[#666666] block">Specialization Track</span>
                        <strong className="text-[#202124]">
                          {specializations.find((s) => s.id === specializationId)?.name || specializationId}
                        </strong>
                      </div>
                    )}
                    <div>
                      <span className="text-[#666666] block">Current Year & Graduation</span>
                      <strong className="text-[#202124]">
                        {currentYearSemester} • Class of {graduationYear}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#666666] block">Academic Interests</span>
                      <strong className="text-[#202124]">
                        {academicInterests.join(", ") || "None specified"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Card 3: Research Information & Projects */}
                <div className="p-5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2.5">
                    <h3 className="text-sm font-bold text-[#202124]">
                      3. Research Information & Projects
                    </h3>
                    <button
                      type="button"
                      onClick={() => jumpToStep(3)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white border border-[#E5E7EB] text-[#2563EB] font-semibold hover:border-[#2563EB]"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[#666666] block">Preferred Research Domains</span>
                      <strong className="text-[#202124]">{preferredDomains.join(", ")}</strong>
                    </div>
                    <div>
                      <span className="text-[#666666] block mb-1.5">
                        Projects ({projects.length})
                      </span>
                      {projects.length === 0 ? (
                        <p className="text-[#666666] italic">No projects added (Optional)</p>
                      ) : (
                        <div className="space-y-2">
                          {projects.map((p, idx) => (
                            <div
                              key={p.id || idx}
                              className="p-3 rounded-lg bg-white border border-[#E5E7EB] space-y-1"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <strong className="text-[#202124]">
                                  Project {idx + 1}: {p.title}
                                </strong>
                                {p.duration && (
                                  <span className="text-[11px] text-[#2563EB] font-semibold">
                                    {p.duration}
                                  </span>
                                )}
                              </div>
                              <p className="text-[#666666]">{p.description}</p>
                              {p.technologies && (
                                <p className="text-[11px] text-[#202124]">
                                  <strong>Technologies:</strong> {p.technologies}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-3 pt-1">
                                {p.project_url && (
                                  <a
                                    href={p.project_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[#2563EB] hover:underline inline-flex items-center gap-1"
                                  >
                                    Project Link <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                                {p.github_url && (
                                  <a
                                    href={p.github_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[#202124] hover:underline inline-flex items-center gap-1"
                                  >
                                    GitHub Repo <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {researchExperience && (
                      <div>
                        <span className="text-[#666666] block">Prior Research Experience</span>
                        <p className="text-[#202124] whitespace-pre-line mt-0.5">
                          {researchExperience}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card 4: Skills & Certifications */}
                <div className="p-5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2.5">
                    <h3 className="text-sm font-bold text-[#202124]">
                      4. Skills & Certifications
                    </h3>
                    <button
                      type="button"
                      onClick={() => jumpToStep(4)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white border border-[#E5E7EB] text-[#2563EB] font-semibold hover:border-[#2563EB]"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-[#666666] block">Technical & Research Skills</span>
                      <strong className="text-[#202124]">{skills.join(", ")}</strong>
                    </div>
                    <div>
                      <span className="text-[#666666] block">Programming Languages</span>
                      <strong className="text-[#202124]">
                        {programmingLanguages.join(", ") || "None specified"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#666666] block">Certifications</span>
                      <strong className="text-[#202124]">
                        {certifications.join(", ") || "None specified"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Card 5: Documents & Links */}
                <div className="p-5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2.5">
                    <h3 className="text-sm font-bold text-[#202124]">5. Documents & Links</h3>
                    <button
                      type="button"
                      onClick={() => jumpToStep(5)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white border border-[#E5E7EB] text-[#2563EB] font-semibold hover:border-[#2563EB]"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#2563EB]" />
                      <div>
                        <span className="text-[#666666] block">Resume / CV PDF</span>
                        <strong className="text-[#202124]">
                          {resumeUrl ? resumeUrl.split("/").pop() : "Not uploaded"}
                        </strong>
                      </div>
                    </div>
                    <div>
                      <span className="text-[#666666] block">Professional Links</span>
                      <div className="space-y-0.5 text-[#202124]">
                        {linkedinUrl && <p className="truncate">LinkedIn: {linkedinUrl}</p>}
                        {githubUrl && <p className="truncate">GitHub: {githubUrl}</p>}
                        {portfolioUrl && <p className="truncate">Portfolio: {portfolioUrl}</p>}
                        {!linkedinUrl && !githubUrl && !portfolioUrl && (
                          <p className="text-[#666666]">No external links provided</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirmation Checkbox */}
              <label className="flex items-center gap-3 p-4 rounded-xl bg-[#EFF6FF] border border-[#2563EB]/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmedAccurate}
                  onChange={(e) => setConfirmedAccurate(e.target.checked)}
                  className="w-4 h-4 accent-[#2563EB]"
                />
                <span className="text-xs sm:text-sm font-semibold text-[#202124]">
                  I confirm that the information provided above is accurate.
                </span>
              </label>
            </div>
          )}

          {/* STEP FOOTER NAVIGATION BAR */}
          <div className="pt-6 border-t border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#D1D5DB] bg-white text-xs sm:text-sm font-semibold text-[#202124] hover:border-[#202124] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={savingDraft}
                onClick={() => persistDraftToServer(currentStep, true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] text-xs sm:text-sm font-semibold text-[#202124] hover:border-[#2563EB] hover:text-[#2563EB] transition-colors disabled:opacity-60"
              >
                {savingDraft ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" />
                ) : (
                  <Save className="w-4 h-4 text-[#2563EB]" />
                )}
                <span>Save as Draft</span>
              </button>

              {currentStep < 6 ? (
                <button
                  type="button"
                  onClick={handleSaveAndContinue}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs sm:text-sm font-semibold hover:bg-[#1D4ED8] transition-colors shadow-xs"
                >
                  <span>Save & Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleFinalSubmit}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#2563EB] text-white text-xs sm:text-sm font-bold hover:bg-[#1D4ED8] transition-colors shadow-sm disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Profile...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Student Profile</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
