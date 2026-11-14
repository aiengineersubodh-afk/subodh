"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  Bookmark,
  Compass,
  Crown,
  FileText,
  FolderGit2,
  LayoutDashboard,
  Lock,
  LogOut,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { EnrichedApplication, EnrichedScholar } from "@/types/database";
import PremiumUpgradeModal from "@/components/PremiumUpgradeModal";
import {
  ApplicationStatusBadge,
  ViewApplicationModal,
} from "@/components/ApplicationStatusModal";

type StudentTab =
  | "overview"
  | "applications"
  | "saved"
  | "profile"
  | "settings";

function StudentDashboardContent({
  initialTab = "overview",
}: {
  initialTab?: StudentTab;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, loading: authLoading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<StudentTab>(initialTab);
  const [applications, setApplications] = useState<EnrichedApplication[]>([]);
  const [savedScholars, setSavedScholars] = useState<EnrichedScholar[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);

  // Filters on My Applications
  const [appSearch, setAppSearch] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState("");
  const [selectedApp, setSelectedApp] = useState<EnrichedApplication | null>(
    null
  );
  const [withdrawingId, setWithdrawingId] = useState("");

  // Settings Password Change
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordErr, setPasswordErr] = useState("");

  useEffect(() => {
    const t = searchParams.get("tab") as StudentTab | null;
    if (
      t &&
      ["overview", "applications", "saved", "profile", "settings"].includes(t)
    ) {
      setActiveTab(t);
    }
  }, [searchParams]);

  const loadDashboardData = async () => {
    setLoadingData(true);
    try {
      const [appsRes, pubRes, savedRes] = await Promise.all([
        fetch("/api/applications"),
        fetch("/api/public"),
        fetch("/api/saved-scholars"),
      ]);
      const appsJson = await appsRes.json();
      const pubJson = await pubRes.json();
      const savedJson = await savedRes.json();

      setApplications(appsJson.applications || []);
      const savedIds: string[] = savedJson.savedScholarIds || [];
      const allScholars: EnrichedScholar[] = pubJson.scholars || [];
      setSavedScholars(
        allScholars.filter((s) => savedIds.includes(s.scholar.id))
      );
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!session) {
        router.push("/login");
      } else if (session.user.role === "scholar") {
        router.push("/dashboard/scholar");
      } else if (session.user.role === "admin") {
        router.push("/admin");
      } else if (!session.user.onboarding_completed) {
        router.push("/onboarding/student");
      } else {
        loadDashboardData();
      }
    }
  }, [authLoading, session, router]);

  const handleWithdraw = async (applicationId: string) => {
    if (
      !confirm(
        "Are you sure you want to withdraw this internship application?"
      )
    )
      return;
    setWithdrawingId(applicationId);
    try {
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, status: "Withdrawn" }),
      });
      if (res.ok) {
        await loadDashboardData();
        if (selectedApp?.application.id === applicationId) {
          setSelectedApp(null);
        }
      }
    } finally {
      setWithdrawingId("");
    }
  };

  const handleRemoveSaved = async (scholarId: string) => {
    await fetch("/api/saved-scholars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scholarProfileId: scholarId }),
    });
    setSavedScholars((prev) => prev.filter((s) => s.scholar.id !== scholarId));
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg("");
    setPasswordErr("");
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      setPasswordErr(data.error || "Failed to update password.");
    } else {
      setPasswordMsg("Password updated successfully.");
      setNewPassword("");
    }
  };

  // Compute Profile Completion (projects are optional and do not penalize completion)
  const profileCompletion = useMemo(() => {
    if (!session) return 0;
    const sp = session.studentProfile;
    if (!sp) return 30;
    let points = 45;
    if (sp.college_university) points += 15;
    if (sp.skills.length > 0) points += 15;
    if (sp.academic_interests.length > 0) points += 15;
    if (sp.resume_url) points += 10;
    return Math.min(100, points);
  }, [session]);

  const filteredApplications = useMemo(() => {
    return applications.filter(({ application, internship, scholarUser }) => {
      if (appStatusFilter && application.status !== appStatusFilter)
        return false;
      if (appSearch.trim()) {
        const q = appSearch.toLowerCase();
        const matchTitle = internship.title.toLowerCase().includes(q);
        const matchScholar = scholarUser.full_name.toLowerCase().includes(q);
        if (!matchTitle && !matchScholar) return false;
      }
      return true;
    });
  }, [applications, appStatusFilter, appSearch]);

  if (authLoading || !session) {
    return (
      <div className="p-16 text-center text-sm text-[#666666]">
        Loading Student Dashboard...
      </div>
    );
  }

  const pendingCount = applications.filter(
    (a) =>
      a.application.status === "Submitted" ||
      a.application.status === "Under Review" ||
      a.application.status === "Shortlisted"
  ).length;
  const acceptedCount = applications.filter(
    (a) => a.application.status === "Accepted"
  ).length;

  const studentProjects = session.studentProfile?.projects || [];
  const hasPremium = Boolean(session.hasPremiumAccess);
  const currentSubscription = session.subscription;

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* STUDENT SIDEBAR */}
          <aside className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-6 sticky top-24">
              {/* Student Mini Card */}
              <div className="flex items-center gap-3 pb-4 border-b border-[#E5E7EB]">
                <img
                  src={session.user.avatar_url}
                  alt={session.user.full_name}
                  className="w-12 h-12 rounded-xl object-cover border border-[#E5E7EB]"
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#202124] truncate">
                    {session.user.full_name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {hasPremium ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] text-[10px] font-bold">
                        <Crown className="w-3 h-3" /> Premium Member
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#2563EB] font-semibold">
                        Free Student Account
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#666666] truncate mt-0.5">
                    {session.studentProfile?.college_university ||
                      session.user.email}
                  </p>
                </div>
              </div>

              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    activeTab === "overview"
                      ? "bg-[#202124] text-white"
                      : "text-[#666666] hover:bg-[#F7F8FA] hover:text-[#202124]"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-[#2563EB]" />
                  <span>Dashboard</span>
                </button>

                <Link
                  href="/explore"
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#666666] hover:bg-[#F7F8FA] hover:text-[#202124] transition-colors"
                >
                  <Compass className="w-4 h-4 text-[#2563EB]" />
                  <span>Explore Researchers</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setActiveTab("applications")}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    activeTab === "applications"
                      ? "bg-[#202124] text-white"
                      : "text-[#666666] hover:bg-[#F7F8FA] hover:text-[#202124]"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-[#2563EB]" />
                    <span>My Applications</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] text-[10px] font-bold">
                    {applications.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("saved")}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    activeTab === "saved"
                      ? "bg-[#202124] text-white"
                      : "text-[#666666] hover:bg-[#F7F8FA] hover:text-[#202124]"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Bookmark className="w-4 h-4 text-[#2563EB]" />
                    <span>Saved Scholars</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#F7F8FA] text-[#202124] text-[10px] font-bold">
                    {savedScholars.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("profile")}
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
                  onClick={() => setActiveTab("settings")}
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

              {/* Premium Upgrade Banner inside Sidebar */}
              <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#2563EB]/30 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#202124]">
                  <Crown className="w-4 h-4 text-[#2563EB]" />
                  <span>
                    {hasPremium ? "STARSKY Premium" : "Upgrade to Premium"}
                  </span>
                </div>
                {hasPremium && currentSubscription ? (
                  <p className="text-[11px] text-[#666666] leading-relaxed">
                    Active ({currentSubscription.plan_name}) until{" "}
                    {new Date(
                      currentSubscription.expiry_date
                    ).toLocaleDateString()}
                    . Full PhD directory & direct contact unlocked.
                  </p>
                ) : (
                  <>
                    <p className="text-[11px] text-[#666666] leading-relaxed">
                      Unlock the full PhD scholar directory and message scholars
                      directly.
                    </p>
                    <button
                      type="button"
                      onClick={() => setPremiumModalOpen(true)}
                      className="w-full py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors"
                    >
                      Upgrade to Premium
                    </button>
                  </>
                )}
              </div>

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
            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                      Student Workspace
                    </span>
                    <h1 className="text-2xl font-extrabold text-[#202124] mt-0.5">
                      Welcome back, {session.user.full_name}
                    </h1>
                    <p className="text-xs text-[#666666] mt-1">
                      Track your research internship applications and discover
                      verified doctoral mentors.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {!hasPremium && (
                      <button
                        type="button"
                        onClick={() => setPremiumModalOpen(true)}
                        className="px-4 py-2.5 rounded-xl border border-[#2563EB] bg-[#EFF6FF] text-[#2563EB] text-xs font-bold hover:bg-[#2563EB] hover:text-white transition-colors inline-flex items-center gap-1.5"
                      >
                        <Crown className="w-3.5 h-3.5" />
                        <span>Unlock Full Directory</span>
                      </button>
                    )}
                    <Link
                      href="/explore"
                      className="px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors"
                    >
                      Explore Research Internships →
                    </Link>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-[#E5E7EB]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666]">
                      Profile Completion
                    </span>
                    <p className="text-2xl font-extrabold text-[#2563EB] mt-2">
                      {profileCompletion}%
                    </p>
                    <div className="w-full h-1.5 bg-[#F7F8FA] rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-[#2563EB]"
                        style={{ width: `${profileCompletion}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-[#E5E7EB]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666]">
                      Total Applications
                    </span>
                    <p className="text-2xl font-extrabold text-[#202124] mt-2">
                      {applications.length}
                    </p>
                    <p className="text-[11px] text-[#666666] mt-1">
                      Submitted internships
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-[#E5E7EB]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666]">
                      Pending Review
                    </span>
                    <p className="text-2xl font-extrabold text-[#202124] mt-2">
                      {pendingCount}
                    </p>
                    <p className="text-[11px] text-[#666666] mt-1">
                      Active evaluations
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-[#E5E7EB]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666]">
                      Accepted Offers
                    </span>
                    <p className="text-2xl font-extrabold text-green-700 mt-2">
                      {acceptedCount}
                    </p>
                    <p className="text-[11px] text-[#666666] mt-1">
                      Confirmed mentorships
                    </p>
                  </div>
                </div>

                {/* Recent Activity / Recent Applications */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-[#202124]">
                      Recent Internship Applications
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab("applications")}
                      className="text-xs font-semibold text-[#2563EB] hover:underline"
                    >
                      View All Applications →
                    </button>
                  </div>

                  {applications.length === 0 ? (
                    <div className="p-8 text-center bg-[#F7F8FA] rounded-xl border border-[#E5E7EB]">
                      <p className="text-xs text-[#666666]">
                        You haven’t submitted any research internship
                        applications yet.
                      </p>
                      <Link
                        href="/explore"
                        className="inline-block mt-3 px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
                      >
                        Discover PhD Scholars
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {applications.slice(0, 4).map((item) => (
                        <div
                          key={item.application.id}
                          className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <ApplicationStatusBadge
                                status={item.application.status}
                              />
                              <span className="text-[11px] text-[#666666]">
                                Applied{" "}
                                {new Date(
                                  item.application.submitted_at
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-[#202124] mt-1.5">
                              {item.internship.title}
                            </h3>
                            <p className="text-xs text-[#666666]">
                              Mentor:{" "}
                              <strong>{item.scholarUser.full_name}</strong> (
                              {item.scholar.university_institution})
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedApp(item)}
                            className="px-3.5 py-2 rounded-lg bg-white border border-[#E5E7EB] text-xs font-semibold text-[#202124] hover:border-[#2563EB] shrink-0"
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

            {/* TAB 2: MY APPLICATIONS */}
            {activeTab === "applications" && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#202124]">
                      My Internship Applications
                    </h2>
                    <p className="text-xs text-[#666666] mt-0.5">
                      Track your application statuses, inspect submitted
                      statements, or withdraw pending applications.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={appSearch}
                        onChange={(e) => setAppSearch(e.target.value)}
                        placeholder="Search scholar or title..."
                        className="pl-8 pr-3 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                      />
                    </div>
                    <select
                      value={appStatusFilter}
                      onChange={(e) => setAppStatusFilter(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs bg-white"
                    >
                      <option value="">All Statuses</option>
                      <option value="Submitted">Submitted</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Shortlisted">Shortlisted</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Withdrawn">Withdrawn</option>
                    </select>
                  </div>
                </div>

                {loadingData ? (
                  <div className="p-12 text-center text-xs text-[#666666]">
                    Loading applications...
                  </div>
                ) : filteredApplications.length === 0 ? (
                  <div className="p-12 text-center bg-[#F7F8FA] rounded-xl border border-[#E5E7EB]">
                    <p className="text-sm font-bold text-[#202124]">
                      No Applications Found
                    </p>
                    <p className="text-xs text-[#666666] mt-1">
                      Explore research domains to apply for internships under
                      verified PhD scholars.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#E5E7EB] text-[11px] font-bold uppercase tracking-wider text-[#666666]">
                          <th className="py-3 px-4">PhD Scholar</th>
                          <th className="py-3 px-4">Internship Title</th>
                          <th className="py-3 px-4">Application Date</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E7EB] text-xs">
                        {filteredApplications.map((item) => {
                          const canWithdraw =
                            item.application.status === "Submitted" ||
                            item.application.status === "Under Review" ||
                            item.application.status === "Shortlisted";
                          return (
                            <tr
                              key={item.application.id}
                              className="hover:bg-[#F7F8FA]"
                            >
                              <td className="py-4 px-4">
                                <div className="font-bold text-[#202124]">
                                  {item.scholarUser.full_name}
                                </div>
                                <div className="text-[11px] text-[#666666]">
                                  {item.scholar.university_institution}
                                </div>
                              </td>
                              <td className="py-4 px-4 font-medium text-[#202124]">
                                {item.internship.title}
                              </td>
                              <td className="py-4 px-4 text-[#666666]">
                                {new Date(
                                  item.application.submitted_at
                                ).toLocaleDateString()}
                              </td>
                              <td className="py-4 px-4">
                                <ApplicationStatusBadge
                                  status={item.application.status}
                                />
                              </td>
                              <td className="py-4 px-4 text-right">
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedApp(item)}
                                    className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-xs font-semibold text-[#202124] hover:border-[#2563EB]"
                                  >
                                    View Application
                                  </button>
                                  {canWithdraw && (
                                    <button
                                      type="button"
                                      disabled={
                                        withdrawingId === item.application.id
                                      }
                                      onClick={() =>
                                        handleWithdraw(item.application.id)
                                      }
                                      className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-700 hover:bg-red-100"
                                    >
                                      Withdraw
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: SAVED SCHOLARS */}
            {activeTab === "saved" && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-[#202124]">
                    Saved PhD Scholars
                  </h2>
                  <p className="text-xs text-[#666666] mt-0.5">
                    Bookmarked doctoral researchers for quick access to their
                    internships.
                  </p>
                </div>

                {savedScholars.length === 0 ? (
                  <div className="p-12 text-center bg-[#F7F8FA] rounded-xl border border-[#E5E7EB]">
                    <Bookmark className="w-8 h-8 text-[#2563EB] mx-auto" />
                    <p className="text-sm font-bold text-[#202124] mt-2">
                      No Saved Scholars Yet
                    </p>
                    <Link
                      href="/explore?tab=scholars"
                      className="inline-block mt-3 px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
                    >
                      Browse Scholar Directory
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedScholars.map(
                      ({ scholar, profile, internships: openInts }) => (
                        <div
                          key={scholar.id}
                          className="p-5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] flex flex-col justify-between gap-4"
                        >
                          <div className="flex items-start gap-3.5">
                            <img
                              src={profile.avatar_url}
                              alt={profile.full_name}
                              className="w-14 h-14 rounded-xl object-cover border border-[#E5E7EB]"
                            />
                            <div>
                              <h3 className="text-sm font-bold text-[#202124]">
                                {profile.full_name}
                              </h3>
                              <p className="text-xs text-[#2563EB] font-medium">
                                {scholar.specialization}
                              </p>
                              <p className="text-[11px] text-[#666666]">
                                {scholar.university_institution}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
                            <span className="text-xs text-[#666666]">
                              {openInts.length} Open Internships
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleRemoveSaved(scholar.id)}
                                className="p-2 rounded-lg border border-[#E5E7EB] bg-white text-red-600 hover:bg-red-50"
                                title="Remove Bookmark"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <Link
                                href={`/scholars/${scholar.id}`}
                                className="px-3.5 py-1.5 rounded-lg bg-[#202124] text-white text-xs font-semibold hover:bg-[#2563EB]"
                              >
                                View Profile
                              </Link>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: MY PROFILE */}
            {activeTab === "profile" && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#202124]">
                      My Student Profile
                    </h2>
                    <p className="text-xs text-[#666666]">
                      Your academic details, technical skills, projects, and CV
                      shared with PhD scholars.
                    </p>
                  </div>
                  <Link
                    href="/onboarding/student"
                    className="px-5 py-2.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] shrink-0"
                  >
                    Edit Complete Profile & Projects
                  </Link>
                </div>

                {session.studentProfile ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] space-y-2">
                      <span className="font-bold uppercase tracking-wider text-[#666666] block">
                        Academic Institution
                      </span>
                      <p className="text-sm font-bold text-[#202124]">
                        {session.studentProfile.college_university}
                      </p>
                      <p className="text-[#666666]">
                        {session.studentProfile.degree} in{" "}
                        {session.studentProfile.department}
                      </p>
                      <p className="text-[#666666]">
                        {session.studentProfile.current_year_semester} •
                        Graduating {session.studentProfile.graduation_year}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] space-y-2">
                      <span className="font-bold uppercase tracking-wider text-[#666666] block">
                        Contact & Location
                      </span>
                      <p className="text-sm font-bold text-[#202124]">
                        {session.user.email}
                      </p>
                      <p className="text-[#666666]">{session.user.phone}</p>
                      <p className="text-[#666666]">
                        {session.user.city}, {session.user.state},{" "}
                        {session.user.country}
                      </p>
                    </div>

                    <div className="md:col-span-2 p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] space-y-2">
                      <span className="font-bold uppercase tracking-wider text-[#666666] block">
                        Skills & Programming Languages
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {[
                          ...session.studentProfile.skills,
                          ...session.studentProfile.programming_languages,
                        ].map((s, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded bg-white border border-[#E5E7EB] text-[#202124] font-medium"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Structured Student Projects Section */}
                    <div className="md:col-span-2 p-5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-bold uppercase tracking-wider text-[#666666] flex items-center gap-1.5">
                          <FolderGit2 className="w-4 h-4 text-[#2563EB]" />
                          Previous Projects ({studentProjects.length})
                        </span>
                        <Link
                          href="/onboarding/student"
                          className="text-xs font-semibold text-[#2563EB] hover:underline"
                        >
                          + Add or Edit Projects
                        </Link>
                      </div>

                      {studentProjects.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {studentProjects.map((proj, idx) => (
                            <div
                              key={proj.id || idx}
                              className="p-4 rounded-xl bg-white border border-[#E5E7EB] space-y-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">
                                    Project {idx + 1}
                                  </span>
                                  <h4 className="text-sm font-bold text-[#202124]">
                                    {proj.title}
                                  </h4>
                                </div>
                                {proj.duration && (
                                  <span className="px-2 py-0.5 rounded bg-[#F7F8FA] border border-[#E5E7EB] text-[10px] font-medium text-[#666666]">
                                    {proj.duration}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#666666] leading-relaxed">
                                {proj.description}
                              </p>
                              {proj.technologies && (
                                <p className="text-[11px] text-[#202124]">
                                  <strong>Technologies:</strong>{" "}
                                  {proj.technologies}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-3 pt-1">
                                {proj.project_url && (
                                  <a
                                    href={proj.project_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2563EB] hover:underline"
                                  >
                                    Project Link{" "}
                                    <ArrowUpRight className="w-3 h-3" />
                                  </a>
                                )}
                                {proj.github_url && (
                                  <a
                                    href={proj.github_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#202124] hover:text-[#2563EB] hover:underline"
                                  >
                                    GitHub Repo{" "}
                                    <ArrowUpRight className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : session.studentProfile.previous_projects ? (
                        <p className="text-[#202124] whitespace-pre-line leading-relaxed">
                          {session.studentProfile.previous_projects}
                        </p>
                      ) : (
                        <p className="text-[#666666] italic">
                          No previous projects added yet (optional). You can add
                          multiple projects anytime via Edit Profile.
                        </p>
                      )}

                      {session.studentProfile.research_experience && (
                        <div className="pt-3 border-t border-[#E5E7EB]">
                          <span className="font-bold uppercase tracking-wider text-[#666666] block mb-1">
                            Research Experience
                          </span>
                          <p className="text-[#202124] whitespace-pre-line leading-relaxed">
                            {session.studentProfile.research_experience}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-[#F7F8FA] rounded-xl">
                    <p className="text-sm font-bold text-[#202124]">
                      Complete your student onboarding profile to apply faster.
                    </p>
                    <Link
                      href="/onboarding/student"
                      className="inline-block mt-3 px-5 py-2.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
                    >
                      Complete Profile Now
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: SETTINGS */}
            {activeTab === "settings" && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#202124]">
                    Account Settings & Security
                  </h2>
                  <p className="text-xs text-[#666666] mt-0.5">
                    Update your account password and view your STARSKY
                    membership status.
                  </p>
                </div>

                {/* Membership Status Card */}
                <div className="p-5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB] flex items-center gap-1.5">
                      {hasPremium ? (
                        <>
                          <ShieldCheck className="w-4 h-4" /> Active STARSKY
                          Premium Membership
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" /> Free Student Access
                        </>
                      )}
                    </span>
                    <p className="text-sm font-bold text-[#202124]">
                      {hasPremium && currentSubscription
                        ? `${currentSubscription.plan_name} (Expires ${new Date(
                            currentSubscription.expiry_date
                          ).toLocaleDateString()})`
                        : currentSubscription?.status === "pending_approval"
                        ? `Pending Approval: ${currentSubscription.plan_name}`
                        : "Free Directory Preview (First 5 Verified PhD Scholars)"}
                    </p>
                    <p className="text-xs text-[#666666]">
                      {hasPremium
                        ? "You have unlimited access to the full PhD scholar directory and direct scholar contact."
                        : "Upgrade to STARSKY Premium to unlock all PhD scholars and direct messaging."}
                    </p>
                  </div>
                  {!hasPremium && (
                    <button
                      type="button"
                      onClick={() => setPremiumModalOpen(true)}
                      className="px-4 py-2.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] shrink-0"
                    >
                      Upgrade to Premium
                    </button>
                  )}
                </div>

                {passwordMsg && (
                  <div className="p-3.5 rounded-lg bg-green-50 border border-green-200 text-xs text-green-800">
                    {passwordMsg}
                  </div>
                )}
                {passwordErr && (
                  <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                    {passwordErr}
                  </div>
                )}

                <form
                  onSubmit={handlePasswordChange}
                  className="max-w-md space-y-4"
                >
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                      New Password
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
                    className="px-5 py-2.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8]"
                  >
                    Update Password
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      <PremiumUpgradeModal
        isOpen={premiumModalOpen}
        onClose={() => setPremiumModalOpen(false)}
      />

      {/* VIEW APPLICATION DETAILS MODAL */}
      <ViewApplicationModal
        applicationData={selectedApp}
        onClose={() => setSelectedApp(null)}
        onWithdraw={handleWithdraw}
        withdrawingId={withdrawingId}
      />
    </div>
  );
}

export default function StudentDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="p-16 text-center text-sm text-[#666666]">
          Loading...
        </div>
      }
    >
      <StudentDashboardContent initialTab="overview" />
    </Suspense>
  );
}
