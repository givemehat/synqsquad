"use client";

import React, { useState } from "react";
import { TalentProfile } from "@/types";
import {
  X,
  Send,
  Code2,
  Globe,
  ShieldAlert,
  UserX,
  Mail,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { useAuth } from "@/context/AuthContext";

interface PersonDetailModalProps {
  profile: TalentProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onBlock?: (email: string) => void;
  onReport?: (profileId: string) => void;
}

export function PersonDetailModal({
  profile,
  isOpen,
  onClose,
  onBlock,
  onReport,
}: PersonDetailModalProps) {
  const { user, openAuthModal, blockUser } = useAuth();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ gmailUrl: string; remainingToday: number } | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);

  if (!isOpen || !profile) return null;

  const handleSendOutreach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal();
      return;
    }

    const trimmed = message.trim();
    if (trimmed.length < 10) {
      setErrorMsg("Please write at least 10 characters introducing yourself and your project.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/people/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: profile.userId,
          profileId: profile.id,
          message: trimmed,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to send collaboration outreach.");
      }

      setSuccessData({
        gmailUrl: data.gmailUrl,
        remainingToday: data.remainingToday,
      });

      // Automatically trigger Gmail compose in a new tab
      if (data.gmailUrl) {
        window.open(data.gmailUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Outreach failed";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlock = async () => {
    if (!confirm(`Are you sure you want to block ${profile.displayName}? You will no longer see their profile or receive outreach from them.`)) {
      return;
    }
    try {
      await blockUser(profile.email);
      setIsBlocked(true);
      if (onBlock) onBlock(profile.email);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch {
      setErrorMsg("Failed to block member.");
    }
  };

  const handleReport = async () => {
    const reason = prompt("Enter the reason for reporting this profile (spam, abuse, external payment link):");
    if (!reason || reason.trim().length < 3) return;

    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporterEmail: user?.email || "reporter@gmail.com",
          targetType: "profile",
          targetId: profile.id,
          reason: reason.trim(),
          details: `Reported talent profile: ${profile.displayName}`,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit report");
      alert("Report submitted to moderators. Thank you for keeping our community safe.");
      if (onReport) onReport(profile.id);
    } catch {
      alert("Failed to submit report. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[var(--bg-canvas)] border border-[var(--border-default)] rounded-2xl shadow-2xl p-6 sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Member Header */}
        <div className="flex items-start gap-4 mb-6">
          <Avatar name={profile.displayName} size={56} />
          <div className="flex-1 pr-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)] leading-snug">
              {profile.displayName}
            </h2>
            <p className="text-sm text-[var(--accent-primary)] font-medium mt-0.5">
              {profile.headline}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                {profile.experienceLevel}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-mono ${
                  profile.availability === "open"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                }`}
              >
                {profile.availability === "open" ? "Open to Squads" : "Currently Busy"}
              </span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mb-6">
            <h4 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
              About & Experience
            </h4>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Looking For */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
            Looking For
          </h4>
          <div className="flex flex-wrap gap-2">
            {profile.lookingFor.map((item) => (
              <span
                key={item}
                className="px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/20"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
            Verified Skills
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className="px-2.5 py-1 rounded-md text-xs bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-default)]"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* External Links */}
        {(profile.github || profile.linkedin || profile.portfolio) && (
          <div className="mb-6">
            <h4 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
              Public Portfolios & Links
            </h4>
            <div className="flex flex-wrap gap-3">
              {profile.github && (
                <a
                  href={
                    profile.github.startsWith("http")
                      ? profile.github
                      : `https://github.com/${profile.github}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-[var(--accent-primary)] hover:underline"
                >
                  <Code2 size={14} />
                  GitHub Profile
                  <ExternalLink size={11} />
                </a>
              )}
              {profile.linkedin && (
                <a
                  href={profile.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-[var(--accent-primary)] hover:underline"
                >
                  <Globe size={14} />
                  LinkedIn Profile
                  <ExternalLink size={11} />
                </a>
              )}
              {profile.portfolio && (
                <a
                  href={profile.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-[var(--accent-primary)] hover:underline"
                >
                  <Globe size={14} />
                  Portfolio Website
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Two-Way Outreach Form */}
        <div className="mt-6 pt-6 border-t border-[var(--border-default)]">
          {successData ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
              <h4 className="font-bold text-sm text-[var(--text-primary)] mb-1">
                Gmail Compose Window Opened!
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mb-3">
                Your prefilled collaboration inquiry has been opened on verified Gmail. Outreach quota remaining today:{" "}
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {successData.remainingToday}/10
                </span>
                .
              </p>
              <a
                href={successData.gmailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-4 rounded-lg"
              >
                <Mail size={14} />
                Re-open in Gmail
              </a>
            </div>
          ) : isBlocked ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center text-xs text-rose-600 dark:text-rose-400">
              Member blocked. You will no longer interact with this profile.
            </div>
          ) : (
            <form onSubmit={handleSendOutreach}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Mail size={14} className="text-[var(--accent-primary)]" />
                  Connect on Verified Gmail
                </label>
                <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
                  10 connects/day limit
                </span>
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Hi ${profile.displayName}, I'd love to invite you to team up for our upcoming hackathon/research project...`}
                rows={3}
                className="w-full p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors mb-2 resize-none"
              />

              {errorMsg && (
                <p className="text-xs text-rose-500 mb-3 font-medium">{errorMsg}</p>
              )}

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReport}
                    className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-amber-500 hover:bg-[var(--bg-elevated)] transition-colors text-xs flex items-center gap-1"
                    title="Report profile"
                  >
                    <ShieldAlert size={14} />
                    Report
                  </button>
                  <button
                    type="button"
                    onClick={handleBlock}
                    className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-rose-500 hover:bg-[var(--bg-elevated)] transition-colors text-xs flex items-center gap-1"
                    title="Block member"
                  >
                    <UserX size={14} />
                    Block
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex items-center gap-2 text-xs py-2.5 px-5 rounded-lg disabled:opacity-50"
                >
                  <Send size={14} />
                  {isSubmitting ? "Opening..." : "Send & Open Gmail"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
