"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AdminLoginPage() {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, adminPortal: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Administrator authentication failed.");
      } else {
        await refreshSession();
        router.push("/admin");
      }
    } catch {
      setError("Network error while authenticating.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#F7F8FA] py-16 px-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#E5E7EB] shadow-md overflow-hidden">
        <div className="bg-[#202124] text-white p-7 space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-white/10 text-xs font-bold text-[#2563EB]">
            <ShieldCheck className="w-4 h-4" /> Restricted Governance Access
          </div>
          <h1 className="text-2xl font-extrabold">STARSKY Admin Portal</h1>
          <p className="text-xs text-gray-300">
            Authorized platform administrators only. Public registration is disabled for
            administrative accounts.
          </p>
        </div>

        <div className="p-7 space-y-5">
          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#666666] absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@institution.edu"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#E5E7EB] text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1">
                Administrator Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#666666] absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#E5E7EB] text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-[#202124] text-white text-sm font-semibold hover:bg-[#2563EB] transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 text-[#2563EB]" />
                  <span>Enter Admin Control Panel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

