"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Edit3,
  GraduationCap,
  Layers,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { AcademicDomain, Specialization } from "@/types/database";
import { DomainIcon } from "@/components/DomainIcon";

export interface AcademicSelectionResult {
  domainId: string;
  domainName: string;
  specializationId: string;
  specializationName: string;
  formattedDepartment: string;
}

interface CascadingAcademicSelectorProps {
  domainId?: string;
  specializationId?: string;
  currentDepartmentText?: string;
  onChange: (selection: AcademicSelectionResult) => void;
  domains?: AcademicDomain[];
  specializations?: Specialization[];
  error?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
}

export function CascadingAcademicSelector({
  domainId,
  specializationId,
  currentDepartmentText,
  onChange,
  domains: propDomains,
  specializations: propSpecializations,
  error,
  label = "Academic Domain & Specialization (Department)",
  required = true,
  disabled = false,
  helperText,
}: CascadingAcademicSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [level, setLevel] = useState<"domain" | "specialization">("domain");
  const [selectedDomainDraft, setSelectedDomainDraft] =
    useState<AcademicDomain | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [internalDomains, setInternalDomains] = useState<AcademicDomain[]>(
    propDomains || []
  );
  const [internalSpecializations, setInternalSpecializations] = useState<
    Specialization[]
  >(propSpecializations || []);
  const [loadingTaxonomy, setLoadingTaxonomy] = useState(false);

  // Sync or fetch dynamic domains & specializations from /api/public
  useEffect(() => {
    if (propDomains && propDomains.length > 0) {
      setInternalDomains(propDomains);
    }
    if (propSpecializations && propSpecializations.length > 0) {
      setInternalSpecializations(propSpecializations);
    }

    if (
      (!propDomains || propDomains.length === 0) ||
      (!propSpecializations || propSpecializations.length === 0)
    ) {
      setLoadingTaxonomy(true);
      fetch("/api/public", { cache: "no-store" })
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data.domains)) {
            setInternalDomains(data.domains.filter((d: AcademicDomain) => d.is_active));
          }
          if (Array.isArray(data.specializations)) {
            setInternalSpecializations(
              data.specializations.filter((s: Specialization) => s.is_active)
            );
          }
        })
        .catch((err) => console.error("Failed to load academic taxonomy:", err))
        .finally(() => setLoadingTaxonomy(false));
    }
  }, [propDomains, propSpecializations]);

  // Derive active domain and specialization objects from current props
  const activeDomain = useMemo(() => {
    if (!domainId) return null;
    return internalDomains.find((d) => d.id === domainId) || null;
  }, [domainId, internalDomains]);

  const activeSpecialization = useMemo(() => {
    if (!specializationId) return null;
    return (
      internalSpecializations.find((s) => s.id === specializationId) || null
    );
  }, [specializationId, internalSpecializations]);

  // Open modal handler
  const handleOpen = () => {
    if (disabled) return;
    setSearchQuery("");
    if (activeDomain) {
      setSelectedDomainDraft(activeDomain);
      setLevel("specialization");
    } else {
      setSelectedDomainDraft(null);
      setLevel("domain");
    }
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleSelectDomain = (domain: AcademicDomain) => {
    setSelectedDomainDraft(domain);
    setLevel("specialization");
    setSearchQuery("");
  };

  const handleBackToDomains = () => {
    setLevel("domain");
    setSearchQuery("");
  };

  const handleSelectSpecialization = (spec: Specialization) => {
    if (!selectedDomainDraft) return;
    const formatted = `${selectedDomainDraft.name} — ${spec.name}`;
    onChange({
      domainId: selectedDomainDraft.id,
      domainName: selectedDomainDraft.name,
      specializationId: spec.id,
      specializationName: spec.name,
      formattedDepartment: formatted,
    });
    setIsOpen(false);
    setSearchQuery("");
  };

  // Filtered domains for Step 1
  const filteredDomains = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return internalDomains.filter((d) => {
      if (!d.is_active) return false;
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        (d.description && d.description.toLowerCase().includes(q))
      );
    });
  }, [internalDomains, searchQuery]);

  // Count specs per domain for count badges
  const specCountByDomain = useMemo(() => {
    const map: Record<string, number> = {};
    for (const spec of internalSpecializations) {
      if (spec.is_active) {
        map[spec.domain_id] = (map[spec.domain_id] || 0) + 1;
      }
    }
    return map;
  }, [internalSpecializations]);

  // Filtered specializations for Step 2
  const filteredSpecializations = useMemo(() => {
    if (!selectedDomainDraft) return [];
    const q = searchQuery.trim().toLowerCase();
    return internalSpecializations.filter((s) => {
      if (!s.is_active) return false;
      if (s.domain_id !== selectedDomainDraft.id) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.slug && s.slug.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q))
      );
    });
  }, [internalSpecializations, selectedDomainDraft, searchQuery]);

  const hasSelection = Boolean(activeDomain && activeSpecialization);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
          {label} {required && <span className="text-[#2563EB]">*</span>}
        </label>
      )}

      {/* Trigger Field */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={handleOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleOpen();
          }
        }}
        className={`w-full rounded-xl transition-all cursor-pointer text-left select-none outline-none ${
          disabled ? "opacity-60 cursor-not-allowed" : ""
        } ${
          hasSelection
            ? "border border-[#2563EB]/40 bg-white hover:border-[#2563EB] shadow-xs hover:shadow-sm"
            : `border px-4 py-3 bg-white hover:border-[#2563EB] ${
                error
                  ? "border-red-400 bg-red-50/20"
                  : "border-[#E5E7EB] hover:bg-[#F7F8FA]/50"
              }`
        }`}
      >
        {hasSelection ? (
          <div className="p-3 sm:p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2 border-b border-[#E5E7EB] pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#2563EB] border border-blue-200">
                  <DomainIcon
                    name={activeDomain?.icon_name}
                    className="w-3.5 h-3.5 text-[#2563EB]"
                  />
                  <span>Domain: {activeDomain?.name}</span>
                </span>
                <span className="text-xs text-[#666666] hidden sm:inline">
                  (Parent Discipline)
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpen();
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Change</span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666] block">
                  Specialization
                </span>
                <p className="text-sm sm:text-base font-bold text-[#202124]">
                  {activeSpecialization?.name}
                </p>
              </div>
              <div className="w-7 h-7 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-[#2563EB]" />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-sm text-[#666666]">
              <div className="w-8 h-8 rounded-lg bg-[#F7F8FA] border border-[#E5E7EB] flex items-center justify-center text-[#2563EB]">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <span className="font-medium text-[#202124] block">
                  {currentDepartmentText && currentDepartmentText.trim()
                    ? currentDepartmentText
                    : "Select Academic Domain & Specialization"}
                </span>
                <span className="text-xs text-[#666666]">
                  Click to choose parent domain and subfield track
                </span>
              </div>
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-[#2563EB] text-xs font-semibold">
              <span>Browse</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        )}
      </div>

      {helperText && !error && (
        <p className="text-xs text-[#666666] mt-1.5">{helperText}</p>
      )}
      {error && <p className="text-xs text-red-600 mt-1.5 font-medium">{error}</p>}

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 bg-[#222326] text-white flex items-center justify-between border-b border-[#33353A]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-[#2563EB]">
                  <Sparkles className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {level === "domain"
                      ? "Select Academic Domain"
                      : "Select Specialization"}
                  </h3>
                  <p className="text-xs text-gray-300">
                    {level === "domain"
                      ? "Step 1 of 2: Choose your primary parent discipline"
                      : `Step 2 of 2: Specializations under ${selectedDomainDraft?.name}`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-Header with Breadcrumb / Selected Parent Banner */}
            {level === "specialization" && selectedDomainDraft && (
              <div className="bg-[#F7F8FA] border-b border-[#E5E7EB] px-5 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#666666] font-medium">Selected Domain:</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#2563EB] text-white shadow-xs">
                    <DomainIcon
                      name={selectedDomainDraft.icon_name}
                      className="w-3.5 h-3.5 text-white"
                    />
                    <span>{selectedDomainDraft.name}</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleBackToDomains}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Parent Domain</span>
                </button>
              </div>
            )}

            {/* Search Input Bar */}
            <div className="p-4 sm:p-5 border-b border-[#E5E7EB] bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-[#666666] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    level === "domain"
                      ? "Search academic domains..."
                      : `Search specializations in ${selectedDomainDraft?.name || ""}...`
                  }
                  autoFocus
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E5E7EB] text-sm text-[#202124] bg-[#F7F8FA] focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#FFFFFF]">
              {loadingTaxonomy ? (
                <div className="py-16 text-center text-sm text-[#666666] flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
                  <span>Loading academic taxonomy...</span>
                </div>
              ) : level === "domain" ? (
                /* STEP 1: Academic Domains Grid */
                <div>
                  <div className="flex items-center justify-between mb-3 text-xs text-[#666666]">
                    <span>
                      Showing {filteredDomains.length} Academic{" "}
                      {filteredDomains.length === 1 ? "Domain" : "Domains"}
                    </span>
                    <span>Click a domain to view specializations</span>
                  </div>

                  {filteredDomains.length === 0 ? (
                    <div className="py-12 text-center text-sm text-[#666666]">
                      <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="font-semibold text-[#202124]">
                        No matching academic domains found
                      </p>
                      <p className="text-xs text-[#666666] mt-1">
                        Try a different search query like &ldquo;Engineering&rdquo;, &ldquo;Medical&rdquo;, or &ldquo;Science&rdquo;.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {filteredDomains.map((domain) => {
                        const isCurrent = activeDomain?.id === domain.id;
                        const specCount = specCountByDomain[domain.id] || 0;

                        return (
                          <div
                            key={domain.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleSelectDomain(domain)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleSelectDomain(domain);
                              }
                            }}
                            className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3.5 group ${
                              isCurrent
                                ? "border-[#2563EB] bg-blue-50/50 ring-1 ring-[#2563EB]"
                                : "border-[#E5E7EB] bg-white hover:border-[#2563EB] hover:bg-[#F7F8FA]"
                            }`}
                          >
                            <div
                              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                isCurrent
                                  ? "bg-[#2563EB] text-white"
                                  : "bg-[#F7F8FA] border border-[#E5E7EB] text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white"
                              }`}
                            >
                              <DomainIcon
                                name={domain.icon_name}
                                className="w-5 h-5 transition-colors"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-sm font-bold text-[#202124] group-hover:text-[#2563EB] transition-colors truncate">
                                  {domain.name}
                                </h4>
                                {isCurrent && (
                                  <span className="shrink-0 w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xs">
                                    <Check className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#666666] line-clamp-2 mt-1 leading-relaxed">
                                {domain.description || "Frontier research discipline"}
                              </p>
                              <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#666666]">
                                <span className="inline-flex items-center gap-1 font-medium text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded-md">
                                  <Layers className="w-3 h-3" />
                                  {specCount} Specializations
                                </span>
                                <span className="text-[#2563EB] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-medium">
                                  View tracks <ChevronRight className="w-3 h-3" />
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* STEP 2: Specializations Grid */
                <div>
                  <div className="flex items-center justify-between mb-3 text-xs text-[#666666]">
                    <span>
                      Showing {filteredSpecializations.length} Specializations in{" "}
                      <strong className="text-[#202124]">
                        {selectedDomainDraft?.name}
                      </strong>
                    </span>
                    <span>Click a specialization to select</span>
                  </div>

                  {filteredSpecializations.length === 0 ? (
                    <div className="py-12 text-center text-sm text-[#666666]">
                      <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="font-semibold text-[#202124]">
                        No specializations match &ldquo;{searchQuery}&rdquo;
                      </p>
                      <p className="text-xs text-[#666666] mt-1">
                        Try another keyword or go back to browse other parent domains.
                      </p>
                      <button
                        type="button"
                        onClick={handleBackToDomains}
                        className="mt-4 px-4 py-2 rounded-lg text-xs font-semibold bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-colors"
                      >
                        ← Back to Academic Domains
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredSpecializations.map((spec) => {
                        const isCurrent =
                          activeSpecialization?.id === spec.id &&
                          activeDomain?.id === selectedDomainDraft?.id;

                        return (
                          <div
                            key={spec.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleSelectSpecialization(spec)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleSelectSpecialization(spec);
                              }
                            }}
                            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                              isCurrent
                                ? "border-[#2563EB] bg-blue-50/60 ring-1 ring-[#2563EB]"
                                : "border-[#E5E7EB] bg-white hover:border-[#2563EB] hover:bg-[#F7F8FA]"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                                  isCurrent
                                    ? "bg-[#2563EB] text-white"
                                    : "bg-[#F7F8FA] border border-[#E5E7EB] text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white transition-colors"
                                }`}
                              >
                                <GraduationCap className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-sm font-semibold text-[#202124] group-hover:text-[#2563EB] transition-colors truncate">
                                  {spec.name}
                                </h5>
                                {spec.slug && (
                                  <span className="text-[11px] text-[#666666] block">
                                    Slug: {spec.slug}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="shrink-0">
                              {isCurrent ? (
                                <span className="w-6 h-6 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xs shadow-xs">
                                  <Check className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <span className="w-6 h-6 rounded-full border border-[#E5E7EB] text-transparent group-hover:border-[#2563EB] group-hover:text-[#2563EB] flex items-center justify-center text-xs transition-colors">
                                  <Check className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 sm:px-6 py-3.5 bg-[#F7F8FA] border-t border-[#E5E7EB] flex items-center justify-between gap-3">
              <div>
                {level === "specialization" ? (
                  <button
                    type="button"
                    onClick={handleBackToDomains}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-[#202124] bg-white border border-[#E5E7EB] hover:bg-[#F7F8FA] transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Domains</span>
                  </button>
                ) : (
                  <span className="text-xs text-[#666666]">
                    Select a domain to proceed to specializations
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-[#666666] hover:text-[#202124] hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
