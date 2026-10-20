"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Flag, Check, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { authFetch } from "@/lib/api-client";

export default function ReportPage() {
  const { user, openAuthModal } = useAuth();
  const [targetType, setTargetType] = useState<"listing" | "user">("listing");
  const [targetId, setTargetId] = useState("");
  const [reason, setReason] = useState("Spam / Unsolicited Promotion");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal(() => {
        // user prompted
      });
      return;
    }

    if (!targetId.trim()) {
      setErrorMsg("Please specify the Listing ID or Creator Name/Email");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await authFetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId: targetId.trim(),
          reason,
          details,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit report");
      }

      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] px-4 py-12 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-xl mx-auto space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors min-h-[36px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Feed</span>
        </Link>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Flag className="w-5 h-5 text-rose-500" />
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Report a Listing or User
            </h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Our moderation team reviews every report against our Community Guidelines within 24 hours.
          </p>
        </div>

        {success ? (
          <div className="p-6 rounded-2xl surface-card text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
              <Check className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Report Received</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Thank you for keeping RIVQ safe. We have logged this report for immediate administrative review.
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-semibold text-xs inline-block transition-colors min-h-[36px]"
              >
                Return to Feed
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="p-6 rounded-2xl surface-card space-y-4 text-xs"
          >
            {errorMsg && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                What are you reporting?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetType("listing")}
                  className={`py-2 px-3 rounded-lg font-medium border text-center transition-colors min-h-[40px] ${
                    targetType === "listing"
                      ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] font-semibold"
                      : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-default)]"
                  }`}
                >
                  A Listing / Requisition
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType("user")}
                  className={`py-2 px-3 rounded-lg font-medium border text-center transition-colors min-h-[40px] ${
                    targetType === "user"
                      ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] font-semibold"
                      : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-default)]"
                  }`}
                >
                  A User / Creator
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Target Identifier (Listing ID, Title, or Creator Name)
              </label>
              <input
                type="text"
                required
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder="e.g. lst-sih-railway-01 or creator name"
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none min-h-[40px]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Reason for Report
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none min-h-[40px]"
              >
                <option value="Spam / Unsolicited Promotion">Spam / Unsolicited Promotion</option>
                <option value="Fake Listing / Impersonation">Fake Listing / Impersonation</option>
                <option value="Harassment or Inappropriate Conduct">Harassment or Inappropriate Conduct</option>
                <option value="Off-Platform Coercion (Unapproved Channels)">Off-Platform Coercion (Unapproved Channels)</option>
                <option value="Fee Solicitation / Advance Money Scam">Fee Solicitation / Advance Money Scam</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Please describe what occurred..."
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none resize-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors disabled:opacity-50 min-h-[44px]"
              >
                {submitting ? "Submitting Report..." : "Submit Report to Moderation"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
