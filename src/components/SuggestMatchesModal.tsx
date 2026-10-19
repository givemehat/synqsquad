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
    { listing: Listing; reason: string; matchedCount: number }[] | null
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
          matchedCount: matches.length,
          reason,
        };
      })
      .filter((item) => item.matchedCount > 0);

    // Sort by overlap count honestly
    scored.sort((a, b) => b.matchedCount - a.matchedCount);

    setRankedResults(scored.slice(0, 5));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="suggest-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-2xl overflow-hidden p-6 animate-in zoom-in-95 duration-150 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)] mb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
            <h3 id="suggest-modal-title" className="text-base font-bold text-[var(--text-primary)]">
              Suggested for You
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              Your Primary Skills (Comma separated)
            </label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="e.g. PyTorch, Next.js, C++, ROS2"
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs focus:outline-none min-h-[40px]"
            />
          </div>

          <button
            type="button"
            onClick={handleCalculateSuggestions}
            className="w-full py-2.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-semibold transition-colors min-h-[44px]"
          >
            Find Matching Requisitions
          </button>

          {/* Results list */}
          {rankedResults !== null && (
            <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
              <span className="text-[11px] font-semibold text-[var(--text-secondary)] block">
                {rankedResults.length} open requirement{rankedResults.length === 1 ? "" : "s"} looking for your skills:
              </span>

              {rankedResults.length === 0 ? (
                <div className="p-4 rounded-xl bg-[var(--bg-elevated)] text-center text-xs text-[var(--text-secondary)]">
                  No open requirements currently list those exact skills. Try broader keywords like &quot;Python&quot; or &quot;Next.js&quot;.
                </div>
              ) : (
                rankedResults.map(({ listing, reason }) => (
                  <div
                    key={listing.id}
                    onClick={() => {
                      onClose();
                      onSelectListing(listing);
                    }}
                    className="p-3 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)] border border-[var(--border-default)] transition-colors cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-[10px] font-mono text-[var(--accent-primary)] block">
                        {listing.event}
                      </span>
                      <h4 className="text-xs font-bold text-[var(--text-primary)]">{listing.title}</h4>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{reason}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" />
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
