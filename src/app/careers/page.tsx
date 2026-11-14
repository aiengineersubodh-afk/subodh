"use client";

import React, { useEffect, useState } from "react";
import { Briefcase, Calendar, CheckCircle2, Mail, MapPin } from "lucide-react";
import { CareerListing } from "@/types/database";

export default function CareersPage() {
  const [careers, setCareers] = useState<CareerListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public")
      .then((res) => res.json())
      .then((data) => setCareers(data.careers || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="bg-[#F7F8FA] border-b border-[#E5E7EB] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
              Careers & Recruitment
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#202124]">
              Build the Future of Academic Research Collaboration
            </h1>
            <p className="text-base text-[#666666] leading-relaxed">
              Join STARSKY’s core engineering, institutional relations, and academic operations
              teams to connect research minds worldwide.
            </p>
          </div>
        </div>
      </section>

      {/* Listings */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-48 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] animate-pulse"
                />
              ))}
            </div>
          ) : careers.length === 0 ? (
            <div className="card-corporate p-12 text-center">
              <Briefcase className="w-10 h-10 text-[#2563EB] mx-auto" />
              <h3 className="text-lg font-bold text-[#202124] mt-3">
                No Open Platform Positions at the Moment
              </h3>
              <p className="text-sm text-[#666666] mt-1">
                Please check back soon or send your resume to{" "}
                <span className="text-[#202124] font-medium">careers@starsky.edu</span>.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {careers.map((job) => (
                <div key={job.id} className="card-corporate p-7">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 rounded bg-[#EFF6FF] border border-[#2563EB]/30 text-xs font-semibold text-[#2563EB]">
                          {job.department}
                        </span>
                        <span className="px-2.5 py-1 rounded bg-[#F7F8FA] border border-[#E5E7EB] text-xs font-medium text-[#202124]">
                          {job.employment_type}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-[#202124] mt-2">{job.title}</h2>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-[#666666] mt-2">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
                          {job.location}
                        </span>
                        {job.closing_date && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
                            Apply by: {job.closing_date}
                          </span>
                        )}
                      </div>
                    </div>

                    <a
                      href={`mailto:${job.application_email}?subject=Application for ${encodeURIComponent(
                        job.title
                      )}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors shrink-0"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Apply via Email</span>
                    </a>
                  </div>

                  <div className="mt-5 space-y-4">
                    <p className="text-sm text-[#666666] leading-relaxed">{job.description}</p>
                    {job.requirements.length > 0 && (
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#202124] mb-2">
                          Key Qualifications & Requirements
                        </h3>
                        <ul className="space-y-1.5">
                          {job.requirements.map((req, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-xs text-[#666666]"
                            >
                              <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

