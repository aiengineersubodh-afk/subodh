"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Password Reset Modal State
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetNewPass, setResetNewPass] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetErr, setResetErr] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Sign in failed.");
      } else {
        await refreshSession();
        router.push(data.redirectUrl || "/");
      }
    } catch {
      setError("Network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const quickFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetErr("");
    setResetMsg("");
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: resetEmail, newPassword: resetNewPass }),
    });
    const data = await res.json();
    if (!res.ok) {
      setResetErr(data.error || "Failed to reset password.");
    } else {
      setResetMsg(data.message);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#F7F8FA] py-14 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        {/* Left Brand Panel */}
        <div className="lg:col-span-5 bg-[#202124] text-white p-8 sm:p-10 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/10 text-xs font-semibold text-[#2563EB]">
              <Sparkles className="w-3.5 h-3.5" /> STARSKY Member Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">
              Welcome Back to STARSKY
            </h1>
            <p className="text-xs text-gray-300 leading-relaxed">
              Sign in to manage your research profile, track internship applications, or review
              student candidates.
            </p>
          </div>

          {/* Demo Accounts Box (Clearly Marked as Demo Data) */}
          <div className="mt-8 pt-6 border-t border-white/15 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB]">
              Demo Evaluation Accounts (Click to Fill)
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => quickFillDemo("aarav.sharma@nitk.edu.in", "Student@2026")}
                className="w-full text-left p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold block text-white">
                    Student: Aarav Sharma (NITK)
                  </span>
                  <span className="text-[11px] text-gray-400">aarav.sharma@nitk.edu.in</span>
                </div>
                <UserCheck className="w-4 h-4 text-[#2563EB]" />
              </button>

              <button
                type="button"
                onClick={() => quickFillDemo("ananya.raghavan@iisc.ac.in", "Scholar@2026")}
                className="w-full text-left p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold block text-white">
                    PhD Scholar: Ananya Raghavan (IISc)
                  </span>
                  <span className="text-[11px] text-gray-400">ananya.raghavan@iisc.ac.in</span>
                </div>
                <GraduationCap className="w-4 h-4 text-[#2563EB]" />
              </button>
            </div>
            <p className="text-[11px] text-gray-400 pt-1">
              Administrator?{" "}
              <Link href="/admin/login" className="text-[#2563EB] underline font-semibold">
                Sign in via Admin Portal →
              </Link>
            </p>
          </div>
        </div>

        {/* Right Login Form */}
        <div className="lg:col-span-7 p-8 sm:p-10">
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-extrabold text-[#202124]">Sign In to Your Account</h2>
            <p className="text-xs text-[#666666] mt-1">
              Enter your registered institutional or personal email address.
            </p>

            {error && (
              <div className="mt-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="mt-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#666666] absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@university.edu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#202124] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setResetOpen(true);
                    }}
                    className="text-xs text-[#2563EB] hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#666666] absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#202124] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-5 rounded-lg bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-xs text-[#666666] text-center mt-6 pt-6 border-t border-[#E5E7EB]">
              Don’t have a STARSKY account yet?{" "}
              <Link href="/register" className="text-[#2563EB] font-semibold hover:underline">
                Create an Account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {resetOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E5E7EB] max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#2563EB]" />
                <h3 className="text-base font-bold text-[#202124]">Reset Account Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setResetOpen(false)}
                className="text-xs text-[#666666] hover:text-[#202124]"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-[#666666]">
              Enter your registered email and choose a new password (minimum 8 characters).
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
            <form onSubmit={handlePasswordReset} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">
                  Account Email
                </label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={resetNewPass}
                  onChange={(e) => setResetNewPass(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E5E7EB] text-xs font-medium text-[#666666]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

