"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Compass,
  Crown,
  Edit3,
  FileText,
  Globe,
  GraduationCap,
  Home,
  Info,
  Layers,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  Megaphone,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { InternationalPhoneInput } from "@/components/PhoneInput";
import {
  AcademicDomain,
  ActivityLog,
  AdminPermissionKey,
  AdminRoleRecord,
  Announcement,
  CareerListing,
  ContactMessage,
  EnrichedApplication,
  EnrichedInternship,
  EnrichedScholar,
  Profile,
  Specialization,
  StudentProfile,
  SubscriptionPlan,
  SubscriptionTransaction,
  Testimonial,
  UserSubscription,
  WebsiteSettings,
} from "@/types/database";

type AdminSection =
  | "dashboard"
  | "students"
  | "scholars"
  | "premium"
  | "internships"
  | "applications"
  | "domains"
  | "specializations"
  | "home_cms"
  | "about_cms"
  | "careers"
  | "messages"
  | "testimonials"
  | "announcements"
  | "settings"
  | "admins"
  | "logs";

interface AdminPayload {
  overview: {
    totalUsers: number;
    totalStudents: number;
    totalScholars: number;
    approvedScholars: number;
    pendingScholars: number;
    totalActiveInternships: number;
    totalInternships: number;
    totalApplications: number;
    pendingApplications: number;
    acceptedApplications: number;
    totalContactMessages: number;
    unreadContactMessages: number;
    premiumMembersCount?: number;
    pendingSubscriptionsCount?: number;
  };
  students: Array<{
    profile: Profile;
    studentProfile?: StudentProfile;
    subscription?: UserSubscription | null;
    isPremium?: boolean;
    applicationsCount: number;
  }>;
  scholars: EnrichedScholar[];
  internships: EnrichedInternship[];
  applications: EnrichedApplication[];
  domains: AcademicDomain[];
  specializations: Specialization[];
  subscriptionPlans: SubscriptionPlan[];
  userSubscriptions: UserSubscription[];
  subscriptionTransactions: SubscriptionTransaction[];
  careers: CareerListing[];
  contactMessages: ContactMessage[];
  testimonials: Testimonial[];
  announcements: Announcement[];
  settings: WebsiteSettings;
  admins: Array<{
    profile: Profile;
    adminRole?: AdminRoleRecord;
  }>;
  activityLogs: ActivityLog[];
}

function AdminPanelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, loading: authLoading, logout, refreshSession } = useAuth();

  const [section, setSection] = useState<AdminSection>("dashboard");
  const [data, setData] = useState<AdminPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  // Filters
  const [userSearch, setUserSearch] = useState("");
  const [appStudentFilter, setAppStudentFilter] = useState("");
  const [appScholarFilter, setAppScholarFilter] = useState("");
  const [appInternshipFilter, setAppInternshipFilter] = useState("");

  // Edit User Modal
  const [editingUser, setEditingUser] = useState<{
    profileId: string;
    full_name: string;
    phone: string;
    city: string;
    state: string;
    institution: string;
    department: string;
  } | null>(null);

  // Domain Form State
  const [domId, setDomId] = useState("");
  const [domName, setDomName] = useState("");
  const [domDesc, setDomDesc] = useState("");
  const [domIcon, setDomIcon] = useState("Cpu");
  const [domImage, setDomImage] = useState("");
  const [domOrder, setDomOrder] = useState(1);

  // Specialization Form State
  const [specId, setSpecId] = useState("");
  const [specDomId, setSpecDomId] = useState("dom-engineering");
  const [specName, setSpecName] = useState("");
  const [specDesc, setSpecDesc] = useState("");
  const [specOrder, setSpecOrder] = useState(1);

  // CMS & Settings State
  const [cmsSettings, setCmsSettings] = useState<WebsiteSettings | null>(null);

  // Career Form
  const [careerId, setCareerId] = useState("");
  const [careerTitle, setCareerTitle] = useState("");
  const [careerDept, setCareerDept] = useState("");
  const [careerLoc, setCareerLoc] = useState("");
  const [careerType, setCareerType] = useState("Full-time");
  const [careerDesc, setCareerDesc] = useState("");
  const [careerReqs, setCareerReqs] = useState("");
  const [careerClosing, setCareerClosing] = useState("2027-04-30");

  // Testimonial Form
  const [testAuthor, setTestAuthor] = useState("");
  const [testRole, setTestRole] = useState("");
  const [testInst, setTestInst] = useState("");
  const [testQuote, setTestQuote] = useState("");

  // Announcement Form
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annAudience, setAnnAudience] = useState<"all" | "students" | "scholars">("all");
  const [annPriority, setAnnPriority] = useState<"normal" | "important" | "urgent">("normal");

  // New Admin Form
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPass, setNewAdminPass] = useState("");
  const [newAdminTitle, setNewAdminTitle] = useState("Platform Moderator");
  const [newAdminPerms, setNewAdminPerms] = useState<AdminPermissionKey[]>([
    "manage_users",
    "verify_scholars",
    "manage_domains",
    "manage_internships",
    "manage_applications",
    "manage_cms",
  ]);

  // Premium Management State
  const [premiumSearch, setPremiumSearch] = useState("");
  const [premiumFilter, setPremiumFilter] = useState<"all" | "premium" | "pending" | "free">("all");
  const [selectedPlanForGrant, setSelectedPlanForGrant] = useState("plan-quarterly");
  const [editPlanId, setEditPlanId] = useState("");
  const [editPlanName, setEditPlanName] = useState("");
  const [editPlanCycle, setEditPlanCycle] = useState<"monthly" | "quarterly" | "yearly">("monthly");
  const [editPlanPrice, setEditPlanPrice] = useState(499);
  const [editPlanDays, setEditPlanDays] = useState(30);
  const [editPlanDesc, setEditPlanDesc] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin", { cache: "no-store" });
      if (res.ok) {
        const json: AdminPayload = await res.json();
        setData(json);
        setCmsSettings(json.settings);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const s = searchParams.get("section") as AdminSection | null;
    if (s) setSection(s);
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading) {
      if (!session || session.user.role !== "admin") {
        router.push("/admin/login");
      } else {
        fetchAdminData();
      }
    }
  }, [authLoading, session, router]);

  const callAdminAction = async (
    action: string,
    payload: Record<string, unknown>,
    successMsg: string
  ) => {
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
    });
    const resJson = await res.json();
    if (!res.ok) {
      alert(resJson.error || "Operation failed.");
      return false;
    }
    showToast(successMsg);
    await fetchAdminData();
    await refreshSession();
    return true;
  };

  if (authLoading || loading || !data || !cmsSettings) {
    return (
      <div className="p-16 text-center text-sm text-[#666666]">
        Loading STARSKY Administrative Control Center...
      </div>
    );
  }

  const sidebarItems: Array<{ id: AdminSection; label: string; icon: React.ReactNode }> = [
    { id: "dashboard", label: "1. Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "students", label: "2. Students", icon: <Users className="w-4 h-4" /> },
    { id: "scholars", label: "3. PhD Scholars", icon: <GraduationCap className="w-4 h-4" /> },
    {
      id: "premium",
      label: "4. Premium Management",
      icon: <Crown className="w-4 h-4" />,
    },
    {
      id: "internships",
      label: "5. Internship Management",
      icon: <BookOpen className="w-4 h-4" />,
    },
    { id: "applications", label: "6. Applications", icon: <FileText className="w-4 h-4" /> },
    { id: "domains", label: "7. Academic Domains", icon: <Compass className="w-4 h-4" /> },
    { id: "specializations", label: "8. Specializations", icon: <Layers className="w-4 h-4" /> },
    { id: "home_cms", label: "9. Home Page Management", icon: <Home className="w-4 h-4" /> },
    { id: "about_cms", label: "10. About Us Management", icon: <Info className="w-4 h-4" /> },
    { id: "careers", label: "11. Careers Management", icon: <Briefcase className="w-4 h-4" /> },
    { id: "messages", label: "12. Contact Messages", icon: <Mail className="w-4 h-4" /> },
    { id: "testimonials", label: "13. Testimonials", icon: <Star className="w-4 h-4" /> },
    { id: "announcements", label: "14. Announcements", icon: <Megaphone className="w-4 h-4" /> },
    { id: "settings", label: "15. Website Settings", icon: <Settings className="w-4 h-4" /> },
    { id: "admins", label: "16. Admin Management", icon: <ShieldCheck className="w-4 h-4" /> },
    { id: "logs", label: "17. Activity Logs", icon: <Activity className="w-4 h-4" /> },
  ];

  const ov = data.overview;

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#202124] text-white px-5 py-3 rounded-xl shadow-xl border border-[#2563EB] flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
          <span>{toast}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 17-ITEM ADMIN SIDEBAR */}
          <aside className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-4 sticky top-24">
              <div className="p-3 rounded-xl bg-[#202124] text-white flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#2563EB] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{session?.user.full_name}</p>
                  <p className="text-[10px] text-[#2563EB] font-semibold uppercase">
                    {session?.adminRole?.role_title || "Super Administrator"}
                  </p>
                </div>
              </div>

              <nav className="space-y-0.5 max-h-[68vh] overflow-y-auto pr-1">
                {sidebarItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSection(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      section === item.id
                        ? "bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/30"
                        : "text-[#666666] hover:bg-[#F7F8FA] hover:text-[#202124]"
                    }`}
                  >
                    <span className="text-[#2563EB]">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </nav>

              <div className="pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>17. Logout</span>
                </button>
              </div>
            </div>
          </aside>

          {/* RIGHT ADMIN WORKSPACE */}
          <div className="lg:col-span-9 space-y-6">
            {/* 1. ADMIN DASHBOARD OVERVIEW & CHARTS */}
            {section === "dashboard" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                    Platform Governance & Analytics
                  </span>
                  <h1 className="text-2xl font-extrabold text-[#202124] mt-0.5">
                    STARSKY Master Admin Panel
                  </h1>
                  <p className="text-xs text-[#666666] mt-1">
                    Real-time database metrics, scholar verification queue, category taxonomy, and
                    CMS controls.
                  </p>
                </div>

                {/* 9 Required Overview Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-[#E5E7EB]">
                    <span className="text-[11px] font-bold uppercase text-[#666666]">
                      Total Registered Users
                    </span>
                    <p className="text-2xl font-extrabold text-[#202124] mt-1">{ov.totalUsers}</p>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-[#E5E7EB]">
                    <span className="text-[11px] font-bold uppercase text-[#666666]">
                      Total Students
                    </span>
                    <p className="text-2xl font-extrabold text-[#202124] mt-1">
                      {ov.totalStudents}
                    </p>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-[#E5E7EB]">
                    <span className="text-[11px] font-bold uppercase text-[#666666]">
                      Total PhD Scholars
                    </span>
                    <p className="text-2xl font-extrabold text-[#202124] mt-1">
                      {ov.totalScholars}
                    </p>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-[#E5E7EB]">
                    <span className="text-[11px] font-bold uppercase text-[#666666]">
                      Total Active Internships
                    </span>
                    <p className="text-2xl font-extrabold text-[#2563EB] mt-1">
                      {ov.totalActiveInternships}
                    </p>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-[#E5E7EB]">
                    <span className="text-[11px] font-bold uppercase text-[#666666]">
                      Total Applications
                    </span>
                    <p className="text-2xl font-extrabold text-[#202124] mt-1">
                      {ov.totalApplications}
                    </p>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-[#E5E7EB]">
                    <span className="text-[11px] font-bold uppercase text-[#666666]">
                      Pending Applications
                    </span>
                    <p className="text-2xl font-extrabold text-amber-600 mt-1">
                      {ov.pendingApplications}
                    </p>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-[#E5E7EB]">
                    <span className="text-[11px] font-bold uppercase text-[#666666]">
                      Approved Scholars
                    </span>
                    <p className="text-2xl font-extrabold text-green-700 mt-1">
                      {ov.approvedScholars}
                    </p>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-[#E5E7EB]">
                    <span className="text-[11px] font-bold uppercase text-[#666666]">
                      Pending Scholar Verification
                    </span>
                    <p className="text-2xl font-extrabold text-[#2563EB] mt-1">
                      {ov.pendingScholars}
                    </p>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-[#E5E7EB]">
                    <span className="text-[11px] font-bold uppercase text-[#666666]">
                      Total Contact Messages
                    </span>
                    <p className="text-2xl font-extrabold text-[#202124] mt-1">
                      {ov.totalContactMessages}
                    </p>
                  </div>
                </div>

                {/* 5 Visual Analytics Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Chart 1 & 2: User Registrations & Student vs PhD Scholar Distribution */}
                  <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4">
                    <h3 className="text-sm font-bold text-[#202124]">
                      User Registrations & Student vs. PhD Scholar Distribution
                    </h3>
                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="font-medium text-[#202124]">Students</span>
                          <span className="font-bold">{ov.totalStudents}</span>
                        </div>
                        <div className="h-3 rounded-full bg-[#F7F8FA] overflow-hidden">
                          <div
                            className="h-full bg-[#2563EB]"
                            style={{
                              width: `${Math.round(
                                (ov.totalStudents / Math.max(1, ov.totalUsers)) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="font-medium text-[#202124]">PhD Scholars</span>
                          <span className="font-bold">{ov.totalScholars}</span>
                        </div>
                        <div className="h-3 rounded-full bg-[#F7F8FA] overflow-hidden">
                          <div
                            className="h-full bg-[#202124]"
                            style={{
                              width: `${Math.round(
                                (ov.totalScholars / Math.max(1, ov.totalUsers)) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="font-medium text-[#202124]">Administrators</span>
                          <span className="font-bold">{data.admins.length}</span>
                        </div>
                        <div className="h-3 rounded-full bg-[#F7F8FA] overflow-hidden">
                          <div
                            className="h-full bg-green-600"
                            style={{
                              width: `${Math.round(
                                (data.admins.length / Math.max(1, ov.totalUsers)) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chart 3 & 5: Applications Over Time / Status & Internship Activity */}
                  <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4">
                    <h3 className="text-sm font-bold text-[#202124]">
                      Internship Activity & Application Pipeline
                    </h3>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB]">
                        <p className="text-xl font-extrabold text-[#2563EB]">
                          {ov.totalActiveInternships}
                        </p>
                        <p className="text-[11px] text-[#666666]">Open Internships</p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB]">
                        <p className="text-xl font-extrabold text-[#202124]">
                          {ov.pendingApplications}
                        </p>
                        <p className="text-[11px] text-[#666666]">In Review</p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB]">
                        <p className="text-xl font-extrabold text-green-700">
                          {ov.acceptedApplications}
                        </p>
                        <p className="text-[11px] text-[#666666]">Accepted</p>
                      </div>
                    </div>
                  </div>

                  {/* Chart 4: Popular Research Domains */}
                  <div className="md:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4">
                    <h3 className="text-sm font-bold text-[#202124]">
                      Popular Research Domains (Scholars & Specializations Distribution)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      {data.domains.slice(0, 6).map((dom) => {
                        const schCount = data.scholars.filter(
                          (s) => s.scholar.domain_id === dom.id
                        ).length;
                        const specCount = data.specializations.filter(
                          (sp) => sp.domain_id === dom.id
                        ).length;
                        return (
                          <div
                            key={dom.id}
                            className="p-3.5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] flex items-center justify-between"
                          >
                            <div>
                              <p className="font-bold text-[#202124]">{dom.name}</p>
                              <p className="text-[11px] text-[#666666]">
                                {specCount} Specializations
                              </p>
                            </div>
                            <span className="px-2.5 py-1 rounded bg-[#EFF6FF] text-[#2563EB] font-bold">
                              {schCount} Scholars
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. STUDENTS MANAGEMENT */}
            {section === "students" && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#202124]">
                      Student Accounts ({data.students.length})
                    </h2>
                    <p className="text-xs text-[#666666]">
                      Search, edit details, activate, suspend, or delete student accounts.
                    </p>
                  </div>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search students..."
                      className="pl-8 pr-3 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#E5E7EB] text-[11px] font-bold uppercase text-[#666666]">
                        <th className="py-3 px-3">Student</th>
                        <th className="py-3 px-3">College & Degree</th>
                        <th className="py-3 px-3">Applications</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {data.students
                        .filter(
                          (s) =>
                            !userSearch ||
                            s.profile.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
                            s.profile.email.toLowerCase().includes(userSearch.toLowerCase())
                        )
                        .map(({ profile, studentProfile, applicationsCount }) => (
                          <tr key={profile.id} className="hover:bg-[#F7F8FA]">
                            <td className="py-3.5 px-3">
                              <p className="font-bold text-[#202124]">{profile.full_name}</p>
                              <p className="text-[11px] text-[#666666]">{profile.email}</p>
                            </td>
                            <td className="py-3.5 px-3">
                              <p className="font-medium text-[#202124]">
                                {studentProfile?.college_university || "Onboarding Pending"}
                              </p>
                              <p className="text-[11px] text-[#666666]">
                                {studentProfile?.degree} {studentProfile?.department}
                              </p>
                            </td>
                            <td className="py-3.5 px-3 font-bold">{applicationsCount}</td>
                            <td className="py-3.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded font-semibold uppercase text-[10px] ${
                                  profile.status === "active"
                                    ? "bg-green-50 text-green-700"
                                    : "bg-red-50 text-red-700"
                                }`}
                              >
                                {profile.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingUser({
                                      profileId: profile.id,
                                      full_name: profile.full_name,
                                      phone: profile.phone,
                                      city: profile.city,
                                      state: profile.state,
                                      institution: studentProfile?.college_university || "",
                                      department: studentProfile?.department || "",
                                    })
                                  }
                                  className="px-2.5 py-1 rounded border border-[#E5E7EB] bg-white font-semibold"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    callAdminAction(
                                      "update_user_status",
                                      {
                                        profileId: profile.id,
                                        status:
                                          profile.status === "active" ? "suspended" : "active",
                                      },
                                      "Updated student account status."
                                    )
                                  }
                                  className="px-2.5 py-1 rounded border border-[#E5E7EB] bg-white font-semibold text-amber-700"
                                >
                                  {profile.status === "active" ? "Suspend" : "Activate"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (
                                      confirm(
                                        `Delete student account for ${profile.full_name}?`
                                      )
                                    ) {
                                      callAdminAction(
                                        "update_user_status",
                                        { profileId: profile.id, deleteAccount: true },
                                        "Deleted student account."
                                      );
                                    }
                                  }}
                                  className="px-2.5 py-1 rounded bg-red-50 text-red-700 font-semibold"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. PHD SCHOLARS MANAGEMENT & CREDENTIAL VERIFICATION */}
            {section === "scholars" && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-[#202124]">
                    PhD Scholars & Credential Verification ({data.scholars.length})
                  </h2>
                  <p className="text-xs text-[#666666]">
                    Verify institutional credentials, approve or reject scholar profiles, and
                    manage account status.
                  </p>
                </div>

                <div className="space-y-4">
                  {data.scholars.map(({ scholar, profile }) => (
                    <div
                      key={scholar.id}
                      className="p-5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-bold text-[#202124]">
                            {profile.full_name}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              scholar.verification_status === "approved"
                                ? "bg-green-100 text-green-800"
                                : scholar.verification_status === "pending"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {scholar.verification_status}
                          </span>
                          <span className="text-xs text-[#666666]">({profile.email})</span>
                        </div>
                        <p className="text-xs font-semibold text-[#202124]">
                          {scholar.university_institution} • {scholar.department}
                        </p>
                        <p className="text-xs text-[#2563EB] font-medium">
                          {scholar.research_field} → {scholar.specialization} • ORCID:{" "}
                          {scholar.orcid_id || "N/A"}
                        </p>
                        <p className="text-xs text-[#666666]">
                          Topic: “{scholar.current_research_topic}”
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            callAdminAction(
                              "verify_scholar",
                              {
                                scholarId: scholar.id,
                                verification_status: "approved",
                              },
                              `Approved PhD Scholar ${profile.full_name}`
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700"
                        >
                          Approve Scholar
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            callAdminAction(
                              "verify_scholar",
                              {
                                scholarId: scholar.id,
                                verification_status: "rejected",
                              },
                              `Rejected PhD Scholar ${profile.full_name}`
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingUser({
                              profileId: profile.id,
                              full_name: profile.full_name,
                              phone: profile.phone,
                              city: profile.city,
                              state: profile.state,
                              institution: scholar.university_institution,
                              department: scholar.department,
                            })
                          }
                          className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-xs font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            callAdminAction(
                              "update_user_status",
                              {
                                profileId: profile.id,
                                status: profile.status === "active" ? "suspended" : "active",
                              },
                              "Updated scholar account status."
                            )
                          }
                          className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-xs font-semibold text-amber-700"
                        >
                          {profile.status === "active" ? "Suspend" : "Activate"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. INTERNSHIP MANAGEMENT */}
            {section === "internships" && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-[#202124]">
                    Platform Internship Moderation ({data.internships.length})
                  </h2>
                  <p className="text-xs text-[#666666]">
                    Approve, reject, close, or remove research internship listings across the
                    platform.
                  </p>
                </div>

                <div className="space-y-4">
                  {data.internships.map(({ internship, scholar, scholarUser, domain, specialization }) => (
                    <div
                      key={internship.id}
                      className="p-5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-white border border-[#E5E7EB] text-[10px] font-bold">
                            {internship.status}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] text-[10px] font-bold uppercase">
                            Moderation: {internship.moderation_status}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-[#2563EB] border border-blue-200 text-[10px] font-semibold">
                            {domain?.name || "Domain"}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold">
                            {specialization?.name || "Specialization"}
                          </span>
                          <span className="text-xs text-[#666666]">{internship.mode}</span>
                        </div>
                        <h3 className="text-sm font-bold text-[#202124]">{internship.title}</h3>
                        <p className="text-xs text-[#666666]">
                          Scholar: <strong>{scholarUser.full_name}</strong> (
                          {scholar.university_institution} • {scholar.department})
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            callAdminAction(
                              "moderate_internship",
                              {
                                internshipId: internship.id,
                                moderation_status: "approved",
                                status: "Open",
                              },
                              "Approved and opened internship listing."
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            callAdminAction(
                              "moderate_internship",
                              {
                                internshipId: internship.id,
                                status: internship.status === "Open" ? "Closed" : "Open",
                              },
                              "Toggled internship open/closed state."
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E7EB] text-xs font-semibold"
                        >
                          {internship.status === "Open" ? "Close Listing" : "Reopen"}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm("Remove this internship listing?")) {
                              await fetch(
                                `/api/internships?id=${encodeURIComponent(internship.id)}`,
                                { method: "DELETE" }
                              );
                              showToast("Removed internship listing.");
                              await fetchAdminData();
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. APPLICATION MANAGEMENT */}
            {section === "applications" && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-[#202124]">
                    All Internship Applications ({data.applications.length})
                  </h2>
                  <p className="text-xs text-[#666666]">
                    Filter applications by student, PhD scholar, or internship title and inspect
                    submitted documents.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={appStudentFilter}
                    onChange={(e) => setAppStudentFilter(e.target.value)}
                    placeholder="Filter by Student name..."
                    className="px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                  />
                  <input
                    type="text"
                    value={appScholarFilter}
                    onChange={(e) => setAppScholarFilter(e.target.value)}
                    placeholder="Filter by PhD Scholar name..."
                    className="px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                  />
                  <input
                    type="text"
                    value={appInternshipFilter}
                    onChange={(e) => setAppInternshipFilter(e.target.value)}
                    placeholder="Filter by Internship title..."
                    className="px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                  />
                </div>

                <div className="space-y-3">
                  {data.applications
                    .filter((item) => {
                      if (
                        appStudentFilter &&
                        !item.application.student_full_name
                          .toLowerCase()
                          .includes(appStudentFilter.toLowerCase())
                      )
                        return false;
                      if (
                        appScholarFilter &&
                        !item.scholarUser.full_name
                          .toLowerCase()
                          .includes(appScholarFilter.toLowerCase())
                      )
                        return false;
                      if (
                        appInternshipFilter &&
                        !item.internship.title
                          .toLowerCase()
                          .includes(appInternshipFilter.toLowerCase())
                      )
                        return false;
                      return true;
                    })
                    .map((item) => (
                      <div
                        key={item.application.id}
                        className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#202124]">
                              Student: {item.application.student_full_name}
                            </span>
                            <span>→</span>
                            <span className="font-bold text-[#2563EB]">
                              Scholar: {item.scholarUser.full_name}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-white border border-[#E5E7EB] font-semibold">
                              {item.application.status}
                            </span>
                          </div>
                          <p className="text-[#202124] font-medium">
                            Internship: {item.internship.title}
                          </p>
                          <p className="text-[#666666] line-clamp-2">
                            SOP: {item.application.statement_of_purpose}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={item.application.resume_url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E7EB] font-semibold text-[#2563EB]"
                          >
                            Resume PDF ↗
                          </a>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 6. ACADEMIC DOMAINS MANAGEMENT */}
            {section === "domains" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4">
                  <h2 className="text-xl font-bold text-[#202124]">
                    {domId ? "Edit Academic Domain" : "Add New Academic Domain"}
                  </h2>
                  <p className="text-xs text-[#666666]">
                    Any domain added or updated here automatically appears on the student Explore
                    page.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <input
                      type="text"
                      value={domName}
                      onChange={(e) => setDomName(e.target.value)}
                      placeholder="Domain Name (e.g., Space Sciences)"
                      className="px-3.5 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                    />
                    <input
                      type="text"
                      value={domIcon}
                      onChange={(e) => setDomIcon(e.target.value)}
                      placeholder="Icon (Cpu, Atom, Stethoscope, Scale...)"
                      className="px-3.5 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                    />
                    <input
                      type="number"
                      value={domOrder}
                      onChange={(e) => setDomOrder(Number(e.target.value))}
                      placeholder="Display Order"
                      className="px-3.5 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                    />
                  </div>
                  <input
                    type="url"
                    value={domImage}
                    onChange={(e) => setDomImage(e.target.value)}
                    placeholder="Category Image URL (https://...)"
                    className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                  />
                  <textarea
                    rows={2}
                    value={domDesc}
                    onChange={(e) => setDomDesc(e.target.value)}
                    placeholder="Short domain description..."
                    className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await callAdminAction(
                          domId ? "update_domain" : "create_domain",
                          {
                            id: domId || undefined,
                            name: domName,
                            description: domDesc,
                            icon_name: domIcon,
                            image_url: domImage,
                            display_order: domOrder,
                          },
                          domId ? "Updated academic domain." : "Added new academic domain."
                        );
                        if (ok) {
                          setDomId("");
                          setDomName("");
                          setDomDesc("");
                          setDomImage("");
                        }
                      }}
                      className="px-5 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
                    >
                      {domId ? "Update Domain" : "Add Academic Domain"}
                    </button>
                    {domId && (
                      <button
                        type="button"
                        onClick={() => {
                          setDomId("");
                          setDomName("");
                          setDomDesc("");
                        }}
                        className="px-4 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-3">
                  <h3 className="text-base font-bold text-[#202124]">
                    Existing Academic Domains ({data.domains.length})
                  </h3>
                  {data.domains.map((d) => (
                    <div
                      key={d.id}
                      className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] flex items-center justify-between gap-4 text-xs"
                    >
                      <div>
                        <span className="font-bold text-[#202124]">
                          #{d.display_order} {d.name}
                        </span>{" "}
                        <span className="text-[#666666]">— {d.description}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setDomId(d.id);
                            setDomName(d.name);
                            setDomDesc(d.description);
                            setDomIcon(d.icon_name);
                            setDomImage(d.image_url);
                            setDomOrder(d.display_order);
                          }}
                          className="px-2.5 py-1 rounded border border-[#E5E7EB] bg-white font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            callAdminAction(
                              "update_domain",
                              { id: d.id, is_active: !d.is_active },
                              "Updated domain visibility."
                            )
                          }
                          className="px-2.5 py-1 rounded border border-[#E5E7EB] bg-white font-semibold"
                        >
                          {d.is_active ? "Active" : "Hidden"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            callAdminAction(
                              "delete_domain",
                              { id: d.id },
                              "Deleted academic domain."
                            )
                          }
                          className="px-2.5 py-1 rounded bg-red-50 text-red-700 font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. SPECIALIZATIONS MANAGEMENT */}
            {section === "specializations" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4">
                  <h2 className="text-xl font-bold text-[#202124]">
                    {specId ? "Edit Specialization" : "Add New Specialization"}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <select
                      value={specDomId}
                      onChange={(e) => setSpecDomId(e.target.value)}
                      className="px-3.5 py-2 rounded-lg border border-[#E5E7EB] text-xs bg-white"
                    >
                      {data.domains.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={specName}
                      onChange={(e) => setSpecName(e.target.value)}
                      placeholder="Specialization Name"
                      className="px-3.5 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                    />
                    <input
                      type="number"
                      value={specOrder}
                      onChange={(e) => setSpecOrder(Number(e.target.value))}
                      placeholder="Order"
                      className="px-3.5 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                    />
                  </div>
                  <input
                    type="text"
                    value={specDesc}
                    onChange={(e) => setSpecDesc(e.target.value)}
                    placeholder="Specialization description..."
                    className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await callAdminAction(
                        specId ? "update_specialization" : "create_specialization",
                        {
                          id: specId || undefined,
                          domain_id: specDomId,
                          name: specName,
                          description: specDesc,
                          display_order: specOrder,
                        },
                        specId ? "Updated specialization." : "Created specialization."
                      );
                      if (ok) {
                        setSpecId("");
                        setSpecName("");
                        setSpecDesc("");
                      }
                    }}
                    className="px-5 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
                  >
                    {specId ? "Save Specialization" : "Add Specialization"}
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-3">
                  <h3 className="text-base font-bold text-[#202124]">
                    All Specializations ({data.specializations.length})
                  </h3>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {data.specializations.map((sp) => {
                      const dom = data.domains.find((d) => d.id === sp.domain_id);
                      return (
                        <div
                          key={sp.id}
                          className="p-3 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="text-[#2563EB] font-bold">{dom?.name}</span> →{" "}
                            <strong className="text-[#202124]">{sp.name}</strong>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSpecId(sp.id);
                                setSpecDomId(sp.domain_id);
                                setSpecName(sp.name);
                                setSpecDesc(sp.description);
                              }}
                              className="px-2.5 py-1 rounded bg-white border border-[#E5E7EB] font-semibold"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                callAdminAction(
                                  "delete_specialization",
                                  { id: sp.id },
                                  "Deleted specialization."
                                )
                              }
                              className="px-2.5 py-1 rounded bg-red-50 text-red-700 font-semibold"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 8. HOME PAGE CMS MANAGEMENT */}
            {section === "home_cms" && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-5">
                <h2 className="text-xl font-bold text-[#202124]">
                  Home Page & Brand Identity CMS
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold block mb-1">Website Name</label>
                    <input
                      type="text"
                      value={cmsSettings.site_name}
                      onChange={(e) =>
                        setCmsSettings({ ...cmsSettings, site_name: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB]"
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Tagline</label>
                    <input
                      type="text"
                      value={cmsSettings.tagline}
                      onChange={(e) =>
                        setCmsSettings({ ...cmsSettings, tagline: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB]"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="font-bold block mb-1">Homepage Hero Heading</label>
                  <input
                    type="text"
                    value={cmsSettings.hero_heading}
                    onChange={(e) =>
                      setCmsSettings({ ...cmsSettings, hero_heading: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB]"
                  />
                </div>

                <div className="text-xs">
                  <label className="font-bold block mb-1">Homepage Hero Description</label>
                  <textarea
                    rows={2}
                    value={cmsSettings.hero_description}
                    onChange={(e) =>
                      setCmsSettings({ ...cmsSettings, hero_description: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB]"
                  />
                </div>

                <div className="text-xs">
                  <label className="font-bold block mb-1">Hero Photograph URL</label>
                  <input
                    type="url"
                    value={cmsSettings.hero_image_url}
                    onChange={(e) =>
                      setCmsSettings({ ...cmsSettings, hero_image_url: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB]"
                  />
                </div>

                <div className="text-xs">
                  <label className="font-bold block mb-1">Footer Summary Text</label>
                  <textarea
                    rows={2}
                    value={cmsSettings.footer_text}
                    onChange={(e) =>
                      setCmsSettings({ ...cmsSettings, footer_text: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold block mb-1">SEO Title</label>
                    <input
                      type="text"
                      value={cmsSettings.seo_title}
                      onChange={(e) =>
                        setCmsSettings({ ...cmsSettings, seo_title: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB]"
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">SEO Description</label>
                    <input
                      type="text"
                      value={cmsSettings.seo_description}
                      onChange={(e) =>
                        setCmsSettings({ ...cmsSettings, seo_description: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB]"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    callAdminAction(
                      "update_website_settings",
                      cmsSettings as unknown as Record<string, unknown>,
                      "Saved Home Page CMS settings."
                    )
                  }
                  className="px-6 py-2.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
                >
                  Publish Home Page Changes
                </button>
              </div>
            )}

            {/* 9. ABOUT US CMS MANAGEMENT */}
            {section === "about_cms" && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-5 text-xs">
                <h2 className="text-xl font-bold text-[#202124]">
                  About Us, Mission & Vision CMS
                </h2>
                <div>
                  <label className="font-bold block mb-1">About Page Heading</label>
                  <input
                    type="text"
                    value={cmsSettings.about_title}
                    onChange={(e) =>
                      setCmsSettings({ ...cmsSettings, about_title: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB]"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">About Us Content</label>
                  <textarea
                    rows={4}
                    value={cmsSettings.about_content}
                    onChange={(e) =>
                      setCmsSettings({ ...cmsSettings, about_content: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB]"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Mission Statement</label>
                  <textarea
                    rows={2}
                    value={cmsSettings.mission_statement}
                    onChange={(e) =>
                      setCmsSettings({ ...cmsSettings, mission_statement: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB]"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Vision Statement</label>
                  <textarea
                    rows={2}
                    value={cmsSettings.vision_statement}
                    onChange={(e) =>
                      setCmsSettings({ ...cmsSettings, vision_statement: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    callAdminAction(
                      "update_website_settings",
                      cmsSettings as unknown as Record<string, unknown>,
                      "Updated About Us content."
                    )
                  }
                  className="px-6 py-2.5 rounded-lg bg-[#2563EB] text-white font-semibold"
                >
                  Save About Us Page
                </button>
              </div>
            )}

            {/* 10. CAREERS MANAGEMENT */}
            {section === "careers" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4 text-xs">
                  <h2 className="text-xl font-bold text-[#202124]">
                    {careerId ? "Edit Career Listing" : "Create Career Listing"}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={careerTitle}
                      onChange={(e) => setCareerTitle(e.target.value)}
                      placeholder="Position Title"
                      className="px-3.5 py-2 rounded-lg border border-[#E5E7EB]"
                    />
                    <input
                      type="text"
                      value={careerDept}
                      onChange={(e) => setCareerDept(e.target.value)}
                      placeholder="Department"
                      className="px-3.5 py-2 rounded-lg border border-[#E5E7EB]"
                    />
                    <input
                      type="text"
                      value={careerLoc}
                      onChange={(e) => setCareerLoc(e.target.value)}
                      placeholder="Location (e.g., Bengaluru / Remote)"
                      className="px-3.5 py-2 rounded-lg border border-[#E5E7EB]"
                    />
                    <input
                      type="date"
                      value={careerClosing}
                      onChange={(e) => setCareerClosing(e.target.value)}
                      className="px-3.5 py-2 rounded-lg border border-[#E5E7EB]"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={careerDesc}
                    onChange={(e) => setCareerDesc(e.target.value)}
                    placeholder="Role description..."
                    className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB]"
                  />
                  <input
                    type="text"
                    value={careerReqs}
                    onChange={(e) => setCareerReqs(e.target.value)}
                    placeholder="Requirements (comma-separated)"
                    className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB]"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await callAdminAction(
                        "save_career",
                        {
                          id: careerId || undefined,
                          title: careerTitle,
                          department: careerDept,
                          location: careerLoc,
                          employment_type: careerType,
                          description: careerDesc,
                          requirements: careerReqs
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                          closing_date: careerClosing,
                          is_published: true,
                        },
                        "Saved career listing."
                      );
                      if (ok) {
                        setCareerId("");
                        setCareerTitle("");
                        setCareerDept("");
                        setCareerLoc("");
                        setCareerDesc("");
                        setCareerReqs("");
                      }
                    }}
                    className="px-5 py-2 rounded-lg bg-[#2563EB] text-white font-semibold"
                  >
                    Publish Career Opportunity
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-3">
                  {data.careers.map((c) => (
                    <div
                      key={c.id}
                      className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-[#202124]">{c.title}</p>
                        <p className="text-[#666666]">
                          {c.department} • {c.location} • {c.is_published ? "Published" : "Draft"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            callAdminAction(
                              "save_career",
                              { id: c.id, is_published: !c.is_published },
                              "Toggled career visibility."
                            )
                          }
                          className="px-2.5 py-1 rounded bg-white border border-[#E5E7EB] font-semibold"
                        >
                          {c.is_published ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            callAdminAction("delete_career", { id: c.id }, "Deleted career listing.")
                          }
                          className="px-2.5 py-1 rounded bg-red-50 text-red-700 font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 11. CONTACT MESSAGES */}
            {section === "messages" && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4">
                <h2 className="text-xl font-bold text-[#202124]">
                  Contact Us Submissions ({data.contactMessages.length})
                </h2>
                {data.contactMessages.map((m) => (
                  <div
                    key={m.id}
                    className="p-5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#202124]">{m.name}</span>{" "}
                        <span className="text-[#666666]">({m.email})</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-white border border-[#E5E7EB] uppercase font-bold text-[10px]">
                        {m.status}
                      </span>
                    </div>
                    <p className="font-bold text-[#2563EB]">{m.subject}</p>
                    <p className="text-[#202124]">{m.message}</p>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() =>
                          callAdminAction(
                            "update_contact_message",
                            { id: m.id, status: "read" },
                            "Marked message as read."
                          )
                        }
                        className="px-3 py-1 rounded bg-white border border-[#E5E7EB] font-semibold"
                      >
                        Mark Read
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          callAdminAction(
                            "delete_contact_message",
                            { id: m.id },
                            "Deleted message."
                          )
                        }
                        className="px-3 py-1 rounded bg-red-50 text-red-700 font-semibold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 12. TESTIMONIALS MANAGEMENT */}
            {section === "testimonials" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4 text-xs">
                  <h2 className="text-xl font-bold text-[#202124]">Add Testimonial</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={testAuthor}
                      onChange={(e) => setTestAuthor(e.target.value)}
                      placeholder="Author Name"
                      className="px-3 py-2 rounded-lg border border-[#E5E7EB]"
                    />
                    <input
                      type="text"
                      value={testRole}
                      onChange={(e) => setTestRole(e.target.value)}
                      placeholder="Role (e.g., B.Tech Student)"
                      className="px-3 py-2 rounded-lg border border-[#E5E7EB]"
                    />
                    <input
                      type="text"
                      value={testInst}
                      onChange={(e) => setTestInst(e.target.value)}
                      placeholder="Institution"
                      className="px-3 py-2 rounded-lg border border-[#E5E7EB]"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={testQuote}
                    onChange={(e) => setTestQuote(e.target.value)}
                    placeholder="Testimonial quote..."
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB]"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await callAdminAction(
                        "save_testimonial",
                        {
                          author_name: testAuthor,
                          author_role: testRole,
                          institution: testInst,
                          quote: testQuote,
                          rating: 5,
                          is_featured: true,
                        },
                        "Added testimonial."
                      );
                      if (ok) {
                        setTestAuthor("");
                        setTestRole("");
                        setTestInst("");
                        setTestQuote("");
                      }
                    }}
                    className="px-5 py-2 rounded-lg bg-[#2563EB] text-white font-semibold"
                  >
                    Save Testimonial
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-3">
                  {data.testimonials.map((t) => (
                    <div
                      key={t.id}
                      className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] flex items-center justify-between gap-4 text-xs"
                    >
                      <div>
                        <p className="font-bold text-[#202124]">
                          {t.author_name} ({t.author_role}, {t.institution})
                        </p>
                        <p className="text-[#666666] mt-0.5">“{t.quote}”</p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          callAdminAction(
                            "delete_testimonial",
                            { id: t.id },
                            "Deleted testimonial."
                          )
                        }
                        className="px-3 py-1 rounded bg-red-50 text-red-700 font-semibold shrink-0"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 13. ANNOUNCEMENTS MANAGEMENT */}
            {section === "announcements" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4 text-xs">
                  <h2 className="text-xl font-bold text-[#202124]">Publish Platform Announcement</h2>
                  <input
                    type="text"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="Announcement Title"
                    className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB]"
                  />
                  <textarea
                    rows={2}
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    placeholder="Announcement content..."
                    className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB]"
                  />
                  <div className="flex gap-3">
                    <select
                      value={annAudience}
                      onChange={(e) =>
                        setAnnAudience(e.target.value as "all" | "students" | "scholars")
                      }
                      className="px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white"
                    >
                      <option value="all">All Visitors & Members</option>
                      <option value="students">Students Only</option>
                      <option value="scholars">PhD Scholars Only</option>
                    </select>
                    <select
                      value={annPriority}
                      onChange={(e) =>
                        setAnnPriority(e.target.value as "normal" | "important" | "urgent")
                      }
                      className="px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white"
                    >
                      <option value="normal">Normal</option>
                      <option value="important">Important</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await callAdminAction(
                          "save_announcement",
                          {
                            title: annTitle,
                            content: annContent,
                            audience: annAudience,
                            priority: annPriority,
                            is_active: true,
                          },
                          "Published announcement."
                        );
                        if (ok) {
                          setAnnTitle("");
                          setAnnContent("");
                        }
                      }}
                      className="px-5 py-2 rounded-lg bg-[#2563EB] text-white font-semibold"
                    >
                      Publish
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-3">
                  {data.announcements.map((a) => (
                    <div
                      key={a.id}
                      className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] flex items-center justify-between gap-4 text-xs"
                    >
                      <div>
                        <p className="font-bold text-[#202124]">{a.title}</p>
                        <p className="text-[#666666]">{a.content}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          callAdminAction(
                            "delete_announcement",
                            { id: a.id },
                            "Removed announcement."
                          )
                        }
                        className="px-3 py-1 rounded bg-red-50 text-red-700 font-semibold"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 14. WEBSITE SETTINGS */}
            {section === "settings" && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-6 text-xs">
                <h2 className="text-xl font-bold text-[#202124]">
                  Platform Governance & Configuration Settings
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="font-bold text-[#202124] block">Maintenance Mode</span>
                      <span className="text-[#666666]">Temporarily restrict public operations</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={cmsSettings.maintenance_mode}
                      onChange={(e) =>
                        setCmsSettings({ ...cmsSettings, maintenance_mode: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#2563EB]"
                    />
                  </label>

                  <label className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="font-bold text-[#202124] block">
                        Allow All New Registrations
                      </span>
                      <span className="text-[#666666]">Master registration switch</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={cmsSettings.allow_registrations}
                      onChange={(e) =>
                        setCmsSettings({ ...cmsSettings, allow_registrations: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#2563EB]"
                    />
                  </label>

                  <label className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="font-bold text-[#202124] block">
                        Allow Student Registrations
                      </span>
                      <span className="text-[#666666]">Enable student onboarding</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={cmsSettings.allow_student_registrations}
                      onChange={(e) =>
                        setCmsSettings({
                          ...cmsSettings,
                          allow_student_registrations: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-[#2563EB]"
                    />
                  </label>

                  <label className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="font-bold text-[#202124] block">
                        Allow PhD Scholar Registrations
                      </span>
                      <span className="text-[#666666]">Enable doctoral mentor onboarding</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={cmsSettings.allow_scholar_registrations}
                      onChange={(e) =>
                        setCmsSettings({
                          ...cmsSettings,
                          allow_scholar_registrations: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-[#2563EB]"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="font-bold block mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={cmsSettings.contact_email}
                      onChange={(e) =>
                        setCmsSettings({ ...cmsSettings, contact_email: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB]"
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={cmsSettings.contact_phone}
                      onChange={(e) =>
                        setCmsSettings({ ...cmsSettings, contact_phone: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB]"
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Office Address</label>
                    <input
                      type="text"
                      value={cmsSettings.contact_address}
                      onChange={(e) =>
                        setCmsSettings({ ...cmsSettings, contact_address: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB]"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    callAdminAction(
                      "update_website_settings",
                      cmsSettings as unknown as Record<string, unknown>,
                      "Saved platform settings."
                    )
                  }
                  className="px-6 py-2.5 rounded-lg bg-[#2563EB] text-white font-semibold"
                >
                  Save Platform Settings
                </button>
              </div>
            )}

            {/* 15. ADMIN MANAGEMENT */}
            {section === "admins" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4 text-xs">
                  <h2 className="text-xl font-bold text-[#202124]">
                    Authorize New Administrator Account
                  </h2>
                  <p className="text-[#666666]">
                    Create an administrative account through this secure internal governance
                    process and assign granular role permissions.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      placeholder="Full Name"
                      className="px-3.5 py-2 rounded-lg border border-[#E5E7EB]"
                    />
                    <input
                      type="email"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="Institutional Email"
                      className="px-3.5 py-2 rounded-lg border border-[#E5E7EB]"
                    />
                    <input
                      type="password"
                      value={newAdminPass}
                      onChange={(e) => setNewAdminPass(e.target.value)}
                      placeholder="Initial Password"
                      className="px-3.5 py-2 rounded-lg border border-[#E5E7EB]"
                    />
                    <input
                      type="text"
                      value={newAdminTitle}
                      onChange={(e) => setNewAdminTitle(e.target.value)}
                      placeholder="Role Title (e.g., Academic Verification Officer)"
                      className="px-3.5 py-2 rounded-lg border border-[#E5E7EB]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await callAdminAction(
                        "create_admin",
                        {
                          full_name: newAdminName,
                          email: newAdminEmail,
                          password: newAdminPass,
                          role_title: newAdminTitle,
                          permissions: newAdminPerms,
                        },
                        "Created new administrator account."
                      );
                      if (ok) {
                        setNewAdminName("");
                        setNewAdminEmail("");
                        setNewAdminPass("");
                      }
                    }}
                    className="px-5 py-2 rounded-lg bg-[#2563EB] text-white font-semibold"
                  >
                    Authorize Administrator
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-3">
                  <h3 className="text-base font-bold text-[#202124]">
                    Authorized Platform Administrators ({data.admins.length})
                  </h3>
                  {data.admins.map(({ profile, adminRole }) => (
                    <div
                      key={profile.id}
                      className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-[#202124]">
                          {profile.full_name} ({profile.email})
                        </p>
                        <p className="text-[#2563EB] font-semibold">
                          {adminRole?.role_title || "Administrator"} •{" "}
                          {adminRole?.permissions.join(", ")}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-green-100 text-green-800 font-bold uppercase text-[10px]">
                        {profile.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 17. ACTIVITY LOGS */}
            {section === "logs" && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4">
                <h2 className="text-xl font-bold text-[#202124]">
                  Platform Audit & Activity Logs ({data.activityLogs.length})
                </h2>
                <div className="space-y-2.5">
                  {data.activityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <span className="px-2 py-0.5 rounded bg-white border border-[#E5E7EB] font-bold uppercase text-[10px] text-[#2563EB] mr-2">
                          {log.actor_role}
                        </span>
                        <strong className="text-[#202124]">{log.actor_name}</strong> —{" "}
                        <span className="font-semibold text-[#202124]">{log.action}</span>
                        <p className="text-[#666666] mt-0.5">{log.details}</p>
                      </div>
                      <span className="text-[11px] text-[#666666] shrink-0">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. PREMIUM MANAGEMENT */}
            {section === "premium" && (
              <div className="space-y-6">
                {/* Header & Global Premium Toggle */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] inline-flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5" />
                        STARSKY Premium Directory & Membership Governance
                      </span>
                      <h2 className="text-2xl font-extrabold text-[#202124] mt-0.5">
                        Premium Management
                      </h2>
                      <p className="text-xs text-[#666666] mt-1">
                        Manage student premium subscriptions, approve upgrade requests, configure
                        Monthly/Quarterly/Yearly plans, and control global PhD directory preview
                        limits.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] text-xs font-semibold text-[#202124] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cmsSettings.enable_premium_system !== false}
                          onChange={(e) => {
                            const enabled = e.target.checked;
                            setCmsSettings({
                              ...cmsSettings,
                              enable_premium_system: enabled,
                            });
                            callAdminAction(
                              "toggle_premium_system",
                              {
                                enable_premium_system: enabled,
                                free_scholar_limit: cmsSettings.free_scholar_limit || 5,
                              },
                              enabled
                                ? "Enabled STARSKY Premium system globally."
                                : "Disabled Premium restriction (all scholars unlocked globally)."
                            );
                          }}
                          className="w-4 h-4 accent-[#2563EB]"
                        />
                        <span>Enable Premium Access Gate</span>
                      </label>
                    </div>
                  </div>

                  {/* Summary Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB]">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666]">
                        Active Premium Members
                      </span>
                      <p className="text-2xl font-extrabold text-[#2563EB] mt-1">
                        {ov.premiumMembersCount || 0}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB]">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666]">
                        Pending Requests
                      </span>
                      <p className="text-2xl font-extrabold text-amber-600 mt-1">
                        {ov.pendingSubscriptionsCount || 0}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB]">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666]">
                        Free Students
                      </span>
                      <p className="text-2xl font-extrabold text-[#202124] mt-1">
                        {Math.max(0, ov.totalStudents - (ov.premiumMembersCount || 0))}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB]">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666]">
                        Free Scholar Limit
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={cmsSettings.free_scholar_limit || 5}
                          onChange={(e) =>
                            setCmsSettings({
                              ...cmsSettings,
                              free_scholar_limit: Number(e.target.value) || 5,
                            })
                          }
                          className="w-16 px-2 py-1 rounded border border-[#E5E7EB] bg-white text-sm font-bold text-[#202124]"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            callAdminAction(
                              "toggle_premium_system",
                              {
                                enable_premium_system:
                                  cmsSettings.enable_premium_system !== false,
                                free_scholar_limit: cmsSettings.free_scholar_limit || 5,
                              },
                              "Updated free scholar preview limit."
                            )
                          }
                          className="px-2.5 py-1 rounded bg-[#202124] text-white text-[11px] font-semibold"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Student Membership Control Table */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#202124]">
                        Student Memberships (Free & Premium)
                      </h3>
                      <p className="text-xs text-[#666666]">
                        Grant or revoke STARSKY Premium access, approve pending upgrade requests,
                        and inspect membership start & expiry dates.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <select
                        value={selectedPlanForGrant}
                        onChange={(e) => setSelectedPlanForGrant(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs bg-[#F7F8FA] font-semibold text-[#202124]"
                      >
                        {(data.subscriptionPlans || []).map((p) => (
                          <option key={p.id} value={p.id}>
                            Grant Plan: {p.name} ({p.duration_days}d)
                          </option>
                        ))}
                      </select>

                      <select
                        value={premiumFilter}
                        onChange={(e) =>
                          setPremiumFilter(
                            e.target.value as "all" | "premium" | "pending" | "free"
                          )
                        }
                        className="px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs bg-white"
                      >
                        <option value="all">All Students</option>
                        <option value="premium">Active Premium Only</option>
                        <option value="pending">Pending Approval</option>
                        <option value="free">Free Members Only</option>
                      </select>

                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={premiumSearch}
                          onChange={(e) => setPremiumSearch(e.target.value)}
                          placeholder="Search student name or email..."
                          className="pl-8 pr-3 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#E5E7EB] text-[11px] font-bold uppercase tracking-wider text-[#666666]">
                          <th className="py-3 px-3">Student</th>
                          <th className="py-3 px-3">Membership Tier</th>
                          <th className="py-3 px-3">Plan & Status</th>
                          <th className="py-3 px-3">Start Date</th>
                          <th className="py-3 px-3">Expiry Date</th>
                          <th className="py-3 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E7EB]">
                        {data.students
                          .filter(({ profile, subscription, isPremium }) => {
                            if (premiumFilter === "premium" && !isPremium) return false;
                            if (
                              premiumFilter === "pending" &&
                              subscription?.status !== "pending_approval"
                            )
                              return false;
                            if (premiumFilter === "free" && isPremium) return false;
                            if (premiumSearch.trim()) {
                              const q = premiumSearch.toLowerCase();
                              const matchName = profile.full_name.toLowerCase().includes(q);
                              const matchEmail = profile.email.toLowerCase().includes(q);
                              if (!matchName && !matchEmail) return false;
                            }
                            return true;
                          })
                          .map(({ profile, studentProfile, subscription, isPremium }) => (
                            <tr key={profile.id} className="hover:bg-[#F7F8FA]">
                              <td className="py-3.5 px-3">
                                <div className="font-bold text-[#202124]">{profile.full_name}</div>
                                <div className="text-[11px] text-[#666666]">{profile.email}</div>
                                {studentProfile?.college_university && (
                                  <div className="text-[10px] text-[#666666]">
                                    {studentProfile.college_university}
                                  </div>
                                )}
                              </td>
                              <td className="py-3.5 px-3">
                                {isPremium ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#EFF6FF] border border-[#2563EB]/30 text-[#2563EB] font-bold text-[11px]">
                                    <Crown className="w-3 h-3" /> Premium Member
                                  </span>
                                ) : subscription?.status === "pending_approval" ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[11px]">
                                    Pending Request
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 font-semibold text-[11px]">
                                    Free Student
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-3">
                                {subscription ? (
                                  <div>
                                    <div className="font-semibold text-[#202124]">
                                      {subscription.plan_name}
                                    </div>
                                    <span className="text-[10px] uppercase font-bold text-[#666666]">
                                      Status: {subscription.status} ({subscription.payment_status})
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[#666666]">No active plan</span>
                                )}
                              </td>
                              <td className="py-3.5 px-3 text-[#666666]">
                                {subscription?.start_date
                                  ? new Date(subscription.start_date).toLocaleDateString()
                                  : "—"}
                              </td>
                              <td className="py-3.5 px-3 text-[#666666]">
                                {subscription?.expiry_date
                                  ? new Date(subscription.expiry_date).toLocaleDateString()
                                  : "—"}
                              </td>
                              <td className="py-3.5 px-3 text-right">
                                <div className="inline-flex flex-wrap items-center justify-end gap-2">
                                  {!isPremium ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        callAdminAction(
                                          "grant_premium_access",
                                          {
                                            studentUserId: profile.id,
                                            planId:
                                              subscription?.plan_id || selectedPlanForGrant,
                                          },
                                          `Granted STARSKY Premium to ${profile.full_name}.`
                                        )
                                      }
                                      className="px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-[11px]"
                                    >
                                      {subscription?.status === "pending_approval"
                                        ? "Approve & Activate"
                                        : "Grant Premium"}
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        callAdminAction(
                                          "update_subscription_status",
                                          {
                                            subscriptionId: subscription?.id,
                                            studentUserId: profile.id,
                                            status: "revoked",
                                          },
                                          `Revoked Premium access for ${profile.full_name}.`
                                        )
                                      }
                                      className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 font-semibold text-[11px]"
                                    >
                                      Revoke Premium
                                    </button>
                                  )}

                                  {subscription && (
                                    <select
                                      value={subscription.status}
                                      onChange={(e) =>
                                        callAdminAction(
                                          "update_subscription_status",
                                          {
                                            subscriptionId: subscription.id,
                                            studentUserId: profile.id,
                                            status: e.target.value,
                                          },
                                          `Updated subscription status to ${e.target.value}.`
                                        )
                                      }
                                      className="px-2 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[11px]"
                                    >
                                      <option value="active">active</option>
                                      <option value="pending_approval">pending_approval</option>
                                      <option value="expired">expired</option>
                                      <option value="revoked">revoked</option>
                                    </select>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Subscription Plans Management */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-5">
                  <div>
                    <h3 className="text-lg font-bold text-[#202124]">
                      Configurable Subscription Plans ({data.subscriptionPlans?.length || 0})
                    </h3>
                    <p className="text-xs text-[#666666]">
                      Create or modify Monthly, Quarterly, and Yearly STARSKY Premium plans.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(data.subscriptionPlans || []).map((plan) => (
                      <div
                        key={plan.id}
                        className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] flex flex-col justify-between space-y-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-[#202124]">{plan.name}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                plan.is_active
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-200 text-gray-600"
                              }`}
                            >
                              {plan.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <p className="text-xl font-extrabold text-[#2563EB] mt-1">
                            ₹{plan.price} / {plan.duration_days} days
                          </p>
                          <p className="text-[#666666] mt-1">{plan.description}</p>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-[#E5E7EB]">
                          <button
                            type="button"
                            onClick={() => {
                              setEditPlanId(plan.id);
                              setEditPlanName(plan.name);
                              setEditPlanCycle(plan.billing_cycle);
                              setEditPlanPrice(plan.price);
                              setEditPlanDays(plan.duration_days);
                              setEditPlanDesc(plan.description);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E7EB] font-semibold text-[#202124] hover:border-[#2563EB]"
                          >
                            Edit Plan
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              callAdminAction(
                                "save_subscription_plan",
                                { id: plan.id, name: plan.name, is_active: !plan.is_active },
                                "Updated plan status."
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E7EB] font-semibold text-[#666666]"
                          >
                            {plan.is_active ? "Disable" : "Enable"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add / Edit Plan Form */}
                  <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] space-y-3 text-xs">
                    <h4 className="font-bold text-[#202124]">
                      {editPlanId ? `Editing Plan: ${editPlanName}` : "Create or Update Plan"}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <input
                        type="text"
                        value={editPlanName}
                        onChange={(e) => setEditPlanName(e.target.value)}
                        placeholder="Plan Name (e.g., Semester Pass)"
                        className="px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white"
                      />
                      <select
                        value={editPlanCycle}
                        onChange={(e) =>
                          setEditPlanCycle(
                            e.target.value as "monthly" | "quarterly" | "yearly"
                          )
                        }
                        className="px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                      <input
                        type="number"
                        value={editPlanPrice}
                        onChange={(e) => setEditPlanPrice(Number(e.target.value))}
                        placeholder="Price (INR)"
                        className="px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white"
                      />
                      <input
                        type="number"
                        value={editPlanDays}
                        onChange={(e) => setEditPlanDays(Number(e.target.value))}
                        placeholder="Duration (Days)"
                        className="px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white"
                      />
                    </div>
                    <input
                      type="text"
                      value={editPlanDesc}
                      onChange={(e) => setEditPlanDesc(e.target.value)}
                      placeholder="Plan description"
                      className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!editPlanName.trim()) return;
                          const ok = await callAdminAction(
                            "save_subscription_plan",
                            {
                              id: editPlanId || undefined,
                              name: editPlanName,
                              billing_cycle: editPlanCycle,
                              price: editPlanPrice,
                              duration_days: editPlanDays,
                              description: editPlanDesc,
                            },
                            "Saved subscription plan."
                          );
                          if (ok) {
                            setEditPlanId("");
                            setEditPlanName("");
                            setEditPlanDesc("");
                          }
                        }}
                        className="px-4 py-2 rounded-lg bg-[#2563EB] text-white font-semibold"
                      >
                        {editPlanId ? "Update Plan" : "Add Plan"}
                      </button>
                      {editPlanId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditPlanId("");
                            setEditPlanName("");
                            setEditPlanDesc("");
                          }}
                          className="px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subscription Transactions Audit Table */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4">
                  <h3 className="text-lg font-bold text-[#202124]">
                    Subscription Transactions & Audit History (
                    {data.subscriptionTransactions?.length || 0})
                  </h3>
                  {(data.subscriptionTransactions || []).length === 0 ? (
                    <p className="text-xs text-[#666666]">
                      No subscription transactions recorded yet.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {(data.subscriptionTransactions || []).map((tx) => (
                        <div
                          key={tx.id}
                          className="p-3.5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <span className="px-2 py-0.5 rounded bg-white border border-[#E5E7EB] font-bold uppercase text-[10px] text-[#2563EB] mr-2">
                              {tx.transaction_type}
                            </span>
                            <strong className="text-[#202124]">{tx.student_name}</strong> (
                            {tx.student_email}) —{" "}
                            <span className="font-semibold text-[#202124]">{tx.plan_name}</span>
                            <p className="text-[#666666] mt-0.5">{tx.notes}</p>
                          </div>
                          <span className="text-[11px] text-[#666666] shrink-0">
                            {new Date(tx.created_at).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EDIT USER DETAILS MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] max-w-md w-full p-6 space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <h3 className="text-base font-bold text-[#202124]">Edit User Details</h3>
              <button type="button" onClick={() => setEditingUser(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="font-bold block mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingUser.full_name}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, full_name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB]"
                />
              </div>
              <div>
                <InternationalPhoneInput
                  label="Phone"
                  value={editingUser.phone}
                  onChange={(val) => setEditingUser({ ...editingUser, phone: val })}
                  countryPreference="India"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">University / College</label>
                <input
                  type="text"
                  value={editingUser.institution}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, institution: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB]"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Department</label>
                <input
                  type="text"
                  value={editingUser.department}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, department: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-lg border border-[#E5E7EB]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const ok = await callAdminAction(
                    "edit_user_details",
                    editingUser,
                    "Updated user details."
                  );
                  if (ok) setEditingUser(null);
                }}
                className="px-4 py-2 rounded-lg bg-[#2563EB] text-white font-semibold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center text-sm text-[#666666]">Loading...</div>}>
      <AdminPanelContent />
    </Suspense>
  );
}

