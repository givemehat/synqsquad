"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Command, X, Search, Moon, Sun, ArrowRight, Shield, FileText, HelpCircle, User, Plus, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";

interface CommandItem {
  id: string;
  label: string;
  category: "Navigation" | "Action" | "Theme";
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  shortcut?: string;
}

export function KeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const { resolvedTheme, toggleTheme } = useTheme();

  const commands: CommandItem[] = useMemo(
    () => [
      {
        id: "nav-home",
        label: "Go to Feed & Active Listings",
        category: "Navigation",
        icon: Home,
        action: () => router.push("/"),
        shortcut: "G H",
      },
      {
        id: "nav-post",
        label: "Post New Requirement",
        category: "Action",
        icon: Plus,
        action: () => router.push("/post"),
        shortcut: "P",
      },
      {
        id: "nav-profile",
        label: "My Profile & Listings",
        category: "Navigation",
        icon: User,
        action: () => router.push("/profile"),
      },
      {
        id: "nav-settings",
        label: "Settings & Display Preferences",
        category: "Navigation",
        icon: Shield,
        action: () => router.push("/settings"),
      },
      {
        id: "action-theme",
        label: `Toggle Theme (Currently ${resolvedTheme})`,
        category: "Theme",
        icon: resolvedTheme === "dark" ? Sun : Moon,
        action: () => toggleTheme(),
        shortcut: "T",
      },
      {
        id: "nav-how-it-works",
        label: "How SynqSquad Works",
        category: "Navigation",
        icon: FileText,
        action: () => router.push("/how-it-works"),
      },
      {
        id: "nav-faq",
        label: "Frequently Asked Questions",
        category: "Navigation",
        icon: HelpCircle,
        action: () => router.push("/faq"),
      },
      {
        id: "nav-support",
        label: "Help & Grievance Officer",
        category: "Navigation",
        icon: Shield,
        action: () => router.push("/support"),
      },
      {
        id: "nav-report",
        label: "Report Listing or Inappropriate Content",
        category: "Action",
        icon: Shield,
        action: () => router.push("/report"),
      },
      {
        id: "nav-privacy",
        label: "Privacy Policy (DPDP / GDPR)",
        category: "Navigation",
        icon: FileText,
        action: () => router.push("/privacy"),
      },
    ],
    [router, resolvedTheme, toggleTheme]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }, [commands, query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setQuery("");
        setSelectedIndex(0);
        return;
      }

      if (e.key === "?" && !isInput) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setQuery("");
        setSelectedIndex(0);
        return;
      }

      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        return;
      }

      if (!isInput && !isOpen) {
        if (e.key === "t" || e.key === "T") {
          toggleTheme();
        }
      }

      if (isOpen) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev <= 0 ? (filtered.length || 1) - 1 : prev - 1
          );
        } else if (e.key === "Enter" && filtered[selectedIndex]) {
          e.preventDefault();
          filtered[selectedIndex].action();
          setIsOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filtered, selectedIndex, toggleTheme]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="command-title"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-lg surface-card rounded-2xl shadow-2xl p-4 space-y-3 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-2 pb-2 border-b border-[var(--border-default)]">
          <Search className="w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or jump to page..."
            className="w-full bg-transparent text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close command palette"
            className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command List */}
        <div className="max-h-72 overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <div className="text-center py-6 text-xs text-[var(--text-secondary)]">
              No matching commands
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[var(--accent-primary)] text-white"
                      : "bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-[var(--text-secondary)]"}`} />
                    <span className="font-medium">{cmd.label}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {cmd.shortcut && (
                      <kbd
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                          isSelected
                            ? "bg-white/20 border-white/30 text-white"
                            : "bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-tertiary)]"
                        }`}
                      >
                        {cmd.shortcut}
                      </kbd>
                    )}
                    <ArrowRight
                      className={`w-3 h-3 ${isSelected ? "text-white" : "text-[var(--text-tertiary)]"}`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-tertiary)] px-1">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="flex items-center gap-1 font-mono">
            <Command className="w-3 h-3" />
            <span>K</span>
          </span>
        </div>
      </div>
    </div>
  );
}
