"use client";

import React from "react";
import { Search, Sparkles, Flame, Users2, ShieldCheck, Zap } from "lucide-react";
import { ProjectDomain } from "@/types";

interface HeroProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedDomain: string;
  setSelectedDomain: (d: string) => void;
  selectedType: string;
  setSelectedType: (t: string) => void;
  onOpenCreate: () => void;
  onOpenMatcher: () => void;
  totalCount: number;
}

const DOMAINS: (ProjectDomain | "All Domains")[] = [
  "All Domains",
  "AI & Machine Learning",
  "Web3 & Blockchain",
  "Full-Stack Web/Mobile",
  "Healthcare & BioTech",
  "Cybersecurity",
  "Robotics & IoT",
  "Climate & CleanTech",
  "Fintech & Quant",
];

export function Hero({
  searchQuery,
  setSearchQuery,
  selectedDomain,
  setSelectedDomain,
  selectedType,
  setSelectedType,
  onOpenCreate,
  onOpenMatcher,
  totalCount,
}: HeroProps) {
  return (
    <div className="relative overflow-hidden pt-10 pb-8 px-4 sm:px-6 lg:px-8 border-b border-slate-900 bg-gradient-to-b from-indigo-950/20 via-slate-950 to-slate-950">
      {/* Background glow orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl h-56 bg-gradient-to-b from-indigo-500/10 via-sky-500/5 to-transparent blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-5xl mx-auto text-center">
        {/* Top badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-900/30 text-indigo-300 border border-indigo-700/40 mb-5 shadow-inner">
          <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>Zero-friction matchmaking for Smart India Hackathon, ETHGlobal, & NeurIPS 2026</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight">
          Find Your Winning Teammates &{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-200 bg-clip-text text-transparent">
            Research Co-Authors
          </span>
        </h1>

        {/* Subhead */}
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 mb-8 leading-relaxed">
          Skip dead chat groups and endless waitlists. Discover complementary developers, AI researchers, and UI builders with direct 1-click contact via Telegram, Discord, and WhatsApp.
        </p>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto relative mb-6">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Hackathon (e.g. SIH, NASA), skill (PyTorch, Next.js), or role..."
              className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/70 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-xl transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-20 text-xs text-slate-400 hover:text-white mr-2"
              >
                Clear
              </button>
            )}
            <button
              onClick={onOpenMatcher}
              className="absolute right-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1 shadow-md shadow-indigo-600/30"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-200" />
              <span>AI Scout</span>
            </button>
          </div>
        </div>

        {/* Type Filter Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <button
            onClick={() => setSelectedType("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              selectedType === "all"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
            }`}
          >
            All Listings ({totalCount})
          </button>
          <button
            onClick={() => setSelectedType("hackathon")}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              selectedType === "hackathon"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
            }`}
          >
            🚀 Hackathon Teams
          </button>
          <button
            onClick={() => setSelectedType("research")}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              selectedType === "research"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
            }`}
          >
            🔬 Research Papers & Labs
          </button>
          <button
            onClick={() => setSelectedType("solo_hacker")}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              selectedType === "solo_hacker"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
            }`}
          >
            ⚡ Solo Hackers Available
          </button>
        </div>

        {/* Domain Filter Pills Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 justify-start sm:justify-center no-scrollbar">
          {DOMAINS.map((dom) => (
            <button
              key={dom}
              onClick={() => setSelectedDomain(dom === "All Domains" ? "all" : dom)}
              className={`whitespace-nowrap px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium transition-all ${
                (dom === "All Domains" && selectedDomain === "all") || selectedDomain === dom
                  ? "bg-sky-500/20 text-sky-300 border border-sky-400/50"
                  : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80"
              }`}
            >
              {dom}
            </button>
          ))}
        </div>

        {/* Quick Trust Highlights */}
        <div className="mt-8 pt-6 border-t border-slate-900/80 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
          <div className="flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-white">Instant Contact</p>
              <p className="text-[11px] text-slate-400">Direct Discord / Telegram</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-white">Zero Account Lockin</p>
              <p className="text-[11px] text-slate-400">Manage via 6-digit PIN</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Users2 className="w-5 h-5 text-indigo-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-white">Complementary Matching</p>
              <p className="text-[11px] text-slate-400">AI finds missing skillsets</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Flame className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-white">Self-Serve Boost</p>
              <p className="text-[11px] text-slate-400">5x faster team filling</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
