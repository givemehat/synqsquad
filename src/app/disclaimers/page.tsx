import React from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Platform Disclaimers | RIVQ",
  description: "Important disclaimers regarding user-generated content, credentials, and tournament results.",
};

export default function DisclaimersPage() {
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
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Platform Disclaimers
            </h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Please read these important disclosures regarding the scope of our services.
          </p>
        </div>

        <div className="space-y-6 text-xs text-[var(--text-secondary)] leading-relaxed">
          <section className="space-y-2 p-5 rounded-2xl surface-card">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">1. Introduction Service Only</h2>
            <p>
              RIVQ is strictly a neutral technological intermediary designed to help students and developers introduce themselves via direct Gmail outreach. We do not act as an agency, broker, employer, or tournament administrator.
            </p>
          </section>

          <section className="space-y-2 p-5 rounded-2xl surface-card">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">2. No Verification of External Credentials</h2>
            <p>
              While Google OAuth verifies ownership of the associated Gmail address, RIVQ does not independently verify university affiliations, resume claims, past hackathon rankings, or academic credentials. Users are strictly responsible for conducting their own technical due diligence before entering competitions together.
            </p>
          </section>

          <section className="space-y-2 p-5 rounded-2xl surface-card">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">3. User-Generated Requisitions</h2>
            <p>
              All project titles, competition descriptions, and role descriptions are submitted by individual users. RIVQ does not endorse, sponsor, or guarantee the legitimacy of any external hackathon, research call, or corporate grant mentioned in user postings.
            </p>
          </section>

          <section className="space-y-2 p-5 rounded-2xl surface-card">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">4. No Guarantee of Results or Awards</h2>
            <p>
              Forming a team through RIVQ provides no guarantee of tournament acceptance, hackathon victory, academic peer-review acceptance, or prize distribution. All outcomes depend entirely on individual team performance.
            </p>
          </section>

          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[11px] text-[var(--text-tertiary)] italic">
            Notice: This disclaimer document is a template designed for platform launch and should be formally reviewed by a qualified attorney prior to commercial deployment.
          </div>
        </div>
      </div>
    </div>
  );
}
