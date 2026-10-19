"use client";

import React from "react";
import { Users, Plus, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface NavbarProps {
  onOpenCreate: () => void;
  onOpenProfile: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Navbar({ onOpenCreate, onOpenProfile, activeTab, setActiveTab }: NavbarProps) {
  const { user, openAuthModal } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#090b0e]/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand Logo & Tag */}
        <div className="flex items-center gap-6">
          <div
            onClick={() => setActiveTab("all")}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              S
            </div>
            <span className="font-bold text-sm tracking-tight text-white">
              SynqSquad
            </span>
          </div>

          {/* Clean 3-Tab Segmented Control (Hick's Law) */}
          <nav className="hidden sm:flex items-center gap-1 text-xs">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === "all"
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All Listings
            </button>
            <button
              onClick={() => setActiveTab("hackathon")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === "hackathon"
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Hackathons
            </button>
            <button
              onClick={() => setActiveTab("research")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === "research"
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Research
            </button>
          </nav>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-3">
          {/* Post Requirement Button */}
          <button
            onClick={() => {
              if (!user) {
                openAuthModal(() => onOpenCreate());
              } else {
                onOpenCreate();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Post</span>
          </button>

          {/* User Profile or Google Sign In */}
          {user ? (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 p-1 pl-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
            >
              <span className="text-xs text-slate-300 font-medium max-w-[100px] truncate hidden sm:inline">
                {user.name.split(" ")[0]}
              </span>
              <div className="w-6 h-6 rounded-full bg-blue-600 overflow-hidden text-[11px] font-bold text-white flex items-center justify-center">
                {user.photo ? (
                  <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0)
                )}
              </div>
            </button>
          ) : (
            <button
              onClick={() => openAuthModal()}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              Sign in with Google
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
