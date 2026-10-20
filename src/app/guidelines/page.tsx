import React from "react";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Community Guidelines & Safety Tips | SynqSquad",
  description: "Best practices for meeting collaborators safely and building winning hackathon squads.",
};

export default function CommunityGuidelinesPage() {
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
            Community Guidelines & Safety Tips
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            How to verify collaborators, protect your intellectual property, and collaborate safely.
          </p>
        </div>

        <div className="space-y-6 text-xs text-[var(--text-secondary)] leading-relaxed">
          <section className="space-y-3 p-5 rounded-2xl surface-card">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Best Practices for Collaborators</span>
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Verify public work:</strong> Ask to see previous GitHub repositories, demo projects, or arXiv preprints before finalizing tournament registration.</li>
              <li><strong>Establish clear role boundaries:</strong> Agree in writing over Gmail who delivers frontend, backend, presentations, and submissions.</li>
              <li><strong>Agree on IP & prizes upfront:</strong> Keep a written email trail detailing how hackathon cash prizes or research authorship order will be apportioned.</li>
            </ul>
          </section>

          <section className="space-y-3 p-5 rounded-2xl surface-card">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Safety & Security Rules</span>
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Never send money:</strong> Legitimate teammates never solicit advance fees, travel allowances, or cryptocurrency transactions.</li>
              <li><strong>Protect secrets:</strong> Never share production API keys, personal credentials, or government identity documents over email.</li>
              <li><strong>Public meetings:</strong> When convening offline before a tournament, meet on verified university campuses or public libraries.</li>
              <li><strong>Report suspicious behavior:</strong> Use our Report feature immediately if anyone solicits commercial services or exhibits harassment.</li>
            </ul>
          </section>

          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[11px] text-[var(--text-tertiary)] italic">
            Notice: This community guidelines document is a template designed for platform operations and should be reviewed by legal counsel.
          </div>
        </div>
      </div>
    </div>
  );
}
