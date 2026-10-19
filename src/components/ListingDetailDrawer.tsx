"use client";

import React, { useState } from "react";
import { Listing } from "@/types";
import { useAuth } from "@/context/AuthContext";
import {
  X,
  Mail,
  Calendar,
  Users,
  ShieldCheck,
  Check,
  Copy,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

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

  if (!listing) return null;

  const isFilled = listing.status === "filled";

  const handleConnectOnGmail = async () => {
    setErrorNotice(null);
    setSuccessNotice(null);

    // If logged out, prompt Google login and resume this action
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

      const recipientEmail = data.data.recipientEmail;
      setUnmaskedEmail(recipientEmail);
      addContactedId(listing.id);

      // Construct prefilled Gmail Compose URL
      const subject = encodeURIComponent(
        `SynqSquad: Teammate inquiry for ${listing.event} — ${listing.title}`
      );
      const body = encodeURIComponent(
        `Hi ${listing.ownerName},\n\nI saw your listing on SynqSquad for "${listing.title}" (${listing.event}).\n\nI would like to collaborate on this. Here is a brief summary of my background:\n- Role: ${user.role}\n- College / Affiliation: ${user.college}\n- Core Skills: ${user.skills.join(", ")}\n\n${user.bio ? `A bit about my work: ${user.bio}\n\n` : ""}Would you be open to a quick chat to discuss the open slots?\n\nBest regards,\n${user.name}\n${user.email}`
      );

      const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
        recipientEmail
      )}&su=${subject}&body=${body}`;

      // Open Gmail in a new tab
      const win = window.open(gmailComposeUrl, "_blank");

      if (!win || win.closed || typeof win.closed === "undefined") {
        setSuccessNotice("Gmail popup blocked. You can copy the verified email address below.");
      } else {
        setSuccessNotice("Gmail opened in a new tab. Saved to your Contacted list.");
      }
    } catch (err: any) {
      setErrorNotice(err.message || "Could not connect to Gmail");
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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-[#0e1117] border-l border-white/10 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#12161f]">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isFilled ? "bg-rose-500" : "bg-emerald-400"
              }`}
            />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {listing.type === "hackathon"
                ? "Hackathon Team"
                : listing.type === "research"
                ? "Research Collaboration"
                : "Solo Developer"}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title & Event */}
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-blue-400 mb-1.5">
              <span>{listing.event}</span>
              {listing.deadline && (
                <>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400 font-sans">
                    Deadline: {listing.deadline}
                  </span>
                </>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">
              {listing.title}
            </h2>
          </div>

          {/* Slots & Status Notice */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-slate-300 font-medium">Open Collaborator Slots</span>
            </div>
            <span
              className={`font-mono font-semibold px-2 py-0.5 rounded text-xs ${
                isFilled
                  ? "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                  : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
              }`}
            >
              {isFilled ? "Team Full" : `${listing.slots} of ${listing.totalSlots} slots vacant`}
            </span>
          </div>

          {/* Lead Information */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Lead / Creator
            </span>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-sm text-white overflow-hidden flex-shrink-0">
                {listing.ownerPhoto ? (
                  <img
                    src={listing.ownerPhoto}
                    alt={listing.ownerName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  listing.ownerName.charAt(0)
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-white">
                    {listing.ownerName}
                  </span>
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <p className="text-xs text-slate-400">
                  {listing.ownerRole} • {listing.ownerCollege}
                </p>
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Project Description & Requirements
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line font-normal">
              {listing.description}
            </p>
          </div>

          {/* Required Skills */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Skills Wanted
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {listing.skillsNeeded.map((skill, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-md text-xs font-mono bg-white/[0.04] text-slate-200 border border-white/10"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Feedback & Error alerts */}
          {errorNotice && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorNotice}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Unmasked Email Fallback (Popup blocker friendly) */}
          {unmaskedEmail && (
            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3 text-xs">
              <div className="truncate">
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider">
                  Verified Contact
                </span>
                <span className="text-white font-mono">{unmaskedEmail}</span>
              </div>
              <button
                onClick={handleCopyEmail}
                className="px-2.5 py-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono flex items-center gap-1 transition-colors"
              >
                {copiedEmail ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Fitts's Law: Large 44px+ Primary Action Button */}
        <div className="p-4 border-t border-white/10 bg-[#12161f] sticky bottom-0">
          <button
            onClick={handleConnectOnGmail}
            disabled={loading || isFilled}
            className={`w-full h-12 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
              isFilled
                ? "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5"
                : "bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white"
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
          <span className="text-[11px] text-slate-500 block text-center mt-2">
            Opens pre-filled message directly in your Gmail
          </span>
        </div>
      </div>
    </div>
  );
}
