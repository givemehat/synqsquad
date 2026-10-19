"use client";

import React from "react";
import { Listing } from "@/types";
import { Users, Calendar, ArrowRight, ShieldCheck } from "lucide-react";

interface ListingCardProps {
  listing: Listing;
  onSelect: (listing: Listing) => void;
}

export function ListingCard({ listing, onSelect }: ListingCardProps) {
  const isFilled = listing.status === "filled";

  return (
    <div
      onClick={() => onSelect(listing)}
      className="group relative rounded-xl bg-[#0f1217] border border-white/5 hover:border-white/15 p-4 sm:p-5 transition-all duration-150 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top Header: Creator details & Slots */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
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
                <span className="text-xs font-semibold text-slate-200">
                  {listing.ownerName}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  • {listing.ownerCollege}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block truncate max-w-[200px]">
                {listing.ownerRole}
              </span>
            </div>
          </div>

          {/* Slot Capacity Tag */}
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
              isFilled
                ? "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
            }`}
          >
            {isFilled ? "Filled" : `Slots: ${listing.slots}`}
          </span>
        </div>

        {/* Project Title / Need */}
        <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors mb-1.5 leading-snug">
          {listing.title}
        </h3>

        {/* Event & Deadline */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
          <span className="font-medium text-slate-300">{listing.event}</span>
          {listing.deadline && (
            <>
              <span>•</span>
              <span className="font-mono text-[11px] text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>{listing.deadline}</span>
              </span>
            </>
          )}
        </div>

        {/* Short Description */}
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
          {listing.description}
        </p>

        {/* Required Skills (Up to 4) */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {listing.skillsNeeded.slice(0, 4).map((skill, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.04] text-slate-300 border border-white/5"
            >
              {skill}
            </span>
          ))}
          {listing.skillsNeeded.length > 4 && (
            <span className="px-1.5 py-0.5 text-[10px] text-slate-500 self-center">
              +{listing.skillsNeeded.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* Quiet Bottom Action */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Verified Gmail</span>
        </span>

        <span className="text-blue-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
          <span>View</span>
          <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}
