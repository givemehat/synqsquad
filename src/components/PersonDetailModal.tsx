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
  Smartphone,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { useAuth } from "@/context/AuthContext";
import { ConnectOptionsModal } from "@/components/ConnectOptionsModal";

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
  const [successData, setSuccessData] = useState<{
    gmailUrl: string;
    mailtoUrl: string;
    remainingToday: number;
    recipientEmail: string;
    subject: string;
    body: string;
  } | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
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

      const subject = `[RIVQ] Teaming up: Collaboration Outreach from ${user?.name || "a fellow hacker"}`;
      const body = `Hi ${profile.displayName},\n\nI discovered your profile on RIVQ (${profile.headline}).\n\n${trimmed}\n\nLooking forward to collaborating on Gmail!\n\nBest,\n${user?.name || "A fellow teammate"}\n${user?.email}`;
      const safeSubject = encodeURIComponent(subject.slice(0, 150));
      const safeBody = encodeURIComponent(body.slice(0, 2000));
      const mailtoUrl = `mailto:${profile.email}?subject=${safeSubject}&body=${safeBody}`;

      setSuccessData({
        gmailUrl: data.gmailUrl,
        mailtoUrl,
        remainingToday: data.remainingToday,
        recipientEmail: profile.email,
        subject,
        body,
      });
      setShowConnectModal(true);

      // Attempt to open in a new tab if supported
      try {
        if (data.gmailUrl) {
          window.open(data.gmailUrl, "_blank", "noopener,noreferrer");
        }
      } catch {
        // Fallback handled smoothly by connect modal
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Outreach failed";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyEmail = () => {
    if (!profile) return;
    navigator.clipboard.writeText(profile.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyAll = () => {
    if (!successData) return;
    const formatted = `To: ${successData.recipientEmail}\nSubject: ${successData.subject}\n\n${successData.body}`;
    navigator.clipboard.writeText(formatted);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
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

            {/* Gmail Reveal / Blurred display */}
            <div className="mt-2.5">
              {user ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs font-mono text-[var(--text-secondary)]">
                  <Mail className="w-3.5 h-3.5 text-blue-500" />
                  <span>{profile.email}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal()}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/25 transition-all text-xs cursor-pointer group/reveal"
                  title="Sign in with Google to reveal Gmail ID"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-500" />
                  <span className="font-mono text-[11px] text-[var(--text-tertiary)] filter blur-[4px] select-none">
                    contact@gmail.com
                  </span>
                  <span className="text-[10px] font-semibold text-blue-500 group-hover/reveal:underline">
                    Sign in to reveal Gmail
                  </span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2.5">
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
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-left space-y-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-[var(--text-primary)]">
                    Collaboration Outreach Created!
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Outreach quota remaining today:{" "}
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {successData.remainingToday}/10
                    </span>
                  </p>
                </div>
              </div>

              {/* Verified Contact Box */}
              <div className="p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Verified Contact</span>
                  </div>
                  <p className="font-mono text-xs font-semibold truncate text-[var(--text-primary)] select-all mt-0.5">
                    {successData.recipientEmail}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="px-2.5 py-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-canvas)] text-xs font-medium transition-colors shrink-0"
                >
                  {copiedEmail ? (
                    <span className="text-emerald-500 flex items-center gap-1">
                      <Check size={12} /> Copied
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Copy size={12} /> Copy Email
                    </span>
                  )}
                </button>
              </div>

              {/* Multi-Tiered Action Buttons */}
              <div className="space-y-2 pt-1">
                {/* 1. Primary Action: Open in Gmail */}
                <a
                  href={successData.gmailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Mail size={14} />
                    <span>Open in Gmail (Web)</span>
                  </span>
                  <ExternalLink size={14} className="opacity-80" />
                </a>

                {/* 2. Native Mailto Action */}
                <a
                  href={successData.mailtoUrl}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium text-xs transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Smartphone size={14} className="text-[var(--text-secondary)]" />
                    <span>Open in Default Mail App</span>
                  </span>
                  <ArrowRight size={14} className="text-[var(--text-tertiary)]" />
                </a>

                {/* 3. One-Tap Clipboard: Copy Email & Template Message */}
                <button
                  type="button"
                  onClick={handleCopyAll}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium text-xs transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {copiedAll ? (
                      <Check size={14} className="text-emerald-500" />
                    ) : (
                      <Copy size={14} className="text-[var(--text-secondary)]" />
                    )}
                    <span>Copy Email & Template Message</span>
                  </span>
                  <span className="text-[11px] text-[var(--accent-primary)] font-semibold">
                    {copiedAll ? "Copied!" : "Copy"}
                  </span>
                </button>
              </div>

              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-tertiary)]">Want separate dialog?</span>
                <button
                  type="button"
                  onClick={() => setShowConnectModal(true)}
                  className="text-[var(--accent-primary)] hover:underline font-medium"
                >
                  Open options modal
                </button>
              </div>
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

      {successData && (
        <ConnectOptionsModal
          isOpen={showConnectModal}
          onClose={() => setShowConnectModal(false)}
          recipientName={profile.displayName}
          recipientEmail={successData.recipientEmail}
          subject={successData.subject}
          body={successData.body}
          remainingToday={successData.remainingToday}
          title={`Connect with ${profile.displayName}`}
        />
      )}
    </div>
  );
}
