"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Compass,
  GraduationCap,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import { WebsiteSettings } from "@/types/database";

export default function AboutPage() {
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);

  useEffect(() => {
    fetch("/api/public")
      .then((res) => res.json())
      .then((data) => setSettings(data.settings || null));
  }, []);

  return (
    <div className="bg-white">
      {/* Header Banner */}
      <section className="bg-[#F7F8FA] border-b border-[#E5E7EB] py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
              About {settings?.site_name || "STARSKY"}
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#202124] leading-tight">
              {settings?.about_title ||
                "Bridging Academic Curiosity and Doctoral Research Mentorship"}
            </h1>
            <p className="text-base text-[#666666] leading-relaxed">
              {settings?.tagline || "Connecting Research Minds. Creating Opportunities."}
            </p>
          </div>
        </div>
      </section>

      {/* Story & Purpose */}
      <section className="py-16 lg:py-20 border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-5">
              <h2 className="text-2xl font-extrabold text-[#202124]">
                Why STARSKY Was Created
              </h2>
              <p className="text-sm sm:text-base text-[#666666] leading-relaxed whitespace-pre-line">
                {settings?.about_content ||
                  "STARSKY was founded to solve a fundamental disconnect in higher education: thousands of PhD scholars possess deep domain expertise in experimental design, scientific computing, clinical analysis, and academic publishing, while ambitious undergraduate and postgraduate students struggle to find structured research guidance beyond their immediate classrooms."}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-[#202124]">
                      For Undergraduate & PG Students
                    </h3>
                    <p className="text-xs text-[#666666] mt-1">
                      Direct access to hands-on research projects, research toolchains, and
                      publication mentorship.
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-[#202124]">
                      For Doctoral (PhD) Scholars
                    </h3>
                    <p className="text-xs text-[#666666] mt-1">
                      Build skilled student research cohorts, accelerate experiments, and establish
                      supervisory leadership.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-2xl overflow-hidden border border-[#E5E7EB] shadow-md">
                <img
                  src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1000&q=80"
                  alt="Academic Research Collaboration"
                  className="w-full h-80 object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 lg:py-20 bg-[#F7F8FA] border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card-corporate p-8">
              <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] border border-[#2563EB]/30 flex items-center justify-center">
                <Target className="w-6 h-6 text-[#2563EB]" />
              </div>
              <h2 className="text-xl font-extrabold text-[#202124] mt-5">Our Mission</h2>
              <p className="text-sm text-[#666666] mt-3 leading-relaxed">
                {settings?.mission_statement ||
                  "To democratize access to high-impact academic research mentorship by connecting motivated undergraduate and postgraduate students with verified PhD scholars across every discipline."}
              </p>
            </div>

            <div className="card-corporate p-8">
              <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] border border-[#2563EB]/30 flex items-center justify-center">
                <Compass className="w-6 h-6 text-[#2563EB]" />
              </div>
              <h2 className="text-xl font-extrabold text-[#202124] mt-5">Our Vision</h2>
              <p className="text-sm text-[#666666] mt-3 leading-relaxed">
                {settings?.vision_statement ||
                  "A global academic ecosystem where every curious student can contribute to frontier research and every doctoral scholar can build agile, collaborative research teams."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contribution to Research Collaboration */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
              Academic Impact
            </span>
            <h2 className="text-3xl font-extrabold text-[#202124] mt-2">
              How STARSKY Strengthens the Research Ecosystem
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            <div className="card-corporate p-6">
              <GraduationCap className="w-6 h-6 text-[#2563EB]" />
              <h3 className="text-base font-bold text-[#202124] mt-4">
                Cross-Institutional Collaboration
              </h3>
              <p className="text-xs text-[#666666] mt-2 leading-relaxed">
                Students from tier-2 and tier-3 engineering, science, and medical colleges can
                collaborate remotely or on-site with doctoral researchers at premier national
                institutes.
              </p>
            </div>

            <div className="card-corporate p-6">
              <ShieldCheck className="w-6 h-6 text-[#2563EB]" />
              <h3 className="text-base font-bold text-[#202124] mt-4">
                Verified Academic Integrity
              </h3>
              <p className="text-xs text-[#666666] mt-2 leading-relaxed">
                Every PhD scholar is vetted for institutional enrollment, research domain, and
                publications—ensuring trustworthy academic mentorship.
              </p>
            </div>

            <div className="card-corporate p-6">
              <Users className="w-6 h-6 text-[#2563EB]" />
              <h3 className="text-base font-bold text-[#202124] mt-4">
                Interdisciplinary Innovation
              </h3>
              <p className="text-xs text-[#666666] mt-2 leading-relaxed">
                Computer science students collaborate with medical researchers on neuroimaging;
                statistics students work with management scholars on causal econometrics.
              </p>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap gap-4">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] transition-colors"
            >
              <span>Explore Academic Domains</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg border border-[#D1D5DB] text-sm font-semibold text-[#202124] hover:border-[#2563EB] hover:text-[#2563EB] transition-colors"
            >
              <span>Create Your Account</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

