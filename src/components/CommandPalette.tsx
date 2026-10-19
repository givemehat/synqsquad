"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Sparkles,
  Plus,
  Rocket,
  BookOpen,
  Users,
  Compass,
  Flame,
  ArrowRight,
  X,
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (action: string) => void;
}

interface CommandItem {
  id: string;
  title: string;
  category: "Navigation" | "Actions" | "Filters";
  shortcut?: string;
  icon: React.ReactNode;
}

export function CommandPalette({ isOpen, onClose, onSelectAction }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = [
    {
      id: "post_requirement",
      title: "Post new team or collaborator requirement",
      category: "Actions",
      shortcut: "N",
      icon: <Plus className="w-4 h-4 text-indigo-400" />,
    },
    {
      id: "open_matcher",
      title: "Run AI skill & teammate scout",
      category: "Actions",
      shortcut: "M",
      icon: <Sparkles className="w-4 h-4 text-indigo-400" />,
    },
    {
      id: "filter_all",
      title: "View all postings feed",
      category: "Navigation",
      shortcut: "1",
      icon: <Users className="w-4 h-4 text-slate-400" />,
    },
    {
      id: "filter_hackathon",
      title: "Filter by Hackathon teams only",
      category: "Filters",
      shortcut: "H",
      icon: <Rocket className="w-4 h-4 text-amber-400" />,
    },
    {
      id: "filter_research",
      title: "Filter by Research papers & labs",
      category: "Filters",
      shortcut: "R",
      icon: <BookOpen className="w-4 h-4 text-sky-400" />,
    },
    {
      id: "view_radar",
      title: "Open 2026 Hackathons & Grants Radar",
      category: "Navigation",
      shortcut: "E",
      icon: <Compass className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: "filter_boosted",
      title: "Show urgent & spotlight matches only",
      category: "Filters",
      shortcut: "B",
      icon: <Flame className="w-4 h-4 text-amber-400" />,
    },
  ];

  const filtered = commands.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else onSelectAction("toggle_palette");
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onSelectAction]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-xl bg-[#11141a] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        {/* Search header */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 gap-3">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <span className="kbd-shortcut">ESC</span>
        </div>

        {/* Command list */}
        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching actions found.
            </div>
          ) : (
            filtered.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectAction(item.id);
                  onClose();
                }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                  idx === selectedIndex
                    ? "bg-white/10 text-white"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span className="font-medium">{item.title}</span>
                </div>
                {item.shortcut && (
                  <span className="kbd-shortcut">{item.shortcut}</span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-white/5 bg-[#0a0c10] flex items-center justify-between text-[11px] text-slate-500">
          <span>SynqSquad Command Palette</span>
          <div className="flex items-center gap-3">
            <span>Navigation: <span className="kbd-shortcut">↑</span> <span className="kbd-shortcut">↓</span></span>
            <span>Select: <span className="kbd-shortcut">↵</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
