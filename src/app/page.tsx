"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  FileCheck2,
  GraduationCap,
  Megaphone,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import {
  Announcement,
  EnrichedApplication,
  EnrichedInternship,
  EnrichedScholar,
  Testimonial,
  WebsiteSettings,
} from "@/types/database";
import { useAuth } from "@/context/AuthContext";
import {
  InternshipApplicationAction,
  ViewApplicationModal,
} from "@/components/ApplicationStatusModal";
import { STARSKY_ASSETS } from "@/config/assets";
import { FeaturedScholarsParticleBackground } from "@/components/FeaturedScholarsParticleBackground";
import { TestimonialsGalaxyBackground } from "@/components/TestimonialsGalaxyBackground";

interface PublicHomeData {
  settings: WebsiteSettings;
  scholars: EnrichedScholar[];
  internships: EnrichedInternship[];
  studentApplications?: Record<string, EnrichedApplication>;
  testimonials: Testimonial[];
  announcements: Announcement[];
  stats: {
    verifiedScholars: number;
    activeInternships: number;
    registeredStudents: number;
    academicDomains: number;
    specializationsCount: number;
    totalApplications: number;
  };
}

export default function HomePage() {
  const { session } = useAuth();
  const [data, setData] = useState<PublicHomeData | null>(null);
  const [viewingApplication, setViewingApplication] =
    useState<EnrichedApplication | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] =
    useState<boolean>(false);
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);
  const whyChooseVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = (matches: boolean) => {
      setPrefersReducedMotion(matches);
      if (matches) {
        heroVideoRef.current?.pause();
        whyChooseVideoRef.current?.pause();
      } else {
        heroVideoRef.current?.play().catch(() => {});
        whyChooseVideoRef.current?.play().catch(() => {});
      }
    };

    updateMotionPreference(mediaQuery.matches);
    const listener = (event: MediaQueryListEvent) =>
      updateMotionPreference(event.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    // Autoplay videos reliably across browsers
    heroVideoRef.current?.play().catch(() => {});
    whyChooseVideoRef.current?.play().catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/public", { cache: "no-store" })
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
      });
  }, [session?.user?.id]);

  const settings = data?.settings;
  const scholars = data?.scholars || [];
  const internships = data?.internships || [];
  const studentApplications = data?.studentApplications || {};
  const testimonials = data?.testimonials || [];
  const announcements = data?.announcements || [];
  const heroPosterUrl =
    settings?.hero_image_url || "/videos/starsky-research-hero-poster.svg";

  return (
    <div className="bg-white">
      {/* 1. ANNOUNCEMENT BAR */}
      {announcements.length > 0 && (
        <div className="bg-[#EFF6FF] border-b border-[#2563EB]/25 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-[#202124]">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#2563EB] text-white font-bold uppercase tracking-wider text-[10px]">
                <Megaphone className="w-3 h-3" /> Announcement
              </span>
              <span className="font-semibold">{announcements[0].title}:</span>
              <span className="text-[#666666]">{announcements[0].content}</span>
            </div>
            <Link
              href="/explore"
              className="text-[#2563EB] font-semibold hover:underline inline-flex items-center gap-1"
            >
              Explore Now <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* 3. HERO SECTION */}
      <section className="relative bg-[#202124] border-b border-[#E5E7EB] overflow-hidden min-h-[560px] sm:min-h-[600px] lg:min-h-[650px] flex items-center">
        {/* Full-Bleed Background Video & Static Fallback Poster */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none bg-[#202124]"
        >
          <img
            src={heroPosterUrl}
            alt=""
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />

          {!prefersReducedMotion && (
            <video
              ref={heroVideoRef}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/videos/starsky-research-hero-poster.svg"
              className="absolute inset-0 w-full h-full object-cover object-center"
              style={{ objectFit: "cover" }}
            >
              <source
                src={STARSKY_ASSETS.homeHeroVideo.livePath}
                type="video/mp4"
              />
              <source
                src={STARSKY_ASSETS.homeHeroVideo.staticPath}
                type="video/mp4"
              />
            </video>
          )}

          {/* Subtle Directional Readability Overlay (Charcoal + Warm Orange Accent) */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#202124]/92 via-[#202124]/76 to-[#202124]/38" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#202124]/70 via-transparent to-[#202124]/30" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-xs border border-white/20 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#202124]">
                  {settings?.tagline ||
                    "Connecting Research Minds. Creating Opportunities."}
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight text-white leading-[1.12] drop-shadow-xs">
                {settings?.hero_heading ||
                  "Where Student Ambitions Meet Research Excellence."}
              </h1>

              <p className="text-lg text-gray-200 leading-relaxed max-w-2xl">
                {settings?.hero_description ||
                  "Discover research opportunities, connect with experienced PhD scholars, and turn your academic curiosity into real-world research experience."}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/explore"
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-lg bg-[#2563EB] text-white font-semibold text-base hover:bg-[#1D4ED8] transition-colors shadow-sm"
                >
                  <span>Explore Researchers</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-lg bg-white text-[#202124] border border-white font-semibold text-base hover:border-[#2563EB] hover:text-[#2563EB] transition-colors shadow-sm"
                >
                  <span>Join STARSKY</span>
                </Link>
              </div>

              {/* Institutional Trust Highlights */}
              <div className="pt-6 border-t border-white/20 grid grid-cols-3 gap-6 max-w-xl">
                <div>
                  <p className="text-2xl font-extrabold text-white">
                    {data?.stats?.verifiedScholars ?? 4}+
                  </p>
                  <p className="text-xs text-gray-300 mt-0.5">
                    Verified PhD Scholars
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-white">
                    {data?.stats?.specializationsCount ?? 52}+
                  </p>
                  <p className="text-xs text-gray-300 mt-0.5">
                    Academic Specializations
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-[#2563EB]">100%</p>
                  <p className="text-xs text-gray-300 mt-0.5">
                    Verified Doctoral Mentors
                  </p>
                </div>
              </div>
            </div>

            {/* Right Visual Balance Card */}
            <div className="lg:col-span-5 flex lg:justify-end">
              <div className="w-full max-w-md rounded-2xl bg-white/95 backdrop-blur-md border border-[#E5E7EB] p-5 shadow-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] border border-[#2563EB]/30 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#202124]">
                      Verified Doctoral Mentorship
                    </p>
                    <p className="text-[11px] text-[#666666] mt-0.5">
                      Scholars from IISc, IITs, AIIMS, IIMs &amp; TIFR
                    </p>
                  </div>
                </div>
                <Link
                  href="/explore"
                  className="text-xs font-semibold text-[#2563EB] hover:underline shrink-0"
                >
                  Directory →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PLATFORM STATISTICS */}
      <section className="bg-[#F7F8FA] border-b border-[#E5E7EB] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-[#E5E7EB]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#666666]">
                  Verified PhD Scholars
                </span>
                <GraduationCap className="w-5 h-5 text-[#2563EB]" />
              </div>
              <p className="text-3xl font-extrabold text-[#202124] mt-3">
                {data?.stats?.verifiedScholars ?? 0}
              </p>
              <p className="text-xs text-[#666666] mt-1">
                Active doctoral mentors across premier institutes
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-[#E5E7EB]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#666666]">
                  Open Research Internships
                </span>
                <BookOpen className="w-5 h-5 text-[#2563EB]" />
              </div>
              <p className="text-3xl font-extrabold text-[#202124] mt-3">
                {data?.stats?.activeInternships ?? 0}
              </p>
              <p className="text-xs text-[#666666] mt-1">
                Remote, Hybrid &amp; On-site research positions
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-[#E5E7EB]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#666666]">
                  Registered Students
                </span>
                <Users className="w-5 h-5 text-[#2563EB]" />
              </div>
              <p className="text-3xl font-extrabold text-[#202124] mt-3">
                {data?.stats?.registeredStudents ?? 0}
              </p>
              <p className="text-xs text-[#666666] mt-1">
                Undergraduate &amp; postgraduate research aspirants
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-[#E5E7EB]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#666666]">
                  Academic Specializations
                </span>
                <Award className="w-5 h-5 text-[#2563EB]" />
              </div>
              <p className="text-3xl font-extrabold text-[#202124] mt-3">
                {data?.stats?.specializationsCount ?? 0}
              </p>
              <p className="text-xs text-[#666666] mt-1">
                Specialized research tracks across disciplines
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW STARSKY WORKS */}
      <section className="py-20 bg-white border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
              Structured Collaboration Workflow
            </span>
            <h2 className="text-3xl font-extrabold text-[#202124] mt-2">
              How STARSKY Works
            </h2>
            <p className="text-base text-[#666666] mt-3">
              A transparent, merit-driven research pipeline designed for both ambitious students
              and doctoral scholars.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 01 — Explore Researchers */}
            <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-xs hover:border-[#2563EB] hover:shadow-md transition-all duration-300 group flex flex-col">
              {/* Complete, Clear Image Container with exact 1738:905 native aspect ratio */}
              <div className="relative w-full aspect-[1738/905] overflow-hidden bg-slate-900">
                <img
                  src={STARSKY_ASSETS.howStarskyWorksCards.exploreResearchers.livePath}
                  alt="01 — Explore Researchers"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
                <div className="absolute top-3.5 left-3.5 w-10 h-10 rounded-lg bg-white/95 border border-[#2563EB]/40 flex items-center justify-center text-[#2563EB] font-extrabold text-sm shadow-sm backdrop-blur-xs">
                  01
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#202124] group-hover:text-[#2563EB] transition-colors">
                    01 — Explore Researchers
                  </h3>
                  <p className="text-xs sm:text-sm text-[#666666] mt-2.5 leading-relaxed">
                    Browse verified PhD scholars across institutions, inspect their doctoral research
                    topics, publications, laboratory methodologies, and technical skill sets.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 02 — Discover Opportunities */}
            <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-xs hover:border-[#2563EB] hover:shadow-md transition-all duration-300 group flex flex-col">
              {/* Complete, Clear Image Container with exact 1738:905 native aspect ratio */}
              <div className="relative w-full aspect-[1738/905] overflow-hidden bg-slate-900">
                <img
                  src={STARSKY_ASSETS.howStarskyWorksCards.discoverOpportunities.livePath}
                  alt="02 — Discover Opportunities"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
                <div className="absolute top-3.5 left-3.5 w-10 h-10 rounded-lg bg-white/95 border border-[#2563EB]/40 flex items-center justify-center text-[#2563EB] font-extrabold text-sm shadow-sm backdrop-blur-xs">
                  02
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#202124] group-hover:text-[#2563EB] transition-colors">
                    02 — Discover Opportunities
                  </h3>
                  <p className="text-xs sm:text-sm text-[#666666] mt-2.5 leading-relaxed">
                    Filter active research internships by specialization, required skills, mode
                    (Remote, On-site, or Hybrid), duration, and application deadlines.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 03 — Apply & Collaborate */}
            <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-xs hover:border-[#2563EB] hover:shadow-md transition-all duration-300 group flex flex-col">
              {/* Complete, Clear Image Container with exact 1738:905 native aspect ratio */}
              <div className="relative w-full aspect-[1738/905] overflow-hidden bg-slate-900">
                <img
                  src={STARSKY_ASSETS.howStarskyWorksCards.applyAndCollaborate.livePath}
                  alt="03 — Apply & Collaborate"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
                <div className="absolute top-3.5 left-3.5 w-10 h-10 rounded-lg bg-white/95 border border-[#2563EB]/40 flex items-center justify-center text-[#2563EB] font-extrabold text-sm shadow-sm backdrop-blur-xs">
                  03
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#202124] group-hover:text-[#2563EB] transition-colors">
                    03 — Apply &amp; Collaborate
                  </h3>
                  <p className="text-xs sm:text-sm text-[#666666] mt-2.5 leading-relaxed">
                    Submit structured internship applications with your resume and statement of
                    interest, track review decisions in real time, and collaborate on research.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. WHY CHOOSE STARSKY? */}
      <section className="relative py-24 bg-[#202124] border-b border-[#E5E7EB] overflow-hidden">
        {/* Full-bleed background video container matching home background style */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none bg-[#202124]"
        >
          <video
            ref={whyChooseVideoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={STARSKY_ASSETS.whyChooseStarskyVideo.posterPath}
            className="absolute inset-0 w-full h-full object-cover object-center"
            style={{ objectFit: "cover" }}
          >
            <source
              src={STARSKY_ASSETS.whyChooseStarskyVideo.livePath}
              type="video/mp4"
            />
            <source
              src={STARSKY_ASSETS.whyChooseStarskyVideo.staticPath}
              type="video/mp4"
            />
          </video>

          {/* Directional Overlay matching the Home Hero Video style */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#202124]/92 via-[#202124]/76 to-[#202124]/38" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#202124]/70 via-transparent to-[#202124]/30" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-xs border border-white/20 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#202124]">
                  The STARSKY Advantage
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight drop-shadow-xs">
                Why Choose STARSKY?
              </h2>

              <p className="text-base text-gray-200 leading-relaxed max-w-xl">
                Traditional job boards focus on generic corporate roles. STARSKY is purpose-built
                for academic mentorship, literature synthesis, experimental analysis, and co-authored
                research publications.
              </p>

              <div className="pt-2">
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-lg bg-[#2563EB] text-white font-semibold text-base hover:bg-[#1D4ED8] transition-colors shadow-sm"
                >
                  <span>Read Our Mission &amp; Vision</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-sm hover:border-[#2563EB] hover:bg-white/15 transition-all">
                <ShieldCheck className="w-6 h-6 text-[#2563EB]" />
                <h3 className="text-base font-bold text-white mt-3">
                  Verified PhD Scholars
                </h3>
                <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
                  Every PhD scholar profile undergoes administrative verification of institutional
                  affiliation, ORCID ID, and research track record before appearing publicly.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-sm hover:border-[#2563EB] hover:bg-white/15 transition-all">
                <Search className="w-6 h-6 text-[#2563EB]" />
                <h3 className="text-base font-bold text-white mt-3">
                  Research-focused Opportunities
                </h3>
                <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
                  Curated academic internships centered on real thesis problems, dataset curation,
                  laboratory experimentation, and peer-reviewed publications.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-sm hover:border-[#2563EB] hover:bg-white/15 transition-all">
                <FileCheck2 className="w-6 h-6 text-[#2563EB]" />
                <h3 className="text-base font-bold text-white mt-3">
                  Structured Internship Applications
                </h3>
                <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
                  Standardized academic profiles, statement-of-purpose submissions, and transparent
                  status tracking from Submitted to Shortlisted and Accepted.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-sm hover:border-[#2563EB] hover:bg-white/15 transition-all">
                <Users className="w-6 h-6 text-[#2563EB]" />
                <h3 className="text-base font-bold text-white mt-3">
                  Direct Academic Collaboration
                </h3>
                <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
                  Connect directly with doctoral mentors across engineering, medicine, sciences,
                  and management without intermediaries.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FEATURED PHD SCHOLARS */}
      <section className="relative overflow-hidden py-24 bg-[#0B0E14] border-b border-[#1F2430]">
        {/* Premium Animated Particle-Wave Background */}
        <FeaturedScholarsParticleBackground />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                Verified Mentors
              </span>
              <h2 className="text-3xl font-extrabold text-white mt-2 drop-shadow-xs">
                Featured PhD Scholars
              </h2>
              <p className="text-base text-gray-300 mt-2">
                Connect with doctoral researchers actively offering mentorship and research
                internships.
              </p>
            </div>
            <Link
              href="/explore?tab=scholars"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#2563EB] hover:text-[#60A5FA] transition-colors"
            >
              <span>View Full Scholar Directory</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
            {scholars.slice(0, 4).map(({ scholar, profile, internships: openInts }) => (
              <div
                key={scholar.id}
                className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/40 shadow-xl p-6 flex flex-col justify-between hover:border-[#2563EB] hover:shadow-2xl transition-all group"
              >
                <div>
                  <div className="flex items-start gap-3.5">
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name}
                      className="w-14 h-14 rounded-xl object-cover border border-[#E5E7EB] shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-bold text-[#202124] truncate">
                          {profile.full_name}
                        </h3>
                        <span title="Verified PhD Scholar" className="shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
                        </span>
                      </div>
                      <p className="text-xs font-medium text-[#2563EB] mt-0.5 truncate">
                        {scholar.specialization}
                      </p>
                      <p className="text-[11px] text-[#666666] mt-0.5 line-clamp-1">
                        {scholar.university_institution}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-[#202124] font-medium mt-4 line-clamp-2 leading-relaxed">
                    “{scholar.current_research_topic}”
                  </p>

                  <p className="text-xs text-[#666666] mt-2 line-clamp-2 leading-relaxed">
                    {scholar.biography}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${
                      scholar.internship_availability ? "text-green-700" : "text-[#666666]"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        scholar.internship_availability ? "bg-green-600" : "bg-gray-400"
                      }`}
                    />
                    {openInts.length > 0
                      ? `${openInts.length} Open ${
                          openInts.length === 1 ? "Internship" : "Internships"
                        }`
                      : "Available for Mentorship"}
                  </span>

                  <Link
                    href={
                      session
                        ? `/scholars/${scholar.id}`
                        : `/login?redirect=${encodeURIComponent(`/scholars/${scholar.id}`)}`
                    }
                    className="px-3.5 py-1.5 rounded-lg bg-[#202124] text-white text-xs font-semibold hover:bg-[#2563EB] transition-colors"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. LATEST RESEARCH OPPORTUNITIES */}
      <section className="py-20 bg-[#F7F8FA] border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                Open Positions
              </span>
              <h2 className="text-3xl font-extrabold text-[#202124] mt-2">
                Latest Research Opportunities
              </h2>
              <p className="text-base text-[#666666] mt-2">
                Apply directly to active research internships led by verified doctoral scholars.
              </p>
            </div>
            <Link
              href="/explore?tab=internships"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#2563EB] hover:underline"
            >
              <span>Browse All Internships</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
            {internships.slice(0, 4).map(({ internship, scholar, scholarUser, domain }) => (
              <div
                key={internship.id}
                className="card-corporate p-6 flex flex-col justify-between bg-white"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-[#EFF6FF] border border-[#2563EB]/30 text-[11px] font-semibold text-[#2563EB]">
                      {domain?.name || scholar.research_field} • {scholar.specialization}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-[#F7F8FA] border border-[#E5E7EB] text-[11px] font-semibold text-[#202124]">
                      {internship.mode}
                    </span>
                  </div>

                  <Link
                    href={`/internships/${internship.id}`}
                    className="block text-lg font-bold text-[#202124] hover:text-[#2563EB] transition-colors mt-3"
                  >
                    {internship.title}
                  </Link>

                  <p className="text-xs text-[#666666] mt-2 line-clamp-2 leading-relaxed">
                    {internship.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {internship.required_skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded bg-[#F7F8FA] border border-[#E5E7EB] text-[11px] text-[#202124]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={scholarUser.avatar_url}
                      alt={scholarUser.full_name}
                      className="w-9 h-9 rounded-full object-cover border border-[#E5E7EB]"
                    />
                    <div>
                      <p className="text-xs font-bold text-[#202124]">
                        {scholarUser.full_name}
                      </p>
                      <p className="text-[11px] text-[#666666] line-clamp-1">
                        {scholar.university_institution}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-[11px] font-semibold text-[#202124] flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3 text-[#2563EB]" /> {internship.duration}
                      </p>
                      <p className="text-[10px] text-[#666666]">
                        Deadline: {internship.application_deadline}
                      </p>
                    </div>
                    <InternshipApplicationAction
                      existingApplication={studentApplications[internship.id]}
                      applyHref={
                        session
                          ? `/scholars/${scholar.id}?apply=${internship.id}`
                          : `/login?redirect=${encodeURIComponent(`/internships/${internship.id}?apply=true`)}`
                      }
                      applyLabel="Apply for This Position"
                      onViewApplication={(app) => setViewingApplication(app)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. TESTIMONIALS */}
      <section className="relative overflow-hidden py-24 bg-[#F1F2F4] border-b border-[#E5E7EB]">
        {/* Galaxy-Style Animated Cosmic Background */}
        <TestimonialsGalaxyBackground />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
              Academic Community Voices
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-2 drop-shadow-xs">
              Testimonials
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/50 shadow-xl p-6 flex flex-col justify-between hover:shadow-2xl transition-all"
              >
                <div>
                  <div className="flex items-center gap-1 text-[#2563EB]">
                    {Array.from({ length: t.rating }).map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-[#2563EB]" />
                    ))}
                  </div>
                  <p className="text-sm text-[#202124] mt-4 leading-relaxed font-medium">
                    “{t.quote}”
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[#E5E7EB]">
                  {t.avatar_url && (
                    <img
                      src={t.avatar_url}
                      alt={t.author_name}
                      className="w-10 h-10 rounded-full object-cover border border-[#E5E7EB]"
                    />
                  )}
                  <div>
                    <p className="text-xs font-bold text-[#202124]">{t.author_name}</p>
                    <p className="text-[11px] text-[#666666]">
                      {t.author_role} • {t.institution}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. FINAL CALL TO ACTION */}
      <section className="py-20 bg-[#F7F8FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-[#202124] text-white p-10 sm:p-14 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="max-w-2xl space-y-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                <Sparkles className="w-4 h-4" /> Start Your Research Journey
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Ready to Start Your Research Journey?
              </h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                Whether you are an undergraduate seeking hands-on mentorship or a PhD scholar
                building an agile research team, STARSKY connects you with verified peers.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 shrink-0">
              <Link
                href="/register?role=student"
                className="px-6 py-3.5 rounded-lg bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] transition-colors"
              >
                Register as Student
              </Link>
              <Link
                href="/register?role=scholar"
                className="px-6 py-3.5 rounded-lg bg-white text-[#202124] text-sm font-semibold hover:bg-gray-100 transition-colors"
              >
                Join as PhD Scholar
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* View Application Read-Only Modal */}
      <ViewApplicationModal
        applicationData={viewingApplication}
        onClose={() => setViewingApplication(null)}
      />
    </div>
  );
}
