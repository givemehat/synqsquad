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
  Clock,
  Eye,
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

  const isFull = listing.currentMembersCount >= listing.maxMembersCount;

  return (
    <div
      id={listing.id}
      className={`group relative rounded-2xl transition-all duration-300 flex flex-col justify-between ${
        listing.isBoosted
          ? "bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/60 shadow-xl shadow-amber-500/10 hover:border-amber-400"
          : "bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 shadow-lg hover:shadow-indigo-500/5"
      }`}
    >
      {/* Boosted Top Badge */}
      {listing.isBoosted && (
        <div className="absolute -top-3 left-4 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-[11px] flex items-center gap-1 shadow-md shadow-amber-500/20">
          <Flame className="w-3 h-3 fill-slate-950" />
          <span>URGENT / FEATURED MATCH</span>
        </div>
      )}

      <div className="p-5 sm:p-6 flex-1 flex flex-col">
        {/* Top Header: Target Event & Status Pill */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                listing.type === "hackathon"
                  ? "bg-purple-900/40 text-purple-300 border border-purple-700/50"
                  : listing.type === "research"
                  ? "bg-sky-900/40 text-sky-300 border border-sky-700/50"
                  : "bg-emerald-900/40 text-emerald-300 border border-emerald-700/50"
              }`}
            >
              {listing.type === "hackathon"
                ? "🚀 Hackathon"
                : listing.type === "research"
                ? "🔬 Research Paper"
                : "⚡ Solo Hacker"}
            </span>

            <span className="text-xs font-medium text-slate-400 bg-slate-800/70 px-2 py-0.5 rounded">
              {listing.targetName}
            </span>
          </div>

          {/* Members count status */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                isFull
                  ? "bg-rose-950/60 text-rose-300 border border-rose-800/50"
                  : "bg-emerald-950/60 text-emerald-300 border border-emerald-800/50"
              }`}
            >
              <Users className="w-3 h-3" />
              <span>
                {listing.currentMembersCount}/{listing.maxMembersCount} joined
              </span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-indigo-300 transition-colors mb-2 leading-snug">
          {listing.title}
        </h3>

        {/* Pitch / Description */}
        <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 mb-4 leading-relaxed">
          {listing.description}
        </p>

        {/* Roles Needed Pill Section */}
        <div className="mb-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <span>Roles Wanted:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {listing.rolesNeeded.map((role, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-950/70 text-indigo-300 border border-indigo-800/60 flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-indigo-400" />
                {role}
              </span>
            ))}
          </div>
        </div>

        {/* Tech Stack Chips */}
        <div className="flex flex-wrap gap-1 mb-4">
          {listing.skills.slice(0, 5).map((skill, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded text-[11px] bg-slate-800/80 text-slate-300 border border-slate-700/60"
            >
              {skill}
            </span>
          ))}
          {listing.skills.length > 5 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] text-slate-400">
              +{listing.skills.length - 5} more
            </span>
          )}
        </div>

        {/* Creator Info & Badges */}
        <div className="pt-3 border-t border-slate-800/70 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 p-0.5 flex-shrink-0">
              {listing.creatorAvatar ? (
                <img
                  src={listing.creatorAvatar}
                  alt={listing.creatorName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-white">
                  {listing.creatorName.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-white">{listing.creatorName}</span>
                {listing.isVerifiedWinner && (
                  <span
                    title="Verified Winner / Published Author"
                    className="inline-flex text-amber-400"
                  >
                    <Trophy className="w-3 h-3 fill-amber-400" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[140px] sm:max-w-[180px]">
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
              <span className="text-[10px] font-semibold text-emerald-400 block">
                {listing.prizeOrGrantPool}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Direct Contact Bar & Action Footer */}
      <div className="p-3 bg-slate-950/80 rounded-b-2xl border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        {/* Contact Icons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {listing.contact.telegram && (
            <a
              href={`https://t.me/${listing.contact.telegram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-sky-950/70 hover:bg-sky-900 text-sky-300 border border-sky-800/60 transition-colors"
              title="Message on Telegram"
            >
              <Send className="w-3 h-3" />
              <span>Telegram</span>
            </a>
          )}

          {listing.contact.discord && (
            <button
              onClick={() => handleCopyDiscord(listing.contact.discord!)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-950/70 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60 transition-colors"
              title="Copy Discord Username"
            >
              {copiedContact === "discord" ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copied!</span>
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
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 transition-colors"
              title="Chat on WhatsApp"
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
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 transition-colors"
              title="GitHub Profile"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
          )}

          {listing.contact.linkedin && (
            <a
              href={listing.contact.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 transition-colors"
              title="LinkedIn Profile"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
          )}

          {listing.contact.email && (
            <a
              href={`mailto:${listing.contact.email}?subject=SynqSquad: Joining your team for ${encodeURIComponent(
                listing.targetName
              )}`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 transition-colors"
              title="Send Direct Email"
            >
              <Mail className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Secondary Management & Boost Buttons */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={handleShare}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Copy share link"
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
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-300 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/50 transition-all shadow-sm"
              title="Boost visibility to top"
            >
              <Flame className="w-3 h-3 text-amber-400" />
              <span>Boost</span>
            </button>
          )}

          <button
            onClick={() => onOpenManage(listing)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Manage post (Close/Edit with PIN)"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
