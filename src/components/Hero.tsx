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
    <div className="pt-8 pb-5 px-4 sm:px-6 border-b border-white/5 bg-[#090b0e]">
      <div className="max-w-4xl mx-auto text-center space-y-4">
        {/* Compact, solid off-white headline - No gradients */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
          Find collaborators for hackathons and research
        </h1>

        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-normal">
          Connect directly on Gmail with students and researchers looking for your exact skills.
        </p>

        {/* Global Search Bar */}
        <div className="max-w-xl mx-auto relative pt-1">
          <div className="relative flex items-center rounded-xl bg-[#12151b] border border-white/10 shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by college, event (SIH, NeurIPS), or skill..."
              className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-slate-400 hover:text-white mr-2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onOpenSuggestMatches}
              className="absolute right-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 text-[11px] font-medium border border-blue-500/20 transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>Suggest</span>
            </button>
          </div>

          {/* ONE Quiet Trust Subtext - Replaces 8 noisy cards */}
          <div className="flex items-center justify-center gap-1.5 mt-2.5 text-[11px] text-slate-400">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>Verified Google accounts only. You talk on Gmail, nothing else.</span>
          </div>
        </div>

        {/* Type & Skill Filter Row - Left-aligned with no clipping */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
          {/* Type Segmented Control */}
          <div className="flex items-center gap-1 bg-[#12151b] p-1 rounded-lg border border-white/5 text-xs font-medium self-start">
            {[
              { id: "all", label: `All (${resultCount})` },
              { id: "hackathon", label: "Hackathons" },
              { id: "research", label: "Research" },
              { id: "solo", label: "Solo Devs" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  selectedType === t.id
                    ? "bg-white/10 text-white font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Skill chips scroll (Strictly left-aligned to prevent "achine Learning" cut-off) */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 justify-start no-scrollbar">
            {COMMON_SKILLS.map((sk) => {
              const active =
                (sk === "All Skills" && selectedSkill === "all") || selectedSkill === sk;
              return (
                <button
                  key={sk}
                  onClick={() => setSelectedSkill(sk === "All Skills" ? "all" : sk)}
                  className={`whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors ${
                    active
                      ? "bg-blue-600 text-white"
                      : "bg-[#12151b] text-slate-400 hover:text-white border border-white/5"
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
