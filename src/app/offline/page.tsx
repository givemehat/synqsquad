"use client";

import React from "react";
import Link from "next/link";
import { WifiOff, RefreshCw, Home } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] px-4 flex items-center justify-center transition-colors">
      <div className="surface-card rounded-2xl max-w-md w-full p-8 text-center space-y-4">
        <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
          <WifiOff className="w-5 h-5" />
        </div>

        <div className="space-y-1">
          <h1 className="text-lg font-bold text-[var(--text-primary)]">
            You Are Offline
          </h1>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            SynqSquad requires an active internet connection to contact leads on Gmail and publish new requirements.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-xs transition-colors min-h-[44px]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Check Connection</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs font-medium transition-colors min-h-[44px]"
          >
            <Home className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span>Feed</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
