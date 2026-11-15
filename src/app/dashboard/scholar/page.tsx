"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit3,
  Eye,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  LogOut,
  Plus,
  Settings,
  ShieldCheck,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  AcademicDomain,
  ApplicationStatus,
  EnrichedApplication,
  Internship,
  Specialization,
} from "@/types/database";
import { TagInput } from "@/components/TagInput";

type ScholarTab =
  | "overview"
  | "profile"
  | "internships"
  | "students"
  | "applications"
  | "settings";

function ScholarDashboardContent({ initialTab = "overview" }: { initialTab?: ScholarTab }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, loading: authLoading, logout, refreshSession } = useAuth();

  const [activeTab, setActiveTab] = useState<ScholarTab>(initialTab);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [applications, setApplications] = useState<EnrichedApplication[]>([]);
  const [domains, setDomains] = useState<AcademicDomain[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Selected Student / Application Modal State
  const [selectedApp, setSelectedApp] = useState<EnrichedApplication | null>(null);
  const [privateNotes, setPrivateNotes] = useState("");
  const [updatingApp, setUpdatingApp] = useState(false);
  const [expandedApplicantsIntId, setExpandedApplicantsIntId] = useState<string | null>(null);
  const [selectedInternshipFilter, setSelectedInternshipFilter] = useState<string | null>(null);

  // Create / Edit Internship Modal State
  const [internshipModalOpen, setInternshipModalOpen] = useState(false);
  const [editingInternship, setEditingInternship] = useState<Internship | null>(null);
  const [intTitle, setIntTitle] = useState("");
  const [intDomainId, setIntDomainId] = useState("dom-engineering");
  const [intSpecId, setIntSpecId] = useState("");
  const [intDesc, setIntDesc] = useState("");
  const [intSkills, setIntSkills] = useState<string[]>(["Python", "Research Analysis"]);
  const [intEligibility, setIntEligibility] = useState(
    "Undergraduate or Postgraduate students in relevant disciplines."
  );
  const [intDuration, setIntDuration] = useState("8 Weeks");
  const [intPositions, setIntPositions] = useState(2);
  const [intMode, setIntMode] = useState<"Remote" | "On-site" | "Hybrid">("Remote");
  const [intDeadline, setIntDeadline] = useState("2027-02-28");
  const [intStipend, setIntStipend] = useState("Academic Credit + Co-authorship");
  const [intStatus, setIntStatus] = useState<"Open" | "Closed" | "Draft">("Open");
  const [savingInt, setSavingInt] = useState(false);
  const [intError, setIntError] = useState("");

  // Password Change
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");

  useEffect(() => {
    const t = searchParams.get("tab") as ScholarTab | null;
    if (
      t &&
      ["overview", "profile", "internships", "students", "applications", "settings"].includes(t)
    ) {
      setActiveTab(t);
    } else if (!t) {
      setActiveTab("overview");
    }
    const intParam = searchParams.get("internshipId");
    if (intParam) {
      setSelectedInternshipFilter(intParam);
      setExpandedApplicantsIntId(intParam);
    } else {
      setSelectedInternshipFilter(null);
    }
  }, [searchParams]);

  useEffect(() => {
    const handlePopState = () => {
      const sp = new URLSearchParams(window.location.search);
      const t = sp.get("tab") as ScholarTab | null;
      if (t && ["overview", "profile", "internships", "students", "applications", "settings"].includes(t)) {
        setActiveTab(t);
      } else {
        setActiveTab("overview");
      }
      const intParam = sp.get("internshipId");
      if (intParam) {
        setSelectedInternshipFilter(intParam);
        setExpandedApplicantsIntId(intParam);
      } else {
        setSelectedInternshipFilter(null);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleTabClick = (t: ScholarTab) => {
    setActiveTab(t);
    const targetUrl = t === "overview" ? "/dashboard/scholar" : `/dashboard/scholar?tab=${t}`;
    const currentUrl = typeof window !== "undefined" ? window.location.pathname + window.location.search : "";
    if (targetUrl !== currentUrl) {
      router.push(targetUrl, { scroll: false });
    }
  };

  const loadScholarData = async () => {
    setLoadingData(true);
    try {
      const [intRes, appRes, pubRes] = await Promise.all([
        fetch("/api/internships"),
        fetch("/api/applications"),
        fetch("/api/public"),
        refreshSession(),
      ]);
      const intJson = await intRes.json();
      const appJson = await appRes.json();
      const pubJson = await pubRes.json();

      setInternships(intJson.internships || []);
      setApplications(appJson.applications || []);
      setDomains(pubJson.domains || []);
      setSpecializations(pubJson.specializations || []);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!session) {
        router.push("/login");
      } else if (session.user.role === "student") {
        router.push("/dashboard/student");
      } else if (session.user.role === "admin") {
        router.push("/admin");
      } else if (!session.user.onboarding_completed) {
        router.push("/onboarding/scholar");
      } else {
        loadScholarData();
      }
    }
  }, [authLoading, session, router]);

  const openCreateInternshipModal = () => {
    setEditingInternship(null);
    setIntTitle("");
    const domId = session?.scholarProfile?.domain_id || "dom-engineering";
    setIntDomainId(domId);
    const firstSpec =
      session?.scholarProfile?.specialization_id ||
      specializations.find((s) => s.domain_id === domId)?.id ||
      "";
    setIntSpecId(firstSpec);
    setIntDesc("");
    setIntSkills(session?.scholarProfile?.technical_skills || ["Python", "Data Analysis"]);
    setIntEligibility(
      "3rd/4th year Undergraduate or Postgraduate students with relevant background."
    );
    setIntDuration("10 Weeks");
    setIntPositions(2);
    setIntMode("Remote");
    setIntDeadline("2027-03-15");
    setIntStipend("Academic Credit + Publication Co-authorship");
    setIntStatus("Open");
    setIntError("");
    setInternshipModalOpen(true);
  };

  const openEditInternshipModal = (int: Internship) => {
    setEditingInternship(int);
    setIntTitle(int.title);
    setIntDomainId(int.domain_id);
    setIntSpecId(int.specialization_id);
    setIntDesc(int.description);
    setIntSkills(int.required_skills);
    setIntEligibility(int.eligibility_criteria);
    setIntDuration(int.duration);
    setIntPositions(int.available_positions);
    setIntMode(int.mode);
    setIntDeadline(int.application_deadline);
    setIntStipend(int.stipend);
    setIntStatus(int.status);
    setIntError("");
    setInternshipModalOpen(true);
  };

  const handleSaveInternship = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingInt(true);
    setIntError("");

    try {
      const method = editingInternship ? "PATCH" : "POST";
      const payload = {
        ...(editingInternship ? { id: editingInternship.id } : {}),
        title: intTitle,
        domain_id: intDomainId,
        specialization_id: intSpecId,
        description: intDesc,
        required_skills: intSkills,
        eligibility_criteria: intEligibility,
        duration: intDuration,
        available_positions: Number(intPositions),
        mode: intMode,
        application_deadline: intDeadline,
        stipend: intStipend,
        status: intStatus,
      };

      const res = await fetch("/api/internships", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setIntError(data.error || "Failed to save internship.");
      } else {
        setInternshipModalOpen(false);
        await loadScholarData();
      }
    } finally {
      setSavingInt(false);
    }
  };

  const handleToggleInternshipStatus = async (int: Internship) => {
    const nextStatus = int.status === "Open" ? "Closed" : "Open";
    await fetch("/api/internships", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: int.id, status: nextStatus }),
    });
    await loadScholarData();
  };

  const handleDeleteInternship = async (id: string) => {
    if (!confirm("Delete this internship listing permanently?")) return;
    await fetch(`/api/internships?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await loadScholarData();
  };

  const openApplicationReviewModal = (item: EnrichedApplication) => {
    setSelectedApp(item);
    setPrivateNotes(item.application.scholar_private_notes || "");
  };

  const handleUpdateApplicationStatus = async (
    applicationId: string,
    newStatus?: ApplicationStatus,
    notes?: string
  ) => {
    setUpdatingApp(true);
    try {
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          ...(newStatus ? { status: newStatus } : {}),
          ...(notes !== undefined ? { scholar_private_notes: notes } : {}),
        }),
      });
      if (res.ok) {
        await loadScholarData();
        if (selectedApp && selectedApp.application.id === applicationId) {
          setSelectedApp((prev) =>
            prev
              ? {
                  ...prev,
                  application: {
                    ...prev.application,
                    status: newStatus || prev.application.status,
                    scholar_private_notes:
                      notes !== undefined ? notes : prev.application.scholar_private_notes,
                  },
                }
              : null
          );
        }
      }
    } finally {
      setUpdatingApp(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg("");
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    });
    if (res.ok) {
      setPasswordMsg("Password updated successfully.");
      setNewPassword("");
    }
  };

  if (authLoading || !session) {
    return (
      <div className="p-16 text-center text-sm text-[#666666]">
        Loading PhD Scholar Dashboard...
      </div>
    );
  }

  const scholarProfile = session.scholarProfile;
  const activeInternshipsCount = internships.filter((i) => i.status === "Open").length;
  const pendingApplicationsCount = applications.filter(
    (a) => a.application.status === "Submitted" || a.application.status === "Under Review"
  ).length;
  const acceptedStudentsCount = applications.filter(
    (a) => a.application.status === "Accepted"
  ).length;

  const statusBadgeColor = (status: string) => {
    switch (status) {
      case "Accepted":
        return "bg-green-50 text-green-700 border-green-200";
      case "Shortlisted":
        return "bg-[#EFF6FF] text-[#2563EB] border-[#2563EB]/30";
      case "Under Review":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Rejected":
        return "bg-red-50 text-red-700 border-red-200";
      case "Withdrawn":
        return "bg-gray-100 text-gray-600 border-gray-200";
      default:
        return "bg-[#F7F8FA] text-[#202124] border-[#E5E7EB]";
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* PHD SCHOLAR SIDEBAR (SECTION 12) */}
          <aside className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-6 sticky top-24">
              <div className="flex items-center gap-3 pb-4 border-b border-[#E5E7EB]">
                <img
                  src={session.user.avatar_url}
                  alt={session.user.full_name}
                  className="w-12 h-12 rounded-xl object-cover border border-[#E5E7EB]"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-bold text-[#202124] truncate">
                      {session.user.full_name}
                    </p>
                    <ShieldCheck className="w-4 h-4 text-[#2563EB] shrink-0" />
                  </div>
                  <p className="text-[11px] text-[#2563EB] font-semibold">PhD Scholar</p>
                  <p className="text-[11px] text-[#666666] truncate">
                    {scholarProfile?.university_institution || session.user.email}
                  </p>
                </div>
              </div>

              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => handleTabClick("overview")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    activeTab === "overview"
                      ? "bg-[#202124] text-white"
                      : "text-[#666666] hover:bg-[#F7F8FA] hover:text-[#202124]"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-[#2563EB]" />
                  <span>Dashboard</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabClick("profile")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    activeTab === "profile"
                      ? "bg-[#202124] text-white"
                      : "text-[#666666] hover:bg-[#F7F8FA] hover:text-[#202124]"
                  }`}
                >
                  <User className="w-4 h-4 text-[#2563EB]" />
                  <span>My Profile</span>
                </button>

                <button
                  type="button"
                  data-tab="internships"
                  onClick={() => handleTabClick("internships")}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    activeTab === "internships"
                      ? "bg-[#202124] text-white"
                      : "text-[#666666] hover:bg-[#F7F8FA] hover:text-[#202124]"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-[#2563EB]" />
                    <span>My Internships</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#F7F8FA] text-[#202124] text-[10px] font-bold">
                    {internships.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabClick("students")}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    activeTab === "students"
                      ? "bg-[#202124] text-white"
                      : "text-[#666666] hover:bg-[#F7F8FA] hover:text-[#202124]"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-[#2563EB]" />
                    <span>Students</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] text-[10px] font-bold">
                    {applications.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabClick("applications")}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    activeTab === "applications"
                      ? "bg-[#202124] text-white"
                      : "text-[#666666] hover:bg-[#F7F8FA] hover:text-[#202124]"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-[#2563EB]" />
                    <span>Applications</span>
                  </span>
                  {pendingApplicationsCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#2563EB] text-white text-[10px] font-bold">
                      {pendingApplicationsCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleTabClick("settings")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    activeTab === "settings"
                      ? "bg-[#202124] text-white"
                      : "text-[#666666] hover:bg-[#F7F8FA] hover:text-[#202124]"
                  }`}
                >
                  <Settings className="w-4 h-4 text-[#2563EB]" />
                  <span>Settings</span>
                </button>
              </nav>

              <div className="pt-4 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <div className="lg:col-span-9 space-y-6">
            {/* TAB 1: DASHBOARD OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                        PhD Scholar Command Center
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${
                          scholarProfile?.verification_status === "approved"
                            ? "bg-green-50 border-green-200 text-green-700"
                            : "bg-amber-50 border-amber-200 text-amber-700"
                        }`}
                      >
                        {scholarProfile?.verification_status === "approved"
                          ? "Approved"
                          : "Pending Institutional Verification"}
                      </span>
                    </div>
                    <h1 className="text-2xl font-extrabold text-[#202124] mt-1">
                      {session.user.full_name}
                    </h1>
                    <p className="text-xs text-[#666666]">
                      {scholarProfile?.university_institution} • {scholarProfile?.specialization}
                    </p>
                    {scholarProfile?.verification_status !== "approved" && (
                      <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                        <Clock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-800 leading-relaxed">
                          <strong>Institutional Verification Pending:</strong> Your PhD profile is under review by administration. Your published internships are active and saved in your dashboard, and will automatically appear in <strong>Open Internships → {scholarProfile?.research_field || "Engineering"} → {scholarProfile?.specialization || "Specialization"}</strong> once your institutional credentials are verified.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {scholarProfile && (
                      <Link
                        href={`/scholars/${scholarProfile.id}`}
                        className="px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#202124] hover:border-[#2563EB]"
                      >
                        View Public Profile
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={openCreateInternshipModal}
                      className="px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Publish New Internship</span>
                    </button>
                  </div>
                </div>

                {/* 6 Required Scholar Overview Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-[#E5E7EB]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666]">
                      Total Profile Views
                    </span>
                    <p className="text-2xl font-extrabold text-[#202124] mt-2">
                      {scholarProfile?.profile_views ?? 0}
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-[#E5E7EB]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666]">
                      Total Internship Listings
                    </span>
                    <p className="text-2xl font-extrabold text-[#202124] mt-2">
                      {internships.length}
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-[#E5E7EB]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666]">
                      Active Internships
                    </span>
                    <p className="text-2xl font-extrabold text-[#2563EB] mt-2">
                      {activeInternshipsCount}
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-[#E5E7EB]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666]">
                      Total Applications
                    </span>
                    <p className="text-2xl font-extrabold text-[#202124] mt-2">
                      {applications.length}
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-[#E5E7EB]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666]">
                      Pending Applications
                    </span>
                    <p className="text-2xl font-extrabold text-amber-600 mt-2">
                      {pendingApplicationsCount}
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-[#E5E7EB]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666]">
                      Accepted Students
                    </span>
                    <p className="text-2xl font-extrabold text-green-700 mt-2">
                      {acceptedStudentsCount}
                    </p>
                  </div>
                </div>

                {/* Recent Applicant Students Preview */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-[#202124]">
                      Recent Student Applicants
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab("students")}
                      className="text-xs font-semibold text-[#2563EB] hover:underline"
                    >
                      Open Students Directory →
                    </button>
                  </div>

                  {applications.length === 0 ? (
                    <p className="text-xs text-[#666666] py-6 text-center">
                      No student applications received yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {applications.slice(0, 4).map((item) => (
                        <div
                          key={item.application.id}
                          className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3.5">
                            <img
                              src={item.studentUser.avatar_url}
                              alt={item.application.student_full_name}
                              className="w-11 h-11 rounded-xl object-cover border border-[#E5E7EB]"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-[#202124]">
                                  {item.application.student_full_name}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${statusBadgeColor(
                                    item.application.status
                                  )}`}
                                >
                                  {item.application.status}
                                </span>
                              </div>
                              <p className="text-xs text-[#666666]">
                                {item.application.college_university} • {item.application.degree} (
                                {item.application.department})
                              </p>
                              <p className="text-[11px] text-[#2563EB] font-medium">
                                Applied: {item.internship.title}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => openApplicationReviewModal(item)}
                            className="px-4 py-2 rounded-lg bg-[#202124] text-white text-xs font-semibold hover:bg-[#2563EB] transition-colors shrink-0"
                          >
                            View Application
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: MY PROFILE */}
            {activeTab === "profile" && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#202124]">
                      My PhD Scholar Research Profile
                    </h2>
                    <p className="text-xs text-[#666666]">
                      Manage your academic credentials, publications, research interests, and links.
                    </p>
                  </div>
                  <Link
                    href="/onboarding/scholar"
                    className="px-5 py-2.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8]"
                  >
                    Edit Complete Profile & Publications
                  </Link>
                </div>

                {scholarProfile ? (
                  <div className="space-y-5 text-xs">
                    <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] space-y-1.5">
                      <span className="font-bold uppercase tracking-wider text-[#2563EB]">
                        Current Research Topic
                      </span>
                      <p className="text-sm font-bold text-[#202124]">
                        {scholarProfile.current_research_topic}
                      </p>
                      <p className="text-[#666666] leading-relaxed pt-1">
                        {scholarProfile.biography}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] space-y-1">
                        <span className="font-bold uppercase text-[#666666]">Institution</span>
                        <p className="text-sm font-bold text-[#202124]">
                          {scholarProfile.university_institution}
                        </p>
                        <p className="text-[#666666]">{scholarProfile.department}</p>
                        <p className="text-[#2563EB] font-semibold">
                          {scholarProfile.research_field} → {scholarProfile.specialization}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] space-y-1">
                        <span className="font-bold uppercase text-[#666666]">
                          Academic Identifiers
                        </span>
                        <p className="text-[#202124]">
                          <strong>ORCID:</strong> {scholarProfile.orcid_id || "Not provided"}
                        </p>
                        <p className="text-[#202124]">
                          <strong>Cohort:</strong> {scholarProfile.enrollment_year} –{" "}
                          {scholarProfile.expected_completion_year}
                        </p>
                        <p className="text-[#202124]">
                          <strong>Verification:</strong>{" "}
                          <span
                            className={
                              scholarProfile.verification_status === "approved"
                                ? "text-green-600 font-semibold"
                                : "text-amber-600 font-semibold"
                            }
                          >
                            {scholarProfile.verification_status === "approved"
                              ? "Approved"
                              : "Pending Institutional Verification"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Link
                      href="/onboarding/scholar"
                      className="px-5 py-2.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
                    >
                      Complete PhD Scholar Profile
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: MY INTERNSHIPS */}
            {activeTab === "internships" && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#202124]">
                      My Research Internship Listings
                    </h2>
                    <p className="text-xs text-[#666666]">
                      Create, edit, publish, close, and manage your internship opportunities.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openCreateInternshipModal}
                    className="px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] inline-flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New Internship</span>
                  </button>
                </div>

                {internships.length === 0 ? (
                  <div className="p-12 text-center bg-[#F7F8FA] rounded-xl border border-[#E5E7EB]">
                    <p className="text-sm font-bold text-[#202124]">
                      No Internships Published Yet
                    </p>
                    <button
                      type="button"
                      onClick={openCreateInternshipModal}
                      className="mt-3 px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
                    >
                      Publish Your First Internship
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {internships.map((int) => {
                      const appCount = applications.filter(
                        (a) => a.application.internship_id === int.id
                      ).length;
                      return (
                        <div
                          key={int.id}
                          className="p-5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] space-y-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                                    int.status === "Open"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-200 text-gray-700"
                                  }`}
                                >
                                  {int.status}
                                </span>
                                {scholarProfile?.verification_status !== "approved" && (
                                  <span
                                    className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200"
                                    title="This internship is saved in your dashboard and will automatically be discoverable in Open Internships once your institutional scholar verification is approved."
                                  >
                                    Pending Admin Verification
                                  </span>
                                )}
                                <span className="px-2.5 py-0.5 rounded bg-white border border-[#E5E7EB] text-[11px] font-semibold text-[#202124]">
                                  {int.mode} • {int.duration}
                                </span>
                                <span className="px-2.5 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] text-[11px] font-bold">
                                  {appCount} {appCount === 1 ? "Applicant" : "Applicants"}
                                </span>
                              </div>
                              <h3 className="text-base font-bold text-[#202124] mt-2">
                                {int.title}
                              </h3>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedApplicantsIntId(
                                    expandedApplicantsIntId === int.id ? null : int.id
                                  )
                                }
                                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                                  expandedApplicantsIntId === int.id
                                    ? "bg-[#2563EB] text-white border-[#2563EB]"
                                    : "bg-white border-[#E5E7EB] text-[#2563EB] hover:border-[#2563EB]"
                                }`}
                              >
                                <Users className="w-3.5 h-3.5" />
                                <span>View Applicants ({appCount})</span>
                                {expandedApplicantsIntId === int.id ? (
                                  <ChevronUp className="w-3 h-3" />
                                ) : (
                                  <ChevronDown className="w-3 h-3" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditInternshipModal(int)}
                                className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E7EB] text-xs font-semibold text-[#202124] hover:border-[#2563EB] inline-flex items-center gap-1"
                              >
                                <Edit3 className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleInternshipStatus(int)}
                                className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E7EB] text-xs font-semibold text-[#202124] hover:border-[#2563EB]"
                              >
                                {int.status === "Open" ? "Close Listing" : "Reopen Listing"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteInternship(int.id)}
                                className="p-1.5 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50"
                                title="Delete Internship"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-[#666666] leading-relaxed">
                            {int.description}
                          </p>

                          <div className="flex flex-wrap gap-1.5">
                            {int.required_skills.map((sk) => (
                              <span
                                key={sk}
                                className="px-2 py-0.5 rounded bg-white border border-[#E5E7EB] text-[11px]"
                              >
                                {sk}
                              </span>
                            ))}
                          </div>

                          {/* EXPANDABLE INLINE APPLICANTS PANEL FOR THIS INTERNSHIP */}
                          {expandedApplicantsIntId === int.id && (
                            <div className="mt-4 pt-4 border-t border-[#E5E7EB] space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-3 rounded-lg border border-[#E5E7EB]">
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] block">
                                    Applicants Review
                                  </span>
                                  <h4 className="text-sm font-bold text-[#202124]">
                                    {int.title} • {appCount} {appCount === 1 ? "Application" : "Applications"}
                                  </h4>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedInternshipFilter(int.id);
                                    setActiveTab("applications");
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-[#EFF6FF] text-[#2563EB] text-xs font-semibold hover:bg-[#2563EB] hover:text-white inline-flex items-center gap-1 transition-colors self-start sm:self-auto"
                                >
                                  <span>Open in Applications Manager</span>
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {appCount === 0 ? (
                                <div className="p-8 text-center bg-white rounded-xl border border-[#E5E7EB] space-y-1">
                                  <Users className="w-6 h-6 text-[#999999] mx-auto" />
                                  <p className="text-xs font-semibold text-[#202124]">
                                    No Student Applications Received Yet
                                  </p>
                                  <p className="text-[11px] text-[#666666]">
                                    Applications submitted by students will appear here in real time.
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {applications
                                    .filter((a) => a.application.internship_id === int.id)
                                    .map((item) => (
                                      <div
                                        key={item.application.id}
                                        className="p-4 bg-white rounded-xl border border-[#E5E7EB] space-y-3"
                                      >
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                          <div className="flex items-start gap-3">
                                            <img
                                              src={item.studentUser.avatar_url || "/avatars/default.png"}
                                              alt={item.application.student_full_name}
                                              className="w-11 h-11 rounded-xl object-cover border border-[#E5E7EB] shrink-0"
                                            />
                                            <div>
                                              <h5 className="text-sm font-bold text-[#202124]">
                                                {item.application.student_full_name}
                                              </h5>
                                              <p className="text-xs text-[#555555]">
                                                {item.application.college_university} • {item.application.degree} ({item.application.department})
                                              </p>
                                              <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#666666] mt-0.5">
                                                <span>
                                                  Academic Year: <strong className="text-[#202124]">{item.application.current_academic_year}</strong>
                                                </span>
                                                <span>•</span>
                                                <span>
                                                  Applied: <strong className="text-[#202124]">{new Date(item.application.submitted_at).toLocaleDateString()}</strong>
                                                </span>
                                              </div>
                                            </div>
                                          </div>

                                          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                                            <select
                                              value={item.application.status}
                                              onChange={(e) =>
                                                handleUpdateApplicationStatus(
                                                  item.application.id,
                                                  e.target.value as ApplicationStatus
                                                )
                                              }
                                              className={`px-2.5 py-1 rounded-md border text-[11px] font-semibold ${statusBadgeColor(
                                                item.application.status
                                              )}`}
                                            >
                                              <option value="Submitted">Submitted</option>
                                              <option value="Under Review">Under Review</option>
                                              <option value="Shortlisted">Shortlisted</option>
                                              <option value="Accepted">Accepted</option>
                                              <option value="Rejected">Rejected</option>
                                              <option value="Withdrawn">Withdrawn</option>
                                            </select>

                                            <button
                                              type="button"
                                              onClick={() => openApplicationReviewModal(item)}
                                              className="px-3 py-1.5 rounded-lg bg-[#202124] text-white text-xs font-semibold hover:bg-black inline-flex items-center gap-1"
                                            >
                                              <Eye className="w-3.5 h-3.5" />
                                              <span>View Dossier</span>
                                            </button>
                                          </div>
                                        </div>

                                        {/* Research Interests & Technical Skills */}
                                        <div className="flex flex-wrap gap-2 text-[11px] pt-1">
                                          {item.application.research_interests?.length > 0 && (
                                            <div className="flex flex-wrap items-center gap-1">
                                              <span className="text-[#666666] font-medium">Interests:</span>
                                              {item.application.research_interests.map((ri) => (
                                                <span key={ri} className="px-2 py-0.5 rounded bg-[#F7F8FA] border border-[#E5E7EB] text-[#202124]">
                                                  {ri}
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                          {item.application.technical_skills?.length > 0 && (
                                            <div className="flex flex-wrap items-center gap-1">
                                              <span className="text-[#666666] font-medium">Skills:</span>
                                              {item.application.technical_skills.map((sk) => (
                                                <span key={sk} className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] font-medium">
                                                  {sk}
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                        </div>

                                        {/* Cover Message / SOP Excerpt */}
                                        {item.application.statement_of_purpose && (
                                          <div className="p-3 rounded-lg bg-[#F7F8FA] border border-[#E5E7EB] text-xs text-[#444444]">
                                            <span className="font-semibold text-[#202124] block mb-0.5">Cover Message / Motivation:</span>
                                            <p className="line-clamp-2 leading-relaxed whitespace-pre-line">
                                              {item.application.statement_of_purpose}
                                            </p>
                                          </div>
                                        )}

                                        {/* Resume / CV Link */}
                                        {item.application.resume_url && (
                                          <div className="flex items-center justify-between text-xs pt-1">
                                            <a
                                              href={item.application.resume_url}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="text-[#2563EB] font-semibold hover:underline inline-flex items-center gap-1"
                                            >
                                              <FileText className="w-3.5 h-3.5" />
                                              <span>Open Uploaded Resume PDF</span>
                                              <ArrowUpRight className="w-3 h-3" />
                                            </a>
                                            {item.application.scholar_private_notes && (
                                              <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                Has private notes
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: STUDENTS SECTION (ESSENTIAL FEATURE IN SECTION 12) */}
            {activeTab === "students" && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                    Applicant Student Directory
                  </span>
                  <h2 className="text-xl font-bold text-[#202124] mt-0.5">
                    Students Who Applied to Your Research Internships
                  </h2>
                  <p className="text-xs text-[#666666] mt-0.5">
                    Inspect student academic profiles, technical skills, resumes, and application
                    details.
                  </p>
                </div>

                {applications.length === 0 ? (
                  <div className="p-12 text-center bg-[#F7F8FA] rounded-xl border border-[#E5E7EB]">
                    <Users className="w-8 h-8 text-[#2563EB] mx-auto" />
                    <p className="text-sm font-bold text-[#202124] mt-2">
                      No Student Applicants Yet
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {applications.map((item) => (
                      <div
                        key={item.application.id}
                        className="card-corporate p-5 flex flex-col justify-between gap-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3.5">
                              <img
                                src={item.studentUser.avatar_url}
                                alt={item.application.student_full_name}
                                className="w-14 h-14 rounded-xl object-cover border border-[#E5E7EB]"
                              />
                              <div>
                                <h3 className="text-base font-bold text-[#202124]">
                                  {item.application.student_full_name}
                                </h3>
                                <p className="text-xs font-semibold text-[#202124]">
                                  {item.application.college_university}
                                </p>
                                <p className="text-[11px] text-[#666666]">
                                  {item.application.degree} • {item.application.department}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`px-2.5 py-1 rounded-md border text-[11px] font-semibold ${statusBadgeColor(
                                item.application.status
                              )}`}
                            >
                              {item.application.status}
                            </span>
                          </div>

                          <div className="p-3 rounded-lg bg-[#F7F8FA] border border-[#E5E7EB] text-xs">
                            <span className="text-[10px] font-bold uppercase text-[#666666] block">
                              Applied Internship
                            </span>
                            <p className="font-bold text-[#202124] mt-0.5">
                              {item.internship.title}
                            </p>
                            <p className="text-[11px] text-[#666666] mt-0.5">
                              Applied on{" "}
                              {new Date(item.application.submitted_at).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {item.application.technical_skills.map((sk) => (
                              <span
                                key={sk}
                                className="px-2 py-0.5 rounded bg-[#EFF6FF] border border-[#2563EB]/30 text-[11px] font-medium text-[#202124]"
                              >
                                {sk}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
                          <a
                            href={item.application.resume_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-[#2563EB] hover:underline"
                          >
                            View Resume / CV ↗
                          </a>
                          <button
                            type="button"
                            onClick={() => openApplicationReviewModal(item)}
                            className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8]"
                          >
                            View Application
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: APPLICATIONS MANAGEMENT TABLE */}
            {activeTab === "applications" && (() => {
              const displayedApplications = selectedInternshipFilter
                ? applications.filter(
                    (a) => a.application.internship_id === selectedInternshipFilter
                  )
                : applications;

              return (
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
                    <div>
                      <h2 className="text-xl font-bold text-[#202124]">
                        Application Review & Status Management
                      </h2>
                      <p className="text-xs text-[#666666] mt-0.5">
                        Shortlist, accept, reject, or add private evaluation notes for applications
                        submitted to your internships.
                      </p>
                    </div>

                    {internships.length > 0 && (
                      <div className="flex items-center gap-2 shrink-0">
                        <label className="text-xs font-semibold text-[#666666]">
                          Filter by Internship:
                        </label>
                        <select
                          value={selectedInternshipFilter || ""}
                          onChange={(e) => setSelectedInternshipFilter(e.target.value || null)}
                          className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-xs bg-white text-[#202124] font-medium"
                        >
                          <option value="">All Published Internships ({applications.length})</option>
                          {internships.map((int) => {
                            const count = applications.filter(
                              (a) => a.application.internship_id === int.id
                            ).length;
                            return (
                              <option key={int.id} value={int.id}>
                                {int.title} ({count})
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    )}
                  </div>

                  {displayedApplications.length === 0 ? (
                    <div className="p-12 text-center bg-[#F7F8FA] rounded-xl border border-[#E5E7EB] space-y-2">
                      <p className="text-sm font-bold text-[#202124]">
                        {selectedInternshipFilter
                          ? "No Applications for This Internship Yet"
                          : "No Applications Received Yet"}
                      </p>
                      {selectedInternshipFilter && (
                        <button
                          type="button"
                          onClick={() => setSelectedInternshipFilter(null)}
                          className="text-xs text-[#2563EB] font-semibold hover:underline"
                        >
                          View All Internships
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#E5E7EB] text-[11px] font-bold uppercase tracking-wider text-[#666666]">
                            <th className="py-3 px-4">Student</th>
                            <th className="py-3 px-4">Internship</th>
                            <th className="py-3 px-4">Submitted</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Quick Decision / Review</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E7EB] text-xs">
                          {displayedApplications.map((item) => (
                          <tr key={item.application.id} className="hover:bg-[#F7F8FA]">
                            <td className="py-4 px-4">
                              <div className="font-bold text-[#202124]">
                                {item.application.student_full_name}
                              </div>
                              <div className="text-[11px] text-[#666666]">
                                {item.application.college_university}
                              </div>
                            </td>
                            <td className="py-4 px-4 font-medium text-[#202124]">
                              {item.internship.title}
                            </td>
                            <td className="py-4 px-4 text-[#666666]">
                              {new Date(item.application.submitted_at).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-4">
                              <select
                                value={item.application.status}
                                onChange={(e) =>
                                  handleUpdateApplicationStatus(
                                    item.application.id,
                                    e.target.value as ApplicationStatus
                                  )
                                }
                                className={`px-2.5 py-1 rounded-md border text-[11px] font-semibold ${statusBadgeColor(
                                  item.application.status
                                )}`}
                              >
                                <option value="Submitted">Submitted</option>
                                <option value="Under Review">Under Review</option>
                                <option value="Shortlisted">Shortlisted</option>
                                <option value="Accepted">Accepted</option>
                                <option value="Rejected">Rejected</option>
                              </select>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateApplicationStatus(
                                      item.application.id,
                                      "Shortlisted"
                                    )
                                  }
                                  className="px-2.5 py-1 rounded bg-[#EFF6FF] text-[#2563EB] font-semibold hover:bg-[#2563EB] hover:text-white"
                                >
                                  Shortlist
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateApplicationStatus(item.application.id, "Accepted")
                                  }
                                  className="px-2.5 py-1 rounded bg-green-50 text-green-700 font-semibold hover:bg-green-600 hover:text-white"
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateApplicationStatus(item.application.id, "Rejected")
                                  }
                                  className="px-2.5 py-1 rounded bg-red-50 text-red-700 font-semibold hover:bg-red-600 hover:text-white"
                                >
                                  Reject
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openApplicationReviewModal(item)}
                                  className="px-3 py-1 rounded bg-[#202124] text-white font-semibold"
                                >
                                  Full Review
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}

            {/* TAB 6: SETTINGS */}
            {activeTab === "settings" && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-5">
                <h2 className="text-xl font-bold text-[#202124]">Scholar Account Settings</h2>
                {passwordMsg && (
                  <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-xs text-green-800">
                    {passwordMsg}
                  </div>
                )}
                <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1">
                      Update Account Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
                  >
                    Save New Password
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FULL STUDENT APPLICATION REVIEW MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#E5E7EB] pb-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={selectedApp.studentUser.avatar_url}
                  alt={selectedApp.application.student_full_name}
                  className="w-14 h-14 rounded-xl object-cover border border-[#E5E7EB]"
                />
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB]">
                    Student Application Dossier
                  </span>
                  <h3 className="text-xl font-extrabold text-[#202124]">
                    {selectedApp.application.student_full_name}
                  </h3>
                  <p className="text-xs text-[#666666]">
                    {selectedApp.application.college_university} • {selectedApp.application.degree}{" "}
                    ({selectedApp.application.department})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="p-2 rounded-lg border border-[#E5E7EB] text-[#666666]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-[#F7F8FA] p-4 rounded-xl border border-[#E5E7EB]">
              <div>
                <span className="text-[#666666] block">Email</span>
                <strong className="text-[#202124]">{selectedApp.application.student_email}</strong>
              </div>
              <div>
                <span className="text-[#666666] block">Phone</span>
                <strong className="text-[#202124]">{selectedApp.application.student_phone}</strong>
              </div>
              <div>
                <span className="text-[#666666] block">Academic Year</span>
                <strong className="text-[#202124]">
                  {selectedApp.application.current_academic_year}
                </strong>
              </div>
              <div>
                <span className="text-[#666666] block">Expected Availability</span>
                <strong className="text-[#202124]">
                  {selectedApp.application.expected_availability}
                </strong>
              </div>
              <div>
                <span className="text-[#666666] block">Preferred Duration</span>
                <strong className="text-[#202124]">
                  {selectedApp.application.preferred_duration}
                </strong>
              </div>
              <div>
                <span className="text-[#666666] block">Resume / CV</span>
                <a
                  href={selectedApp.application.resume_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#2563EB] font-bold hover:underline"
                >
                  Open Uploaded Resume PDF ↗
                </a>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold uppercase tracking-wider text-[#202124] block">
                  Why the student wants to join this research internship:
                </span>
                <p className="p-3.5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] text-[#202124] mt-1 leading-relaxed whitespace-pre-line">
                  {selectedApp.application.statement_of_purpose}
                </p>
              </div>

              <div>
                <span className="font-bold uppercase tracking-wider text-[#202124] block">
                  Relevant Experience & Projects:
                </span>
                <p className="p-3.5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] text-[#202124] mt-1 leading-relaxed whitespace-pre-line">
                  {selectedApp.application.relevant_experience}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {selectedApp.application.technical_skills.map((sk) => (
                  <span
                    key={sk}
                    className="px-2.5 py-1 rounded bg-[#EFF6FF] border border-[#2563EB]/30 font-semibold text-[#202124]"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            {/* Private Review Notes & Status Controls */}
            <div className="pt-4 border-t border-[#E5E7EB] space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#202124] mb-1">
                  Private Scholar Review Notes (Visible only to you)
                </label>
                <textarea
                  rows={2}
                  value={privateNotes}
                  onChange={(e) => setPrivateNotes(e.target.value)}
                  placeholder="Record interview impressions, technical assessment notes..."
                  className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={updatingApp}
                    onClick={() =>
                      handleUpdateApplicationStatus(
                        selectedApp.application.id,
                        "Under Review",
                        privateNotes
                      )
                    }
                    className="px-3.5 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-xs font-semibold"
                  >
                    Mark Under Review
                  </button>
                  <button
                    type="button"
                    disabled={updatingApp}
                    onClick={() =>
                      handleUpdateApplicationStatus(
                        selectedApp.application.id,
                        "Shortlisted",
                        privateNotes
                      )
                    }
                    className="px-3.5 py-2 rounded-lg bg-[#EFF6FF] border border-[#2563EB] text-[#2563EB] text-xs font-semibold"
                  >
                    Shortlist Student
                  </button>
                  <button
                    type="button"
                    disabled={updatingApp}
                    onClick={() =>
                      handleUpdateApplicationStatus(
                        selectedApp.application.id,
                        "Accepted",
                        privateNotes
                      )
                    }
                    className="px-4 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700"
                  >
                    Accept Application
                  </button>
                  <button
                    type="button"
                    disabled={updatingApp}
                    onClick={() =>
                      handleUpdateApplicationStatus(
                        selectedApp.application.id,
                        "Rejected",
                        privateNotes
                      )
                    }
                    className="px-3.5 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>

                <button
                  type="button"
                  disabled={updatingApp}
                  onClick={() =>
                    handleUpdateApplicationStatus(
                      selectedApp.application.id,
                      undefined,
                      privateNotes
                    )
                  }
                  className="px-4 py-2 rounded-lg bg-[#202124] text-white text-xs font-semibold"
                >
                  Save Private Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT INTERNSHIP MODAL */}
      {internshipModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <h3 className="text-lg font-extrabold text-[#202124]">
                {editingInternship
                  ? "Edit Research Internship Opportunity"
                  : "Publish New Research Internship Opportunity"}
              </h3>
              <button
                type="button"
                onClick={() => setInternshipModalOpen(false)}
                className="p-1.5 rounded-lg border border-[#E5E7EB] text-[#666666]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {intError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {intError}
              </div>
            )}

            <form onSubmit={handleSaveInternship} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">
                  Internship Title <span className="text-[#2563EB]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={intTitle}
                  onChange={(e) => setIntTitle(e.target.value)}
                  placeholder="e.g., Research Intern — Deep Learning for Genomic Sequence Modeling"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-[#202124]">
                      Academic Domain
                    </label>
                    <span className="text-[10px] font-semibold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#2563EB]/20">
                      Verified Profile
                    </span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={
                      domains.find(
                        (d) =>
                          d.id ===
                          (editingInternship
                            ? intDomainId
                            : session?.scholarProfile?.domain_id || intDomainId)
                      )?.name ||
                      session?.scholarProfile?.research_field ||
                      "Academic Domain"
                    }
                    className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB] text-xs bg-[#F7F8FA] text-[#202124] font-medium cursor-default"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-[#202124]">
                      Specialization
                    </label>
                    <span className="text-[10px] font-semibold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#2563EB]/20">
                      Auto-Linked
                    </span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={
                      specializations.find(
                        (s) =>
                          s.id ===
                          (editingInternship
                            ? intSpecId
                            : session?.scholarProfile?.specialization_id || intSpecId)
                      )?.name ||
                      session?.scholarProfile?.specialization ||
                      "Specialization"
                    }
                    className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB] text-xs bg-[#F7F8FA] text-[#202124] font-medium cursor-default"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">
                  Research Project Description <span className="text-[#2563EB]">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={intDesc}
                  onChange={(e) => setIntDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                />
              </div>

              <TagInput
                label="Required Student Skills"
                required
                values={intSkills}
                onChange={setIntSkills}
              />

              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">
                  Eligibility Criteria <span className="text-[#2563EB]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={intEligibility}
                  onChange={(e) => setIntEligibility(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    required
                    value={intDuration}
                    onChange={(e) => setIntDuration(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Available Positions
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={intPositions}
                    onChange={(e) => setIntPositions(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Internship Mode
                  </label>
                  <select
                    value={intMode}
                    onChange={(e) =>
                      setIntMode(e.target.value as "Remote" | "On-site" | "Hybrid")
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs bg-white"
                  >
                    <option value="Remote">Remote</option>
                    <option value="On-site">On-site</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Application Deadline
                  </label>
                  <input
                    type="date"
                    required
                    value={intDeadline}
                    onChange={(e) => setIntDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Stipend
                  </label>
                  <input
                    type="text"
                    value={intStipend}
                    onChange={(e) => setIntStipend(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Status
                  </label>
                  <select
                    value={intStatus}
                    onChange={(e) =>
                      setIntStatus(e.target.value as "Open" | "Closed" | "Draft")
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs bg-white"
                  >
                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setInternshipModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-[#666666]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingInt}
                  className="px-6 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8]"
                >
                  {savingInt ? "Saving..." : "Save Internship"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScholarDashboardPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center text-sm text-[#666666]">Loading...</div>}>
      <ScholarDashboardContent initialTab="overview" />
    </Suspense>
  );
}

