"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, Moon, Sun, Monitor, Bell, Shield, Download, FileText, Check, UserX } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";

function subscribePrompt(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getPromptSnapshot(): boolean {
  try {
    const stored = localStorage.getItem("synqsquad_compose_prompt");
    return stored !== null ? stored === "true" : true;
  } catch {
    return true;
  }
}

function getPromptServerSnapshot(): boolean {
  return true;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, blockedUsers, unblockUser } = useAuth();
  const composePrompt = useSyncExternalStore(
    subscribePrompt,
    getPromptSnapshot,
    getPromptServerSnapshot
  );
  const [savedNotice, setSavedNotice] = useState(false);

  const handleToggleComposePrompt = () => {
    const nextVal = !composePrompt;
    try {
      localStorage.setItem("synqsquad_compose_prompt", String(nextVal));
      window.dispatchEvent(new Event("storage"));
    } catch {
      // ignore
    }
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] px-4 py-8 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors min-h-[36px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Feed</span>
        </Link>

        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Preferences & Settings
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Manage your display theme, outreach settings, and privacy preferences.
          </p>
        </div>

        {/* Section 1: Appearance */}
        <div className="surface-card rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              Appearance
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Choose your interface color scheme. RIVQ uses warm near-black for dark mode and high-contrast editorial gray for light mode.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-medium transition-colors min-h-[72px] ${
                theme === "dark"
                  ? "border-[var(--accent-primary)] bg-[var(--accent-muted)] text-[var(--text-primary)] font-semibold"
                  : "border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>Dark Theme</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-medium transition-colors min-h-[72px] ${
                theme === "light"
                  ? "border-[var(--accent-primary)] bg-[var(--accent-muted)] text-[var(--text-primary)] font-semibold"
                  : "border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>Light Theme</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme("system")}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-medium transition-colors min-h-[72px] ${
                theme === "system"
                  ? "border-[var(--accent-primary)] bg-[var(--accent-muted)] text-[var(--text-primary)] font-semibold"
                  : "border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>Match System</span>
            </button>
          </div>
        </div>

        {/* Section 2: Email & Outreach Hygiene */}
        <div className="surface-card rounded-2xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>Outreach & Email Hygiene</span>
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                RIVQ does not send marketing digests, uninvited newsletters, or intermediary emails. All communication happens exclusively between verified Google accounts on Gmail.
              </p>
            </div>
            {savedNotice && (
              <span className="text-xs text-emerald-500 flex items-center gap-1 shrink-0">
                <Check className="w-3.5 h-3.5" />
                <span>Saved</span>
              </span>
            )}
          </div>

          <div className="pt-2 border-t border-[var(--border-default)] flex items-center justify-between">
            <div>
              <h3 className="text-xs font-medium text-[var(--text-primary)]">
                Pre-fill respectful introductory template in Gmail
              </h3>
              <p className="text-[11px] text-[var(--text-tertiary)]">
                Automatically populate the collaborator title, event, and your verified role in the compose window.
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleComposePrompt}
              aria-label="Toggle Gmail pre-fill template"
              className={`w-11 h-6 rounded-full transition-colors relative min-h-[24px] ${
                composePrompt
                  ? "bg-[var(--accent-primary)]"
                  : "bg-[var(--bg-elevated)] border border-[var(--border-default)]"
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                  composePrompt ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Section 3: Data & Compliance Rights */}
        <div className="surface-card rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-500" />
              <span>Data & Compliance Rights</span>
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Compliant with India&apos;s Digital Personal Data Protection (DPDP) Act 2023 and GDPR.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Link
              href="/privacy"
              className="p-3 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)] border border-[var(--border-default)] flex items-center justify-between text-xs transition-colors min-h-[44px]"
            >
              <span className="text-[var(--text-secondary)]">Review Privacy Policy</span>
              <FileText className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            </Link>

            <Link
              href="/terms"
              className="p-3 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)] border border-[var(--border-default)] flex items-center justify-between text-xs transition-colors min-h-[44px]"
            >
              <span className="text-[var(--text-secondary)]">Terms of Service</span>
              <FileText className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            </Link>

            {user && (
              <a
                href={`/api/user/export?email=${encodeURIComponent(user.email)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)] border border-[var(--border-default)] flex items-center justify-between text-xs transition-colors min-h-[44px]"
              >
                <span className="text-[var(--text-secondary)]">Download My Data (JSON)</span>
                <Download className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              </a>
            )}

            <Link
              href="/profile"
              className="p-3 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)] border border-[var(--border-default)] flex items-center justify-between text-xs transition-colors min-h-[44px]"
            >
              <span className="text-[var(--text-secondary)]">Manage or Delete Account</span>
              <Shield className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            </Link>
          </div>
        </div>

        {/* Section 4: Blocked Creators & Safety (UGC Policy) */}
        <div className="surface-card rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-1.5">
              <UserX className="w-3.5 h-3.5 text-rose-500" />
              <span>Blocked Creators &amp; Moderation</span>
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Creators you block cannot contact you, and their requisitions are hidden from your feed across all your devices.
            </p>
          </div>

          <div className="pt-2 border-t border-[var(--border-default)]">
            {!user ? (
              <p className="text-xs text-[var(--text-tertiary)]">
                Sign in to view and manage your cross-device blocked creators list.
              </p>
            ) : blockedUsers.length === 0 ? (
              <p className="text-xs text-[var(--text-tertiary)] py-2">
                No creators currently blocked. You can block any creator directly from their requisition card drawer.
              </p>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {blockedUsers.map((blockedEmail) => (
                  <div
                    key={blockedEmail}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-6 h-6 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-tertiary)] shrink-0">
                        <UserX className="w-3 h-3" />
                      </div>
                      <span className="font-mono text-[var(--text-primary)] truncate">
                        {blockedEmail}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => unblockUser(blockedEmail)}
                      className="px-2.5 py-1 rounded-lg border border-[var(--border-default)] hover:border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium text-[11px] transition-colors shrink-0 min-h-[32px]"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
