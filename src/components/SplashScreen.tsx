"use client";

import React, { useEffect, useState } from "react";

export function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    // Check if splash was already shown in this browser session
    try {
      const shown = sessionStorage.getItem("synqsquad_splash_shown");
      if (shown) {
        return;
      }
    } catch {
      // If sessionStorage is restricted (e.g. private mode iframe), skip splash
      return;
    }

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      try {
        sessionStorage.setItem("synqsquad_splash_shown", "1");
      } catch {
        /* ignore */
      }
      return;
    }

    // First load in session: show splash
    setVisible(true);

    const startTime = performance.now();
    const minDuration = 800; // Minimum 800ms so it does not flash
    const maxDuration = 2000; // Maximum 2s cap

    // Smooth progress line animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 15;
      });
    }, 150);

    const completeSplash = () => {
      clearInterval(progressInterval);
      setProgress(100);

      const elapsed = performance.now() - startTime;
      const remaining = Math.max(0, minDuration - elapsed);

      setTimeout(() => {
        setFading(true);
        setTimeout(() => {
          setVisible(false);
          try {
            sessionStorage.setItem("synqsquad_splash_shown", "1");
          } catch {
            /* ignore */
          }
        }, 180);
      }, remaining);
    };

    // If page is already loaded or finishes loading
    if (document.readyState === "complete") {
      completeSplash();
    } else {
      window.addEventListener("load", completeSplash, { once: true });
      // Fallback max duration safety timer
      const maxTimer = setTimeout(completeSplash, maxDuration);
      return () => {
        clearInterval(progressInterval);
        clearTimeout(maxTimer);
        window.removeEventListener("load", completeSplash);
      };
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg-canvas)] transition-opacity duration-180 ease-out select-none ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-4 max-w-xs w-full px-6 text-center">
        {/* Brand Mark */}
        <div className="w-12 h-12 rounded-xl bg-[var(--accent-primary)] flex items-center justify-center text-white font-bold text-xl shadow-xs">
          S
        </div>

        {/* Brand Name & USP Subtitle */}
        <div className="space-y-1">
          <h1 className="font-bold text-lg tracking-tight text-[var(--text-primary)]">
            SynqSquad
          </h1>
          <p className="text-xs text-[var(--text-secondary)] font-medium">
            Find your one teammate. Talk on Gmail.
          </p>
        </div>

        {/* Subtle Progress Line */}
        <div className="w-40 h-1 bg-[var(--border-subtle)] rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
