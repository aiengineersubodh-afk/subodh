"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { InternationalPhoneInput, validateInternationalPhone } from "@/components/PhoneInput";

interface AuthGatewayProps {
  initialTab?: "login" | "register";
}

function AuthGatewayContent({ initialTab = "login" }: AuthGatewayProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, refreshSession } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">(initialTab);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync tab with URL search parameter if provided (?mode=register or ?tab=register)
  useEffect(() => {
    const mode = searchParams.get("mode") || searchParams.get("tab");
    if (mode === "register") {
      setActiveTab("register");
    } else if (mode === "login") {
      setActiveTab("login");
    }
  }, [searchParams]);

  // If already authenticated, redirect to appropriate destination immediately
  useEffect(() => {
    if (session) {
      const redirectUrl = searchParams.get("redirect");
      if (
        redirectUrl &&
        redirectUrl.startsWith("/") &&
        !redirectUrl.startsWith("//") &&
        !redirectUrl.startsWith("/login") &&
        !redirectUrl.startsWith("/register")
      ) {
        router.push(redirectUrl);
        return;
      }

      if (session.user.role === "admin") {
        router.push("/admin");
      } else if (session.user.role === "scholar") {
        router.push(
          session.user.onboarding_completed
            ? "/dashboard/scholar"
            : "/onboarding/scholar"
        );
      } else {
        router.push(
          session.user.onboarding_completed
            ? "/dashboard/student"
            : "/onboarding/student"
        );
      }
    }
  }, [session, router, searchParams]);

  // ---------------------------------------------------------------------------
  // LOGIN STATE
  // ---------------------------------------------------------------------------
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState("");
  const [accountNotFound, setAccountNotFound] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // REGISTRATION STATE
  // ---------------------------------------------------------------------------
  const [regRole, setRegRole] = useState<"student" | "scholar">("student");
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regPhone, setRegPhone] = useState("");
  const [regCountry] = useState("India");
  const [regState, setRegState] = useState("");
  const [regCity, setRegCity] = useState("");
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // PASSWORD RESET MODAL STATE
  // ---------------------------------------------------------------------------
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetNewPass, setResetNewPass] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetErr, setResetErr] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setAccountNotFound(false);
    setLoginLoading(true);

    try {
      const redirectTarget = searchParams.get("redirect") || "";
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
          remember_me: rememberMe,
          redirect: redirectTarget,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.accountNotFound || res.status === 404) {
          setAccountNotFound(true);
          setLoginError(
            data.error ||
              "We couldn't find an account matching those details. Please check your email or create a new STARSKY account."
          );
        } else {
          setLoginError(data.error || "Invalid email or password. Please check your credentials.");
        }
      } else {
        window.location.href = data.redirectUrl || "/";
      }
    } catch {
      setLoginError("Network connection error. Please verify your connection and try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");

    const phoneValidation = validateInternationalPhone(regPhone, regCountry);
    if (!phoneValidation.isValid) {
      setRegError(phoneValidation.error || "Please enter a valid phone number.");
      return;
    }

    setRegLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: regFullName.trim(),
          email: regEmail.trim(),
          password: regPassword,
          role: regRole,
          phone: regPhone.trim(),
          country: regCountry,
          state: regState.trim(),
          city: regCity.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRegError(data.error || "Registration could not be completed.");
      } else {
        window.location.href = data.redirectUrl;
      }
    } catch {
      setRegError("Network connection error. Please try again.");
    } finally {
      setRegLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetErr("");
    setResetMsg("");
    setResetLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail.trim(),
          newPassword: resetNewPass,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResetErr(data.error || "Failed to reset password.");
      } else {
        setResetMsg(data.message || "Password has been successfully updated. You can now log in.");
      }
    } catch {
      setResetErr("Network error. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  const quickFillDemo = (demoEmail: string, demoPass: string) => {
    setLoginEmail(demoEmail);
    setLoginPassword(demoPass);
    setLoginError("");
    setAccountNotFound(false);
    setActiveTab("login");
  };

  return (
    <div
      data-hydrated={mounted ? "true" : "false"}
      className="min-h-[90vh] bg-[#F7F8FA] py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center"
    >
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-2xl border border-[#E5E7EB] shadow-md overflow-hidden">
        {/* =================================================================== */}
        {/* LEFT BRAND PANEL (Charcoal & Orange Aesthetic)                      */}
        {/* =================================================================== */}
        <div className="lg:col-span-5 bg-[#202124] text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Orange Glow Ambient Decor */}
          <div className="absolute -top-24 -left-24 w-60 h-60 bg-[#F97316]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-[#2563EB]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-6 relative z-10">
            {/* Platform Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-white">
              <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
              <span>STARSKY Academic Gateway</span>
            </div>

            {/* Brand Title */}
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
                <span>STARSKY</span>
              </h1>
              <p className="text-xs text-[#F97316] font-semibold tracking-wide uppercase mt-1">
                Connecting Research Minds. Creating Opportunities.
              </p>
            </div>

            {/* Platform Value Proposition */}
            <p className="text-xs text-gray-300 leading-relaxed">
              India&apos;s premier research collaboration network connecting doctoral scholars with
              undergraduate and postgraduate students across all 9 academic domains.
            </p>

            {/* Key Platform Highlights */}
            <div className="space-y-2.5 pt-2 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#F97316] shrink-0" />
                <span>Verified PhD Researchers & Mentors</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#F97316] shrink-0" />
                <span>Curated Research Internships across 57 Specializations</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#F97316] shrink-0" />
                <span>Paper Co-authorship & Lab Fellowship Opportunities</span>
              </div>
            </div>
          </div>

          {/* Quick Demo Accounts Box for Evaluators */}
          <div className="mt-8 pt-6 border-t border-white/15 space-y-3 relative z-10">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Evaluation Test Accounts
              </p>
              <span className="text-[10px] text-gray-400">One-click fill</span>
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => quickFillDemo("aarav.sharma@nitk.edu.in", "Student@2026")}
                className="w-full text-left p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold block text-white">Student: Aarav Sharma (NITK)</span>
                  <span className="text-[11px] text-gray-400">aarav.sharma@nitk.edu.in</span>
                </div>
                <UserCheck className="w-4 h-4 text-[#F97316]" />
              </button>

              <button
                type="button"
                onClick={() => quickFillDemo("ananya.raghavan@iisc.ac.in", "Scholar@2026")}
                className="w-full text-left p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold block text-white">PhD Scholar: Dr. Ananya (IISc)</span>
                  <span className="text-[11px] text-gray-400">ananya.raghavan@iisc.ac.in</span>
                </div>
                <GraduationCap className="w-4 h-4 text-[#F97316]" />
              </button>
            </div>

            <div className="pt-2 text-center sm:text-left">
              <Link
                href="/admin/login"
                className="text-[11px] text-gray-400 hover:text-[#F97316] transition-colors inline-flex items-center gap-1 font-medium"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#F97316]" />
                <span>Sign in via Admin Portal →</span>
              </Link>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* RIGHT INTERACTIVE GATEWAY PANEL (Login / Register Switcher)         */}
        {/* =================================================================== */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            {/* Header Required by Prompt: Welcome to STARSKY */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#202124] tracking-tight">
                Welcome to STARSKY
              </h2>
              <p className="text-xs sm:text-sm text-[#666666] mt-1.5 leading-relaxed">
                Connect with researchers, explore academic opportunities, and discover your next
                research journey.
              </p>
            </div>

            {/* TWO PROMINENT ACTIONS (Gateway Mode Selector) */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#F7F8FA] rounded-xl border border-[#E5E7EB] mt-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  setLoginError("");
                  setAccountNotFound(false);
                }}
                className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === "login"
                    ? "bg-white text-[#202124] shadow-xs border border-[#E5E7EB] text-[#F97316]"
                    : "text-[#666666] hover:text-[#202124]"
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 text-[#F97316]" />
                <span>Login to Your Account</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("register");
                  setRegError("");
                }}
                className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === "register"
                    ? "bg-white text-[#202124] shadow-xs border border-[#E5E7EB] text-[#F97316]"
                    : "text-[#666666] hover:text-[#202124]"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 text-[#F97316]" />
                <span>Create a New Account</span>
              </button>
            </div>

            {/* =============================================================== */}
            {/* VIEW 1: LOGIN FLOW                                              */}
            {/* =============================================================== */}
            {activeTab === "login" && (
              <div className="mt-6">
                {/* Account Not Found Alert with Direct Action Button */}
                {accountNotFound ? (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold">Account Not Found</p>
                        <p className="text-xs mt-0.5 text-amber-800 leading-relaxed">
                          We couldn&apos;t find an account matching those details. Please check your
                          email or create a new STARSKY account.
                        </p>
                      </div>
                    </div>
                    <div className="pl-6.5 pt-0.5">
                      <button
                        type="button"
                        data-action="create-account-now"
                        onClick={() => {
                          setRegEmail(loginEmail);
                          setActiveTab("register");
                          setAccountNotFound(false);
                          setLoginError("");
                        }}
                        className="px-4 py-2 rounded-lg bg-[#F97316] text-white text-xs font-bold hover:bg-[#EA580C] transition-colors inline-flex items-center gap-1.5 shadow-xs"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Create Account Now →</span>
                      </button>
                    </div>
                  </div>
                ) : loginError ? (
                  /* Standard Invalid Credentials Error */
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{loginError}</span>
                  </div>
                ) : null}

                {/* Login Form */}
                <form onSubmit={handleLoginSubmit} className="mt-5 space-y-4">
                  {/* Email Input */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#202124] mb-1.5">
                      Email Address <span className="text-[#F97316]">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#666666] absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => {
                          setLoginEmail(e.target.value);
                          if (accountNotFound) setAccountNotFound(false);
                          if (loginError) setLoginError("");
                        }}
                        placeholder="name@university.edu"
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#202124] focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]"
                      />
                    </div>
                  </div>

                  {/* Password Input with Show/Hide Toggle */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#202124]">
                        Password <span className="text-[#F97316]">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(loginEmail);
                          setResetOpen(true);
                        }}
                        className="text-xs text-[#F97316] hover:underline font-semibold"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#666666] absolute left-3.5 top-3" />
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        required
                        value={loginPassword}
                        onChange={(e) => {
                          setLoginPassword(e.target.value);
                          if (loginError) setLoginError("");
                        }}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#202124] focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword((prev) => !prev)}
                        className="absolute right-3.5 top-3 text-[#666666] hover:text-[#202124] focus:outline-none"
                        aria-label={showLoginPassword ? "Hide password" : "Show password"}
                      >
                        {showLoginPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me Checkbox */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-[#E5E7EB] text-[#F97316] focus:ring-[#F97316] accent-[#F97316]"
                    />
                    <label htmlFor="rememberMe" className="text-xs text-[#666666] select-none">
                      Remember me on this browser (7-day session)
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3 px-5 rounded-lg bg-[#202124] text-white text-sm font-bold hover:bg-[#111214] transition-colors flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm"
                  >
                    {loginLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#F97316]" />
                        <span>Authenticating...</span>
                      </>
                    ) : (
                      <>
                        <span>Login to Your Account</span>
                        <ArrowRight className="w-4 h-4 text-[#F97316]" />
                      </>
                    )}
                  </button>
                </form>

                {/* Footer Switcher */}
                <p className="text-xs text-[#666666] text-center mt-6 pt-5 border-t border-[#E5E7EB]">
                  Don’t have a STARSKY account yet?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("register");
                      setLoginError("");
                      setAccountNotFound(false);
                    }}
                    className="text-[#F97316] font-bold hover:underline"
                  >
                    Create one now →
                  </button>
                </p>
              </div>
            )}

            {/* =============================================================== */}
            {/* VIEW 2: REGISTRATION FLOW                                       */}
            {/* =============================================================== */}
            {activeTab === "register" && (
              <div className="mt-6">
                {regError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2 mb-4">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{regError}</span>
                  </div>
                )}

                {/* Role Selector Cards: Student vs PhD Scholar */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#202124] mb-2">
                    Select Account Role <span className="text-[#F97316]">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      data-role-btn="student"
                      onClick={() => setRegRole("student")}
                      className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        regRole === "student"
                          ? "border-[#F97316] bg-orange-50/40 ring-1 ring-[#F97316]"
                          : "border-[#E5E7EB] bg-white hover:border-[#D1D5DB]"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <BookOpen
                          className={`w-5 h-5 ${
                            regRole === "student" ? "text-[#F97316]" : "text-[#666666]"
                          }`}
                        />
                        {regRole === "student" && (
                          <span className="w-2 h-2 rounded-full bg-[#F97316]" />
                        )}
                      </div>
                      <div className="mt-2.5">
                        <span className="font-bold text-xs text-[#202124] block">Student</span>
                        <span className="text-[10px] text-[#666666] leading-tight block mt-0.5">
                          Undergraduate or Postgraduate
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      data-role-btn="scholar"
                      onClick={() => setRegRole("scholar")}
                      className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        regRole === "scholar"
                          ? "border-[#F97316] bg-orange-50/40 ring-1 ring-[#F97316]"
                          : "border-[#E5E7EB] bg-white hover:border-[#D1D5DB]"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <GraduationCap
                          className={`w-5 h-5 ${
                            regRole === "scholar" ? "text-[#F97316]" : "text-[#666666]"
                          }`}
                        />
                        {regRole === "scholar" && (
                          <span className="w-2 h-2 rounded-full bg-[#F97316]" />
                        )}
                      </div>
                      <div className="mt-2.5">
                        <span className="font-bold text-xs text-[#202124] block">PhD Scholar</span>
                        <span className="text-[10px] text-[#666666] leading-tight block mt-0.5">
                          Doctoral Researcher & Mentor
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Registration Form */}
                <form onSubmit={handleRegisterSubmit} className="mt-4 space-y-3.5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-[#202124] mb-1">
                      Full Legal Name <span className="text-[#F97316]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder={regRole === "scholar" ? "Dr. / Scholar Name" : "Student Name"}
                      className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#202124] focus:outline-none focus:border-[#F97316]"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-[#202124] mb-1">
                      Email Address <span className="text-[#F97316]">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#666666] absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="you@institution.edu"
                        className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#202124] focus:outline-none focus:border-[#F97316]"
                      />
                    </div>
                  </div>

                  {/* Password with Show/Hide */}
                  <div>
                    <label className="block text-xs font-semibold text-[#202124] mb-1">
                      Create Password <span className="text-[#F97316]">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#666666] absolute left-3 top-2.5" />
                      <input
                        type={showRegPassword ? "text" : "password"}
                        required
                        minLength={8}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min 8 chars, 1 uppercase, 1 number"
                        className="w-full pl-9 pr-9 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#202124] focus:outline-none focus:border-[#F97316]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword((prev) => !prev)}
                        className="absolute right-3 top-2.5 text-[#666666] hover:text-[#202124]"
                        aria-label={showRegPassword ? "Hide password" : "Show password"}
                      >
                        {showRegPassword ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Phone & State/City Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <InternationalPhoneInput
                        label="Phone Number"
                        required
                        value={regPhone}
                        onChange={(val) => {
                          setRegPhone(val);
                          if (regError) setRegError("");
                        }}
                        countryPreference={regCountry || "India"}
                        theme="orange"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#202124] mb-1">
                        State / Province <span className="text-[#F97316]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={regState}
                        onChange={(e) => setRegState(e.target.value)}
                        placeholder="e.g. Karnataka"
                        className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#202124] focus:outline-none focus:border-[#F97316]"
                      />
                    </div>
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-xs font-semibold text-[#202124] mb-1">
                      City <span className="text-[#F97316]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                      placeholder="e.g. Bangalore"
                      className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#202124] focus:outline-none focus:border-[#F97316]"
                    />
                  </div>

                  {/* Registration Submit Button */}
                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full py-2.5 px-4 rounded-lg bg-[#F97316] text-white text-xs font-bold hover:bg-[#EA580C] transition-colors flex items-center justify-center gap-2 disabled:opacity-60 shadow-xs mt-2"
                  >
                    {regLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <span>Create {regRole === "scholar" ? "PhD Scholar" : "Student"} Account</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>

                {/* Switch back to Login */}
                <p className="text-xs text-[#666666] text-center mt-5 pt-4 border-t border-[#E5E7EB]">
                  Already have a STARSKY account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("login");
                      setRegError("");
                    }}
                    className="text-[#F97316] font-bold hover:underline"
                  >
                    Login to Your Account →
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* PASSWORD RESET MODAL                                                  */}
      {/* ===================================================================== */}
      {resetOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-[#F97316]" />
                </div>
                <h3 className="text-base font-bold text-[#202124]">Reset Account Password</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setResetOpen(false);
                  setResetMsg("");
                  setResetErr("");
                }}
                className="text-xs text-[#666666] hover:text-[#202124]"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-[#666666] leading-relaxed">
              Enter your registered institutional or personal email address and choose a new
              password (minimum 8 characters).
            </p>

            {resetMsg && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-xs text-green-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <span>{resetMsg}</span>
              </div>
            )}

            {resetErr && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {resetErr}
              </div>
            )}

            <form onSubmit={handlePasswordReset} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">
                  Registered Account Email
                </label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#202124] focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">
                  New Password (min 8 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={resetNewPass}
                  onChange={(e) => setResetNewPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#202124] focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResetOpen(false);
                    setResetMsg("");
                    setResetErr("");
                  }}
                  className="px-4 py-2 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-[#666666] hover:bg-[#F7F8FA]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-4 py-2 rounded-lg bg-[#F97316] text-white text-xs font-bold hover:bg-[#EA580C] transition-colors disabled:opacity-60"
                >
                  {resetLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function AuthGateway({ initialTab = "login" }: AuthGatewayProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#F97316]" />
        </div>
      }
    >
      <AuthGatewayContent initialTab={initialTab} />
    </Suspense>
  );
}
