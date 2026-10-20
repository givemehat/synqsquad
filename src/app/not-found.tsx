import React from "react";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export const metadata = {
  title: "404 - Page Not Found | SynqSquad",
  description: "The requested listing or page does not exist or has expired.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] px-4 flex items-center justify-center transition-colors">
      <div className="surface-card rounded-2xl max-w-md w-full p-8 text-center space-y-4">
        <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-center mx-auto text-[var(--text-tertiary)]">
          <Search className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <span className="font-mono text-xs text-[var(--accent-primary)] font-semibold">
            ERROR 404
          </span>
          <h1 className="text-lg font-bold text-[var(--text-primary)]">
            Page or Requisition Not Found
          </h1>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            The page you requested may have been removed, filled, or expired after 30 days.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-xs transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Listings Feed</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
