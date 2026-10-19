"use client";

import React from "react";
import { Search, Shield, X, Sparkles } from "lucide-react";

interface HeroProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedSkill: string;
  setSelectedSkill: (skill: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  onOpenSuggestMatches: () => void;
  resultCount: number;
}

const COMMON_SKILLS = [
  "All Skills",
  "Next.js",
  "Python",
  "PyTorch",
  "FastAPI",
  "TypeScript",
  "Solidity",
  "C++",
  "ROS2",
  "Figma",
  "Three.js",
  "Docker",
];

export function Hero({
  searchQuery,
  setSearchQuery,
  selectedSkill,
  setSelectedSkill,
  selectedType,
  setSelectedType,
  onOpenSuggestMatches,
  resultCount,
}: HeroProps) {
  return (
    <div className="pt-8 pb-5 px-4 sm:px-6 border-b border-[var(--border-default)] bg-[var(--bg-canvas)] transition-colors">
      <div className="max-w-4xl mx-auto text-center space-y-4">
        {/* Compact, calm editorial headline - No gradients or hype copy */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Find collaborators for hackathons and research
        </h1>

        <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-xl mx-auto leading-normal">
          Connect directly on Gmail with students and researchers looking for your exact skills.
        </p>

        {/* Global Search Bar */}
        <div className="max-w-xl mx-auto relative pt-1">
          <div className="relative flex items-center rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-xs transition-colors focus-within:border-[var(--accent-primary)]">
            <Search className="absolute left-3.5 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by college, event (SIH, NeurIPS), or skill..."
              className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-transparent text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none min-h-[44px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search input"
                className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] mr-2 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onOpenSuggestMatches}
              className="absolute right-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--accent-muted)] hover:bg-[var(--accent-muted)]/80 text-[var(--accent-primary)] text-[11px] font-medium border border-[var(--border-subtle)] transition-colors flex items-center gap-1 min-h-[34px]"
            >
              <Sparkles className="w-3 h-3" />
              <span>Suggest</span>
            </button>
          </div>

          {/* Quiet Trust Subtext */}
          <div className="flex items-center justify-center gap-1.5 mt-2.5 text-[11px] text-[var(--text-tertiary)]">
            <Shield className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>Verified Google accounts only. You talk on Gmail, nothing else.</span>
          </div>
        </div>

        {/* Type & Skill Filter Row */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
          {/* Type Segmented Control */}
          <div className="flex items-center gap-1 bg-[var(--bg-surface)] p-1 rounded-lg border border-[var(--border-default)] text-xs font-medium self-start">
            {[
              { id: "all", label: `All (${resultCount})` },
              { id: "hackathon", label: "Hackathons" },
              { id: "research", label: "Research" },
              { id: "solo", label: "Solo Devs" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedType(t.id)}
                className={`px-3 py-1.5 rounded-md transition-colors min-h-[32px] ${
                  selectedType === t.id
                    ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] font-semibold border border-[var(--border-default)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Skill chips scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 justify-start">
            {COMMON_SKILLS.map((sk) => {
              const active =
                (sk === "All Skills" && selectedSkill === "all") || selectedSkill === sk;
              return (
                <button
                  key={sk}
                  type="button"
                  onClick={() => setSelectedSkill(sk === "All Skills" ? "all" : sk)}
                  className={`whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors min-h-[30px] ${
                    active
                      ? "bg-[var(--accent-primary)] text-white"
                      : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-default)]"
                  }`}
                >
                  {sk}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
