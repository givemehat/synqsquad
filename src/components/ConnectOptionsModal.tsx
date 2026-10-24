"use client";

import React, { useState } from "react";
import { Mail, ExternalLink, Copy, Check, X, Smartphone, ArrowRight, ShieldCheck } from "lucide-react";

export interface ConnectOptionsProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
  recipientEmail: string;
  subject: string;
  body: string;
  remainingToday?: number;
  title?: string;
}

export function ConnectOptionsModal({
  isOpen,
  onClose,
  recipientName,
  recipientEmail,
  subject,
  body,
  remainingToday,
  title = "Choose How to Connect",
}: ConnectOptionsProps) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  if (!isOpen) return null;

  // Safe URI encoding
  const safeSubject = encodeURIComponent(subject.slice(0, 150));
  const safeBody = encodeURIComponent(body.slice(0, 2000));

  const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    recipientEmail
  )}&su=${safeSubject}&body=${safeBody}`;

  const mailtoUrl = `mailto:${recipientEmail}?subject=${safeSubject}&body=${safeBody}`;

  const copyToClipboard = async (text: string, onDone: () => void) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      onDone();
    } catch {
      // Fallback
    }
  };

  const handleCopyEmailOnly = () => {
    copyToClipboard(recipientEmail, () => {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    });
  };

  const handleCopyAll = () => {
    const formatted = `To: ${recipientEmail}\nSubject: ${subject}\n\n${body}`;
    copyToClipboard(formatted, () => {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="connect-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-lg bg-[var(--bg-canvas)] border border-[var(--border-default)] rounded-2xl shadow-2xl overflow-hidden text-[var(--text-primary)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 id="connect-modal-title" className="font-bold text-sm sm:text-base">
                {title}
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Connect directly with {recipientName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close connect modal"
            className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Verified Contact Card */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Verified Google Email</span>
              </div>
              <p className="font-mono text-xs sm:text-sm font-semibold truncate mt-0.5 select-all">
                {recipientEmail}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyEmailOnly}
              className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] text-xs font-medium transition-colors"
              aria-label="Copy email address"
            >
              {copiedEmail ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Connect Actions */}
          <div className="space-y-2.5 pt-1">
            {/* 1. Primary Action: Open in Gmail */}
            <a
              href={gmailComposeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm shadow-xs transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/15">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-semibold flex items-center gap-1.5">
                    <span>Open in Gmail (Web)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/20 font-normal">
                      Primary
                    </span>
                  </div>
                  <div className="text-[11px] text-blue-100/80">
                    Opens web Gmail with prefilled subject & message
                  </div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 opacity-75 group-hover:opacity-100 transition-opacity" />
            </a>

            {/* 2. Native Mailto: Default Mail App */}
            <a
              href={mailtoUrl}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-canvas)] font-medium text-xs sm:text-sm transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-[var(--text-primary)]">
                    Open in Default Mail App
                  </div>
                  <div className="text-[11px] text-[var(--text-tertiary)]">
                    Apple Mail, Outlook, or native mobile client
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors" />
            </a>

            {/* 3. One-Tap Clipboard: Copy Email & Template */}
            <button
              type="button"
              onClick={handleCopyAll}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-canvas)] font-medium text-xs sm:text-sm transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                  {copiedAll ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                    <span>Copy Email & Template Message</span>
                    {copiedAll && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold">
                        Copied to Clipboard!
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[var(--text-tertiary)]">
                    Paste directly into any email compose window
                  </div>
                </div>
              </div>
              <span className="text-xs text-[var(--accent-primary)] font-medium">
                {copiedAll ? "Done" : "Copy"}
              </span>
            </button>
          </div>

          {/* Template Preview Accordion */}
          <div className="pt-2 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] flex items-center justify-between w-full font-medium"
            >
              <span>{showPreview ? "Hide prefilled message" : "View prefilled message"}</span>
              <span>{showPreview ? "−" : "+"}</span>
            </button>
            {showPreview && (
              <div className="mt-2 p-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] space-y-1.5 max-h-36 overflow-y-auto">
                <div>
                  <strong className="text-[var(--text-primary)]">Subject:</strong> {subject}
                </div>
                <div className="whitespace-pre-wrap font-mono text-[11px] text-[var(--text-tertiary)] pt-1 border-t border-[var(--border-subtle)]">
                  {body}
                </div>
              </div>
            )}
          </div>

          {typeof remainingToday === "number" && (
            <div className="text-center text-[11px] text-[var(--text-tertiary)] font-mono">
              Daily connects remaining today:{" "}
              <strong className="text-[var(--text-primary)]">{remainingToday}/10</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
