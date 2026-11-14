"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshSession } = useAuth();

  const initialRole = searchParams.get("role") === "scholar" ? "scholar" : "student";
  const [role, setRole] = useState<"student" | "scholar">(initialRole);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("India");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const r = searchParams.get("role");
    if (r === "scholar" || r === "student") {
      setRole(r);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          role,
          phone,
          country,
          state,
          city,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed.");
      } else {
        await refreshSession();
        router.push(data.redirectUrl);
      }
    } catch {
      setError("Network error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 sm:p-10">
        <div className="text-center max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#2563EB]/30 text-xs font-semibold text-[#2563EB]">
            <Sparkles className="w-3.5 h-3.5" /> Join STARSKY
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202124] mt-3">
            Create Your Academic Account
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] mt-1">
            Select your account type below. After registration, you will be guided to your
            dedicated academic profile onboarding form.
          </p>
        </div>

        {/* Role Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          <button
            type="button"
            onClick={() => setRole("student")}
            className={`p-5 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
              role === "student"
                ? "border-[#2563EB] bg-[#EFF6FF] ring-1 ring-[#2563EB]"
                : "border-[#E5E7EB] bg-white hover:border-[#D1D5DB]"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                role === "student" ? "bg-[#2563EB] text-white" : "bg-[#F7F8FA] text-[#202124]"
              }`}
            >
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#202124]">1. Student Account</span>
                {role === "student" && <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />}
              </div>
              <p className="text-xs text-[#666666] mt-1 leading-relaxed">
                For undergraduate and postgraduate students seeking research internships and
                mentorship.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setRole("scholar")}
            className={`p-5 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
              role === "scholar"
                ? "border-[#2563EB] bg-[#EFF6FF] ring-1 ring-[#2563EB]"
                : "border-[#E5E7EB] bg-white hover:border-[#D1D5DB]"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                role === "scholar" ? "bg-[#2563EB] text-white" : "bg-[#F7F8FA] text-[#202124]"
              }`}
            >
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#202124]">2. PhD Scholar Account</span>
                {role === "scholar" && <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />}
              </div>
              <p className="text-xs text-[#666666] mt-1 leading-relaxed">
                For doctoral researchers offering research internships, project guidance, and
                mentorship.
              </p>
            </div>
          </button>
        </div>

        {error && (
          <div className="mt-6 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                Full Name <span className="text-[#2563EB]">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={role === "scholar" ? "e.g., Ananya Raghavan" : "e.g., Aarav Sharma"}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#202124] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                Email Address <span className="text-[#2563EB]">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.ac.in"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#202124] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                Password <span className="text-[#2563EB]">*</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#202124] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                Phone Number <span className="text-[#2563EB]">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#202124] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                Country <span className="text-[#2563EB]">*</span>
              </label>
              <input
                type="text"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#202124] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                State / Province <span className="text-[#2563EB]">*</span>
              </label>
              <input
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g., Karnataka"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#202124] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                City <span className="text-[#2563EB]">*</span>
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., Bengaluru"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#202124] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-lg bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>
                  Continue to {role === "scholar" ? "PhD Scholar" : "Student"} Profile Onboarding
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-[#666666] text-center mt-6 pt-6 border-t border-[#E5E7EB]">
          Already registered on STARSKY?{" "}
          <Link href="/login" className="text-[#2563EB] font-semibold hover:underline">
            Sign In Here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-[#666666]">Loading...</div>}>
      <RegisterFormContent />
    </Suspense>
  );
}

