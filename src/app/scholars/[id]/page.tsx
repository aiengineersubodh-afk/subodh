"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Award,
  Bookmark,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Crown,
  FileText,
  FlaskConical,
  Globe,
  GraduationCap,
  Loader2,
  Lock,
  MapPin,
  MessageSquare,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  EnrichedApplication,
  EnrichedScholar,
  Internship,
  LockedScholarPreview,
  ScholarContactRequest,
} from "@/types/database";
import { useAuth } from "@/context/AuthContext";
import { TagInput } from "@/components/TagInput";
import { FileUploadField } from "@/components/FileUploadField";
import PremiumUpgradeModal from "@/components/PremiumUpgradeModal";
import {
  InternshipApplicationAction,
  ViewApplicationModal,
  getApplicationBadgeLabel,
} from "@/components/ApplicationStatusModal";

export default function ScholarProfileDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const scholarId = String(params.id || "");
  const preselectedInternshipId = searchParams.get("apply") || "";
  const openContactParam = searchParams.get("contact") === "true";

  const { session, refreshSession } = useAuth();
  const [data, setData] = useState<EnrichedScholar | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  // Premium & Direct Contact State
  const [isPremiumUnlocked, setIsPremiumUnlocked] = useState<boolean>(false);
  const [requiresPremiumProfile, setRequiresPremiumProfile] =
    useState<boolean>(false);
  const [lockedPreview, setLockedPreview] =
    useState<LockedScholarPreview | null>(null);
  const [premiumModalOpen, setPremiumModalOpen] = useState<boolean>(false);
  const [premiumModalContext, setPremiumModalContext] = useState<string>("");

  const [contactModalOpen, setContactModalOpen] = useState<boolean>(false);
  const [contactSubject, setContactSubject] = useState<string>("");
  const [contactTopic, setContactTopic] = useState<string>("");
  const [contactMessage, setContactMessage] = useState<string>("");
  const [contactSubmitting, setContactSubmitting] = useState<boolean>(false);
  const [contactFeedback, setContactFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [pastContactRequests, setPastContactRequests] = useState<
    ScholarContactRequest[]
  >([]);

  // Application Modal State & Student Application Map
  const [studentApplications, setStudentApplications] = useState<
    Record<string, EnrichedApplication>
  >({});
  const [viewingApplication, setViewingApplication] =
    useState<EnrichedApplication | null>(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [reviewStep, setReviewStep] = useState(false);
  const [selectedInternship, setSelectedInternship] =
    useState<Internship | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Form Fields
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [college, setCollege] = useState("");
  const [degree, setDegree] = useState("");
  const [department, setDepartment] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [researchInterests, setResearchInterests] = useState<string[]>([]);
  const [technicalSkills, setTechnicalSkills] = useState<string[]>([]);
  const [sop, setSop] = useState("");
  const [relevantExp, setRelevantExp] = useState("");
  const [availability, setAvailability] = useState("20-25 hours/week");
  const [preferredDuration, setPreferredDuration] = useState("8-12 Weeks");
  const [resumeUrl, setResumeUrl] = useState(
    "/sample-documents/student-cv.pdf"
  );
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [additionalMessage, setAdditionalMessage] = useState("");

  useEffect(() => {
    if (!scholarId) return;
    setLoading(true);
    fetch(
      `/api/public?scholarId=${encodeURIComponent(scholarId)}&incrementView=true`,
      { cache: "no-store" }
    )
      .then(async (r) => {
        const res = await r.json();
        if (r.status === 403 && res.requiresPremium) {
          setRequiresPremiumProfile(true);
          setLockedPreview(res.lockedPreview || null);
          setIsPremiumUnlocked(false);
          setPremiumModalContext("Unlock PhD Scholar Profile");
          setPremiumModalOpen(true);
          return;
        }
        setRequiresPremiumProfile(false);
        setIsPremiumUnlocked(Boolean(res.isPremiumUnlocked));
        const appMap: Record<string, EnrichedApplication> =
          res.studentApplications || {};
        setStudentApplications(appMap);
        if (res.scholar) {
          setData(res.scholar);
          setContactTopic(res.scholar.scholar.specialization || "");
          const ints: Internship[] = res.scholar.internships || [];
          if (preselectedInternshipId) {
            const match = ints.find((i) => i.id === preselectedInternshipId);
            const existingApp = appMap[preselectedInternshipId];
            if (
              existingApp &&
              existingApp.application.status !== "Withdrawn"
            ) {
              setViewingApplication(existingApp);
              if (match) {
                setSelectedInternship(match);
                setPreferredDuration(match.duration);
              }
            } else if (match) {
              setSelectedInternship(match);
              setPreferredDuration(match.duration);
              setApplyModalOpen(true);
            }
          } else if (ints.length > 0) {
            const firstUnapplied =
              ints.find(
                (i) =>
                  !appMap[i.id] ||
                  appMap[i.id].application.status === "Withdrawn"
              ) || ints[0];
            setSelectedInternship(firstUnapplied);
            setPreferredDuration(firstUnapplied.duration);
          }

          if (openContactParam) {
            if (res.isPremiumUnlocked) {
              setContactModalOpen(true);
            } else {
              setPremiumModalContext(
                `Direct Scholar Contact with ${res.scholar.profile.full_name}`
              );
              setPremiumModalOpen(true);
            }
          }
        }
      })
      .finally(() => setLoading(false));

    fetch("/api/saved-scholars")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.savedScholarIds)) {
          setIsSaved(d.savedScholarIds.includes(scholarId));
        }
      })
      .catch(() => {});
  }, [
    scholarId,
    preselectedInternshipId,
    openContactParam,
    session?.user?.id,
    session?.hasPremiumAccess,
  ]);

  useEffect(() => {
    if (!session || !scholarId || !isPremiumUnlocked) return;
    fetch(`/api/scholar-contact?scholarId=${encodeURIComponent(scholarId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.contactRequests)) {
          setPastContactRequests(d.contactRequests);
        }
      })
      .catch(() => {});
  }, [session, scholarId, isPremiumUnlocked]);

  // Pre-populate application form from logged-in student profile
  useEffect(() => {
    if (session?.user) {
      setStudentName(session.user.full_name || "");
      setStudentEmail(session.user.email || "");
      setStudentPhone(session.user.phone || "");
      if (session.studentProfile) {
        const sp = session.studentProfile;
        setCollege(sp.college_university || "");
        setDegree(sp.degree || "");
        setDepartment(sp.department || "");
        setAcademicYear(sp.current_year_semester || "");
        setResearchInterests(sp.academic_interests || []);
        setTechnicalSkills(sp.skills || []);
        setRelevantExp(sp.research_experience || sp.previous_projects || "");
        setResumeUrl(sp.resume_url || "/sample-documents/student-cv.pdf");
        setPortfolioUrl(sp.portfolio_url || "");
        setLinkedinUrl(sp.linkedin_url || "");
      }
    }
  }, [session]);

  const handleOpenContactScholar = () => {
    if (!isPremiumUnlocked) {
      setPremiumModalContext(
        `Direct Scholar Contact${data ? ` with ${data.profile.full_name}` : ""}`
      );
      setPremiumModalOpen(true);
      return;
    }
    setContactFeedback(null);
    setContactModalOpen(true);
  };

  const handleSendDirectContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setContactSubmitting(true);
    setContactFeedback(null);

    try {
      const res = await fetch("/api/scholar-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scholarId: data.scholar.id,
          subject: contactSubject,
          researchInterestTopic: contactTopic,
          message: contactMessage,
        }),
      });
      const resJson = await res.json();
      if (!res.ok) {
        if (resJson.requiresPremium) {
          setContactModalOpen(false);
          setPremiumModalContext(
            `Direct Scholar Contact with ${data.profile.full_name}`
          );
          setPremiumModalOpen(true);
          return;
        }
        setContactFeedback({
          type: "error",
          text: resJson.error || "Unable to send message.",
        });
      } else {
        setContactFeedback({
          type: "success",
          text:
            resJson.message ||
            "Your academic inquiry has been delivered to the PhD scholar.",
        });
        setContactSubject("");
        setContactMessage("");
        if (resJson.contactRequest) {
          setPastContactRequests((prev) => [resJson.contactRequest, ...prev]);
        }
      }
    } catch {
      setContactFeedback({
        type: "error",
        text: "Network error while sending direct message.",
      });
    } finally {
      setContactSubmitting(false);
    }
  };

  const openApplyForInternship = (internship?: Internship) => {
    if (!session) {
      window.location.href = `/login`;
      return;
    }
    if (session.user.role !== "student") {
      alert(
        "Only registered Student accounts can submit internship applications."
      );
      return;
    }
    const ints = data?.internships || [];
    const target =
      internship ||
      ints.find(
        (i) =>
          !studentApplications[i.id] ||
          studentApplications[i.id].application.status === "Withdrawn"
      ) ||
      ints[0] ||
      null;

    if (target) {
      const existing = studentApplications[target.id];
      if (existing && existing.application.status !== "Withdrawn") {
        setViewingApplication(existing);
        return;
      }
      setSelectedInternship(target);
      setPreferredDuration(target.duration);
    }
    setSubmitError("");
    setSubmitSuccess(false);
    setReviewStep(false);
    setApplyModalOpen(true);
  };

  const handleToggleSave = async () => {
    if (!session || session.user.role !== "student") {
      window.location.href = "/login";
      return;
    }
    const res = await fetch("/api/saved-scholars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scholarProfileId: scholarId }),
    });
    const resData = await res.json();
    if (res.ok) {
      setIsSaved(Boolean(resData.saved));
    }
  };

  const handleReviewApplication = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (!selectedInternship) {
      setSubmitError("Please select an open internship position.");
      return;
    }
    const existing = studentApplications[selectedInternship.id];
    if (existing && existing.application.status !== "Withdrawn") {
      setSubmitError(
        `You have already applied for this internship (Current Status: ${getApplicationBadgeLabel(
          existing.application.status
        )}).`
      );
      return;
    }
    if (sop.trim().length < 30) {
      setSubmitError(
        "Please provide at least 30 characters explaining why you want to join this research internship."
      );
      return;
    }
    if (researchInterests.length === 0 || technicalSkills.length === 0) {
      setSubmitError(
        "Please add at least one research interest and one technical skill."
      );
      return;
    }
    setReviewStep(true);
  };

  const handleFinalSubmit = async () => {
    if (!selectedInternship || !data) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          internship_id: selectedInternship.id,
          scholar_profile_id: data.scholar.id,
          student_full_name: studentName,
          student_email: studentEmail,
          student_phone: studentPhone,
          college_university: college,
          degree,
          department,
          current_academic_year: academicYear,
          research_interests: researchInterests,
          technical_skills: technicalSkills,
          statement_of_purpose: sop,
          relevant_experience: relevantExp,
          expected_availability: availability,
          preferred_duration: preferredDuration,
          resume_url: resumeUrl,
          portfolio_url: portfolioUrl,
          linkedin_url: linkedinUrl,
          additional_message: additionalMessage,
        }),
      });
      const resJson = await res.json();
      if (!res.ok) {
        setSubmitError(resJson.error || "Failed to submit application.");
        setReviewStep(false);
      } else {
        if (resJson.enrichedApplication) {
          setStudentApplications((prev) => ({
            ...prev,
            [selectedInternship.id]: resJson.enrichedApplication,
          }));
        }
        setSubmitSuccess(true);
        await refreshSession();
      }
    } catch {
      setSubmitError("Network error while submitting application.");
      setReviewStep(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-[#666666]">
        Loading PhD Scholar profile...
      </div>
    );
  }

  if (requiresPremiumProfile) {
    return (
      <div className="bg-[#F7F8FA] min-h-screen py-14 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-[#E5E7EB] p-8 sm:p-10 text-center shadow-xs space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-[#EFF6FF] border border-[#2563EB]/30 text-[#2563EB] flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] text-xs font-bold uppercase tracking-wider text-[#2563EB]">
            <Crown className="w-3.5 h-3.5" />
            STARSKY Premium Scholar Profile
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202124]">
            Unlock More Research Opportunities
          </h1>

          {lockedPreview && (
            <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] text-left space-y-1">
              <p className="text-xs font-bold text-[#2563EB] uppercase tracking-wider">
                {lockedPreview.research_field} → {lockedPreview.specialization}
              </p>
              <p className="text-sm font-bold text-[#202124]">
                {lockedPreview.university_institution}
              </p>
              <p className="text-xs text-[#666666]">
                {lockedPreview.department}
              </p>
            </div>
          )}

          <p className="text-sm text-[#666666] leading-relaxed">
            Free student accounts can preview the first 5 verified PhD scholar
            profiles. Upgrade to STARSKY Premium to unlock the complete PhD
            scholar directory, view full academic profiles, and contact
            researchers directly.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/explore?tab=scholars"
              className="px-5 py-3 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#202124] hover:bg-[#F7F8FA]"
            >
              ← Back to Scholar Directory
            </Link>
            <button
              type="button"
              onClick={() => setPremiumModalOpen(true)}
              className="px-6 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs"
            >
              <Crown className="w-4 h-4" />
              <span>Upgrade to Premium</span>
            </button>
          </div>
        </div>

        <PremiumUpgradeModal
          isOpen={premiumModalOpen}
          onClose={() => setPremiumModalOpen(false)}
          contextTitle={premiumModalContext}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold text-[#202124]">
          PhD Scholar Profile Not Found
        </h1>
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Explore Directory
        </Link>
      </div>
    );
  }

  const { scholar, profile, publications, projects, internships } = data;
  const unappliedInternships = internships.filter(
    (i) =>
      !studentApplications[i.id] ||
      studentApplications[i.id].application.status === "Withdrawn"
  );

  return (
    <div className="bg-[#F7F8FA] min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/explore?tab=scholars"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#666666] hover:text-[#2563EB]"
          >
            <ArrowLeft className="w-4 h-4" /> Back to PhD Scholar Directory
          </Link>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-7 sm:p-9 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border border-[#E5E7EB] shrink-0"
              />
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202124]">
                    {profile.full_name}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#EFF6FF] border border-[#2563EB]/30 text-xs font-semibold text-[#2563EB]">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified PhD Scholar
                  </span>
                </div>

                <p className="text-sm font-bold text-[#202124] flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#2563EB] shrink-0" />
                  <span>{scholar.university_institution}</span>
                </p>

                <p className="text-xs text-[#666666]">{scholar.department}</p>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-[#666666]">
                  <span className="px-2.5 py-1 rounded-md bg-[#F7F8FA] border border-[#E5E7EB] font-semibold text-[#202124]">
                    {scholar.research_field} → {scholar.specialization}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
                    {profile.city}, {profile.state}, {profile.country}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
                    PhD Cohort: {scholar.enrollment_year} –{" "}
                    {scholar.expected_completion_year}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Save Scholar, Contact Scholar (Premium-gated), Apply for Internship */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleToggleSave}
                className={`px-4 py-3 rounded-xl border text-xs font-semibold inline-flex items-center gap-2 transition-colors ${
                  isSaved
                    ? "bg-[#EFF6FF] border-[#2563EB] text-[#2563EB]"
                    : "bg-white border-[#E5E7EB] text-[#202124] hover:border-[#202124]"
                }`}
              >
                <Bookmark
                  className={`w-4 h-4 ${isSaved ? "fill-[#2563EB]" : ""}`}
                />
                <span>{isSaved ? "Saved Scholar" : "Save Scholar"}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenContactScholar}
                className={`px-4 py-3 rounded-xl border text-xs font-bold inline-flex items-center gap-2 transition-colors ${
                  isPremiumUnlocked
                    ? "bg-[#202124] border-[#202124] text-white hover:bg-black"
                    : "bg-[#EFF6FF] border-[#2563EB]/40 text-[#2563EB] hover:bg-[#2563EB] hover:text-white"
                }`}
              >
                {isPremiumUnlocked ? (
                  <MessageSquare className="w-4 h-4" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                <span>Contact Scholar</span>
              </button>

              {internships.length > 0 && unappliedInternships.length === 0 ? (
                <InternshipApplicationAction
                  existingApplication={studentApplications[internships[0].id]}
                  checkingStatus={loading}
                  onViewApplication={(app) => setViewingApplication(app)}
                />
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    openApplyForInternship(
                      unappliedInternships[0] || internships[0]
                    )
                  }
                  disabled={internships.length === 0}
                  className="px-6 py-3.5 rounded-xl bg-[#2563EB] text-white text-sm font-bold hover:bg-[#1D4ED8] transition-colors shadow-sm inline-flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>Apply for Internship</span>
                </button>
              )}
            </div>
          </div>

          {/* Current Doctoral Research Topic Highlight */}
          <div className="mt-7 p-5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB]">
              Current Doctoral Research Topic
            </span>
            <p className="text-base font-bold text-[#202124] mt-1">
              {scholar.current_research_topic}
            </p>
          </div>
        </div>

        {/* Main 2-Column Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left 8 Columns: Bio, Education, Internships, Publications, Projects */}
          <div className="lg:col-span-8 space-y-6">
            {/* Biography & Education */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-7 space-y-5">
              <div>
                <h2 className="text-base font-bold text-[#202124]">
                  Academic Biography
                </h2>
                <p className="text-sm text-[#666666] mt-2 leading-relaxed whitespace-pre-line">
                  {scholar.biography}
                </p>
              </div>

              {scholar.education_summary && (
                <div className="pt-4 border-t border-[#E5E7EB]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#202124] flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-[#2563EB]" />{" "}
                    Education & Academic Lineage
                  </h3>
                  <p className="text-xs text-[#666666] mt-1.5 leading-relaxed">
                    {scholar.education_summary}
                  </p>
                </div>
              )}
            </div>

            {/* Available Research Internships */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-7 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#202124] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#2563EB]" />
                  <span>
                    Available Research Internships ({internships.length})
                  </span>
                </h2>
              </div>

              {internships.length === 0 ? (
                <p className="text-xs text-[#666666]">
                  No open internship listings published right now.
                </p>
              ) : (
                <div className="space-y-4">
                  {internships.map((internship) => {
                    const existingApp = studentApplications[internship.id];
                    return (
                      <div
                        key={internship.id}
                        className="p-5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] space-y-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded bg-white border border-[#E5E7EB] text-[11px] font-semibold text-[#202124]">
                                {internship.mode}
                              </span>
                              <span className="px-2.5 py-0.5 rounded bg-green-50 border border-green-200 text-[11px] font-semibold text-green-700">
                                {internship.available_positions} Positions Open
                              </span>
                            </div>
                            <Link
                              href={`/internships/${internship.id}`}
                              className="block text-base font-bold text-[#202124] hover:text-[#2563EB] transition-colors mt-2"
                            >
                              {internship.title}
                            </Link>
                          </div>

                          <InternshipApplicationAction
                            existingApplication={existingApp}
                            checkingStatus={loading}
                            onApply={() => openApplyForInternship(internship)}
                            onViewApplication={(app) =>
                              setViewingApplication(app)
                            }
                          />
                        </div>

                        <p className="text-xs text-[#666666] leading-relaxed">
                          {internship.description}
                        </p>

                        <div className="text-xs text-[#666666]">
                          <strong className="text-[#202124]">
                            Eligibility:
                          </strong>{" "}
                          {internship.eligibility_criteria}
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {internship.required_skills.map((sk) => (
                            <span
                              key={sk}
                              className="px-2 py-0.5 rounded bg-white border border-[#E5E7EB] text-[11px] text-[#202124]"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>

                        <div className="pt-3 border-t border-[#E5E7EB] flex flex-wrap items-center justify-between gap-4 text-xs text-[#666666]">
                          <div className="flex flex-wrap items-center gap-5">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                              Duration:{" "}
                              <strong className="text-[#202124]">
                                {internship.duration}
                              </strong>
                            </span>
                            <span>
                              Stipend:{" "}
                              <strong className="text-[#202124]">
                                {internship.stipend || "Academic Credit"}
                              </strong>
                            </span>
                            <span>
                              Apply Before:{" "}
                              <strong className="text-[#202124]">
                                {internship.application_deadline}
                              </strong>
                            </span>
                          </div>
                          <Link
                            href={`/internships/${internship.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline"
                          >
                            <span>View Position Details</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Publications */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-7 space-y-4">
              <h2 className="text-base font-bold text-[#202124] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#2563EB]" />
                <span>
                  Publications & Research Papers ({publications.length})
                </span>
              </h2>

              {publications.length === 0 ? (
                <p className="text-xs text-[#666666]">
                  No publications listed yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {publications.map((pub) => (
                    <div
                      key={pub.id}
                      className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm font-bold text-[#202124]">
                          {pub.title}
                        </h3>
                        <span className="px-2 py-0.5 rounded bg-white border border-[#E5E7EB] text-[11px] font-bold text-[#2563EB] shrink-0">
                          {pub.publication_year}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-[#202124]">
                        {pub.journal_conference}
                      </p>
                      {pub.co_authors && (
                        <p className="text-[11px] text-[#666666]">
                          Authors: {pub.co_authors}
                        </p>
                      )}
                      {pub.abstract && (
                        <p className="text-xs text-[#666666] pt-1 leading-relaxed">
                          {pub.abstract}
                        </p>
                      )}
                      {pub.doi_or_url && (
                        <a
                          href={pub.doi_or_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline pt-1"
                        >
                          View DOI / Publication{" "}
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Research Projects */}
            {projects.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-7 space-y-4">
                <h2 className="text-base font-bold text-[#202124] flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-[#2563EB]" />
                  <span>Active Research Projects ({projects.length})</span>
                </h2>
                <div className="space-y-4">
                  {projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-[#202124]">
                          {proj.title}
                        </h3>
                        <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] text-[10px] font-bold uppercase">
                          {proj.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#666666] leading-relaxed">
                        {proj.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {proj.technologies.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded bg-white border border-[#E5E7EB] text-[11px]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right 4 Columns: Research Interests, Technical Skills, Tools, Certifications, Links */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#202124] mb-2.5">
                  Research Interests
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {scholar.research_interests.map((interest) => (
                    <span
                      key={interest}
                      className="px-2.5 py-1 rounded-md bg-[#EFF6FF] border border-[#2563EB]/30 text-xs font-medium text-[#202124]"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E7EB]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#202124] mb-2.5">
                  Technical Skills
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {scholar.technical_skills.map((sk) => (
                    <span
                      key={sk}
                      className="px-2.5 py-1 rounded-md bg-[#F7F8FA] border border-[#E5E7EB] text-xs text-[#202124]"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              {scholar.research_tools.length > 0 && (
                <div className="pt-4 border-t border-[#E5E7EB]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#202124] mb-2.5">
                    Research Tools & Lab Stack
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {scholar.research_tools.map((tool) => (
                      <span
                        key={tool}
                        className="px-2.5 py-1 rounded-md bg-[#F7F8FA] border border-[#E5E7EB] text-xs text-[#666666]"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {scholar.certifications.length > 0 && (
                <div className="pt-4 border-t border-[#E5E7EB]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#202124] mb-2.5 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#2563EB]" /> Fellowships &
                    Honors
                  </h3>
                  <ul className="space-y-1.5 text-xs text-[#666666]">
                    {scholar.certifications.map((c) => (
                      <li key={c} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0 mt-0.5" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-4 border-t border-[#E5E7EB]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#202124] mb-2.5 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-[#2563EB]" /> Academic & Social
                  Links
                </h3>
                <div className="space-y-2 text-xs">
                  {scholar.orcid_id && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-[#F7F8FA]">
                      <span className="text-[#666666] font-medium">
                        ORCID ID
                      </span>
                      <span className="font-mono text-[#202124]">
                        {scholar.orcid_id}
                      </span>
                    </div>
                  )}
                  {scholar.google_scholar_url && (
                    <a
                      href={scholar.google_scholar_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2 rounded-lg bg-[#F7F8FA] hover:text-[#2563EB]"
                    >
                      <span>Google Scholar Profile</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {scholar.linkedin_url && (
                    <a
                      href={scholar.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2 rounded-lg bg-[#F7F8FA] hover:text-[#2563EB]"
                    >
                      <span>LinkedIn Profile</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {scholar.github_url && (
                    <a
                      href={scholar.github_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2 rounded-lg bg-[#F7F8FA] hover:text-[#2563EB]"
                    >
                      <span>GitHub Lab Repository</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DIRECT SCHOLAR CONTACT MODAL (PREMIUM USERS) */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-[#E5E7EB] pb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                  <Crown className="w-3.5 h-3.5" />
                  STARSKY Premium Direct Scholar Contact
                </span>
                <h2 className="text-xl font-extrabold text-[#202124] mt-1">
                  Message {profile.full_name}
                </h2>
                <p className="text-xs text-[#666666] mt-0.5">
                  {scholar.university_institution} • {scholar.department}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setContactModalOpen(false)}
                className="p-2 rounded-lg border border-[#E5E7EB] text-[#666666] hover:text-[#202124]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {contactFeedback && (
              <div
                className={`p-4 rounded-xl border text-xs font-medium ${
                  contactFeedback.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
              >
                {contactFeedback.text}
              </div>
            )}

            <form onSubmit={handleSendDirectContact} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">
                  Inquiry Subject <span className="text-[#2563EB]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  placeholder="e.g., Undergraduate Research Collaboration on Multimodal AI"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">
                  Research Area / Topic of Interest
                </label>
                <input
                  type="text"
                  value={contactTopic}
                  onChange={(e) => setContactTopic(e.target.value)}
                  placeholder="e.g., Vision-Language Transformers"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">
                  Your Academic Message (Min 20 characters){" "}
                  <span className="text-[#2563EB]">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Introduce your academic background, relevant projects, and how you would like to collaborate or seek mentorship..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setContactModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-[#666666]"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={contactSubmitting}
                  className="px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold inline-flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {contactSubmitting
                      ? "Sending Inquiry..."
                      : "Send Direct Message"}
                  </span>
                </button>
              </div>
            </form>

            {pastContactRequests.length > 0 && (
              <div className="pt-4 border-t border-[#E5E7EB] space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#666666]">
                  Your Previous Inquiries to {profile.full_name}
                </h3>
                <div className="space-y-2.5 max-h-48 overflow-y-auto">
                  {pastContactRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3.5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-[#202124]">{req.subject}</strong>
                        <span className="px-2 py-0.5 rounded bg-white border border-[#E5E7EB] text-[10px] font-semibold uppercase text-[#2563EB]">
                          {req.status}
                        </span>
                      </div>
                      <p className="text-[#666666]">{req.message}</p>
                      {req.scholar_reply && (
                        <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                          <span className="font-bold block text-[11px]">
                            Scholar Reply:
                          </span>
                          <p className="mt-0.5">{req.scholar_reply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PREMIUM UPGRADE MODAL */}
      <PremiumUpgradeModal
        isOpen={premiumModalOpen}
        onClose={() => setPremiumModalOpen(false)}
        contextTitle={premiumModalContext}
      />

      {/* INTERNSHIP APPLICATION MODAL (SECTION 11) */}
      {applyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#E5E7EB] pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                  Research Internship Application
                </span>
                <h2 className="text-xl font-extrabold text-[#202124] mt-0.5">
                  Mentor: {profile.full_name} ({scholar.university_institution})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setApplyModalOpen(false)}
                className="p-2 rounded-lg border border-[#E5E7EB] text-[#666666] hover:text-[#202124]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="py-10 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-extrabold text-[#202124]">
                  Application Submitted Successfully!
                </h3>
                <p className="text-sm text-[#666666] max-w-md mx-auto">
                  Your application for{" "}
                  <strong>{selectedInternship?.title}</strong> has been linked
                  to your profile and sent to{" "}
                  <strong>{profile.full_name}</strong> for review.
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-4">
                  {selectedInternship &&
                    studentApplications[selectedInternship.id] && (
                      <button
                        type="button"
                        onClick={() => {
                          const app =
                            studentApplications[selectedInternship.id];
                          setApplyModalOpen(false);
                          if (app) setViewingApplication(app);
                        }}
                        className="px-6 py-3 rounded-lg bg-[#202124] text-white text-xs font-semibold hover:bg-black"
                      >
                        View Application
                      </button>
                    )}
                  <Link
                    href="/dashboard/student?tab=applications"
                    className="px-6 py-3 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8]"
                  >
                    Track Application in Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => setApplyModalOpen(false)}
                    className="px-5 py-3 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-[#202124]"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : reviewStep ? (
              /* STEP 2: REVIEW APPLICATION BEFORE SUBMISSION */
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#2563EB]/30">
                  <p className="text-xs font-bold text-[#2563EB] uppercase">
                    Review Your Application Before Final Submission
                  </p>
                  <p className="text-sm font-bold text-[#202124] mt-1">
                    Internship: {selectedInternship?.title}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[#F7F8FA] p-5 rounded-xl border border-[#E5E7EB]">
                  <div>
                    <span className="text-[#666666] block">Full Name</span>
                    <strong className="text-[#202124]">{studentName}</strong>
                  </div>
                  <div>
                    <span className="text-[#666666] block">Email & Phone</span>
                    <strong className="text-[#202124]">
                      {studentEmail} • {studentPhone}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#666666] block">
                      Institution & Degree
                    </span>
                    <strong className="text-[#202124]">
                      {college} ({degree} — {department})
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#666666] block">
                      Current Year & Availability
                    </span>
                    <strong className="text-[#202124]">
                      {academicYear} • {availability} ({preferredDuration})
                    </strong>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[#666666] block">
                      Technical Skills
                    </span>
                    <strong className="text-[#202124]">
                      {technicalSkills.join(", ")}
                    </strong>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[#666666] block">
                      Why do you want to join this research internship?
                    </span>
                    <p className="text-[#202124] mt-1 whitespace-pre-line">
                      {sop}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[#666666] block">
                      Relevant Experience
                    </span>
                    <p className="text-[#202124] mt-1 whitespace-pre-line">
                      {relevantExp}
                    </p>
                  </div>
                </div>

                {submitError && (
                  <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                    {submitError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
                  <button
                    type="button"
                    onClick={() => setReviewStep(false)}
                    className="px-5 py-2.5 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-[#202124]"
                  >
                    ← Edit Details
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleFinalSubmit}
                    className="px-6 py-2.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] inline-flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Confirm & Submit Application</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* STEP 1: APPLICATION FORM */
              <form onSubmit={handleReviewApplication} className="space-y-5">
                {/* Select Internship Position */}
                <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB]">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#202124] mb-1.5">
                    Selected Internship Opportunity{" "}
                    <span className="text-[#2563EB]">*</span>
                  </label>
                  <select
                    value={selectedInternship?.id || ""}
                    onChange={(e) => {
                      const found =
                        internships.find((i) => i.id === e.target.value) ||
                        null;
                      setSelectedInternship(found);
                      if (found) setPreferredDuration(found.duration);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm font-semibold text-[#202124]"
                  >
                    {internships.map((i) => {
                      const existing = studentApplications[i.id];
                      const isAlreadyApplied =
                        Boolean(existing) &&
                        existing.application.status !== "Withdrawn";
                      return (
                        <option
                          key={i.id}
                          value={i.id}
                          disabled={isAlreadyApplied}
                        >
                          {i.title} ({i.mode} • {i.duration})
                          {isAlreadyApplied && existing
                            ? ` — [Already Applied: ${getApplicationBadgeLabel(
                                existing.application.status
                              )}]`
                            : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {submitError && (
                  <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                    {submitError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#202124] mb-1">
                      Student Full Name{" "}
                      <span className="text-[#2563EB]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#202124] mb-1">
                      Email <span className="text-[#2563EB]">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#202124] mb-1">
                      Phone Number <span className="text-[#2563EB]">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={studentPhone}
                      onChange={(e) => setStudentPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#202124] mb-1">
                      College / University{" "}
                      <span className="text-[#2563EB]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#202124] mb-1">
                        Degree <span className="text-[#2563EB]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={degree}
                        onChange={(e) => setDegree(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#202124] mb-1">
                        Current Year <span className="text-[#2563EB]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={academicYear}
                        onChange={(e) => setAcademicYear(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Department <span className="text-[#2563EB]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TagInput
                    label="Research Interests"
                    required
                    values={researchInterests}
                    onChange={setResearchInterests}
                  />
                  <TagInput
                    label="Technical Skills"
                    required
                    values={technicalSkills}
                    onChange={setTechnicalSkills}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Why do you want to join this research internship? (Min 30
                    chars) <span className="text-[#2563EB]">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={sop}
                    onChange={(e) => setSop(e.target.value)}
                    placeholder="Explain how your background aligns with this research topic and what you aim to contribute..."
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Relevant Experience & Projects
                  </label>
                  <textarea
                    rows={2}
                    value={relevantExp}
                    onChange={(e) => setRelevantExp(e.target.value)}
                    placeholder="Highlight prior projects, coursework, or research implementations..."
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#202124] mb-1">
                      Expected Availability{" "}
                      <span className="text-[#2563EB]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                      placeholder="e.g., 25 hours/week starting immediately"
                      className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#202124] mb-1">
                      Preferred Internship Duration{" "}
                      <span className="text-[#2563EB]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={preferredDuration}
                      onChange={(e) => setPreferredDuration(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                    />
                  </div>
                </div>

                <FileUploadField
                  label="Resume / CV Upload (PDF)"
                  category="document"
                  value={resumeUrl}
                  onChange={setResumeUrl}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#202124] mb-1">
                      Portfolio Link
                    </label>
                    <input
                      type="url"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#202124] mb-1">
                      LinkedIn Link
                    </label>
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Additional Message to Scholar
                  </label>
                  <textarea
                    rows={2}
                    value={additionalMessage}
                    onChange={(e) => setAdditionalMessage(e.target.value)}
                    placeholder="Any links to GitHub repositories, preprints, or scheduling notes..."
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
                  <button
                    type="button"
                    onClick={() => setApplyModalOpen(false)}
                    className="px-5 py-2.5 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-[#666666]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8]"
                  >
                    Review Application →
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* VIEW APPLICATION READ-ONLY MODAL */}
      <ViewApplicationModal
        applicationData={viewingApplication}
        onClose={() => setViewingApplication(null)}
      />
    </div>
  );
}
