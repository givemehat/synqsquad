"use client";

import React, { useState } from "react";
import { Listing } from "@/types";
import {
  X,
  Flame,
  Trophy,
  Users,
  MapPin,
  ExternalLink,
  MessageSquare,
  Send,
  Mail,
  Share2,
  Settings,
  Sparkles,
  Check,
  Calendar,
  Layers,
  ArrowUpRight,
} from "lucide-react";

interface ListingDetailDrawerProps {
  listing: Listing | null;
  onClose: () => void;
  onOpenBoost: (listing: Listing) => void;
  onOpenManage: (listing: Listing) => void;
}

export function ListingDetailDrawer({
  listing,
  onClose,
  onOpenBoost,
  onOpenManage,
}: ListingDetailDrawerProps) {
  const [copiedContact, setCopiedContact] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  if (!listing) return null;

  const handleCopyDiscord = (discordTag: string) => {
    navigator.clipboard.writeText(discordTag);
    setCopiedContact("discord");
    setTimeout(() => setCopiedContact(null), 2500);
  };

  const handleShare = () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/#${listing.id}` : "";
    navigator.clipboard.writeText(url);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const isFull = listing.currentMembersCount >= listing.maxMembersCount;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-[#0e1117] border-l border-white/10 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#12161f]">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isFull ? "bg-rose-400" : "bg-emerald-400"
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

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Copy link"
            >
              {copiedShare ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => onOpenManage(listing)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Manage with 6-digit PIN"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Target Event / Journal */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/20">
                {listing.targetName}
              </span>
              <span className="text-xs font-medium text-slate-400">
                • {listing.domain}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight leading-snug">
              {listing.title}
            </h2>
          </div>

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
            <div>
              <span className="text-[10px] text-slate-500 font-medium block uppercase tracking-wider">
                Capacity
              </span>
              <span className="text-sm font-semibold font-mono text-slate-200">
                {listing.currentMembersCount} / {listing.maxMembersCount} joined
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-medium block uppercase tracking-wider">
                Mode
              </span>
              <span className="text-sm font-semibold text-slate-200 truncate block">
                {listing.location}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-medium block uppercase tracking-wider">
                Prize / Grant
              </span>
              <span className="text-sm font-semibold text-emerald-400 truncate block font-mono">
                {listing.prizeOrGrantPool || "Recognized"}
              </span>
            </div>
          </div>

          {/* Project Abstract */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Project Abstract & Scope
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed font-normal whitespace-pre-line">
              {listing.description}
            </p>
          </div>

          {/* Roles Needed */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Roles Being Recruited
            </h4>
            <div className="space-y-1.5">
              {listing.rolesNeeded.map((role, idx) => (
                <div
                  key={idx}
                  className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 text-slate-200">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-medium">{role}</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-mono">Open</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tech Stack Matrix */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Required Skills & Technologies
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {listing.skills.map((skill, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-md text-xs font-mono bg-white/[0.04] text-slate-300 border border-white/10"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Lead Profile */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Project Lead
            </h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-sm text-white flex-shrink-0">
                {listing.creatorAvatar ? (
                  <img
                    src={listing.creatorAvatar}
                    alt={listing.creatorName}
                    className="w-full h-full rounded-lg object-cover"
                  />
                ) : (
                  listing.creatorName.charAt(0)
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-white">
                    {listing.creatorName}
                  </span>
                  {listing.isVerifiedWinner && (
                    <Trophy className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  )}
                </div>
                <p className="text-xs text-slate-400">{listing.creatorRole}</p>
              </div>
            </div>
          </div>

          {/* Direct Contact Channels */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Direct Contact (Zero Waitlist)
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {listing.contact.telegram && (
                <a
                  href={`https://t.me/${listing.contact.telegram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/20 text-xs font-semibold transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Telegram</span>
                  <ArrowUpRight className="w-3 h-3 ml-auto opacity-60" />
                </a>
              )}

              {listing.contact.discord && (
                <button
                  onClick={() => handleCopyDiscord(listing.contact.discord!)}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-xs font-semibold transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>
                    {copiedContact === "discord" ? "Tag Copied!" : "Copy Discord"}
                  </span>
                </button>
              )}

              {listing.contact.whatsapp && (
                <a
                  href={`https://wa.me/${listing.contact.whatsapp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-xs font-semibold transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp</span>
                  <ArrowUpRight className="w-3 h-3 ml-auto opacity-60" />
                </a>
              )}

              {listing.contact.github && (
                <a
                  href={`https://github.com/${listing.contact.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/10 text-xs font-semibold transition-colors"
                >
                  <span>GitHub</span>
                  <ArrowUpRight className="w-3 h-3 ml-auto opacity-60" />
                </a>
              )}

              {listing.contact.email && (
                <a
                  href={`mailto:${listing.contact.email}?subject=SynqSquad: Team inquiry for ${encodeURIComponent(
                    listing.targetName
                  )}`}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/10 text-xs font-semibold transition-colors col-span-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send Direct Email ({listing.contact.email})</span>
                  <ArrowUpRight className="w-3 h-3 ml-auto opacity-60" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Drawer Sticky Footer Action */}
        <div className="p-4 border-t border-white/10 bg-[#12161f] flex items-center justify-between gap-3">
          {!listing.isBoosted && (
            <button
              onClick={() => onOpenBoost(listing)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors"
            >
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Boost to #1</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
}
