"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, CheckCircle2, AlertCircle, ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { authFetch } from "@/lib/api-client";

export default function AccountDeletionPage() {
  const { user, openAuthModal, signOut } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [confirmText, setConfirmText] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (confirmText.trim().toUpperCase() !== "DELETE") {
      setErrorMsg("Please type 'DELETE' to confirm permanent removal.");
      return;
    }

    if (!user) {
      openAuthModal(() => {
        // user verified
      });
      setErrorMsg("Please sign in with Google to confirm you own this account before permanent deletion.");
      return;
    }

    setLoading(true);
    try {
      const res = await authFetch("/api/user", {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to process account deletion.");
      }

      await signOut();
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred while deleting account.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] px-4 py-12 transition-colors">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors min-h-[36px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to RIVQ</span>
        </Link>

        {/* Card Header */}
        <div className="surface-card rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-[var(--border-default)]">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                Account &amp; Data Deletion Request
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                Google Play Policy, DPDP Act 2023 &amp; GDPR Compliance
              </p>
            </div>
          </div>

          {/* Policy Information */}
          <div className="space-y-3 text-xs text-[var(--text-secondary)] leading-relaxed">
            <p>
              In compliance with Google Play User Data policies, India&apos;s DPDP Act 2023, and GDPR,
              RIVQ provides this public web portal so users can request the complete and permanent
              deletion of their account and associated data without needing to install or sign into the app.
            </p>
            <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1.5">
              <span className="font-semibold text-[var(--text-primary)] block text-xs">
                What data will be permanently deleted:
              </span>
              <ul className="list-disc pl-5 space-y-1 text-[11px]">
                <li>Your Google-verified user profile (Name, Email, Profile Photo URL, College, Bio).</li>
                <li>Your Talent Directory availability profile, headline, skills, and portfolio links.</li>
                <li>All hackathon and research paper requisitions created by your account.</li>
                <li>All collaboration outreach records you have sent or received.</li>
                <li>Your 30-day contact audit history and 10/day rate limit counters.</li>
                <li>Any moderation or triage reports associated with your profile.</li>
              </ul>
            </div>
            <p className="text-[11px] text-[var(--text-tertiary)]">
              Deletion is immediate and irreversible. Once processed, your previous listings will disappear
              from the active feed.
            </p>
          </div>

          {success ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span className="text-xs font-semibold">Account and Data Successfully Erased</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                All records associated with <strong>{email}</strong> have been permanently purged from our
                database in accordance with our data retention policy.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Verified Google Account Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none min-h-[44px]"
                />
              </div>

              {/* Reason (Optional) */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Reason for Leaving (Optional)
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none min-h-[44px]"
                >
                  <option value="">Select a reason...</option>
                  <option value="found_teammate">Found a teammate / Completed project</option>
                  <option value="privacy_concerns">Privacy preferences</option>
                  <option value="not_using">No longer participating in hackathons</option>
                  <option value="other">Other reason</option>
                </select>
              </div>

              {/* Confirmation Input */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-rose-500 uppercase tracking-wider">
                  Type &quot;DELETE&quot; to Confirm
                </label>
                <input
                  type="text"
                  required
                  placeholder="DELETE"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-rose-500/40 text-xs text-[var(--text-primary)] focus:outline-none min-h-[44px]"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || confirmText.trim().toUpperCase() !== "DELETE"}
                className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors min-h-[44px]"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>{loading ? "Purging Records..." : "Permanently Delete My Account & Data"}</span>
              </button>
            </form>
          )}

          {/* Grievance Officer Contact */}
          <div className="pt-4 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-tertiary)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>Need manual verification? Contact:</span>
            <a
              href="mailto:rajnishsingh.work@gmail.com"
              className="text-[var(--accent-primary)] hover:underline font-mono"
            >
              rajnishsingh.work@gmail.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
