"use client";

import React from "react";
import Link from "next/link";
import { Mail, MapPin, Phone, ShieldCheck, Sparkles, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function Footer() {
  const { settings, supabaseConnected } = useAuth();

  const siteName = settings?.site_name || "STARSKY";
  const tagline = settings?.tagline || "Connecting Research Minds. Creating Opportunities.";
  const footerText =
    settings?.footer_text ||
    "STARSKY is a dedicated academic research collaboration and internship discovery platform connecting verified PhD scholars with undergraduate and postgraduate students.";

  return (
    <footer className="bg-[#FFFFFF] border-t border-[#E5E7EB] text-[#202124]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Column 1-2: Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#202124] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#2563EB]" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-[#202124] block leading-none">
                  {siteName}
                </span>
                <span className="text-xs text-[#666666] block mt-0.5">{tagline}</span>
              </div>
            </Link>
            <p className="text-sm text-[#666666] leading-relaxed max-w-md">{footerText}</p>
            <div className="pt-2 space-y-2 text-xs text-[#666666]">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#2563EB] shrink-0" />
                <span>
                  {settings?.contact_address ||
                    "STARSKY Academic Innovation Hub, Research Park, Bengaluru, India"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#2563EB] shrink-0" />
                <span>{settings?.contact_email || "contact@starsky.edu"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#2563EB] shrink-0" />
                <span>{settings?.contact_phone || "+91 (800) 555-0199"}</span>
              </div>
            </div>
          </div>

          {/* Column 3: Academic Domains */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#202124] mb-4">
              Academic Domains
            </h3>
            <ul className="space-y-2.5 text-sm text-[#666666]">
              <li>
                <Link href="/explore?domain=dom-engineering" className="hover:text-[#2563EB]">
                  Engineering & AI
                </Link>
              </li>
              <li>
                <Link href="/explore?domain=dom-medical" className="hover:text-[#2563EB]">
                  Medical & Healthcare
                </Link>
              </li>
              <li>
                <Link href="/explore?domain=dom-science" className="hover:text-[#2563EB]">
                  Fundamental Sciences
                </Link>
              </li>
              <li>
                <Link href="/explore?domain=dom-management" className="hover:text-[#2563EB]">
                  Management & Analytics
                </Link>
              </li>
              <li>
                <Link href="/explore?domain=dom-law" className="hover:text-[#2563EB]">
                  Law, Arts & Humanities
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Platform Navigation */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#202124] mb-4">
              Platform
            </h3>
            <ul className="space-y-2.5 text-sm text-[#666666]">
              <li>
                <Link href="/explore?tab=domains" className="hover:text-[#2563EB]">
                  Open Internships (Academic Domains)
                </Link>
              </li>
              <li>
                <Link href="/explore?tab=scholars" className="hover:text-[#2563EB]">
                  Researchers
                </Link>
              </li>
              <li>
                <Link href="/explore?tab=internships" className="hover:text-[#2563EB]">
                  Browse Internships
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#2563EB]">
                  About STARSKY
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#2563EB]">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Portals & Governance */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#202124] mb-4">
              Research Portals
            </h3>
            <ul className="space-y-2.5 text-sm text-[#666666]">
              <li>
                <Link href="/register?role=student" className="hover:text-[#2563EB]">
                  Student Registration
                </Link>
              </li>
              <li>
                <Link href="/register?role=scholar" className="hover:text-[#2563EB]">
                  PhD Scholar Onboarding
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#2563EB]">
                  Member Sign In
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/login"
                  className="hover:text-[#2563EB] inline-flex items-center gap-1 font-medium text-[#202124]"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Admin Governance</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright & Database Mode Transparency Bar */}
        <div className="mt-12 pt-6 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#666666]">
          <p>
            © {new Date().getFullYear()} {siteName} Academic Research Platform. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F7F8FA] border border-[#E5E7EB] text-[11px]">
              <span
                className={`w-2 h-2 rounded-full ${
                  supabaseConnected ? "bg-green-600" : "bg-[#2563EB]"
                }`}
              />
              <span>
                {supabaseConnected
                  ? "Database: Supabase PostgreSQL Connected"
                  : "Database: Local Persistent Server Store (Configure .env.local for Supabase Cloud)"}
              </span>
            </span>
            {settings?.social_links?.linkedin && (
              <a
                href={settings.social_links.linkedin}
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#2563EB] inline-flex items-center gap-0.5"
              >
                LinkedIn <ArrowUpRight className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}

