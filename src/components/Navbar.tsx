"use client";

import React from "react";
import Link from "next/link";
import { Plus, Sun, Moon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Avatar } from "@/components/Avatar";

interface NavbarProps {
  onOpenCreate: () => void;
  onOpenProfile: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Navbar({ onOpenCreate, onOpenProfile, activeTab, setActiveTab }: NavbarProps) {
  const { user, openAuthModal } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-default)] bg-[var(--bg-canvas)]/90 backdrop-blur-md transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand Logo & Tag */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            onClick={() => setActiveTab("all")}
            className="flex items-center gap-2.5 cursor-pointer text-inherit no-underline group"
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-[var(--border-subtle)] shadow-sm flex items-center justify-center bg-black">
              <img
                src="/logo.png"
                alt="SynqSquad Logo"
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
            </div>
            <span className="font-bold text-base tracking-tight text-[var(--text-primary)]">
              SynqSquad
            </span>
          </Link>

          {/* Clean Navigation Control */}
          <nav className="hidden sm:flex items-center gap-1 text-xs">
            <Link
              href="/"
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab !== "people"
                  ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-default)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Requisitions
            </Link>
            <Link
              href="/people"
              onClick={() => setActiveTab("people")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === "people"
                  ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-default)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Find Squadmates
            </Link>
          </nav>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Persistent Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} theme`}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] transition-colors"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* Post Requirement Button */}
          <button
            type="button"
            onClick={() => {
              if (!user) {
                openAuthModal(() => onOpenCreate());
              } else {
                onOpenCreate();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)] text-[var(--text-primary)] text-xs font-medium border border-[var(--border-default)] transition-colors min-h-[36px]"
          >
            <Plus className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span>Post</span>
          </button>

          {/* User Profile or Google Sign In */}
          {user ? (
            <button
              type="button"
              onClick={onOpenProfile}
              className="flex items-center gap-2 p-1 pl-2 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)] border border-[var(--border-default)] transition-colors min-h-[36px]"
            >
              <span className="text-xs text-[var(--text-secondary)] font-medium max-w-[100px] truncate hidden sm:inline">
                {user.name.split(" ")[0]}
              </span>
              <Avatar src={user.photo} name={user.name} size={24} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal()}
              className="px-3.5 py-1.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-sm transition-colors min-h-[36px]"
            >
              Sign in with Google
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
