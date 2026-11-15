"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
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

  // Helper to resolve domain id from id, name, or slug
  const resolveDomainId = useCallback(
    (param: string | null): string => {
      if (!param || !param.trim()) return "";
      const p = param.trim().toLowerCase();
      const match = domains.find(
        (d) =>
          d.id.toLowerCase() === p ||
          d.name.toLowerCase() === p ||
          (d.slug && d.slug.toLowerCase() === p)
      );
      if (match) return match.id;
      return domains.length > 0 ? "" : param;
    },
    [domains]
  );

  // Helper to resolve specialization id from id, name, or slug
  const resolveSpecId = useCallback(
    (param: string | null): string => {
      if (!param || !param.trim()) return "";
      const p = param.trim().toLowerCase();
      const match = specializations.find(
        (s) =>
          s.id.toLowerCase() === p ||
          s.name.toLowerCase() === p ||
          (s.slug && s.slug.toLowerCase() === p)
      );
      if (match) return match.id;
      return specializations.length > 0 ? "" : param;
    },
    [specializations]
  );

  // Navigate to new Explore state creating proper browser history entry
  const navigateToExploreState = useCallback(
    (
      updates: {
        tab?: "domains" | "scholars" | "internships";
        domain?: string;
        spec?: string;
        q?: string;
        mode?: string;
        skill?: string;
        uni?: string;
        country?: string;
        avail?: boolean;
        page?: number;
      },
      options?: { replace?: boolean; scroll?: boolean }
    ) => {
      const nextTab = updates.tab !== undefined ? updates.tab : activeTab;
      const nextDomain = updates.domain !== undefined ? updates.domain : selectedDomainId;
      const nextSpec = updates.spec !== undefined ? updates.spec : selectedSpecId;
      const nextQ = updates.q !== undefined ? updates.q : searchQuery;
      const nextMode = updates.mode !== undefined ? updates.mode : modeFilter;
      const nextSkill = updates.skill !== undefined ? updates.skill : skillFilter;
      const nextUni = updates.uni !== undefined ? updates.uni : universityFilter;
      const nextCountry = updates.country !== undefined ? updates.country : countryFilter;
      const nextAvail = updates.avail !== undefined ? updates.avail : availabilityOnly;
      const nextPage = updates.page !== undefined ? updates.page : currentPage;

      const sp = new URLSearchParams();
      if (nextTab) sp.set("tab", nextTab);
      if (nextDomain) sp.set("domain", nextDomain);
      if (nextSpec) sp.set("spec", nextSpec);
      if (nextQ && nextQ.trim()) sp.set("q", nextQ.trim());
      if (nextMode) sp.set("mode", nextMode);
      if (nextSkill && nextSkill.trim()) sp.set("skill", nextSkill.trim());
      if (nextUni && nextUni.trim()) sp.set("uni", nextUni.trim());
      if (nextCountry && nextCountry.trim()) sp.set("country", nextCountry.trim());
      if (nextAvail) sp.set("avail", "true");
      if (nextPage > 1) sp.set("page", String(nextPage));

      const queryStr = sp.toString();
      const targetUrl = queryStr ? `/explore?${queryStr}` : "/explore";
      const currentUrl =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "";

      if (targetUrl === currentUrl) return;

      if (options?.replace) {
        router.replace(targetUrl, { scroll: options?.scroll ?? false });
      } else {
        router.push(targetUrl, { scroll: options?.scroll ?? false });
      }
    },
    [
      activeTab,
      selectedDomainId,
      selectedSpecId,
      searchQuery,
      modeFilter,
      skillFilter,
      universityFilter,
      countryFilter,
      availabilityOnly,
      currentPage,
      router,
    ]
  );

  // Synchronize internal state from URL search parameters
  const syncFromUrl = useCallback(
    (params: URLSearchParams) => {
      const domParam = params.get("domain");
      const specParam = params.get("spec");
      const tabParam = params.get("tab");
      const qParam = params.get("q");
      const modeParam = params.get("mode");
      const skillParam = params.get("skill");
      const uniParam = params.get("uni");
      const countryParam = params.get("country");
      const availParam = params.get("avail");
      const pageParam = params.get("page");

      let resolvedDom = resolveDomainId(domParam);
      const resolvedSpec = resolveSpecId(specParam);

      // If spec is provided but domain is not, deduce domain from specialization
      if (resolvedSpec && !resolvedDom && specializations.length > 0) {
        const specObj = specializations.find((s) => s.id === resolvedSpec);
        if (specObj) {
          resolvedDom = specObj.domain_id;
        }
      }

      setSelectedDomainId(resolvedDom || "");
      setSelectedSpecId(resolvedSpec || "");

      // Determine active tab
      if (tabParam === "internships" || tabParam === "scholars" || tabParam === "domains") {
        setActiveTab(tabParam as "domains" | "scholars" | "internships");
      } else if (resolvedSpec) {
        setActiveTab("internships");
      } else if (resolvedDom) {
        setActiveTab("domains");
      } else {
        setActiveTab("domains");
      }

      if (qParam !== null) setSearchQuery(qParam);
      else setSearchQuery("");

      if (modeParam !== null) setModeFilter(modeParam);
      else setModeFilter("");

      if (skillParam !== null) setSkillFilter(skillParam);
      else setSkillFilter("");

      if (uniParam !== null) setUniversityFilter(uniParam);
      else setUniversityFilter("");

      if (countryParam !== null) setCountryFilter(countryParam);
      else setCountryFilter("");

      if (availParam !== null) setAvailabilityOnly(availParam === "true");
      else setAvailabilityOnly(false);

      if (pageParam !== null) {
        const pNum = parseInt(pageParam, 10);
        setCurrentPage(!isNaN(pNum) && pNum > 0 ? pNum : 1);
      } else {
        setCurrentPage(1);
      }
    },
    [resolveDomainId, resolveSpecId, specializations]
  );

  // Sync state when searchParams or taxonomy changes
  useEffect(() => {
    syncFromUrl(searchParams);
  }, [searchParams, syncFromUrl]);

  // Listen to popstate event (native browser Back / Forward)
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== "undefined") {
        syncFromUrl(new URLSearchParams(window.location.search));
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [syncFromUrl]);

  // Debounced input handlers for keyword search, university, and country filters
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleSearchChange = (newQ: string) => {
    setSearchQuery(newQ);
    setCurrentPage(1);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      navigateToExploreState({ q: newQ, page: 1 }, { replace: true });
    }, 350);
  };

  const uniTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleUniChange = (newUni: string) => {
    setUniversityFilter(newUni);
    setCurrentPage(1);
    if (uniTimeoutRef.current) clearTimeout(uniTimeoutRef.current);
    uniTimeoutRef.current = setTimeout(() => {
      navigateToExploreState({ uni: newUni, page: 1 }, { replace: true });
    }, 350);
  };

  const countryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleCountryChange = (newCountry: string) => {
    setCountryFilter(newCountry);
    setCurrentPage(1);
    if (countryTimeoutRef.current) clearTimeout(countryTimeoutRef.current);
    countryTimeoutRef.current = setTimeout(() => {
      navigateToExploreState({ country: newCountry, page: 1 }, { replace: true });
    }, 350);
  };

  const handleModeChange = (newMode: string) => {
    setModeFilter(newMode);
    setCurrentPage(1);
    navigateToExploreState({ mode: newMode, page: 1 }, { replace: true });
  };

  const handleSkillChange = (newSkill: string) => {
    setSkillFilter(newSkill);
    setCurrentPage(1);
    navigateToExploreState({ skill: newSkill, page: 1 }, { replace: true });
  };

  const handleAvailChange = (newAvail: boolean) => {
    setAvailabilityOnly(newAvail);
    setCurrentPage(1);
    navigateToExploreState({ avail: newAvail, page: 1 }, { replace: true });
  };

  useEffect(() => {
    const handleSwitchTab = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const tab = customEvent.detail;
      if (tab === "domains" || tab === "scholars" || tab === "internships") {
        navigateToExploreState({
          tab: tab as "domains" | "scholars" | "internships",
          domain: tab === "domains" ? "" : selectedDomainId,
          spec: tab === "domains" ? "" : selectedSpecId,
        });
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
  }, [navigateToExploreState, selectedDomainId, selectedSpecId]);

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
      router.push("/login?redirect=" + encodeURIComponent("/explore" + window.location.search));
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
  const selectedSpec = specializations.find((s) => s.id === selectedSpecId);
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
    return internships.filter(({ internship, scholar, scholarUser, domain, specialization }) => {
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
        const matchUni = scholar.university_institution.toLowerCase().includes(q);
        const matchDept = (scholar.department || "").toLowerCase().includes(q);
        const matchSkills = internship.required_skills.some((sk) =>
          sk.toLowerCase().includes(q)
        );
        const matchDomain = (domain?.name || "").toLowerCase().includes(q);
        const matchSpec = (specialization?.name || scholar.specialization || "").toLowerCase().includes(q);
        if (
          !matchTitle &&
          !matchDesc &&
          !matchScholar &&
          !matchUni &&
          !matchDept &&
          !matchSkills &&
          !matchDomain &&
          !matchSpec
        ) {
          return false;
        }
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
    navigateToExploreState({
      domain: "",
      spec: "",
      q: "",
      mode: "",
      skill: "",
      uni: "",
      country: "",
      avail: false,
      page: 1,
    });
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
                  navigateToExploreState({ tab: "domains", domain: "", spec: "" });
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
                  navigateToExploreState({ tab: "scholars" });
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
                  navigateToExploreState({ tab: "internships" });
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
              onClick={() => navigateToExploreState({ tab: "domains" })}
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
              onClick={() => navigateToExploreState({ tab: "scholars" })}
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
              onClick={() => navigateToExploreState({ tab: "internships" })}
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
            {loading && domains.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-72 rounded-2xl bg-[#F7F8FA] border border-[#E5E7EB] p-6 flex flex-col justify-between"
                  >
                    <div className="h-36 bg-[#E5E7EB] rounded-xl mb-4" />
                    <div className="space-y-2">
                      <div className="h-4 bg-[#E5E7EB] rounded w-2/3" />
                      <div className="h-3 bg-[#E5E7EB] rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !selectedDomain ? (
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
                        data-domain-id={domain.id}
                        onClick={() => {
                          navigateToExploreState({
                            tab: "domains",
                            domain: domain.id,
                            spec: "",
                          });
                        }}
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
                        navigateToExploreState({
                          tab: "domains",
                          domain: "",
                          spec: "",
                        });
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

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        navigateToExploreState({
                          tab: "internships",
                          domain: selectedDomainId,
                          spec: "",
                        });
                      }}
                      className="px-4 py-2.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors"
                    >
                      View All {selectedDomain.name} Internships →
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigateToExploreState({
                          tab: "scholars",
                          domain: selectedDomainId,
                          spec: "",
                        });
                      }}
                      className="px-4 py-2.5 rounded-lg bg-white border border-[#E5E7EB] text-[#202124] text-xs font-semibold hover:border-[#2563EB] hover:text-[#2563EB] transition-colors"
                    >
                      View Scholars →
                    </button>
                  </div>
                </div>

                {loading && domainSpecializations.length === 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-80 rounded-2xl bg-[#0C1017] border border-white/10 p-6 flex flex-col justify-between"
                      >
                        <div className="h-6 bg-white/10 rounded w-1/2" />
                        <div className="h-4 bg-white/5 rounded w-3/4" />
                        <div className="h-10 bg-white/10 rounded" />
                      </div>
                    ))}
                  </div>
                ) : domainSpecializations.length === 0 ? (
                  <div className="p-12 text-center text-sm text-[#666666] bg-[#F7F8FA] rounded-2xl border border-[#E5E7EB]">
                    No research specializations currently found for {selectedDomain.name}.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {domainSpecializations.map((spec) => {
                      const specVisibleCount = scholars.filter(
                        (s) => s.scholar.specialization_id === spec.id
                      ).length;
                      const specLockedCount = lockedScholarPreviews.filter(
                        (lp) => lp.specialization_id === spec.id
                      ).length;
                      const specScholarCount = specVisibleCount + specLockedCount;
                      const specInternshipCount = internships.filter(
                        (i) => i.internship.specialization_id === spec.id
                      ).length;
                      return (
                        <SpecializationCardWithAnimation
                          key={spec.id}
                          spec={spec}
                          domainName={selectedDomain.name}
                          scholarCount={specScholarCount}
                          internshipCount={specInternshipCount}
                          ctaLabel={`Explore Open Internships in ${spec.name}`}
                          onClick={() => {
                            navigateToExploreState({
                              tab: "internships",
                              domain: selectedDomainId,
                              spec: spec.id,
                            });
                          }}
                        />
                      );
                    })}
                  </div>
                )}
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
                      onChange={(e) => handleSearchChange(e.target.value)}
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
                      navigateToExploreState({
                        domain: e.target.value,
                        spec: "",
                        page: 1,
                      });
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
                      navigateToExploreState({
                        domain: selectedDomainId,
                        spec: e.target.value,
                        page: 1,
                      });
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
                    onChange={(e) => handleUniChange(e.target.value)}
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
                    onChange={(e) => handleSkillChange(e.target.value)}
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
                    onChange={(e) => handleModeChange(e.target.value)}
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
                    onChange={(e) => handleCountryChange(e.target.value)}
                    placeholder="e.g., India"
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs"
                  />
                </div>

                {/* Availability Toggle */}
                <label className="flex items-center gap-2 pt-1 text-xs font-medium text-[#202124] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={availabilityOnly}
                    onChange={(e) => handleAvailChange(e.target.checked)}
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
                            onClick={() => {
                              const p = Math.max(1, currentPage - 1);
                              navigateToExploreState({ page: p });
                            }}
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
                            onClick={() => {
                              const p = Math.min(totalPages, currentPage + 1);
                              navigateToExploreState({ page: p });
                            }}
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
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-[#F7F8FA] px-4 py-3 rounded-xl border border-[#E5E7EB]">
                    <p className="text-xs text-[#666666]">
                      Showing{" "}
                      <strong className="text-[#202124]">
                        {filteredInternships.length}
                      </strong>{" "}
                      open research {filteredInternships.length === 1 ? "internship" : "internships"}
                      {selectedDomain && (
                        <span>
                          {" "}under <strong className="text-[#202124]">{selectedDomain.name}</strong>
                          {selectedSpec && (
                            <> → <strong className="text-[#2563EB]">{selectedSpec.name}</strong></>
                          )}
                        </span>
                      )}
                    </p>
                    {(selectedDomainId || selectedSpecId) && (
                      <button
                        type="button"
                        onClick={() => {
                          navigateToExploreState({ domain: "", spec: "", page: 1 });
                        }}
                        className="text-xs text-[#2563EB] font-semibold hover:underline"
                      >
                        Clear Academic Filter ×
                      </button>
                    )}
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
                      ({ internship, scholar, scholarUser, domain, specialization }) => {
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
                                    {domain?.name || scholar.research_field} •{" "}
                                    {specialization?.name || scholar.specialization}
                                  </span>
                                  <span className="px-2.5 py-0.5 rounded bg-[#F7F8FA] border border-[#E5E7EB] text-[11px] font-semibold text-[#202124]">
                                    {internship.mode}
                                  </span>
                                  <span className="px-2.5 py-0.5 rounded bg-green-50 border border-green-200 text-[11px] font-semibold text-green-700">
                                    {internship.available_positions} {internship.available_positions === 1 ? "Position" : "Positions"}
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
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-[#202124] group-hover:text-[#2563EB]">
                                      {scholarUser.full_name}
                                    </span>
                                    {scholar.verification_status === "approved" && (
                                      <span title="Verified PhD Scholar" className="inline-flex">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-[#666666]">
                                    {scholar.university_institution} • {scholar.department}
                                  </span>
                                  {scholar.current_research_topic && (
                                    <span className="text-[11px] text-gray-500 block truncate max-w-xs sm:max-w-md">
                                      Research: {scholar.current_research_topic}
                                    </span>
                                  )}
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
                                  <span>View Details</span>
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
