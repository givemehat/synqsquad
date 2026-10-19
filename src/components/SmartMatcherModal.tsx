"use client";

import React, { useState } from "react";
import { Listing } from "@/types";
import { Sparkles, X, Check, ArrowRight, Trophy, Users, Send, MessageSquare } from "lucide-react";

interface SmartMatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  listings: Listing[];
}

const COMMON_ROLES = [
  "Full-Stack Dev",
  "Frontend (React/Next.js)",
  "Backend (FastAPI/Node)",
  "Machine Learning / PyTorch",
  "Computer Vision",
  "Autonomous Agent Engineer",
  "Solidity / Web3",
  "UI/UX Designer",
  "ROS2 / Robotics",
  "BioTech Researcher",
];

export function SmartMatcherModal({ isOpen, onClose, listings }: SmartMatcherModalProps) {
  const [selectedRole, setSelectedRole] = useState("Machine Learning / PyTorch");
  const [skillsInput, setSkillsInput] = useState("PyTorch, Python, Next.js, OpenCV");
  const [hasSearched, setHasSearched] = useState(false);
  const [matches, setMatches] = useState<{ listing: Listing; matchScore: number; matchedReason: string }[]>([]);

  if (!isOpen) return null;

  const handleRunMatch = () => {
    const userSkills = skillsInput
      .toLowerCase()
      .split(/[,+\s]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1);

    const scored = listings.map((l) => {
      let score = 30; // base potential
      const reasons: string[] = [];

      // Check role overlap in rolesNeeded
      const roleMatch = l.rolesNeeded.some((r) =>
        r.toLowerCase().includes(selectedRole.toLowerCase().split("/")[0].trim().toLowerCase())
      );
      if (roleMatch) {
        score += 35;
        reasons.push(`Looking for ${selectedRole}`);
      }

      // Check skills overlap
      const sharedSkills = l.skills.filter((sk) =>
        userSkills.some((us) => sk.toLowerCase().includes(us) || us.includes(sk.toLowerCase()))
      );
      if (sharedSkills.length > 0) {
        score += Math.min(30, sharedSkills.length * 12);
        reasons.push(`Matched skills: ${sharedSkills.slice(0, 3).join(", ")}`);
      }

      // Boost bonus
      if (l.isBoosted) score += 5;

      const finalScore = Math.min(99, score);
      return {
        listing: l,
        matchScore: finalScore,
        matchedReason: reasons.join(" • ") || "Domain compatibility",
      };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);
    setMatches(scored.slice(0, 5));
    setHasSearched(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-gradient-to-r from-indigo-950/60 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">AI Scout & Teammate Matcher</h2>
              <p className="text-xs text-slate-400">
                Match with teams seeking your exact strengths in seconds
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Role selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Your Primary Role
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRole(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    selectedRole === r
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Skills input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Your Core Tech & Tools (Comma separated)
            </label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="e.g. PyTorch, React, Next.js, Solana, Docker"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Action button */}
          <button
            onClick={handleRunMatch}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Calculate Top 5 Complementary Teams</span>
          </button>

          {/* Match Results */}
          {hasSearched && (
            <div className="mt-6 pt-5 border-t border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Top Compatible Teams ({matches.length})
              </h4>

              {matches.map(({ listing, matchScore, matchedReason }) => (
                <div
                  key={listing.id}
                  className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {matchScore}% Match
                      </span>
                      <span className="text-xs font-medium text-slate-400">
                        {listing.targetName}
                      </span>
                    </div>
                    <h5 className="text-sm font-bold text-white mb-1">{listing.title}</h5>
                    <p className="text-[11px] text-indigo-300">{matchedReason}</p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {listing.contact.telegram && (
                      <a
                        href={`https://t.me/${listing.contact.telegram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 text-white flex items-center gap-1 hover:bg-sky-500 transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        <span>Telegram</span>
                      </a>
                    )}
                    {listing.contact.discord && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(listing.contact.discord!);
                          alert(`Copied Discord: ${listing.contact.discord}`);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white flex items-center gap-1 hover:bg-indigo-500 transition-colors"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Discord</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
