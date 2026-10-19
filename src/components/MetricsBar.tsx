"use client";

import React from "react";
import { Users, TrendingUp, Clock, Trophy } from "lucide-react";
import { Listing } from "@/types";

interface MetricsBarProps {
  listings: Listing[];
}

export function MetricsBar({ listings }: MetricsBarProps) {
  const totalOpenSlots = listings.reduce(
    (acc, l) => acc + Math.max(0, l.maxMembersCount - l.currentMembersCount),
    0
  );
  const hackathonsCount = listings.filter((l) => l.type === "hackathon").length;
  const researchCount = listings.filter((l) => l.type === "research").length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      {/* Metric 1 */}
      <div className="p-4 rounded-xl bg-[#0e1117] border border-white/5 shadow-sm">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[11px] font-medium uppercase tracking-wider">
            Active Squads
          </span>
          <Users className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-white tracking-tight">
            {listings.length}
          </span>
          <span className="text-[11px] font-medium text-emerald-400 flex items-center">
            <TrendingUp className="w-3 h-3 inline mr-0.5" />
            +18.2%
          </span>
        </div>
        <span className="text-[10px] text-slate-500 mt-1 block">
          {hackathonsCount} hackathons • {researchCount} papers
        </span>
      </div>

      {/* Metric 2 */}
      <div className="p-4 rounded-xl bg-[#0e1117] border border-white/5 shadow-sm">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[11px] font-medium uppercase tracking-wider">
            Open Team Slots
          </span>
          <Users className="w-3.5 h-3.5 text-indigo-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-white tracking-tight">
            {totalOpenSlots}
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            slots vacant
          </span>
        </div>
        <span className="text-[10px] text-slate-500 mt-1 block">
          Ready for immediate collaboration
        </span>
      </div>

      {/* Metric 3 */}
      <div className="p-4 rounded-xl bg-[#0e1117] border border-white/5 shadow-sm">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[11px] font-medium uppercase tracking-wider">
            Median Match Time
          </span>
          <Clock className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-white tracking-tight">
            2.8 hrs
          </span>
          <span className="text-[11px] font-medium text-emerald-400">
            -42 min
          </span>
        </div>
        <span className="text-[10px] text-slate-500 mt-1 block">
          Direct outreach via Telegram/Discord
        </span>
      </div>

      {/* Metric 4 */}
      <div className="p-4 rounded-xl bg-[#0e1117] border border-white/5 shadow-sm">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[11px] font-medium uppercase tracking-wider">
            Verified Prize Pool
          </span>
          <Trophy className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">
            $340,000+
          </span>
        </div>
        <span className="text-[10px] text-slate-500 mt-1 block">
          Across SIH, ETHGlobal & Grants
        </span>
      </div>
    </div>
  );
}
