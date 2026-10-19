import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

export const metadata = {
  title: "How It Works | SynqSquad",
  description: "Find your hackathon or research partner and connect directly on Gmail in 3 simple steps.",
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] px-4 py-12 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors min-h-[36px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Feed</span>
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
            How SynqSquad Works
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Zero chat inboxes. Zero spam. One-click introduction directly in your native Gmail.
          </p>
        </div>

        <div className="space-y-6">
          {/* Step 1 */}
          <div className="p-5 rounded-2xl surface-card space-y-2">
            <div className="flex items-center gap-2 text-[var(--accent-primary)] font-mono text-xs font-semibold">
              <span className="w-5 h-5 rounded-full bg-[var(--accent-muted)] flex items-center justify-center">1</span>
              <span>Browse Open Squads</span>
            </div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              Filter by Hackathon, Domain, or Required Skill
            </h2>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Explore teams currently recruiting for competitions like Smart India Hackathon 2026, ETHGlobal, and NeurIPS workshops. You can browse completely without logging in.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-5 rounded-2xl surface-card space-y-2">
            <div className="flex items-center gap-2 text-[var(--accent-primary)] font-mono text-xs font-semibold">
              <span className="w-5 h-5 rounded-full bg-[var(--accent-muted)] flex items-center justify-center">2</span>
              <span>Sign in with Google</span>
            </div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              Verified Identity with Minimum Scopes
            </h2>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              When you click &quot;Connect on Gmail&quot;, we prompt a quick Google authentication so creators know your inquiry is coming from a genuine, verified collaborator. We never request permission to read or send mail on your behalf.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-5 rounded-2xl surface-card space-y-2">
            <div className="flex items-center gap-2 text-[var(--accent-primary)] font-mono text-xs font-semibold">
              <span className="w-5 h-5 rounded-full bg-[var(--accent-muted)] flex items-center justify-center">3</span>
              <span>Talk Directly on Gmail</span>
            </div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              Prefilled, Human Outreach Draft
            </h2>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              A native Gmail compose tab opens automatically with a polite introductory draft highlighting your role, college, and matching skills. You can review or edit before pressing send. The conversation stays in your inbox forever.
            </p>
          </div>
        </div>

        <div className="pt-4 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-semibold text-xs transition-colors min-h-[44px]"
          >
            <span>Explore Active Listings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
