"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [retrying, setRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Log sanitized error internally without exposing raw traces to users
    console.error("Application error boundary captured:", error.digest || error.message);
  }, [error]);

  const handleRetryWithBackoff = () => {
    setRetrying(true);
    // Exponential backoff delay
    const delay = Math.min(1000 * Math.pow(1.5, retryCount), 4000);
    setTimeout(() => {
      setRetrying(false);
      setRetryCount((prev) => prev + 1);
      reset();
    }, delay);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] px-4 flex items-center justify-center transition-colors">
      <div className="surface-card rounded-2xl max-w-md w-full p-8 text-center space-y-4">
        <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-5 h-5" />
        </div>

        <div className="space-y-1">
          <span className="font-mono text-xs text-red-500 font-semibold">
            ERROR 500
          </span>
          <h1 className="text-lg font-bold text-[var(--text-primary)]">
            Something went wrong
          </h1>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            We encountered an unexpected condition while loading this view. You can retry with backoff or return to the feed.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={handleRetryWithBackoff}
            disabled={retrying}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-xs transition-colors min-h-[44px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${retrying ? "animate-spin" : ""}`} />
            <span>{retrying ? "Retrying with backoff..." : "Try Again"}</span>
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
