"use client";

import React, { useState, useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { getSpecializationAnimationUrl } from "@/config/specializationAnimations";

interface SpecializationCardProps {
  spec: {
    id: string;
    name: string;
    description: string;
    domain_id: string;
  };
  domainName: string;
  scholarCount: number;
  internshipCount?: number;
  ctaLabel?: string;
  onClick: () => void;
}

export function SpecializationCardWithAnimation({
  spec,
  domainName,
  scholarCount,
  internshipCount,
  ctaLabel,
  onClick,
}: SpecializationCardProps) {
  const [isInView, setIsInView] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const animationUrl = getSpecializationAnimationUrl(
    spec.id,
    spec.name,
    spec.domain_id
  );

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInView(entry.isIntersecting);
          if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
              entry.isIntersecting ? "play" : "pause",
              "*"
            );
          }
        });
      },
      { rootMargin: "250px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`relative group overflow-hidden rounded-2xl border border-white/10 bg-[#0C1017] transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[320px] md:min-h-[340px] ${
        isHovered
          ? "border-[#3B82F6]/60 -translate-y-1.5 shadow-2xl shadow-blue-500/15"
          : "hover:border-white/20 shadow-lg shadow-black/40"
      }`}
    >
      {/* LAYER 1: Self-Contained Specialized HTML Canvas Animation */}
      {isInView && (
        <iframe
          ref={iframeRef}
          src={animationUrl}
          title={`${spec.name} Interactive Background Animation`}
          className="absolute inset-0 w-full h-full border-0 pointer-events-none z-0"
          sandbox="allow-scripts"
          loading="lazy"
          aria-hidden="true"
          tabIndex={-1}
        />
      )}

      {/* LAYER 2: High-Contrast Corporate Dark Gradient Overlay for Maximum Legibility */}
      <div
        className={`absolute inset-0 pointer-events-none z-10 transition-opacity duration-300 bg-gradient-to-t from-[#0A0E17]/95 via-[#0D121D]/80 to-[#0A0E17]/65 ${
          isHovered ? "opacity-90" : "opacity-95"
        }`}
      />

      {/* LAYER 3: Existing STARSKY Card Content and Badges */}
      <div className="relative z-20 flex flex-col justify-between h-full p-6 md:p-7 space-y-4">
        {/* Top Header Row */}
        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#93C5FD]">
              {domainName}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {internshipCount !== undefined && internshipCount > 0 && (
                <span className="px-2.5 py-1 rounded-md bg-[#2563EB]/40 border border-[#3B82F6]/60 text-[11px] font-bold text-[#93C5FD] backdrop-blur-sm">
                  {internshipCount} {internshipCount === 1 ? "Internship" : "Internships"}
                </span>
              )}
              <span className="px-2.5 py-1 rounded-md bg-white/10 border border-white/15 text-[11px] font-semibold text-white backdrop-blur-sm">
                {scholarCount} {scholarCount === 1 ? "Scholar" : "Scholars"}
              </span>
            </div>
          </div>

          <h3 className="text-xl md:text-2xl font-bold text-white mt-3 group-hover:text-[#60A5FA] transition-colors leading-snug">
            {spec.name}
          </h3>

          <p className="text-xs md:text-sm text-gray-300/90 mt-2.5 leading-relaxed line-clamp-3">
            {spec.description}
          </p>
        </div>

        {/* Bottom CTA Row */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs md:text-sm font-semibold text-[#60A5FA] group-hover:text-white transition-colors">
          <span>{ctaLabel || `Browse Scholars in ${spec.name}`}</span>
          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
}

