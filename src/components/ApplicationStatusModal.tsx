"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  GraduationCap,
  Send,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import { ApplicationStatus, EnrichedApplication } from "@/types/database";

export function getApplicationBadgeLabel(status: ApplicationStatus): string {
  switch (status) {
    case "Submitted":
      return "Application Submitted";
    case "Under Review":
      return "Under Review";
    case "Shortlisted":
      return "Shortlisted";
    case "Accepted":
      return "Accepted";
    case "Rejected":
      return "Rejected";
    case "Withdrawn":
      return "Withdrawn";
    default:
      return status;
  }
}

export function getApplicationBadgeStyle(status: ApplicationStatus): string {
  switch (status) {
    case "Submitted":
      return "bg-[#EFF6FF] text-[#2563EB] border-[#2563EB]/30";
    case "Under Review":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "Shortlisted":
      return "bg-[#EFF6FF] text-[#1D4ED8] border-[#2563EB]";
    case "Accepted":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Rejected":
      return "bg-red-50 text-red-700 border-red-200";
    case "Withdrawn":
      return "bg-gray-100 text-gray-600 border-gray-200";
    default:
      return "bg-[#F7F8FA] text-[#202124] border-[#E5E7EB]";
  }
}

export function ApplicationStatusBadge({
  status,
  className = "",
}: {
  status: ApplicationStatus;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-bold ${getApplicationBadgeStyle(
        status
      )} ${className}`}
    >
      {status === "Accepted" ? (
        <CheckCircle2 className="w-3.5 h-3.5" />
      ) : status === "Rejected" ? (
        <XCircle className="w-3.5 h-3.5" />
      ) : (
        <Clock className="w-3.5 h-3.5" />
      )}
      <span>{getApplicationBadgeLabel(status)}</span>
    </span>
  );
}

interface InternshipApplicationActionProps {
  existingApplication?: EnrichedApplication | null;
  checkingStatus?: boolean;
  onApply?: () => void;
  applyHref?: string;
  applyLabel?: string;
  onViewApplication: (app: EnrichedApplication) => void;
  disabled?: boolean;
}

export function InternshipApplicationAction({
  existingApplication,
  checkingStatus = false,
  onApply,
  applyHref,
  applyLabel = "Apply for This Position",
  onViewApplication,
  disabled = false,
}: InternshipApplicationActionProps) {
  if (checkingStatus) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F7F8FA] border border-[#E5E7EB] text-xs font-medium text-[#666666]">
        <span className="w-3.5 h-3.5 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin" />
        <span>Checking status...</span>
      </div>
    );
  }

  const status = existingApplication?.application.status;
  const hasActiveOrDecidedApp =
    Boolean(existingApplication) && status !== "Withdrawn";

  if (hasActiveOrDecidedApp && existingApplication) {
    return (
      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        <ApplicationStatusBadge status={existingApplication.application.status} />
        <button
          type="button"
          onClick={() => onViewApplication(existingApplication)}
          className="px-4 py-2 rounded-lg bg-[#202124] hover:bg-black text-white text-xs font-semibold transition-colors inline-flex items-center gap-1.5 shadow-2xs"
        >
          <Eye className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>View Application</span>
        </button>
      </div>
    );
  }

  // Not applied yet, or previously Withdrawn (student is permitted to apply again)
  return (
    <div className="flex flex-wrap items-center gap-2 shrink-0">
      {status === "Withdrawn" && existingApplication && (
        <>
          <ApplicationStatusBadge status="Withdrawn" />
          <button
            type="button"
            onClick={() => onViewApplication(existingApplication)}
            className="px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white hover:border-[#202124] text-[#202124] text-xs font-semibold transition-colors inline-flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5 text-[#666666]" />
            <span>View Application</span>
          </button>
        </>
      )}

      {onApply ? (
        <button
          type="button"
          onClick={onApply}
          disabled={disabled}
          className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{applyLabel}</span>
        </button>
      ) : applyHref ? (
        <Link
          href={applyHref}
          className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{applyLabel}</span>
        </Link>
      ) : null}
    </div>
  );
}

interface ViewApplicationModalProps {
  applicationData: EnrichedApplication | null;
  onClose: () => void;
  onWithdraw?: (applicationId: string) => void;
  withdrawingId?: string;
}

export function ViewApplicationModal({
  applicationData,
  onClose,
  onWithdraw,
  withdrawingId,
}: ViewApplicationModalProps) {
  if (!applicationData) return null;

  const { application, internship, scholar, scholarUser } = applicationData;
  const canWithdraw =
    Boolean(onWithdraw) &&
    (application.status === "Submitted" ||
      application.status === "Under Review" ||
      application.status === "Shortlisted");

  const statusTimeline: Array<{ key: ApplicationStatus; label: string }> = [
    { key: "Submitted", label: "Application Submitted" },
    { key: "Under Review", label: "Under Review" },
    { key: "Shortlisted", label: "Shortlisted" },
    {
      key: application.status === "Rejected" ? "Rejected" : "Accepted",
      label: application.status === "Rejected" ? "Rejected" : "Accepted",
    },
  ];

  const getStepState = (
    stepKey: ApplicationStatus
  ): "completed" | "current" | "upcoming" | "rejected" => {
    const order: Record<string, number> = {
      Submitted: 1,
      "Under Review": 2,
      Shortlisted: 3,
      Accepted: 4,
      Rejected: 4,
      Withdrawn: 0,
    };
    const currOrder = order[application.status] ?? 1;
    const stepOrder = order[stepKey] ?? 1;

    if (application.status === "Withdrawn") return "upcoming";
    if (application.status === "Rejected" && stepKey === "Rejected") {
      return "rejected";
    }
    if (stepOrder < currOrder) return "completed";
    if (stepOrder === currOrder) return "current";
    return "upcoming";
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6 my-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#E5E7EB] pb-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                Submitted Research Internship Application
              </span>
              <ApplicationStatusBadge status={application.status} />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#202124]">
              {internship.title}
            </h2>
            <p className="text-xs text-[#666666] flex flex-wrap items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>
                PhD Scholar: <strong className="text-[#202124]">{scholarUser.full_name}</strong> (
                {scholar.university_institution} • {scholar.department})
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close application view"
            className="p-2 rounded-lg border border-[#E5E7EB] text-[#666666] hover:text-[#202124] hover:bg-[#F7F8FA]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Progression & Timestamps */}
        <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-[#666666] inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
              Submitted on:{" "}
              <strong className="text-[#202124]">
                {new Date(application.submitted_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </strong>
            </span>
            <span className="text-[#666666] inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
              Latest Status Update:{" "}
              <strong className="text-[#202124]">
                {new Date(application.updated_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}{" "}
                ({getApplicationBadgeLabel(application.status)})
              </strong>
            </span>
          </div>

          {application.status !== "Withdrawn" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {statusTimeline.map((step, index) => {
                const state = getStepState(step.key);
                return (
                  <div
                    key={step.key}
                    className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
                      state === "completed" || state === "current"
                        ? "bg-[#EFF6FF] border-[#2563EB] text-[#202124]"
                        : state === "rejected"
                        ? "bg-red-50 border-red-300 text-red-800"
                        : "bg-white border-[#E5E7EB] text-[#666666]"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                        state === "completed" || state === "current"
                          ? "bg-[#2563EB] text-white"
                          : state === "rejected"
                          ? "bg-red-600 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="truncate">{step.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Submitted Application Details (Read-Only) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#202124] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
              Submitted Application Record (Read-Only)
            </h3>
            <span className="text-[11px] text-[#666666]">
              ID: {application.id}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[#F7F8FA] p-5 rounded-xl border border-[#E5E7EB]">
            <div>
              <span className="text-[#666666] block">Applicant Name</span>
              <strong className="text-[#202124] text-sm">
                {application.student_full_name}
              </strong>
            </div>
            <div>
              <span className="text-[#666666] block">Contact Information</span>
              <strong className="text-[#202124]">
                {application.student_email} • {application.student_phone}
              </strong>
            </div>
            <div>
              <span className="text-[#666666] block">
                Institution & Academic Program
              </span>
              <strong className="text-[#202124]">
                {application.college_university} ({application.degree} —{" "}
                {application.department})
              </strong>
            </div>
            <div>
              <span className="text-[#666666] block">
                Current Year & Availability
              </span>
              <strong className="text-[#202124]">
                {application.current_academic_year} •{" "}
                {application.expected_availability} (
                {application.preferred_duration})
              </strong>
            </div>

            <div className="sm:col-span-2 pt-2 border-t border-[#E5E7EB]">
              <span className="text-[#666666] block mb-1.5">
                Research Interests
              </span>
              <div className="flex flex-wrap gap-1.5">
                {application.research_interests.map((interest) => (
                  <span
                    key={interest}
                    className="px-2.5 py-0.5 rounded bg-[#EFF6FF] border border-[#2563EB]/30 text-[#2563EB] font-medium"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2">
              <span className="text-[#666666] block mb-1.5">
                Technical Skills
              </span>
              <div className="flex flex-wrap gap-1.5">
                {application.technical_skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-0.5 rounded bg-white border border-[#E5E7EB] text-[#202124] font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2 pt-2 border-t border-[#E5E7EB]">
              <span className="text-[#666666] font-semibold block">
                Statement of Purpose
              </span>
              <p className="text-[#202124] mt-1 whitespace-pre-line leading-relaxed">
                {application.statement_of_purpose}
              </p>
            </div>

            {application.relevant_experience && (
              <div className="sm:col-span-2 pt-2 border-t border-[#E5E7EB]">
                <span className="text-[#666666] font-semibold block">
                  Relevant Experience & Projects
                </span>
                <p className="text-[#202124] mt-1 whitespace-pre-line leading-relaxed">
                  {application.relevant_experience}
                </p>
              </div>
            )}

            {application.additional_message && (
              <div className="sm:col-span-2 pt-2 border-t border-[#E5E7EB]">
                <span className="text-[#666666] font-semibold block">
                  Additional Message to Scholar
                </span>
                <p className="text-[#202124] mt-1 whitespace-pre-line leading-relaxed">
                  {application.additional_message}
                </p>
              </div>
            )}

            {/* Uploaded Resume & Links */}
            <div className="sm:col-span-2 pt-3 border-t border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                {application.resume_url && (
                  <a
                    href={application.resume_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#E5E7EB] hover:border-[#2563EB] text-[#202124] font-semibold shadow-2xs"
                  >
                    <FileText className="w-4 h-4 text-[#2563EB]" />
                    <span>View Uploaded Resume (CV)</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#2563EB]" />
                  </a>
                )}
                {application.portfolio_url && (
                  <a
                    href={application.portfolio_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#2563EB] font-semibold hover:underline"
                  >
                    <span>Portfolio</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                )}
                {application.linkedin_url && (
                  <a
                    href={application.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#202124] hover:text-[#2563EB] font-semibold hover:underline"
                  >
                    <span>LinkedIn</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <Link
                href={`/scholars/${scholar.id}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline"
              >
                <GraduationCap className="w-4 h-4" />
                <span>View Scholar Profile</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E5E7EB]">
          <Link
            href="/dashboard/student?tab=applications"
            className="text-xs font-semibold text-[#2563EB] hover:underline"
          >
            Go to Student Dashboard → My Applications
          </Link>

          <div className="flex items-center gap-2.5">
            {canWithdraw && onWithdraw && (
              <button
                type="button"
                disabled={withdrawingId === application.id}
                onClick={() => onWithdraw(application.id)}
                className="px-4 py-2.5 rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
              >
                {withdrawingId === application.id
                  ? "Withdrawing..."
                  : "Withdraw Application"}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg bg-[#202124] text-white text-xs font-semibold hover:bg-black"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

