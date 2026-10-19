"use client";

import React from "react";
import { Users, Sparkles, PlusCircle, Search, Rocket, Compass, BookOpen } from "lucide-react";

interface NavbarProps {
  onOpenCreate: () => void;
  onOpenMatcher: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Navbar({ onOpenCreate, onOpenMatcher, activeTab, setActiveTab }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <div
            onClick={() => setActiveTab("all")}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-white group-hover:text-indigo-400 transition-colors">
                  SynqSquad
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-ping" />
                  Live
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Hackathon & Research Matcher
              </p>
            </div>
          </div>

          {/* Quick Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "all"
                  ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              Explore Feed
            </button>
            <button
              onClick={() => setActiveTab("hackathon")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "hackathon"
                  ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Rocket className="w-3.5 h-3.5 inline mr-1 text-amber-400" />
              Hackathons
            </button>
            <button
              onClick={() => setActiveTab("research")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "research"
                  ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 inline mr-1 text-sky-400" />
              Research & Papers
            </button>
            <button
              onClick={() => setActiveTab("radar")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "radar"
                  ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Compass className="w-3.5 h-3.5 inline mr-1 text-emerald-400" />
              Events Radar
            </button>
          </nav>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenMatcher}
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/60 rounded-xl transition-all shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span className="hidden sm:inline">AI Smart Matcher</span>
            <span className="sm:hidden">Match</span>
          </button>

          <button
            onClick={onOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-xl shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post Requirement</span>
          </button>
        </div>
      </div>
    </header>
  );
}
