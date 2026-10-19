"use client";

import React, { useState } from "react";
import { Listing } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { X, Sparkles, ArrowRight } from "lucide-react";

interface SuggestMatchesModalProps {
  isOpen: boolean;
  onClose: () => void;
  listings: Listing[];
  onSelectListing: (listing: Listing) => void;
}

export function SuggestMatchesModal({
  isOpen,
  onClose,
  listings,
  onSelectListing,
}: SuggestMatchesModalProps) {
  const { user } = useAuth();
  const [skillsInput, setSkillsInput] = useState(
    user?.skills?.join(", ") || "PyTorch, Python, Next.js"
  );
  const [rankedResults, setRankedResults] = useState<
    { listing: Listing; reason: string }[] | null
  >(null);

  if (!isOpen) return null;

  const handleCalculateSuggestions = () => {
    const inputTags = skillsInput
      .toLowerCase()
      .split(/[,+\s]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1);

    const scored = listings
      .filter((l) => l.status === "open")
      .map((l) => {
        const matches = l.skillsNeeded.filter((needed) =>
          inputTags.some(
            (it) => needed.toLowerCase().includes(it) || it.includes(needed.toLowerCase())
          )
        );

        let reason = "Complementary technical focus";
        if (matches.length > 0) {
          reason = `Looking for ${matches.slice(0, 3).join(", ")}`;
        }

        return {
          listing: l,
          score: matches.length,
          reason,
        };
      })
      .filter((item) => item.score > 0);

    // Sort by overlap count
    scored.sort((a, b) => b.score - a.score);

    setRankedResults(scored.slice(0, 5));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div
        className="w-full max-w-lg bg-[#0f1217] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <h3 className="text-base font-bold text-white">Suggested for You</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Your Primary Skills (Comma separated)
            </label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="e.g. PyTorch, Next.js, C++, ROS2"
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:outline-none"
            />
          </div>

          <button
            onClick={handleCalculateSuggestions}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Find Complementary Squads</span>
          </button>

          {rankedResults && (
            <div className="pt-3 border-t border-white/5 space-y-2.5">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                Ranked Recommendations ({rankedResults.length})
              </span>

              {rankedResults.length === 0 ? (
                <p className="text-slate-500 py-4 text-center">
                  No active listings currently seeking these exact skills.
                </p>
              ) : (
                rankedResults.map(({ listing, reason }) => (
                  <div
                    key={listing.id}
                    onClick={() => {
                      onSelectListing(listing);
                      onClose();
                    }}
                    className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 cursor-pointer transition-colors flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-[10px] font-mono text-blue-400 block mb-0.5">
                        {listing.event}
                      </span>
                      <h4 className="text-xs font-bold text-white line-clamp-1">
                        {listing.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1">{reason}</p>
                    </div>

                    <span className="text-blue-400 text-xs font-semibold flex items-center gap-1 flex-shrink-0">
                      <span>View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
