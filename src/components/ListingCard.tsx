"use client";

import React from "react";
import { Listing } from "@/types";
import { Calendar, ArrowRight, ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/Avatar";

interface ListingCardProps {
  listing: Listing;
  onSelect: (listing: Listing) => void;
}

export function ListingCard({ listing, onSelect }: ListingCardProps) {
  const isFilled = listing.status === "filled";

  return (
    <article
      onClick={() => onSelect(listing)}
      className="surface-card group relative p-4 sm:p-5 cursor-pointer flex flex-col justify-between select-none"
    >
      <div>
        {/* Top Header: Creator details & Slots */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <Avatar src={listing.ownerPhoto} name={listing.ownerName} size={32} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  {listing.ownerName}
                </span>
                <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
                  • {listing.ownerCollege}
                </span>
              </div>
              <span className="text-[11px] text-[var(--text-secondary)] block truncate max-w-[200px]">
                {listing.ownerRole}
              </span>
            </div>
          </div>

          {/* Slot Capacity Tag */}
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
              isFilled
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
            }`}
          >
            {isFilled ? "Filled" : `Slots: ${listing.slots}`}
          </span>
        </div>

        {/* Project Title / Need */}
        <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors mb-1.5 leading-snug">
          {listing.title}
        </h3>

        {/* Event & Deadline */}
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-3">
          <span className="font-medium text-[var(--text-primary)]">{listing.event}</span>
          {listing.deadline && (
            <>
              <span>•</span>
              <span className="font-mono text-[11px] text-[var(--text-tertiary)] flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[var(--text-tertiary)]" />
                <span>{listing.deadline}</span>
              </span>
            </>
          )}
        </div>

        {/* Short Description */}
        <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed mb-4">
          {listing.description}
        </p>

        {/* Required Skills (Up to 4) */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {listing.skillsNeeded.slice(0, 4).map((skill, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-default)]"
            >
              {skill}
            </span>
          ))}
          {listing.skillsNeeded.length > 4 && (
            <span className="px-1.5 py-0.5 text-[10px] text-[var(--text-tertiary)] self-center">
              +{listing.skillsNeeded.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* Quiet Bottom Action */}
      <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
        <span className="text-[11px] flex items-center gap-1 text-[var(--text-tertiary)]">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          <span>Verified Gmail</span>
        </span>

        <span className="text-[var(--accent-primary)] font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
          <span>View Details</span>
          <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </article>
  );
}
