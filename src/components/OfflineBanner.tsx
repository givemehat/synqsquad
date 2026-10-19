"use client";

import React, { useSyncExternalStore } from "react";
import { WifiOff, RefreshCw } from "lucide-react";

function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

function getOnlineServerSnapshot(): boolean {
  return true;
}

export function OfflineBanner() {
  const isOnline = useSyncExternalStore(
    subscribeOnline,
    getOnlineSnapshot,
    getOnlineServerSnapshot
  );

  if (isOnline) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      className="bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-400 px-4 py-2 text-xs flex items-center justify-between z-50 sticky top-0"
    >
      <div className="flex items-center gap-2 max-w-6xl mx-auto w-full">
        <WifiOff className="w-4 h-4 shrink-0" />
        <span className="font-medium">
          You are currently offline. Cached listings remain readable. Connecting on Gmail and posting require an active connection.
        </span>
        <button
          onClick={() => window.location.reload()}
          className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 font-medium text-[11px] transition-colors shrink-0"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Retry</span>
        </button>
      </div>
    </aside>
  );
}
