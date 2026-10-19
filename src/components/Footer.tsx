import React from "react";
import Link from "next/link";
import { Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--border-default)] bg-[var(--bg-canvas)] text-[var(--text-tertiary)] text-xs py-10 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-bold flex items-center justify-center text-[11px]">
              S
            </div>
            <span className="font-semibold text-[var(--text-primary)]">SynqSquad</span>
            <span className="text-[var(--text-tertiary)]">•</span>
            <span className="text-[var(--text-secondary)]">
              Direct collaborator matchmaking on verified Gmail.
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
            <Shield className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>Google OAuth verified. No external messaging.</span>
          </div>
        </div>

        {/* Navigation directory */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[var(--border-subtle)] text-[11px]">
          <div className="space-y-2">
            <span className="font-semibold text-[var(--text-secondary)] uppercase tracking-wider block text-[10px]">
              Platform
            </span>
            <ul className="space-y-1.5 list-none p-0 m-0">
              <li>
                <Link href="/" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                  Feed & Search
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <span className="font-semibold text-[var(--text-secondary)] uppercase tracking-wider block text-[10px]">
              Support & Help
            </span>
            <ul className="space-y-1.5 list-none p-0 m-0">
              <li>
                <Link href="/faq" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                  Help & Grievance Officer
                </Link>
              </li>
              <li>
                <Link href="/report" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                  Report Listing or Abuse
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <span className="font-semibold text-[var(--text-secondary)] uppercase tracking-wider block text-[10px]">
              Compliance & Legal
            </span>
            <ul className="space-y-1.5 list-none p-0 m-0">
              <li>
                <Link href="/privacy" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                  Privacy Policy (DPDP / GDPR)
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/disclaimers" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                  Disclaimers
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <span className="font-semibold text-[var(--text-secondary)] uppercase tracking-wider block text-[10px]">
              Standards
            </span>
            <ul className="space-y-1.5 list-none p-0 m-0">
              <li>
                <Link href="/guidelines" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link href="/settings" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                  Theme & Preferences
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                  Manage Account & Data
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between text-[11px] gap-2">
          <span>&copy; {new Date().getFullYear()} SynqSquad. Neutral technological intermediary.</span>
          <span className="font-mono text-[10px]">DPDP Act 2023 & GDPR Compliant</span>
        </div>
      </div>
    </footer>
  );
}
