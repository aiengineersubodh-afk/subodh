"use client";

import React, { useState } from "react";
import { CheckCircle2, Loader2, Mail, MapPin, Phone, Send } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function ContactPage() {
  const { settings } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submittedMsg, setSubmittedMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmittedMsg("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send message.");
      } else {
        setSubmittedMsg(data.message);
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
      }
    } catch {
      setError("Network error while submitting contact message.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="bg-[#F7F8FA] border-b border-[#E5E7EB] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
              Contact Us
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#202124]">
              Get in Touch with STARSKY
            </h1>
            <p className="text-base text-[#666666] leading-relaxed">
              Have questions about PhD scholar verification, university partnerships, or research
              internships? Send us a message and our academic relations team will respond.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Contact Information Cards */}
            <div className="lg:col-span-5 space-y-6">
              <div className="card-corporate p-6 space-y-4">
                <h2 className="text-lg font-bold text-[#202124]">
                  Academic Relations & Support Office
                </h2>
                <p className="text-xs text-[#666666] leading-relaxed">
                  Our support desk assists students, doctoral scholars, and university research
                  deans Monday through Saturday, 9:00 AM to 6:00 PM IST.
                </p>

                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] border border-[#2563EB]/30 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-[#2563EB]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#202124]">Office Address</p>
                      <p className="text-xs text-[#666666] mt-0.5">
                        {settings?.contact_address ||
                          "STARSKY Academic Innovation Hub, Research Park, Bengaluru 560012, India"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] border border-[#2563EB]/30 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-[#2563EB]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#202124]">Email</p>
                      <p className="text-xs text-[#666666] mt-0.5">
                        {settings?.contact_email || "contact@starsky.edu"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] border border-[#2563EB]/30 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4 text-[#2563EB]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#202124]">Telephone</p>
                      <p className="text-xs text-[#666666] mt-0.5">
                        {settings?.contact_phone || "+91 (800) 555-0199"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-7">
              <div className="card-corporate p-8">
                <h2 className="text-xl font-bold text-[#202124]">Send Us a Message</h2>
                <p className="text-xs text-[#666666] mt-1">
                  All submissions are stored directly in our database and reviewed by STARSKY
                  administrators.
                </p>

                {submittedMsg && (
                  <div className="mt-5 p-4 rounded-lg bg-green-50 border border-green-200 flex items-start gap-3 text-green-800 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Message Sent Successfully</p>
                      <p className="mt-0.5">{submittedMsg}</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mt-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                        Your Full Name <span className="text-[#2563EB]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Dr. / Prof. / Student Name"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#202124] focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                        Email Address <span className="text-[#2563EB]">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@university.edu"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#202124] focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                      Subject <span className="text-[#2563EB]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g., Scholar Verification / Institutional Partnership / Internship Query"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#202124] focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#202124] mb-1.5">
                      Message <span className="text-[#2563EB]">*</span>
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write your detailed inquiry..."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#202124] focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] transition-colors disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Message</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

