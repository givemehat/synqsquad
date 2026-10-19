"use client";

import React, { useState } from "react";
import { Listing } from "@/types";
import {
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
  Zap,
} from "lucide-react";

interface ListingCardProps {
  listing: Listing;
  onOpenBoost: (listing: Listing) => void;
  onOpenManage: (listing: Listing) => void;
}

export function ListingCard({ listing, onOpenBoost, onOpenManage }: ListingCardProps) {
  const [copiedContact, setCopiedContact] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState(false);

  const handleCopyDiscord = (discordTag: string) => {
    navigator.clipboard.writeText(discordTag);
    setCopiedContact("discord");
    setTimeout(() => setCopiedContact(null), 2500);
  };

  const handleShare = () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/#${listing.id}` : "";
    navigator.clipboard.writeText(url);
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2500);
  };

  const fillPercentage = Math.min(
    100,
    Math.round((listing.currentMembersCount / listing.maxMembersCount) * 100)
  );

  return (
    <div
      id={listing.id}
      className={`group relative rounded-3xl transition-all duration-300 flex flex-col justify-between overflow-hidden hover:-translate-y-1 ${
        listing.isBoosted
          ? "glow-featured"
          : "glass-panel glass-panel-hover"
      }`}
    >
      {/* Featured Top Ribbon */}
      {listing.isBoosted && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-4 py-1 text-slate-950 font-black text-[11px] flex items-center justify-between tracking-wide shadow-sm">
          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 fill-slate-950" />
            <span>🔥 URGENT SPOTLIGHT • 10X VISIBILITY</span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-90">Featured</span>
        </div>
      )}

      <div className="p-6 flex-1 flex flex-col">
        {/* Top Badges Row */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-3 py-1 rounded-xl text-xs font-bold tracking-wide ${
                listing.type === "hackathon"
                  ? "bg-purple-900/50 text-purple-300 border border-purple-700/50"
                  : listing.type === "research"
                  ? "bg-sky-900/50 text-sky-300 border border-sky-700/50"
                  : "bg-emerald-900/50 text-emerald-300 border border-emerald-700/50"
              }`}
            >
              {listing.type === "hackathon"
                ? "🚀 Hackathon"
                : listing.type === "research"
                ? "🔬 Research Paper"
                : "⚡ Solo Dev"}
            </span>

            <span className="text-xs font-semibold text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700/50">
              {listing.targetName}
            </span>
          </div>

          {/* Members Joined Pill */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <span
              className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                listing.currentMembersCount >= listing.maxMembersCount
                  ? "bg-rose-950/60 text-rose-300 border border-rose-800/60"
                  : "bg-emerald-950/60 text-emerald-300 border border-emerald-800/60"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>
                {listing.currentMembersCount}/{listing.maxMembersCount}
              </span>
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg sm:text-xl font-extrabold text-white group-hover:text-indigo-300 transition-colors mb-2.5 leading-snug">
          {listing.title}
        </h3>

        {/* Pitch Summary */}
        <p className="text-xs sm:text-sm text-slate-300/90 line-clamp-3 mb-4 leading-relaxed font-normal">
          {listing.description}
        </p>

        {/* Team Fill Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-[11px] font-semibold text-slate-400 mb-1">
            <span>Team Formation</span>
            <span>{fillPercentage}% Complete</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                fillPercentage >= 100
                  ? "bg-rose-500"
                  : fillPercentage > 50
                  ? "bg-amber-400"
                  : "bg-indigo-500"
              }`}
              style={{ width: `${fillPercentage}%` }}
            />
          </div>
        </div>

        {/* Roles Needed Section */}
        <div className="mb-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Roles Needed:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {listing.rolesNeeded.map((role, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 flex items-center gap-1 shadow-sm"
              >
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>{role}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Tech Stack Chips */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {listing.skills.slice(0, 5).map((skill, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-800/90 text-slate-300 border border-slate-700/60"
            >
              {skill}
            </span>
          ))}
          {listing.skills.length > 5 && (
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium text-slate-400 bg-slate-800/40">
              +{listing.skills.length - 5}
            </span>
          )}
        </div>

        {/* Creator Info Footer */}
        <div className="pt-3.5 border-t border-slate-800/70 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 p-[1.5px] flex-shrink-0">
              {listing.creatorAvatar ? (
                <img
                  src={listing.creatorAvatar}
                  alt={listing.creatorName}
                  className="w-full h-full rounded-[10px] object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center text-xs font-bold text-white">
                  {listing.creatorName.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">{listing.creatorName}</span>
                {listing.isVerifiedWinner && (
                  <span title="Past Winner / Published Author" className="text-amber-400">
                    <Trophy className="w-3 h-3 fill-amber-400 inline" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[140px] sm:max-w-[170px]">
                {listing.creatorRole}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1 text-[11px] text-slate-400 justify-end">
              <MapPin className="w-3 h-3 text-slate-500" />
              <span>{listing.location}</span>
            </div>
            {listing.prizeOrGrantPool && (
              <span className="text-[11px] font-bold text-emerald-400 block tracking-tight">
                {listing.prizeOrGrantPool}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Direct Contact Bar */}
      <div className="p-3 bg-slate-950/90 rounded-b-3xl border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        {/* Contact Outreach Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {listing.contact.telegram && (
            <a
              href={`https://t.me/${listing.contact.telegram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-950/70 hover:bg-sky-900 text-sky-300 border border-sky-800/60 transition-all hover:scale-105"
            >
              <Send className="w-3 h-3" />
              <span>Telegram</span>
            </a>
          )}

          {listing.contact.discord && (
            <button
              onClick={() => handleCopyDiscord(listing.contact.discord!)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-950/70 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60 transition-all hover:scale-105"
            >
              {copiedContact === "discord" ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-3 h-3" />
                  <span>Discord</span>
                </>
              )}
            </button>
          )}

          {listing.contact.whatsapp && (
            <a
              href={`https://wa.me/${listing.contact.whatsapp.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 transition-all hover:scale-105"
            >
              <MessageSquare className="w-3 h-3" />
              <span>WhatsApp</span>
            </a>
          )}

          {listing.contact.github && (
            <a
              href={`https://github.com/${listing.contact.github}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 transition-colors"
              title="GitHub Profile"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
          )}

          {listing.contact.email && (
            <a
              href={`mailto:${listing.contact.email}?subject=SynqSquad: Joining team for ${encodeURIComponent(
                listing.targetName
              )}`}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 transition-colors"
              title="Direct Email"
            >
              <Mail className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={handleShare}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Share listing link"
          >
            {shareSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
          </button>

          {!listing.isBoosted && (
            <button
              onClick={() => onOpenBoost(listing)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-300 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 transition-all shadow-sm"
              title="Boost to top with Golden Frame"
            >
              <Flame className="w-3 h-3 text-amber-400" />
              <span>Boost</span>
            </button>
          )}

          <button
            onClick={() => onOpenManage(listing)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Manage post (Close/Edit with PIN)"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
