"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { SubscriptionPlan, UserSubscription } from "@/types/database";
import {
  Award,
  CheckCircle2,
  Clock,
  Crown,
  Lock,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextTitle?: string;
}

export default function PremiumUpgradeModal({
  isOpen,
  onClose,
  contextTitle,
}: PremiumUpgradeModalProps) {
  const { session, refreshSession } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("plan-quarterly");
  const [pendingSub, setPendingSub] = useState<UserSubscription | null>(null);
  const [activeSub, setActiveSub] = useState<UserSubscription | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFeedback(null);
    setLoading(true);
    fetch("/api/subscriptions", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.plans && data.plans.length > 0) {
          setPlans(data.plans);
          const defaultPlan =
            data.plans.find(
              (p: SubscriptionPlan) => p.billing_cycle === "quarterly"
            ) || data.plans[0];
          setSelectedPlanId(defaultPlan.id);
        }
        setPendingSub(data.pendingSubscription || null);
        setActiveSub(data.activeSubscription || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestUpgrade = async () => {
    if (!selectedPlanId) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlanId, notes }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: json.error || "Unable to submit subscription request.",
        });
      } else {
        setPendingSub(json.subscription || null);
        setFeedback({
          type: "success",
          text:
            json.message ||
            "Your subscription request has been recorded. An administrator will verify and activate your Premium access.",
        });
        await refreshSession();
      }
    } catch {
      setFeedback({
        type: "error",
        text: "Network error while submitting request.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#E5E7EB] shadow-2xl overflow-hidden my-8">
        {/* Top Banner */}
        <div className="bg-[#202124] text-white px-6 py-6 relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-5 right-5 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2563EB]/20 border border-[#2563EB]/40 text-[#2563EB] text-xs font-semibold uppercase tracking-wider mb-3">
            <Crown className="w-3.5 h-3.5" />
            STARSKY Premium Student Access
          </div>

          <h2 className="text-2xl font-bold text-white">
            Unlock Your Research Network
          </h2>
          <p className="text-sm text-gray-300 mt-1.5 leading-relaxed max-w-xl">
            Get access to more verified PhD scholars, discover additional research
            opportunities, and connect directly with researchers in your field.
          </p>

          {contextTitle && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 text-xs text-gray-200">
              <Lock className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Requested feature: {contextTitle}</span>
            </div>
          )}
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Core Benefits */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#666666] mb-3">
              Included with STARSKY Premium
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                {
                  icon: Users,
                  title: "Full PhD scholar directory",
                  desc: "Unlock all verified PhD scholars beyond the first 5 preview profiles.",
                },
                {
                  icon: Search,
                  title: "Advanced researcher discovery",
                  desc: "Filter and discover researchers across every university, lab, and domain.",
                },
                {
                  icon: MessageSquare,
                  title: "Direct scholar contact",
                  desc: "Send direct academic inquiries and mentorship messages to PhD scholars.",
                },
                {
                  icon: Sparkles,
                  title: "Expanded research networking opportunities",
                  desc: "Connect directly with mentors for thesis guidance and co-authored papers.",
                },
              ].map((benefit) => (
                <div
                  key={benefit.title}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB]"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
                    <benefit.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#202124]">
                      {benefit.title}
                    </p>
                    <p className="text-xs text-[#666666] mt-0.5 leading-relaxed">
                      {benefit.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {feedback && (
            <div
              className={`p-4 rounded-xl border text-sm flex items-start gap-3 ${
                feedback.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">
                  {feedback.type === "success"
                    ? "Subscription Request Recorded"
                    : "Unable to Process Request"}
                </p>
                <p className="text-xs mt-0.5 leading-relaxed">{feedback.text}</p>
              </div>
            </div>
          )}

          {activeSub ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Your STARSKY Premium Membership is Active ({activeSub.plan_name})
              </div>
              <p className="text-xs text-emerald-700 mt-1">
                Valid until{" "}
                {new Date(activeSub.expiry_date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                . You have full access to the PhD scholar directory and direct scholar messaging.
              </p>
            </div>
          ) : (
            <>
              {/* Plan Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#666666]">
                    Choose a Membership Plan
                  </p>
                  <span className="text-xs text-[#666666]">
                    Student-friendly academic pricing
                  </span>
                </div>

                {loading ? (
                  <div className="grid sm:grid-cols-3 gap-3">
                    {[1, 2, 3].map((n) => (
                      <div
                        key={n}
                        className="h-32 rounded-xl bg-gray-100 animate-pulse"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-3 gap-3">
                    {plans.map((plan) => {
                      const isSelected = selectedPlanId === plan.id;
                      const isPopular =
                        plan.is_popular || plan.billing_cycle === "quarterly";
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={`text-left p-4 rounded-xl border transition-all relative flex flex-col justify-between ${
                            isSelected
                              ? "border-[#2563EB] bg-[#EFF6FF]/70 ring-2 ring-[#2563EB]/20"
                              : "border-[#E5E7EB] bg-white hover:border-gray-300"
                          }`}
                        >
                          {isPopular && (
                            <span className="inline-block self-start px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#2563EB] text-white mb-2">
                              Recommended
                            </span>
                          )}
                          <div>
                            <p className="text-sm font-bold text-[#202124]">
                              {plan.name}
                            </p>
                            <p className="text-2xl font-extrabold text-[#202124] mt-1">
                              ₹{plan.price.toLocaleString("en-IN")}
                              <span className="text-xs font-normal text-[#666666]">
                                {" "}
                                / {plan.duration_days} days
                              </span>
                            </p>
                          </div>
                          <p className="text-[11px] text-[#666666] mt-2">
                            {plan.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {pendingSub && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-semibold">
                      Pending Activation Request: {pendingSub.plan_name} (ID:{" "}
                      {pendingSub.id})
                    </p>
                    <p className="text-amber-800 mt-0.5">
                      Your request is awaiting payment gateway verification or
                      administrator approval in the Admin Panel.
                    </p>
                  </div>
                </div>
              )}

              {/* Payment Gateway / Admin Activation Notice */}
              <div className="p-3.5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] text-xs text-[#666666] space-y-2">
                <p className="font-semibold text-[#202124] flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#2563EB]" />
                  Transparent Activation Process
                </p>
                <p className="leading-relaxed">
                  Submitting an upgrade request registers your selected plan for{" "}
                  <strong>
                    payment gateway checkout or administrator verification
                  </strong>
                  . Your account is upgraded immediately once payment confirmation
                  or admin approval is completed.
                </p>
                {session?.user.role === "student" && (
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional note for admin (e.g., university scholarship code or academic department)"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E7EB] text-xs text-[#202124] focus:outline-none focus:border-[#2563EB]"
                  />
                )}
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-[#E5E7EB] text-sm font-medium text-[#666666] hover:text-[#202124] hover:bg-[#F7F8FA] transition-colors"
            >
              Maybe Later
            </button>

            {!session ? (
              <Link
                href="/login?redirect=/explore"
                className="px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold transition-colors inline-flex items-center gap-2 shadow-xs"
              >
                <Crown className="w-4 h-4" />
                Sign In to Upgrade to Premium
              </Link>
            ) : session.user.role === "student" && !activeSub ? (
              <button
                type="button"
                disabled={submitting}
                onClick={handleRequestUpgrade}
                className="px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold transition-colors inline-flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                <Crown className="w-4 h-4" />
                {submitting
                  ? "Submitting Request..."
                  : pendingSub
                  ? "Update Premium Request"
                  : "Upgrade to Premium"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
