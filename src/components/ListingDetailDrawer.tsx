"use client";

import React, { useState } from "react";
import { Listing } from "@/types";
import { useAuth } from "@/context/AuthContext";
import {
  X,
  Mail,
  Users,
  ShieldCheck,
  Check,
  Copy,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";

interface ListingDetailDrawerProps {
  listing: Listing | null;
  onClose: () => void;
}

export function ListingDetailDrawer({ listing, onClose }: ListingDetailDrawerProps) {
  const { user, openAuthModal, addContactedId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [unmaskedEmail, setUnmaskedEmail] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [mailtoUrl, setMailtoUrl] = useState<string | null>(null);

  if (!listing) return null;

  const isFilled = listing.status === "filled";

  const handleConnectOnGmail = async () => {
    setErrorNotice(null);
    setSuccessNotice(null);

    // If logged out, prompt Google login and resume this action automatically
    if (!user) {
      openAuthModal(() => handleConnectOnGmail());
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromUserEmail: user.email,
          listingId: listing.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to process connect");
      }

      const recipientEmail: string = data.data.recipientEmail;
      setUnmaskedEmail(recipientEmail);
      addContactedId(listing.id);

      // Construct prefilled message
      const subject = `SynqSquad: Teammate inquiry for ${listing.event} — ${listing.title}`;
      const body = `Hi ${listing.ownerName},\n\nI saw your requirement on SynqSquad for "${listing.title}" (${listing.event}).\n\nI would like to collaborate on this. Here is a brief summary of my background:\n- Role: ${user.role}\n- College / Affiliation: ${user.college}\n- Core Skills: ${user.skills.join(", ")}\n\n${user.bio ? `About my work: ${user.bio}\n\n` : ""}Would you be open to a quick chat to discuss the open slots?\n\nBest regards,\n${user.name}\n${user.email}`;

      const encodedSubject = encodeURIComponent(subject);
      const encodedBody = encodeURIComponent(body);

      // Primary Action: Google Mail Compose Tab
      const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(
        recipientEmail
      )}&su=${encodedSubject}&body=${encodedBody}`;

      // Fallback: mailto link
      const fallbackMailto = `mailto:${recipientEmail}?subject=${encodedSubject}&body=${encodedBody}`;
      setMailtoUrl(fallbackMailto);

      // Open Gmail in a new tab
      const win = window.open(gmailComposeUrl, "_blank");

      if (!win || win.closed || typeof win.closed === "undefined") {
        setSuccessNotice(
          "Gmail popup was blocked by your browser. Use the copy button or mailto fallback below."
        );
      } else {
        setSuccessNotice(
          `Gmail opened in a new tab. Verified contact revealed. Saved to your Contacted list.`
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not connect to Gmail";
      setErrorNotice(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyEmail = () => {
    if (!unmaskedEmail) return;
    navigator.clipboard.writeText(unmaskedEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[var(--bg-surface)] border-l border-[var(--border-default)] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-elevated)]">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isFilled ? "bg-rose-500" : "bg-emerald-500"
              }`}
            />
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              {listing.type === "hackathon"
                ? "Hackathon Team"
                : listing.type === "research"
                ? "Research Collaboration"
                : "Solo Developer"}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title & Event */}
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--accent-primary)] mb-1.5">
              <span>{listing.event}</span>
              {listing.deadline && (
                <>
                  <span className="text-[var(--text-tertiary)]">•</span>
                  <span className="text-[var(--text-secondary)] font-sans">
                    Deadline: {listing.deadline}
                  </span>
                </>
              )}
            </div>
            <h2
              id="drawer-title"
              className="text-lg sm:text-xl font-bold text-[var(--text-primary)] tracking-tight leading-snug"
            >
              {listing.title}
            </h2>
          </div>

          {/* Slots & Status Notice */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--accent-primary)]" />
              <span className="text-[var(--text-secondary)] font-medium">Open Collaborator Slots</span>
            </div>
            <span
              className={`font-mono font-semibold px-2 py-0.5 rounded text-xs ${
                isFilled
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              }`}
            >
              {isFilled ? "Team Full" : `${listing.slots} of ${listing.totalSlots} slots vacant`}
            </span>
          </div>

          {/* Lead Information */}
          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-2">
            <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider block">
              Lead / Creator
            </span>
            <div className="flex items-center gap-3">
              <Avatar src={listing.ownerPhoto} name={listing.ownerName} size={40} />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">
                    {listing.ownerName}
                  </span>
                  <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  {listing.ownerRole} • {listing.ownerCollege}
                </p>
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div>
            <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
              Project Description & Requirements
            </h4>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line font-normal">
              {listing.description}
            </p>
          </div>

          {/* Required Skills */}
          <div>
            <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
              Skills Wanted
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {listing.skillsNeeded.map((skill, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-md text-xs font-mono bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-default)]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Feedback & Error alerts */}
          {errorNotice && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorNotice}</span>
            </div>
          )}

          {successNotice && (
            <div
              role="status"
              className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2"
            >
              <Check className="w-4 h-4 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Unmasked Email Fallbacks (Copy Email & Mailto) */}
          {unmaskedEmail && (
            <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-3">
                <div className="truncate">
                  <span className="text-[10px] text-[var(--text-tertiary)] block uppercase tracking-wider">
                    Verified Gmail Address
                  </span>
                  <span className="text-[var(--text-primary)] font-mono">{unmaskedEmail}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-overlay)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs font-mono flex items-center gap-1.5 transition-colors min-h-[36px]"
                >
                  {copiedEmail ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Email</span>
                    </>
                  )}
                </button>
              </div>

              {mailtoUrl && (
                <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px]">
                  <span className="text-[var(--text-tertiary)]">Prefer default email client?</span>
                  <a
                    href={mailtoUrl}
                    className="inline-flex items-center gap-1 text-[var(--accent-primary)] hover:underline font-medium"
                  >
                    <span>Open in Local Mail</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Primary Action Button (44px+ touch target) */}
        <div className="p-4 border-t border-[var(--border-default)] bg-[var(--bg-elevated)] sticky bottom-0">
          <button
            type="button"
            onClick={handleConnectOnGmail}
            disabled={loading || isFilled}
            className={`w-full h-12 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
              isFilled
                ? "bg-[var(--bg-surface)] text-[var(--text-tertiary)] cursor-not-allowed border border-[var(--border-default)]"
                : "bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] active:opacity-90 text-white"
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>
              {isFilled
                ? "Team Already Filled"
                : loading
                ? "Opening Gmail..."
                : "Connect on Gmail"}
            </span>
          </button>
          <span className="text-[11px] text-[var(--text-tertiary)] block text-center mt-2">
            Opens prefilled message directly in your verified Gmail
          </span>
        </div>
      </div>
    </div>
  );
}
