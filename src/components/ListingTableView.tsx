"use client";

import React, { useState } from "react";
import { Listing } from "@/types";
import {
  Flame,
  Trophy,
  Users,
  Send,
  MessageSquare,
  Sparkles,
  ArrowUpDown,
  MoreHorizontal,
  ChevronRight,
} from "lucide-react";

interface ListingTableViewProps {
  listings: Listing[];
  onSelectListing: (listing: Listing) => void;
  onOpenBoost: (listing: Listing) => void;
  onOpenManage: (listing: Listing) => void;
}

export function ListingTableView({
  listings,
  onSelectListing,
  onOpenBoost,
  onOpenManage,
}: ListingTableViewProps) {
  const [sortField, setSortField] = useState<"created" | "members" | "views">("created");
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (field: "created" | "members" | "views") => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedListings = [...listings].sort((a, b) => {
    if (a.isBoosted && !b.isBoosted) return -1;
    if (!a.isBoosted && b.isBoosted) return 1;

    let diff = 0;
    if (sortField === "created") {
      diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortField === "members") {
      diff = b.currentMembersCount - a.currentMembersCount;
    } else if (sortField === "views") {
      diff = (b.views || 0) - (a.views || 0);
    }
    return sortAsc ? -diff : diff;
  });

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-white/10 bg-[#0e1117]">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-white/10 bg-[#12161f] text-slate-400 font-medium">
            <th className="py-3 px-4 w-12 text-center">Status</th>
            <th className="py-3 px-4">Project / Competition</th>
            <th className="py-3 px-4">Roles Recruited</th>
            <th
              onClick={() => handleSort("members")}
              className="py-3 px-4 cursor-pointer hover:text-white select-none whitespace-nowrap"
            >
              <div className="flex items-center gap-1">
                <span>Slots</span>
                <ArrowUpDown className="w-3 h-3 opacity-60" />
              </div>
            </th>
            <th className="py-3 px-4">Tech Stack</th>
            <th className="py-3 px-4">Lead</th>
            <th className="py-3 px-4 text-right">Outreach</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {sortedListings.map((listing) => {
            const isFull = listing.currentMembersCount >= listing.maxMembersCount;
            return (
              <tr
                key={listing.id}
                onClick={() => onSelectListing(listing)}
                className={`group cursor-pointer transition-colors ${
                  listing.isBoosted
                    ? "bg-amber-500/[0.04] hover:bg-amber-500/[0.08]"
                    : "hover:bg-white/[0.03]"
                }`}
              >
                {/* Status Dot */}
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center">
                    {listing.isBoosted ? (
                      <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    ) : (
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isFull ? "bg-rose-500" : "bg-emerald-400"
                        }`}
                      />
                    )}
                  </div>
                </td>

                {/* Project Title & Target */}
                <td className="py-3 px-4 max-w-xs">
                  <div className="font-semibold text-white group-hover:text-indigo-400 transition-colors truncate">
                    {listing.title}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-indigo-400">
                      {listing.targetName}
                    </span>
                    <span>• {listing.domain}</span>
                  </div>
                </td>

                {/* Roles Needed */}
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {listing.rolesNeeded.slice(0, 2).map((r, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[11px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 whitespace-nowrap"
                      >
                        {r}
                      </span>
                    ))}
                    {listing.rolesNeeded.length > 2 && (
                      <span className="text-[10px] text-slate-500 self-center">
                        +{listing.rolesNeeded.length - 2}
                      </span>
                    )}
                  </div>
                </td>

                {/* Slots / Capacity */}
                <td className="py-3 px-4 whitespace-nowrap font-mono">
                  <span
                    className={
                      isFull
                        ? "text-rose-400 font-semibold"
                        : "text-emerald-400 font-semibold"
                    }
                  >
                    {listing.currentMembersCount}/{listing.maxMembersCount}
                  </span>
                </td>

                {/* Tech Stack */}
                <td className="py-3 px-4">
                  <div className="flex gap-1">
                    {listing.skills.slice(0, 3).map((sk, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/[0.04] text-slate-300"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </td>

                {/* Lead Name & Winner status */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-300 font-medium truncate max-w-[100px]">
                      {listing.creatorName}
                    </span>
                    {listing.isVerifiedWinner && (
                      <Trophy className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                    )}
                  </div>
                </td>

                {/* Outreach & Actions */}
                <td
                  className="py-3 px-4 text-right whitespace-nowrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-end gap-1">
                    {listing.contact.telegram && (
                      <a
                        href={`https://t.me/${listing.contact.telegram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="Telegram"
                      >
                        <Send className="w-3.5 h-3.5 text-sky-400" />
                      </a>
                    )}
                    {listing.contact.discord && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(listing.contact.discord!);
                          alert(`Copied Discord: ${listing.contact.discord}`);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="Copy Discord"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                      </button>
                    )}
                    <button
                      onClick={() => onSelectListing(listing)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
