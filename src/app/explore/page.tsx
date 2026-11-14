"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  BookOpen,
  Building2,
  CheckCircle2,
  Clock,
  Crown,
  GraduationCap,
  Lock,
  MapPin,
  MessageSquare,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  AcademicDomain,
  EnrichedApplication,
  EnrichedInternship,
  EnrichedScholar,
  LockedScholarPreview,
  Specialization,
} from "@/types/database";
import { DomainIcon } from "@/components/DomainIcon";
import { useAuth } from "@/context/AuthContext";
import PremiumUpgradeModal from "@/components/PremiumUpgradeModal";
import {
  InternshipApplicationAction,
  ViewApplicationModal,
} from "@/components/ApplicationStatusModal";
import { STARSKY_ASSETS } from "@/config/assets";
import { SpecializationCardWithAnimation } from "@/components/SpecializationCardWithAnimation";

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuth();

  const [domains, setDomains] = useState<AcademicDomain[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [scholars, setScholars] = useState<EnrichedScholar[]>([]);
  const [internships, setInternships] = useState<EnrichedInternship[]>([]);
  const [studentApplications, setStudentApplications] = useState<
    Record<string, EnrichedApplication>
  >({});
  const [viewingApplication, setViewingApplication] =
    useState<EnrichedApplication | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Premium Access State from server
  const [isPremiumUnlocked, setIsPremiumUnlocked] = useState<boolean>(false);
  const [totalApprovedScholarsCount, setTotalApprovedScholarsCount] =
    useState<number>(0);
  const [lockedScholarsCount, setLockedScholarsCount] = useState<number>(0);
  const [lockedScholarPreviews, setLockedScholarPreviews] = useState<
    LockedScholarPreview[]
  >([]);
  const [freeScholarLimit, setFreeScholarLimit] = useState<number>(5);
  const [premiumModalOpen, setPremiumModalOpen] = useState<boolean>(false);
  const [premiumModalContext, setPremiumModalContext] = useState<string>("");

  // Navigation & Filter State
  const [activeTab, setActiveTab] = useState<
    "domains" | "scholars" | "internships"
  >("domains");
  const [selectedDomainId, setSelectedDomainId] = useState<string>("");
  const [selectedSpecId, setSelectedSpecId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [universityFilter, setUniversityFilter] = useState<string>("");
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [availabilityOnly, setAvailabilityOnly] = useState<boolean>(false);
  const [modeFilter, setModeFilter] = useState<string>("");
  const [skillFilter, setSkillFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 6;

  useEffect(() => {
    setLoading(true);
    fetch("/api/public", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setDomains(d.domains || []);
        setSpecializations(d.specializations || []);
        setScholars(d.scholars || []);
        setInternships(d.internships || []);
        setStudentApplications(d.studentApplications || {});
        setIsPremiumUnlocked(Boolean(d.isPremiumUnlocked));
        setTotalApprovedScholarsCount(
          d.totalApprovedScholarsCount ?? (d.scholars || []).length
        );
        setLockedScholarsCount(d.lockedScholarsCount ?? 0);
        setLockedScholarPreviews(d.lockedScholarPreviews || []);
        setFreeScholarLimit(d.freeScholarLimit || 5);
      })
      .finally(() => setLoading(false));

    fetch("/api/saved-scholars")
      .then((r) => r.json())
      .then((d) => setSavedIds(d.savedScholarIds || []))
      .catch(() => {});
  }, [session?.user?.id, session?.hasPremiumAccess]);

  useEffect(() => {
    const domParam = searchParams.get("domain");
    const specParam = searchParams.get("spec");
    const tabParam = searchParams.get("tab");

    if (domParam) {
      setSelectedDomainId(domParam);
    } else if (tabParam === "domains") {
      setSelectedDomainId("");
      setSelectedSpecId("");
    }
    if (specParam) {
      setSelectedSpecId(specParam);
      setActiveTab("scholars");
    } else if (tabParam === "scholars" || tabParam === "internships" || tabParam === "domains") {
      setActiveTab(tabParam as "domains" | "scholars" | "internships");
    }

    if (tabParam) {
      setTimeout(() => {
        const el = document.getElementById("academic-domains-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 150);
    }
  }, [searchParams]);

  useEffect(() => {
    const handleSwitchTab = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const tab = customEvent.detail;
      if (tab === "domains" || tab === "scholars" || tab === "internships") {
        setActiveTab(tab as "domains" | "scholars" | "internships");
        if (tab === "domains") {
          setSelectedDomainId("");
          setSelectedSpecId("");
        }
        setTimeout(() => {
          const el = document.getElementById("academic-domains-section");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    };
    window.addEventListener("starsky:switch-tab", handleSwitchTab);
    return () => {
      window.removeEventListener("starsky:switch-tab", handleSwitchTab);
    };
  }, []);

  const openPremiumModal = (context?: string) => {
    setPremiumModalContext(context || "");
    setPremiumModalOpen(true);
  };

  const handleContactScholarClick = (
    scholarId: string,
    scholarName: string
  ) => {
    if (!isPremiumUnlocked) {
      openPremiumModal(`Direct Scholar Contact with ${scholarName}`);
      return;
    }
    router.push(`/scholars/${scholarId}?contact=true`);
  };

  const toggleSaveScholar = async (scholarId: string) => {
    if (!session || session.user.role !== "student") {
      window.location.href = "/login";
      return;
    }
    const res = await fetch("/api/saved-scholars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scholarProfileId: scholarId }),
    });
    const data = await res.json();
    if (res.ok) {
      if (data.saved) {
        setSavedIds((prev) => [...prev, scholarId]);
      } else {
        setSavedIds((prev) => prev.filter((id) => id !== scholarId));
      }
    }
  };

  const selectedDomain = domains.find((d) => d.id === selectedDomainId);
  const domainSpecializations = specializations.filter(
    (s) => s.domain_id === selectedDomainId
  );

  // Filtered Scholars
  const filteredScholars = useMemo(() => {
    return scholars.filter(({ scholar, profile, internships: schInts }) => {
      if (selectedDomainId && scholar.domain_id !== selectedDomainId)
        return false;
      if (selectedSpecId && scholar.specialization_id !== selectedSpecId)
        return false;
      if (availabilityOnly && !scholar.internship_availability) return false;
      if (
        universityFilter &&
        !scholar.university_institution
          .toLowerCase()
          .includes(universityFilter.toLowerCase())
      ) {
        return false;
      }
      if (
        countryFilter &&
        profile.country.toLowerCase() !== countryFilter.toLowerCase()
      ) {
        return false;
      }
      if (modeFilter) {
        const hasMode = schInts.some((i) => i.mode === modeFilter);
        if (!hasMode) return false;
      }
      if (skillFilter) {
        const hasSkill = scholar.technical_skills.some((sk) =>
          sk.toLowerCase().includes(skillFilter.toLowerCase())
        );
        if (!hasSkill) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = profile.full_name.toLowerCase().includes(q);
        const matchTopic = scholar.current_research_topic
          .toLowerCase()
          .includes(q);
        const matchUni = scholar.university_institution
          .toLowerCase()
          .includes(q);
        const matchSpec = scholar.specialization.toLowerCase().includes(q);
        const matchInterest = scholar.research_interests.some((ri) =>
          ri.toLowerCase().includes(q)
        );
        const matchSkill = scholar.technical_skills.some((sk) =>
          sk.toLowerCase().includes(q)
        );
        if (
          !matchName &&
          !matchTopic &&
          !matchUni &&
          !matchSpec &&
          !matchInterest &&
          !matchSkill
        ) {
          return false;
        }
      }
      return true;
    });
  }, [
    scholars,
    selectedDomainId,
    selectedSpecId,
    availabilityOnly,
    universityFilter,
    countryFilter,
    modeFilter,
    skillFilter,
    searchQuery,
  ]);

  // Filtered Internships
  const filteredInternships = useMemo(() => {
    return internships.filter(({ internship, scholar, scholarUser }) => {
      if (selectedDomainId && internship.domain_id !== selectedDomainId)
        return false;
      if (selectedSpecId && internship.specialization_id !== selectedSpecId)
        return false;
      if (modeFilter && internship.mode !== modeFilter) return false;
      if (
        universityFilter &&
        !scholar.university_institution
          .toLowerCase()
          .includes(universityFilter.toLowerCase())
      ) {
        return false;
      }
      if (skillFilter) {
        const hasSkill = internship.required_skills.some((sk) =>
          sk.toLowerCase().includes(skillFilter.toLowerCase())
        );
        if (!hasSkill) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = internship.title.toLowerCase().includes(q);
        const matchDesc = internship.description.toLowerCase().includes(q);
        const matchScholar = scholarUser.full_name.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchScholar) return false;
      }
      return true;
    });
  }, [
    internships,
    selectedDomainId,
    selectedSpecId,
    modeFilter,
    universityFilter,
    skillFilter,
    searchQuery,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredScholars.length / pageSize)
  );
  const paginatedScholars = filteredScholars.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const resetFilters = () => {
    setSelectedDomainId("");
    setSelectedSpecId("");
    setSearchQuery("");
    setUniversityFilter("");
    setCountryFilter("");
    setAvailabilityOnly(false);
    setModeFilter("");
    setSkillFilter("");
    setCurrentPage(1);
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section matching Home Hero Area (Box), Video & Style */}
      <section className="relative bg-[#202124] border-b border-[#E5E7EB] overflow-hidden min-h-[560px] sm:min-h-[600px] lg:min-h-[650px] flex items-center">
        {/* Full-bleed background video container matching home background style */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none bg-[#202124]"
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={STARSKY_ASSETS.exploreResearchersVideo.posterPath}
            className="absolute inset-0 w-full h-full object-cover object-center"
            style={{ objectFit: "cover" }}
          >
            <source
              src={STARSKY_ASSETS.exploreResearchersVideo.livePath}
              type="video/mp4"
            />
            <source
              src={STARSKY_ASSETS.exploreResearchersVideo.staticPath}
              type="video/mp4"
            />
          </video>

          {/* Directional Overlay matching Home Hero Video style */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#202124]/92 via-[#202124]/76 to-[#202124]/38" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#202124]/70 via-transparent to-[#202124]/30" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="max-w-4xl space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-xs border border-white/20 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#202124]">
                  Academic Discovery &amp; Directory
                </span>
              </div>

              {isPremiumUnlocked ? (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-xs border border-emerald-400/40 text-[11px] font-semibold text-emerald-300">
                  <Crown className="w-3.5 h-3.5 text-[#2563EB]" />
                  STARSKY Premium Unlocked
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    openPremiumModal("Full PhD Scholar Directory Access")
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-xs border border-[#2563EB]/40 text-[11px] font-semibold text-[#2563EB] hover:bg-[#2563EB] hover:text-white transition-colors shadow-xs"
                >
                  <Lock className="w-3 h-3" />
                  Free Preview ({freeScholarLimit} of {totalApprovedScholarsCount}) • Upgrade
                </button>
              )}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight text-white leading-[1.12] drop-shadow-xs">
              Explore Academic Domains &amp; PhD Scholars
            </h1>

            <p className="text-lg text-gray-200 leading-relaxed max-w-2xl">
              Browse 9 multidisciplinary academic domains, drill down into specialized research tracks, and discover verified PhD scholars offering internships.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("domains");
                  const el = document.getElementById("academic-domains-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center gap-2 px-7 py-4 rounded-lg bg-[#2563EB] text-white font-semibold text-base hover:bg-[#1D4ED8] transition-colors shadow-sm"
              >
                <span>1. Academic Domains</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("scholars");
                  const el = document.getElementById("academic-domains-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center gap-2 px-7 py-4 rounded-lg bg-white text-[#202124] border border-white font-semibold text-base hover:border-[#2563EB] hover:text-[#2563EB] transition-colors shadow-sm"
              >
                <span>2. PhD Scholar Directory</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("internships");
                  const el = document.getElementById("academic-domains-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center gap-2 px-7 py-4 rounded-lg bg-white/10 text-white border border-white/25 font-semibold text-base hover:bg-white/20 transition-colors shadow-sm backdrop-blur-xs"
              >
                <span>3. Open Internships</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <div
        id="academic-domains-section"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 scroll-mt-6"
      >
        {/* Directory View Header with Quick View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5E7EB] mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
              Directory View
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#202124] mt-0.5">
              {activeTab === "domains"
                ? "1. Academic Domains & Specializations"
                : activeTab === "scholars"
                ? "2. Verified PhD Scholar Directory"
                : "3. Open Research Internships"}
            </h2>
          </div>

          <div className="inline-flex rounded-xl bg-[#F7F8FA] p-1.5 border border-[#E5E7EB] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab("domains")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "domains"
                  ? "bg-[#2563EB] text-white shadow-xs"
                  : "text-[#666666] hover:text-[#202124]"
              }`}
            >
              1. Domains ({domains.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("scholars")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "scholars"
                  ? "bg-[#2563EB] text-white shadow-xs"
                  : "text-[#666666] hover:text-[#202124]"
              }`}
            >
              2. Scholars ({totalApprovedScholarsCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("internships")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "internships"
                  ? "bg-[#2563EB] text-white shadow-xs"
                  : "text-[#666666] hover:text-[#202124]"
              }`}
            >
              3. Internships ({filteredInternships.length})
            </button>
          </div>
        </div>
        {/* TAB 1: ACADEMIC DOMAINS & SPECIALIZATIONS DRILLDOWN */}
        {activeTab === "domains" && (
          <div className="space-y-10">
            {!selectedDomain ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-[#202124]">
                      Select an Academic Domain
                    </h2>
                    <p className="text-xs text-[#666666] mt-0.5">
                      Click any domain card to explore its research
                      specializations and verified PhD scholars.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {domains.map((domain) => {
                    const domVisibleCount = scholars.filter(
                      (s) => s.scholar.domain_id === domain.id
                    ).length;
                    const domLockedCount = lockedScholarPreviews.filter(
                      (lp) => lp.domain_id === domain.id
                    ).length;
                    const domScholarsCount = domVisibleCount + domLockedCount;
                    const domSpecs = specializations.filter(
                      (sp) => sp.domain_id === domain.id
                    );

                    return (
                      <div
                        key={domain.id}
                        onClick={() => setSelectedDomainId(domain.id)}
                        className="card-corporate overflow-hidden flex flex-col justify-between cursor-pointer group"
                      >
                        <div>
                          <div className="h-44 overflow-hidden bg-[#F7F8FA] relative border-b border-[#E5E7EB]">
                            <img
                              src={domain.image_url}
                              alt={domain.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-white/95 border border-[#E5E7EB] text-[11px] font-semibold text-[#202124] flex items-center gap-1.5">
                              <DomainIcon
                                name={domain.icon_name}
                                className="w-3.5 h-3.5 text-[#2563EB]"
                              />
                              <span>{domSpecs.length} Specializations</span>
                            </div>
                          </div>

                          <div className="p-6">
                            <h3 className="text-lg font-bold text-[#202124] group-hover:text-[#2563EB] transition-colors">
                              {domain.name}
                            </h3>
                            <p className="text-xs text-[#666666] mt-2 leading-relaxed">
                              {domain.description}
                            </p>

                            <div className="flex flex-wrap gap-1.5 mt-4">
                              {domSpecs.slice(0, 3).map((sp) => (
                                <span
                                  key={sp.id}
                                  className="px-2 py-0.5 rounded bg-[#F7F8FA] border border-[#E5E7EB] text-[11px] text-[#666666]"
                                >
                                  {sp.name}
                                </span>
                              ))}
                              {domSpecs.length > 3 && (
                                <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[11px] font-medium text-[#2563EB]">
                                  +{domSpecs.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="px-6 py-4 bg-[#F7F8FA] border-t border-[#E5E7EB] flex items-center justify-between">
                          <span className="text-xs text-[#666666]">
                            <strong className="text-[#202124]">
                              {domScholarsCount}
                            </strong>{" "}
                            Verified PhD{" "}
                            {domScholarsCount === 1 ? "Scholar" : "Scholars"}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB]">
                            Explore <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Specialization View inside Selected Domain */
              <div className="space-y-8">
                <div className="p-6 rounded-2xl bg-[#F7F8FA] border border-[#E5E7EB] flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDomainId("");
                        setSelectedSpecId("");
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:underline"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to All 9
                      Academic Domains
                    </button>
                    <h2 className="text-2xl font-extrabold text-[#202124] pt-1">
                      {selectedDomain.name} — Specializations
                    </h2>
                    <p className="text-xs text-[#666666]">
                      {selectedDomain.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSpecId("");
                      setActiveTab("scholars");
                    }}
                    className="px-5 py-2.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors shrink-0"
                  >
                    View All {selectedDomain.name} Scholars →
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {domainSpecializations.map((spec) => {
                    const specVisibleCount = scholars.filter(
                      (s) => s.scholar.specialization_id === spec.id
                    ).length;
                    const specLockedCount = lockedScholarPreviews.filter(
                      (lp) => lp.specialization_id === spec.id
                    ).length;
                    const specScholarCount = specVisibleCount + specLockedCount;
                    return (
                      <SpecializationCardWithAnimation
                        key={spec.id}
                        spec={spec}
                        domainName={selectedDomain.name}
                        scholarCount={specScholarCount}
                        onClick={() => {
                          setSelectedSpecId(spec.id);
                          setActiveTab("scholars");
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2 & TAB 3: PHD SCHOLAR DIRECTORY & OPEN INTERNSHIPS WITH FULL FILTERS */}
        {(activeTab === "scholars" || activeTab === "internships") && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Filter Sidebar */}
            <aside className="lg:col-span-3 space-y-5">
              <div className="card-corporate p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#202124]">
                    <SlidersHorizontal className="w-4 h-4 text-[#2563EB]" />
                    <span>Search & Filters</span>
                  </div>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-xs text-[#2563EB] hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                </div>

                {/* Keyword Search */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#666666] mb-1">
                    Keyword Search
                  </label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-3" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Name, topic, skill..."
                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                    />
                  </div>
                </div>

                {/* Domain Filter */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#666666] mb-1">
                    Academic Domain
                  </label>
                  <select
                    value={selectedDomainId}
                    onChange={(e) => {
                      setSelectedDomainId(e.target.value);
                      setSelectedSpecId("");
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs bg-white"
                  >
                    <option value="">All Academic Domains</option>
                    {domains.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Specialization Filter */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#666666] mb-1">
                    Specialization
                  </label>
                  <select
                    value={selectedSpecId}
                    onChange={(e) => {
                      setSelectedSpecId(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs bg-white"
                  >
                    <option value="">All Specializations</option>
                    {(selectedDomainId
                      ? specializations.filter(
                          (s) => s.domain_id === selectedDomainId
                        )
                      : specializations
                    ).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* University Filter */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#666666] mb-1">
                    University / Institution
                  </label>
                  <input
                    type="text"
                    value={universityFilter}
                    onChange={(e) => {
                      setUniversityFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="e.g., IISc, IIT, AIIMS, IIM"
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                  />
                </div>

                {/* Technical Skill Filter */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#666666] mb-1">
                    Technical Skill
                  </label>
                  <input
                    type="text"
                    value={skillFilter}
                    onChange={(e) => {
                      setSkillFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="e.g., PyTorch, ROS2, MONAI, R"
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                  />
                </div>

                {/* Internship Mode Filter */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#666666] mb-1">
                    Internship Mode
                  </label>
                  <select
                    value={modeFilter}
                    onChange={(e) => {
                      setModeFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs bg-white"
                  >
                    <option value="">Any Mode</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>

                {/* Country Filter */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#666666] mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={countryFilter}
                    onChange={(e) => {
                      setCountryFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="e.g., India"
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                  />
                </div>

                {/* Availability Toggle */}
                <label className="flex items-center gap-2 pt-1 text-xs font-medium text-[#202124] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={availabilityOnly}
                    onChange={(e) => {
                      setAvailabilityOnly(e.target.checked);
                      setCurrentPage(1);
                    }}
                    className="w-4 h-4 accent-[#2563EB]"
                  />
                  <span>Accepting Interns Only</span>
                </label>
              </div>
            </aside>

            {/* Right Results Area */}
            <div className="lg:col-span-9 space-y-6">
              {activeTab === "scholars" ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-[#F7F8FA] px-4 py-3 rounded-xl border border-[#E5E7EB]">
                    <p className="text-xs text-[#666666]">
                      Showing{" "}
                      <strong className="text-[#202124]">
                        {filteredScholars.length}
                      </strong>{" "}
                      unlocked PhD{" "}
                      {filteredScholars.length === 1 ? "scholar" : "scholars"}
                      {!isPremiumUnlocked && lockedScholarsCount > 0 && (
                        <span>
                          {" "}
                          (plus{" "}
                          <strong className="text-[#2563EB]">
                            {lockedScholarsCount} Premium-locked
                          </strong>{" "}
                          verified scholars)
                        </span>
                      )}
                    </p>
                    {selectedSpecId && (
                      <button
                        type="button"
                        onClick={() => setSelectedSpecId("")}
                        className="text-xs text-[#2563EB] font-semibold hover:underline"
                      >
                        Clear Specialization Filter ×
                      </button>
                    )}
                  </div>

                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((n) => (
                        <div
                          key={n}
                          className="h-52 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] animate-pulse"
                        />
                      ))}
                    </div>
                  ) : paginatedScholars.length === 0 &&
                    lockedScholarPreviews.length === 0 ? (
                    <div className="card-corporate p-12 text-center space-y-3">
                      <GraduationCap className="w-10 h-10 text-[#2563EB] mx-auto" />
                      <h3 className="text-lg font-bold text-[#202124]">
                        No Matching PhD Scholars Found
                      </h3>
                      <p className="text-xs text-[#666666] max-w-md mx-auto">
                        Try clearing one or more filters or selecting another
                        specialization.
                      </p>
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {paginatedScholars.map(
                        ({
                          scholar,
                          profile,
                          internships: openInts,
                          publications,
                        }) => {
                          const isSaved = savedIds.includes(scholar.id);
                          return (
                            <div
                              key={scholar.id}
                              className="card-corporate p-6"
                            >
                              <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                                <div className="flex items-start gap-4">
                                  <img
                                    src={profile.avatar_url}
                                    alt={profile.full_name}
                                    className="w-20 h-20 rounded-xl object-cover border border-[#E5E7EB] shrink-0"
                                  />
                                  <div className="space-y-1.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h3 className="text-lg font-bold text-[#202124]">
                                        {profile.full_name}
                                      </h3>
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#EFF6FF] border border-[#2563EB]/30 text-[11px] font-semibold text-[#2563EB]">
                                        <CheckCircle2 className="w-3 h-3" />{" "}
                                        Verified PhD Scholar
                                      </span>
                                    </div>

                                    <p className="text-xs font-semibold text-[#202124] flex items-center gap-1.5">
                                      <Building2 className="w-3.5 h-3.5 text-[#2563EB]" />
                                      <span>
                                        {scholar.university_institution} •{" "}
                                        {scholar.department}
                                      </span>
                                    </p>

                                    <p className="text-xs text-[#666666] flex items-center gap-2">
                                      <MapPin className="w-3.5 h-3.5 text-[#666666]" />
                                      <span>
                                        {profile.city}, {profile.state},{" "}
                                        {profile.country}
                                      </span>
                                      <span>•</span>
                                      <span className="font-medium text-[#2563EB]">
                                        {scholar.research_field} →{" "}
                                        {scholar.specialization}
                                      </span>
                                    </p>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      toggleSaveScholar(scholar.id)
                                    }
                                    className={`p-2.5 rounded-lg border text-xs font-medium transition-colors ${
                                      isSaved
                                        ? "bg-[#EFF6FF] border-[#2563EB] text-[#2563EB]"
                                        : "border-[#E5E7EB] text-[#666666] hover:border-[#202124]"
                                    }`}
                                    title={
                                      isSaved ? "Saved Scholar" : "Save Scholar"
                                    }
                                  >
                                    <Bookmark
                                      className={`w-4 h-4 ${
                                        isSaved ? "fill-[#2563EB]" : ""
                                      }`}
                                    />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleContactScholarClick(
                                        scholar.id,
                                        profile.full_name
                                      )
                                    }
                                    className={`px-3.5 py-2.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                                      isPremiumUnlocked
                                        ? "bg-white border-[#202124] text-[#202124] hover:bg-[#202124] hover:text-white"
                                        : "bg-[#EFF6FF] border-[#2563EB]/40 text-[#2563EB] hover:bg-[#2563EB] hover:text-white"
                                    }`}
                                  >
                                    {isPremiumUnlocked ? (
                                      <MessageSquare className="w-3.5 h-3.5" />
                                    ) : (
                                      <Lock className="w-3.5 h-3.5" />
                                    )}
                                    <span>Contact Scholar</span>
                                  </button>

                                  <Link
                                    href={`/scholars/${scholar.id}`}
                                    className="px-5 py-2.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors"
                                  >
                                    View Profile
                                  </Link>
                                </div>
                              </div>

                              <div className="mt-4 pt-4 border-t border-[#E5E7EB] space-y-3">
                                <div>
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666]">
                                    Current Research Topic:
                                  </span>
                                  <p className="text-xs font-semibold text-[#202124] mt-0.5">
                                    {scholar.current_research_topic}
                                  </p>
                                </div>

                                <p className="text-xs text-[#666666] leading-relaxed">
                                  {scholar.biography}
                                </p>

                                <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                                  <div className="flex flex-wrap gap-1.5">
                                    {scholar.research_interests
                                      .slice(0, 3)
                                      .map((interest) => (
                                        <span
                                          key={interest}
                                          className="px-2.5 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] text-[11px] font-medium"
                                        >
                                          {interest}
                                        </span>
                                      ))}
                                    {scholar.technical_skills
                                      .slice(0, 4)
                                      .map((sk) => (
                                        <span
                                          key={sk}
                                          className="px-2.5 py-0.5 rounded bg-[#F7F8FA] border border-[#E5E7EB] text-[#202124] text-[11px]"
                                        >
                                          {sk}
                                        </span>
                                      ))}
                                  </div>

                                  <div className="flex items-center gap-3 text-xs">
                                    <span className="text-[#666666]">
                                      <strong className="text-[#202124]">
                                        {publications.length}
                                      </strong>{" "}
                                      Publications
                                    </span>
                                    <span
                                      className={`px-2.5 py-1 rounded-md font-semibold ${
                                        scholar.internship_availability
                                          ? "bg-green-50 text-green-700 border border-green-200"
                                          : "bg-gray-100 text-gray-600"
                                      }`}
                                    >
                                      {openInts.length > 0
                                        ? `${openInts.length} Open ${
                                            openInts.length === 1
                                              ? "Internship"
                                              : "Internships"
                                          }`
                                        : scholar.internship_availability
                                        ? "Open for Mentorship"
                                        : "Currently Full"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}

                      {/* PREMIUM UNLOCK SECTION (Displayed after the first 5 approved PhD Scholar profiles for Free Users) */}
                      {!isPremiumUnlocked && lockedScholarsCount > 0 && (
                        <div className="space-y-5 pt-4">
                          {/* Locked Preview Cards */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {lockedScholarPreviews.map((preview, idx) => (
                              <div
                                key={preview.id}
                                onClick={() =>
                                  openPremiumModal(
                                    `View ${preview.specialization} Scholar Profile (${preview.university_institution})`
                                  )
                                }
                                className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] p-5 relative overflow-hidden cursor-pointer group hover:border-[#2563EB] transition-all"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-[#E5E7EB] text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">
                                    <Lock className="w-3 h-3" />
                                    Locked Profile #{freeScholarLimit + idx + 1}
                                  </span>
                                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                    Verified Scholar
                                  </span>
                                </div>

                                <div className="space-y-1.5">
                                  <div className="h-4 w-40 rounded bg-gray-200/90 blur-[2px] select-none" />
                                  <p className="text-xs font-bold text-[#202124] line-clamp-1 pt-1">
                                    {preview.university_institution}
                                  </p>
                                  <p className="text-[11px] text-[#666666] line-clamp-1">
                                    {preview.department}
                                  </p>
                                  <p className="text-[11px] font-semibold text-[#2563EB] pt-1">
                                    {preview.research_field} →{" "}
                                    {preview.specialization}
                                  </p>
                                </div>

                                <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs font-semibold text-[#202124] group-hover:text-[#2563EB]">
                                  <span>Unlock Scholar Profile</span>
                                  <Crown className="w-3.5 h-3.5 text-[#2563EB]" />
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Main Premium Unlock Card */}
                          <div className="rounded-2xl border-2 border-[#2563EB]/30 bg-gradient-to-br from-[#EFF6FF] via-white to-[#F7F8FA] p-8 sm:p-10 text-center shadow-sm space-y-5">
                            <div className="w-14 h-14 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center mx-auto shadow-md">
                              <Lock className="w-7 h-7" />
                            </div>

                            <div className="space-y-2 max-w-2xl mx-auto">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#2563EB]/30 text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                                <Crown className="w-3.5 h-3.5" />
                                STARSKY Premium Directory Access
                              </span>
                              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#202124]">
                                Unlock More Research Opportunities
                              </h3>
                              <p className="text-sm text-[#666666] leading-relaxed">
                                You are currently viewing a preview of verified
                                PhD scholars on STARSKY ({freeScholarLimit} of{" "}
                                {totalApprovedScholarsCount} approved profiles).
                                Upgrade to STARSKY Premium to unlock the full
                                PhD scholar directory, explore researchers
                                across all academic specializations, and connect
                                directly with scholars.
                              </p>
                            </div>

                            <div className="pt-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openPremiumModal(
                                    "Unlock Full PhD Scholar Directory"
                                  )
                                }
                                className="px-7 py-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold transition-colors shadow-sm inline-flex items-center gap-2"
                              >
                                <Crown className="w-4 h-4" />
                                <span>Upgrade to Premium</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4">
                          <button
                            type="button"
                            disabled={currentPage === 1}
                            onClick={() =>
                              setCurrentPage((p) => Math.max(1, p - 1))
                            }
                            className="px-4 py-2 rounded-lg border border-[#E5E7EB] text-xs font-semibold disabled:opacity-40"
                          >
                            Previous
                          </button>
                          <span className="text-xs text-[#666666]">
                            Page <strong>{currentPage}</strong> of{" "}
                            <strong>{totalPages}</strong>
                          </span>
                          <button
                            type="button"
                            disabled={currentPage === totalPages}
                            onClick={() =>
                              setCurrentPage((p) =>
                                Math.min(totalPages, p + 1)
                              )
                            }
                            className="px-4 py-2 rounded-lg border border-[#E5E7EB] text-xs font-semibold disabled:opacity-40"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* TAB 3: OPEN RESEARCH INTERNSHIPS */
                <div className="space-y-5">
                  <div className="bg-[#F7F8FA] px-4 py-3 rounded-xl border border-[#E5E7EB] text-xs text-[#666666]">
                    Showing{" "}
                    <strong className="text-[#202124]">
                      {filteredInternships.length}
                    </strong>{" "}
                    open research internships
                  </div>

                  {filteredInternships.length === 0 ? (
                    <div className="card-corporate p-12 text-center space-y-3">
                      <BookOpen className="w-10 h-10 text-[#2563EB] mx-auto" />
                      <h3 className="text-lg font-bold text-[#202124]">
                        No Matching Open Internships
                      </h3>
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
                      >
                        Reset Filters
                      </button>
                    </div>
                  ) : (
                    filteredInternships.map(
                      ({ internship, scholar, scholarUser }) => {
                        const existingApp = studentApplications[internship.id];
                        return (
                          <div
                            key={internship.id}
                            className="card-corporate p-6 space-y-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="px-2.5 py-0.5 rounded bg-[#EFF6FF] border border-[#2563EB]/30 text-[11px] font-semibold text-[#2563EB]">
                                    {scholar.research_field} •{" "}
                                    {scholar.specialization}
                                  </span>
                                  <span className="px-2.5 py-0.5 rounded bg-[#F7F8FA] border border-[#E5E7EB] text-[11px] font-semibold text-[#202124]">
                                    {internship.mode}
                                  </span>
                                  <span className="px-2.5 py-0.5 rounded bg-green-50 border border-green-200 text-[11px] font-semibold text-green-700">
                                    {internship.available_positions} Positions
                                  </span>
                                </div>
                                <Link
                                  href={`/internships/${internship.id}`}
                                  className="block text-lg font-bold text-[#202124] hover:text-[#2563EB] transition-colors mt-2"
                                >
                                  {internship.title}
                                </Link>
                              </div>

                              <InternshipApplicationAction
                                existingApplication={existingApp}
                                checkingStatus={loading}
                                applyHref={`/scholars/${scholar.id}?apply=${internship.id}`}
                                applyLabel="Apply for This Position"
                                onViewApplication={(app) =>
                                  setViewingApplication(app)
                                }
                              />
                            </div>

                            <p className="text-xs text-[#666666] leading-relaxed">
                              {internship.description}
                            </p>

                            <div className="flex flex-wrap gap-1.5">
                              {internship.required_skills.map((sk) => (
                                <span
                                  key={sk}
                                  className="px-2.5 py-0.5 rounded bg-[#F7F8FA] border border-[#E5E7EB] text-[11px] text-[#202124]"
                                >
                                  {sk}
                                </span>
                              ))}
                            </div>

                            <div className="pt-4 border-t border-[#E5E7EB] flex flex-wrap items-center justify-between gap-4 text-xs">
                              <Link
                                href={`/scholars/${scholar.id}`}
                                className="flex items-center gap-2.5 group"
                              >
                                <img
                                  src={scholarUser.avatar_url}
                                  alt={scholarUser.full_name}
                                  className="w-8 h-8 rounded-full object-cover border border-[#E5E7EB]"
                                />
                                <div>
                                  <span className="font-bold text-[#202124] group-hover:text-[#2563EB] block">
                                    {scholarUser.full_name}
                                  </span>
                                  <span className="text-[11px] text-[#666666]">
                                    {scholar.university_institution}
                                  </span>
                                </div>
                              </Link>

                              <div className="flex flex-wrap items-center gap-4 text-[#666666]">
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                                  Duration:{" "}
                                  <strong className="text-[#202124]">
                                    {internship.duration}
                                  </strong>
                                </span>
                                <span>
                                  Stipend:{" "}
                                  <strong className="text-[#202124]">
                                    {internship.stipend || "Academic Credit"}
                                  </strong>
                                </span>
                                <span>
                                  Deadline:{" "}
                                  <strong className="text-[#202124]">
                                    {internship.application_deadline}
                                  </strong>
                                </span>
                                <Link
                                  href={`/internships/${internship.id}`}
                                  className="inline-flex items-center gap-1 font-semibold text-[#2563EB] hover:underline"
                                >
                                  <span>Details</span>
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reusable Premium Upgrade Modal */}
      <PremiumUpgradeModal
        isOpen={premiumModalOpen}
        onClose={() => setPremiumModalOpen(false)}
        contextTitle={premiumModalContext}
      />

      {/* View Application Read-Only Modal */}
      <ViewApplicationModal
        applicationData={viewingApplication}
        onClose={() => setViewingApplication(null)}
      />
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="p-16 text-center text-sm text-[#666666]">
          Loading...
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
