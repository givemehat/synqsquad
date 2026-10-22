"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Listing, UserProfile } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { authFetch } from "@/lib/api-client";
import {
  X,
  Mail,
  Users,
  ShieldCheck,
  Check,
  Copy,
  AlertCircle,
  ExternalLink,
  Flag,
  Ban,
  Sparkles,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";

interface ListingDetailDrawerProps {
  listing: Listing | null;
  onClose: () => void;
}

type TemplateKey = "hackathon" | "research" | "skills" | "casual";

const generateTemplates = (listing: Listing, user: UserProfile | null) => {
  const recipient = listing.ownerName;
  const event = listing.event;
  const title = listing.title;
  const senderName = user?.name || "Fellow Builder";
  const senderRole = user?.role || "Developer";
  const senderSkills =
    user?.skills && user.skills.length > 0
      ? user.skills.slice(0, 3).join(", ")
      : listing.skillsNeeded.slice(0, 2).join(", ") || "software engineering";

  return {
    hackathon: {
      label: "Hackathon Teammate",
      badge: "Recommended",
      subject: `RIVQ: Teammate inquiry for ${event} — ${title}`,
      body: `Hi ${recipient},\n\nI saw your post for ${event} on RIVQ. I work as a ${senderRole} focusing on ${senderSkills}, and I would like to join your squad for "${title}".\n\nI have open bandwidth to build and I am happy to share my GitHub and past projects. Are you still looking for teammates?\n\nBest regards,\n${senderName}`,
    },
    research: {
      label: "Research Collaboration",
      badge: null,
      subject: `Collaboration inquiry: ${event} — ${title}`,
      body: `Hi ${recipient},\n\nI came across your requisition for ${event} ("${title}"). My technical background is in ${senderRole} with experience in ${senderSkills}.\n\nI am interested in collaborating on this research paper and contributing to the methodology and experiments. Would you be open to a brief chat to discuss?\n\nBest,\n${senderName}`,
    },
    skills: {
      label: "Skill-Specific Ask",
      badge: null,
      subject: `Hands-on ${senderSkills} for ${event}`,
      body: `Hi ${recipient},\n\nI noticed your team needs someone with hands-on experience in ${listing.skillsNeeded.slice(0, 2).join(", ")} for ${event}.\n\nI have built production projects using ${senderSkills} and can contribute immediately to the core architecture. Let me know if the slot is still open.\n\nRegards,\n${senderName}`,
    },
    casual: {
      label: "Short & Casual",
      badge: null,
      subject: `RIVQ: ${event} squad`,
      body: `Hi ${recipient},\n\nSaw your ${event} post on RIVQ. I do ${senderSkills} and would love to team up for this. Let's talk directly on Gmail.\n\nCheers,\n${senderName}`,
    },
  };
};

export function ListingDetailDrawer({ listing, onClose }: ListingDetailDrawerProps) {
  const { user, openAuthModal, addContactedId, blockUser } = useAuth();
  const [showComposer, setShowComposer] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>("hackathon");
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [isImprovingAi, setIsImprovingAi] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [unmaskedEmail, setUnmaskedEmail] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [mailtoUrl, setMailtoUrl] = useState<string | null>(null);
  const [gmailComposeUrl, setGmailComposeUrl] = useState<string | null>(null);

  // Initialize templates when listing or user changes
  useEffect(() => {
    if (listing) {
      const templates = generateTemplates(listing, user);
      const initial = templates[selectedTemplate];
      setCustomSubject(initial.subject);
      setCustomBody(initial.body);
    }
  }, [listing, user, selectedTemplate]);

  if (!listing) return null;

  const isFilled = listing.status === "filled";
  const templates = generateTemplates(listing, user);

  const handleSelectTemplate = (key: TemplateKey) => {
    setSelectedTemplate(key);
    setCustomSubject(templates[key].subject);
    setCustomBody(templates[key].body);
    setAiNotice(null);
  };

  const handleImproveWithAi = async () => {
    if (!user) {
      openAuthModal();
      return;
    }

    setIsImprovingAi(true);
    setAiNotice(null);

    try {
      const res = await authFetch("/api/ai/improve-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: customBody,
          templateType: selectedTemplate,
          recipientName: listing.ownerName,
          event: listing.event,
          userRole: user.role,
          userSkills: user.skills,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.message) {
        setCustomBody(data.message);
        setAiNotice("Message polished by AI. Still completely editable.");
      } else {
        // Silent fallback as requested by Task 3
        setAiNotice("Retaining template draft (AI service unavailable).");
      }
    } catch {
      setAiNotice("Retaining template draft.");
    } finally {
      setIsImprovingAi(false);
    }
  };

  const handleInitiateConnect = () => {
    setErrorNotice(null);
    setSuccessNotice(null);

    // If logged out, open Google Auth with exact copy and return right here
    if (!user) {
      openAuthModal(() => {
        setShowComposer(true);
      });
      return;
    }

    setShowComposer(true);
  };

  const handleFinalSendGmail = async () => {
    setErrorNotice(null);
    setSuccessNotice(null);

    if (!user) {
      openAuthModal();
      return;
    }

    setLoading(true);
    try {
      // 1. Call server to atomically record contact & retrieve unmasked recipient email
      const res = await authFetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to process connect");
      }

      const recipientEmail: string = data.data.recipientEmail;
      setUnmaskedEmail(recipientEmail);
      addContactedId(listing.id);

      // 2. Safe URL encoding for subject and body with length containment
      const safeSubject = encodeURIComponent(customSubject.slice(0, 150));
      const safeBody = encodeURIComponent(customBody.slice(0, 1500));

      const composeUrl = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(
        recipientEmail
      )}&su=${safeSubject}&body=${safeBody}`;

      const fallbackMail = `mailto:${recipientEmail}?subject=${safeSubject}&body=${safeBody}`;

      setGmailComposeUrl(composeUrl);
      setMailtoUrl(fallbackMail);

      // 3. Open Gmail in a new tab
      const win = window.open(composeUrl, "_blank");

      if (!win || win.closed || typeof win.closed === "undefined") {
        setSuccessNotice(
          "Gmail popup was blocked by browser. Use the copy button or mailto link below."
        );
      } else {
        setSuccessNotice(
          "Gmail compose opened in a new tab. Verified contact revealed below and saved to your Contacted list."
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not connect to Gmail";
      setErrorNotice(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyEmail = () => {
    if (!unmaskedEmail) return;
    navigator.clipboard.writeText(unmaskedEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[var(--bg-surface)] border-l border-[var(--border-default)] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-elevated)]">
          <div className="flex items-center gap-2">
            {showComposer && (
              <button
                type="button"
                onClick={() => setShowComposer(false)}
                className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors mr-1"
                title="Back to Requisition Details"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <span
              className={`w-2 h-2 rounded-full ${
                isFilled ? "bg-rose-500" : "bg-emerald-500"
              }`}
            />
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              {showComposer
                ? "Gmail Message Composer"
                : listing.type === "hackathon"
                ? "Hackathon Team"
                : listing.type === "research"
                ? "Research Collaboration"
                : "Solo Developer"}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!showComposer ? (
            /* STANDARD REQUISITION VIEW */
            <>
              {/* Title & Event */}
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-[var(--accent-primary)] mb-1.5">
                  <span>{listing.event}</span>
                  {listing.deadline && (
                    <>
                      <span className="text-[var(--text-tertiary)]">•</span>
                      <span className="text-[var(--text-secondary)] font-sans">
                        Deadline: {listing.deadline}
                      </span>
                    </>
                  )}
                </div>
                <h2
                  id="drawer-title"
                  className="text-lg sm:text-xl font-bold text-[var(--text-primary)] tracking-tight leading-snug"
                >
                  {listing.title}
                </h2>
              </div>

              {/* Slots & Status Notice */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span className="text-[var(--text-secondary)] font-medium">Open Collaborator Slots</span>
                </div>
                <span
                  className={`font-mono font-semibold px-2 py-0.5 rounded text-xs ${
                    isFilled
                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  }`}
                >
                  {isFilled ? "Team Full" : `${listing.slots} of ${listing.totalSlots} slots vacant`}
                </span>
              </div>

              {/* Lead Information */}
              <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider block">
                    Project Lead
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified Google Account</span>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Avatar src={listing.ownerPhoto} name={listing.ownerName} size={42} />
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)]">
                      {listing.ownerName}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {listing.ownerRole} • {listing.ownerCollege}
                    </p>
                  </div>
                </div>

                {/* Lead Gmail Pill: Blurred when unauthenticated, revealed when logged in */}
                <div className="pt-2 border-t border-[var(--border-subtle)]">
                  {user ? (
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)]">
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                        <span className="text-xs font-mono text-[var(--text-primary)] truncate">
                          {unmaskedEmail || listing.ownerEmail}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleInitiateConnect}
                        className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shrink-0 transition-colors cursor-pointer"
                      >
                        Email Lead
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => openAuthModal()}
                      className="cursor-pointer group p-2.5 rounded-lg bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 transition-all flex items-center justify-between"
                      title="Sign in with Google to reveal Gmail ID"
                    >
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono filter blur-[5px] select-none text-[var(--text-primary)]">
                            lead.contact@gmail.com
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-blue-500 flex items-center gap-1 group-hover:underline">
                        <span>Sign in to reveal Gmail</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Project Details */}
              <div>
                <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
                  Project Description & Requirements
                </h4>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line font-normal">
                  {listing.description}
                </p>
              </div>

              {/* Required Skills */}
              <div>
                <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
                  Skills Wanted
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {listing.skillsNeeded.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-md text-xs font-mono bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-default)]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* GMAIL TEMPLATES & COMPOSER PANEL */
            <div className="space-y-5 animate-in fade-in duration-150">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Reach out to {listing.ownerName}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Choose an introductory template, personalize your message, and launch Gmail compose.
                </p>
              </div>

              {/* 4 Template Options */}
              <div className="space-y-2">
                <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider block">
                  Select Template
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(templates) as TemplateKey[]).map((key) => {
                    const tpl = templates[key];
                    const isSelected = selectedTemplate === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleSelectTemplate(key)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all relative ${
                          isSelected
                            ? "bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] text-[var(--text-primary)] font-semibold"
                            : "bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        <div className="truncate">{tpl.label}</div>
                        {tpl.badge && (
                          <span className="text-[9px] font-mono text-[var(--accent-primary)] block mt-0.5">
                            {tpl.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subject Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider block">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={customSubject}
                  maxLength={150}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none"
                />
              </div>

              {/* Message Body Editor */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider block">
                    Message Body
                  </label>
                  <button
                    type="button"
                    onClick={handleImproveWithAi}
                    disabled={isImprovingAi}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--accent-primary)] hover:underline disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{isImprovingAi ? "Polishing..." : "Improve with AI"}</span>
                  </button>
                </div>

                <textarea
                  rows={8}
                  value={customBody}
                  maxLength={1500}
                  onChange={(e) => setCustomBody(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] leading-relaxed focus:outline-none resize-none font-sans"
                />

                <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)] font-mono">
                  <span>{aiNotice || "Tone: polite, short, specific"}</span>
                  <span>{customBody.length} / 1500</span>
                </div>
              </div>

              {/* Editable Disclosure Notice */}
              <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)] leading-relaxed">
                This message is completely editable. When you click <strong>Open in Gmail</strong>, it launches your own Gmail compose tab with this draft.
              </div>
            </div>
          )}

          {/* Feedback & Error alerts */}
          {errorNotice && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorNotice}</span>
            </div>
          )}

          {successNotice && (
            <div
              role="status"
              className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2"
            >
              <Check className="w-4 h-4 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Unmasked Email Fallbacks (Copy Email & Mailto) */}
          {unmaskedEmail && (
            <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-3">
                <div className="truncate">
                  <span className="text-[10px] text-[var(--text-tertiary)] block uppercase tracking-wider">
                    Verified Gmail Address
                  </span>
                  <span className="text-[var(--text-primary)] font-mono font-medium">{unmaskedEmail}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-overlay)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs font-mono flex items-center gap-1.5 transition-colors min-h-[36px]"
                >
                  {copiedEmail ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Email</span>
                    </>
                  )}
                </button>
              </div>

              {gmailComposeUrl && (
                <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px]">
                  <span className="text-[var(--text-tertiary)]">Popup blocked or tab closed?</span>
                  <a
                    href={gmailComposeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[var(--accent-primary)] hover:underline font-medium"
                  >
                    <span>Launch Web Gmail</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {mailtoUrl && (
                <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px]">
                  <span className="text-[var(--text-tertiary)]">Prefer local mail client?</span>
                  <a
                    href={mailtoUrl}
                    className="inline-flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline font-medium"
                  >
                    <span>Open in Local Mail</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* UGC Community Safety Controls: Report & Block */}
          {!showComposer && (
            <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-tertiary)]">
              <Link
                href={`/report?id=${encodeURIComponent(listing.id)}`}
                className="hover:text-rose-500 flex items-center gap-1.5 transition-colors min-h-[36px] py-1 px-2 rounded-lg hover:bg-[var(--bg-elevated)]"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Report Requisition</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      `Block ${listing.ownerName}? All requisitions from this creator will be hidden from your feed.`
                    )
                  ) {
                    blockUser(listing.ownerEmail);
                    onClose();
                  }
                }}
                className="hover:text-rose-500 flex items-center gap-1.5 transition-colors min-h-[36px] py-1 px-2 rounded-lg hover:bg-[var(--bg-elevated)]"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Block Creator</span>
              </button>
            </div>
          )}
        </div>

        {/* Action Button Bar (44px+ touch target) */}
        <div className="p-4 border-t border-[var(--border-default)] bg-[var(--bg-elevated)] sticky bottom-0">
          {!showComposer ? (
            <button
              type="button"
              onClick={handleInitiateConnect}
              disabled={isFilled}
              className={`w-full h-12 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
                isFilled
                  ? "bg-[var(--bg-surface)] text-[var(--text-tertiary)] cursor-not-allowed border border-[var(--border-default)]"
                  : "bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] active:opacity-90 text-white"
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>{isFilled ? "Team Already Filled" : "Connect on Gmail"}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSendGmail}
              disabled={loading || isFilled || !customBody.trim()}
              className="w-full h-12 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] active:opacity-90 text-white disabled:opacity-50"
            >
              <Mail className="w-4 h-4" />
              <span>{loading ? "Launching Gmail..." : "Open in Gmail"}</span>
            </button>
          )}

          <span className="text-[11px] text-[var(--text-tertiary)] block text-center mt-2">
            {!showComposer
              ? "One person finds one person. You will talk directly on Gmail."
              : "Pre-fills compose window with this draft. Review and send from your Gmail."}
          </span>
        </div>
      </div>
    </div>
  );
}
