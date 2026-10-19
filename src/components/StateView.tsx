"use client";

import React from "react";
import {
  AlertTriangle,
  RefreshCw,
  Search,
  WifiOff,
  Clock,
  ShieldAlert,
  Inbox,
  Lock,
} from "lucide-react";
import { ScreenState } from "@/types";

interface StateViewProps {
  state: ScreenState;
  onRetry?: () => void;
  onResetFilters?: () => void;
  onSignIn?: () => void;
  customMessage?: string;
  className?: string;
}

export function StateView({
  state,
  onRetry,
  onResetFilters,
  onSignIn,
  customMessage,
  className = "",
}: StateViewProps) {
  if (state === "idle") return null;

  if (state === "loading") {
    return (
      <div
        role="status"
        aria-label="Loading listings"
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}
      >
        {[1, 2, 3, 4, 5, 6].map((idx) => (
          <div
            key={idx}
            className="h-64 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-5 flex flex-col justify-between animate-pulse"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)]" />
                  <div className="space-y-1">
                    <div className="w-24 h-3 bg-[var(--bg-elevated)] rounded" />
                    <div className="w-16 h-2.5 bg-[var(--bg-elevated)] rounded" />
                  </div>
                </div>
                <div className="w-14 h-4 bg-[var(--bg-elevated)] rounded" />
              </div>
              <div className="w-3/4 h-4 bg-[var(--bg-elevated)] rounded mt-4" />
              <div className="w-full h-3 bg-[var(--bg-elevated)] rounded" />
              <div className="w-5/6 h-3 bg-[var(--bg-elevated)] rounded" />
            </div>
            <div className="pt-3 border-t border-[var(--border-subtle)] flex justify-between">
              <div className="w-20 h-3 bg-[var(--bg-elevated)] rounded" />
              <div className="w-12 h-3 bg-[var(--bg-elevated)] rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (state === "empty") {
    return (
      <div
        className={`text-center py-16 px-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] max-w-md mx-auto space-y-3 ${className}`}
      >
        <div className="w-9 h-9 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center mx-auto text-[var(--text-tertiary)]">
          <Inbox className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          No requirements posted yet
        </h3>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          {customMessage || "Be the first to publish a hackathon project or research paper need."}
        </p>
      </div>
    );
  }

  if (state === "no_results") {
    return (
      <div
        className={`text-center py-16 px-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] max-w-md mx-auto space-y-3 ${className}`}
      >
        <div className="w-9 h-9 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center mx-auto text-[var(--text-tertiary)]">
          <Search className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          No matches found
        </h3>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          {customMessage || "No listings match your search or skill filter. Try adjusting your search query."}
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)] text-[var(--text-primary)] text-xs font-medium border border-[var(--border-default)] transition-colors"
          >
            Reset Filters
          </button>
        )}
      </div>
    );
  }

  if (state === "error") {
    return (
      <div
        role="alert"
        className={`text-center py-16 px-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] max-w-md mx-auto space-y-3 ${className}`}
      >
        <div className="w-9 h-9 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Unable to load data
        </h3>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          {customMessage || "We encountered a temporary network issue. Cached listings remain readable."}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        )}
      </div>
    );
  }

  if (state === "offline") {
    return (
      <div
        role="status"
        className={`text-center py-16 px-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] max-w-md mx-auto space-y-3 ${className}`}
      >
        <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
          <WifiOff className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          You are currently offline
        </h3>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          Please check your internet connection. New outreach requests and postings require network connectivity.
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)] text-[var(--text-primary)] text-xs font-medium border border-[var(--border-default)] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Check Connection</span>
          </button>
        )}
      </div>
    );
  }

  if (state === "session_expired") {
    return (
      <div
        role="alert"
        className={`text-center py-16 px-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] max-w-md mx-auto space-y-3 ${className}`}
      >
        <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
          <Clock className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Session Expired
        </h3>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          Your Google authentication session has expired. Sign in again to continue connecting on Gmail.
        </p>
        {onSignIn && (
          <button
            type="button"
            onClick={onSignIn}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-sm transition-colors"
          >
            Sign in with Google
          </button>
        )}
      </div>
    );
  }

  if (state === "rate_limited") {
    return (
      <div
        role="alert"
        className={`text-center py-16 px-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] max-w-md mx-auto space-y-3 ${className}`}
      >
        <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Daily Outreach Quota Reached
        </h3>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          You have reached your 10 contacts per day limit. This protects project leads from automated mass spam. Your quota resets at midnight.
        </p>
      </div>
    );
  }

  if (state === "permission_denied") {
    return (
      <div
        role="alert"
        className={`text-center py-16 px-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] max-w-md mx-auto space-y-3 ${className}`}
      >
        <div className="w-9 h-9 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
          <Lock className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Permission Denied
        </h3>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          You do not have authorization to edit or delete this listing. Only the verified creator who published it may modify its status.
        </p>
      </div>
    );
  }

  return null;
}
