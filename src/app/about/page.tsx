import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export const metadata = {
  title: "About | SynqSquad",
  description: "The origin and mission behind SynqSquad: direct collaborator matching on verified Gmail.",
};

export default function AboutPage() {
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
            About SynqSquad
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Built by engineers and researchers frustrated with broken team discovery channels.
          </p>
        </div>

        <div className="space-y-5 text-xs text-[var(--text-secondary)] leading-relaxed">
          <p>
            Every year, thousands of talented engineers and students enter high-stakes tournaments like the Smart India Hackathon, ETHGlobal, and international academic workshops. Yet the single biggest failure point remains consistent: <strong>solo builders struggling to find complementary talent in time.</strong>
          </p>

          <p>
            Public chat rooms are noisy and chaotic. Ephemeral channels get inundated with promotional spam. Existing matchmaking apps force users into artificial internal chat systems that nobody monitors once the browser tab is closed.
          </p>

          <p>
            <strong>SynqSquad takes the opposite approach:</strong> We act as an ultra-clean, verified introduction directory. You find the exact profile you need in under 30 seconds, click &quot;Connect on Gmail&quot;, and conversation flows into your native, searchable email inbox.
          </p>

          <div className="p-5 rounded-2xl surface-card space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[var(--accent-primary)]" />
              <h3 className="font-bold text-[var(--text-primary)]">Our Core Promises</h3>
            </div>
            <ul className="list-disc pl-5 space-y-1.5 text-[var(--text-secondary)]">
              <li>Verified Google accounts only. No ghost profiles or anonymous spam.</li>
              <li>No internal inboxes to manage. You talk on Gmail, nothing else.</li>
              <li>Privacy-first: Public scrapers can never see your raw email address.</li>
              <li>Anti-spam guarantee: Maximum 10 connections per user per day.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
