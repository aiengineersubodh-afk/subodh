"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  Loader2,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import { EnrichedApplication, EnrichedInternship } from "@/types/database";
import { useAuth } from "@/context/AuthContext";
import { TagInput } from "@/components/TagInput";
import { FileUploadField } from "@/components/FileUploadField";
import {
  InternshipApplicationAction,
  ViewApplicationModal,
  getApplicationBadgeLabel,
} from "@/components/ApplicationStatusModal";

export default function InternshipDetailsPage() {
  const params = useParams();
  const internshipId = String(params.id || "");
  const { session, refreshSession } = useAuth();

  const [data, setData] = useState<EnrichedInternship | null>(null);
  const [studentApplications, setStudentApplications] = useState<
    Record<string, EnrichedApplication>
  >({});
  const [loading, setLoading] = useState(true);
  const [viewingApplication, setViewingApplication] =
    useState<EnrichedApplication | null>(null);

  // Application Modal State
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [reviewStep, setReviewStep] = useState(false);
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
    if (!internshipId) return;
    setLoading(true);
    fetch(`/api/public?internshipId=${encodeURIComponent(internshipId)}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.internship) {
          setData(res.internship);
          setPreferredDuration(res.internship.internship.duration);
        }
        setStudentApplications(res.studentApplications || {});
      })
      .finally(() => setLoading(false));
  }, [internshipId, session?.user?.id]);

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

  const existingApp = data ? studentApplications[data.internship.id] : null;

  const handleOpenApplyModal = () => {
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
    if (existingApp && existingApp.application.status !== "Withdrawn") {
      setViewingApplication(existingApp);
      return;
    }
    setSubmitError("");
    setSubmitSuccess(false);
    setReviewStep(false);
    setApplyModalOpen(true);
  };

  const handleReviewApplication = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (existingApp && existingApp.application.status !== "Withdrawn") {
      setSubmitError(
        `You have already applied for this internship (${getApplicationBadgeLabel(
          existingApp.application.status
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
    if (!data) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          internship_id: data.internship.id,
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
            [data.internship.id]: resJson.enrichedApplication,
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
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-sm text-[#666666]">
        Loading Research Internship Details...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold text-[#202124]">
          Research Internship Not Found
        </h1>
        <Link
          href="/explore?tab=internships"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Open Internships
        </Link>
      </div>
    );
  }

  const { internship, scholar, scholarUser, domain } = data;

  return (
    <div className="bg-[#F7F8FA] min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Navigation Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/explore?tab=internships"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#666666] hover:text-[#2563EB]"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Open Internships
          </Link>
          <Link
            href={`/scholars/${scholar.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:underline"
          >
            <span>View Full PhD Scholar Profile</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Main Internship Details Card */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-7 sm:p-9 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 border-b border-[#E5E7EB] pb-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-[#EFF6FF] border border-[#2563EB]/30 text-xs font-semibold text-[#2563EB]">
                  {domain?.name || scholar.research_field} •{" "}
                  {scholar.specialization}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-[#F7F8FA] border border-[#E5E7EB] text-xs font-semibold text-[#202124]">
                  {internship.mode}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-green-50 border border-green-200 text-xs font-semibold text-green-700">
                  {internship.available_positions} Positions Open
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202124]">
                {internship.title}
              </h1>

              <div className="flex flex-wrap items-center gap-5 text-xs text-[#666666]">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#2563EB]" />
                  Duration:{" "}
                  <strong className="text-[#202124]">
                    {internship.duration}
                  </strong>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#2563EB]" />
                  Stipend:{" "}
                  <strong className="text-[#202124]">
                    {internship.stipend || "Academic Credit / Certificate"}
                  </strong>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#2563EB]" />
                  Application Deadline:{" "}
                  <strong className="text-[#202124]">
                    {internship.application_deadline}
                  </strong>
                </span>
              </div>
            </div>

            <div className="shrink-0">
              <InternshipApplicationAction
                existingApplication={existingApp}
                checkingStatus={loading}
                onApply={handleOpenApplyModal}
                onViewApplication={(app) => setViewingApplication(app)}
              />
            </div>
          </div>

          {/* Description & Eligibility */}
          <div className="space-y-5">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#202124]">
                Research Position Overview & Objectives
              </h2>
              <p className="text-sm text-[#666666] mt-2 leading-relaxed whitespace-pre-line">
                {internship.description}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#202124]">
                Eligibility Criteria
              </h3>
              <p className="text-xs text-[#666666] mt-1 leading-relaxed">
                {internship.eligibility_criteria}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#202124] mb-2">
                Required Technical Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {internship.required_skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 rounded-lg bg-[#F7F8FA] border border-[#E5E7EB] text-xs font-medium text-[#202124]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* PhD Scholar Mentor Card */}
          <div className="p-5 rounded-xl bg-[#EFF6FF]/60 border border-[#2563EB]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <img
                src={scholarUser.avatar_url}
                alt={scholarUser.full_name}
                className="w-16 h-16 rounded-xl object-cover border border-[#E5E7EB] shrink-0"
              />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                    Doctoral Research Mentor
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-[#2563EB]/30 text-[10px] font-semibold text-[#2563EB]">
                    <ShieldCheck className="w-3 h-3" /> Verified PhD Scholar
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#202124]">
                  {scholarUser.full_name}
                </h3>
                <p className="text-xs text-[#666666] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>
                    {scholar.university_institution} • {scholar.department}
                  </span>
                </p>
                <p className="text-xs text-[#202124] font-medium flex items-center gap-1.5 pt-0.5">
                  <GraduationCap className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Topic: {scholar.current_research_topic}</span>
                </p>
              </div>
            </div>

            <Link
              href={`/scholars/${scholar.id}`}
              className="px-4 py-2.5 rounded-xl bg-[#202124] text-white text-xs font-semibold hover:bg-black transition-colors shrink-0 self-start sm:self-center"
            >
              View Scholar Profile →
            </Link>
          </div>
        </div>
      </div>

      {/* APPLICATION FORM MODAL */}
      {applyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-[#E5E7EB] pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                  Research Internship Application
                </span>
                <h2 className="text-xl font-extrabold text-[#202124] mt-0.5">
                  {internship.title}
                </h2>
                <p className="text-xs text-[#666666] mt-0.5">
                  Mentor: {scholarUser.full_name} (
                  {scholar.university_institution})
                </p>
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
                  Your application for <strong>{internship.title}</strong> has
                  been sent to <strong>{scholarUser.full_name}</strong> for
                  review.
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-4">
                  {existingApp && (
                    <button
                      type="button"
                      onClick={() => {
                        setApplyModalOpen(false);
                        setViewingApplication(existingApp);
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
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#2563EB]/30">
                  <p className="text-xs font-bold text-[#2563EB] uppercase">
                    Review Your Application Before Final Submission
                  </p>
                  <p className="text-sm font-bold text-[#202124] mt-1">
                    Internship: {internship.title}
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
                      Statement of Purpose
                    </span>
                    <p className="text-[#202124] mt-1 whitespace-pre-line">
                      {sop}
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
              <form onSubmit={handleReviewApplication} className="space-y-5">
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

