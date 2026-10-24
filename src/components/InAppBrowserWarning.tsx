"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, Copy, Check, ExternalLink, X, Share2, MoreVertical } from "lucide-react";
import { detectInAppBrowser, InAppBrowserInfo } from "@/lib/browser-detect";

export function InAppBrowserWarning() {
  const [info, setInfo] = useState<InAppBrowserInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    try {
      if (sessionStorage.getItem("rivq_inapp_dismissed") === "true") {
        setDismissed(true);
      }
    } catch {
      // sessionStorage unavailable
    }

    const detected = detectInAppBrowser();
    if (detected.isInAppBrowser) {
      setInfo(detected);
    }
  }, []);

  if (!info || !info.isInAppBrowser || dismissed) {
    return null;
  }

  const handleCopy = async () => {
    try {
      const url = window.location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem("rivq_inapp_dismissed", "true");
    } catch {
      // Ignore
    }
  };

  const targetBrowser = info.systemBrowserRecommendation;

  return (
    <aside
      role="region"
      aria-label="In-app browser warning"
      className="bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-3 sticky top-0 z-50 shadow-sm backdrop-blur-md"
    >
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-start gap-2.5">
          <div className="p-1 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-amber-950 dark:text-amber-100 flex items-center gap-1.5 flex-wrap">
              <span>Opened inside {info.browserName}</span>
              <span className="text-[11px] font-normal px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300">
                OAuth Notice
              </span>
            </p>
            <p className="mt-0.5 text-amber-900/90 dark:text-amber-200/90 leading-relaxed text-xs">
              Google blocks sign-in inside in-app browsers. Please tap the{" "}
              <span className="inline-flex items-center font-semibold mx-0.5">
                <MoreVertical className="w-3 h-3 inline" />
              </span>{" "}
              (or{" "}
              <span className="inline-flex items-center font-semibold mx-0.5">
                <Share2 className="w-3 h-3 inline" />
              </span>{" "}
              share icon) at the top-right and choose{" "}
              <strong className="underline underline-offset-2">
                &apos;Open in {targetBrowser}&apos;
              </strong>{" "}
              to connect seamlessly.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 dark:bg-amber-500 text-white font-medium text-xs hover:bg-amber-700 dark:hover:bg-amber-600 transition-colors shadow-xs"
            aria-label="Copy link to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss in-app browser notice"
            className="p-1.5 rounded-md text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
