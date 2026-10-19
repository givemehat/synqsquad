import React from "react";
import { Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/5 bg-[#090b0e] text-slate-500 text-xs py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-[11px]">
            S
          </div>
          <span className="font-semibold text-slate-300">SynqSquad</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">
            Collaborator discovery for hackathons and academic papers.
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1 text-slate-400">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>Verified Gmail Only</span>
          </span>
          <span className="hover:text-slate-200 cursor-pointer">Privacy</span>
          <span className="hover:text-slate-200 cursor-pointer">Terms</span>
        </div>
      </div>
    </footer>
  );
}
