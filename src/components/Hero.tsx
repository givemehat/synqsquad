"use client";

import React from "react";
import { Search, Sparkles, Flame, Users, Trophy, Zap, ShieldCheck, ArrowRight } from "lucide-react";
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

const DOMAIN_OPTIONS: { name: ProjectDomain | "All Domains"; icon: string }[] = [
  { name: "All Domains", icon: "🌐" },
  { name: "AI & Machine Learning", icon: "🤖" },
  { name: "Web3 & Blockchain", icon: "⛓️" },
  { name: "Full-Stack Web/Mobile", icon: "⚡" },
  { name: "Healthcare & BioTech", icon: "🧬" },
  { name: "Cybersecurity", icon: "🛡️" },
  { name: "Robotics & IoT", icon: "🛰️" },
  { name: "Climate & CleanTech", icon: "🌱" },
  { name: "Fintech & Quant", icon: "📈" },
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
    <div className="relative pt-12 pb-10 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80">
      {/* Decorative ambient gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-5xl mx-auto text-center relative z-10">
        {/* Top Tagline Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-900/40 text-indigo-300 border border-indigo-700/50 mb-6 shadow-inner backdrop-blur-md">
          <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
          <span>Active Team Building for SIH 2026, ETHGlobal, & NeurIPS Papers</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white mb-5 leading-[1.15]">
          Find Your Winning Teammates &{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-teal-300 bg-clip-text text-transparent">
            Research Co-Authors
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 mb-8 leading-relaxed font-normal">
          No walled inboxes. No endless waiting. Connect directly via <span className="text-sky-400 font-medium">Telegram</span>, <span className="text-indigo-400 font-medium">Discord</span>, and <span className="text-emerald-400 font-medium">WhatsApp</span> with verified hackers, developers, and published researchers.
        </p>

        {/* Search Command Input */}
        <div className="max-w-2xl mx-auto relative mb-6">
          <div className="relative flex items-center rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl shadow-indigo-950/50 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all duration-300">
            <Search className="absolute left-4 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Hackathon (SIH, NASA), skill (PyTorch, Next.js), or role..."
              className="w-full pl-12 pr-32 py-4 rounded-2xl bg-transparent text-white placeholder-slate-400 text-sm focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs font-medium text-slate-400 hover:text-white mr-3"
              >
                Clear
              </button>
            )}
            <button
              onClick={onOpenMatcher}
              className="absolute right-2.5 bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>AI Match</span>
            </button>
          </div>
        </div>

        {/* Quick Category Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          {[
            { id: "all", label: `All Listings (${totalCount})` },
            { id: "hackathon", label: "🚀 Hackathon Teams" },
            { id: "research", label: "🔬 Research Papers" },
            { id: "solo_hacker", label: "⚡ Solo Developers" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedType(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                selectedType === cat.id
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400"
                  : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Domain Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 justify-start sm:justify-center no-scrollbar">
          {DOMAIN_OPTIONS.map((item) => (
            <button
              key={item.name}
              onClick={() => setSelectedDomain(item.name === "All Domains" ? "all" : item.name)}
              className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                (item.name === "All Domains" && selectedDomain === "all") ||
                selectedDomain === item.name
                  ? "bg-sky-500/20 text-sky-300 border border-sky-400/50 shadow-sm"
                  : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:border-slate-700"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </button>
          ))}
        </div>

        {/* Trust Stats Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
          <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Direct Connect</p>
              <p className="text-[11px] text-slate-400">Telegram & Discord</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Zero Waitlist</p>
              <p className="text-[11px] text-slate-400">Manage via 6-digit PIN</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Smart Matcher</p>
              <p className="text-[11px] text-slate-400">AI finds missing skills</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Winner Badges</p>
              <p className="text-[11px] text-slate-400">Verified SIH/ICLR vets</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
