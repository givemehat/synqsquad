import React from "react";
import Link from "next/link";
import { Scale, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service | RIVQ",
  description: "Terms and conditions governing the use of the RIVQ matchmaking platform.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Feed</span>
        </Link>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Scale className="w-5 h-5 text-blue-500" />
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Terms of Service
            </h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Last Updated: October 19, 2026 • Governed by the Laws of the Republic of India
          </p>
        </div>

        <div className="space-y-6 text-xs text-[var(--text-secondary)] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">1. Acceptance & Eligibility</h2>
            <p>
              By accessing or using RIVQ, you agree to be bound by these Terms. You must be at least 18 years of age, or have the valid consent of a legal parent/guardian if a collegiate student between 16 and 18 years old, to participate in hackathon and research matchmaking.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">2. Introduction Platform Only</h2>
            <p>
              RIVQ provides a technical directory allowing users to discover collaborators and initiate email conversations. RIVQ is <strong>not</strong> an employer, agent, tournament organizer, or academic co-author. We do not independently verify past competition wins, academic credentials, or individual claims.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">3. Acceptable Use Policy</h2>
            <p>You agree NOT to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Harvest, scrape, or mass-collect user email addresses for unsolicited commercial spam.</li>
              <li>Post deceptive listings, counterfeit hackathons, or commercial freelance job postings.</li>
              <li>Harass, intimidate, or solicit monetary investments, advance fees, or sensitive financial information from collaborators.</li>
              <li>Attempt to circumvent our daily rate limits or automated security protections.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">4. Talent Profiles & Two-Way Collaboration Outreach</h2>
            <p>
              Users publishing availability in the <strong>Talent Directory (/people)</strong> agree to display their skills, headline, and collaboration preferences. Inquiries and two-way outreaches are subject to the shared 10 connections/day quota and Google Play UGC safety guidelines, including immediate blocking and reporting mechanisms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">5. Content Ownership & Deletion</h2>
            <p>
              You retain full ownership of all project abstracts and descriptions you publish on RIVQ. By posting, you grant RIVQ a non-exclusive license to display the content on our public discovery board. You may edit, mark filled, or permanently delete your listings at any time.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">6. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by Indian law, RIVQ and its developers shall not be liable for any direct, indirect, incidental, or consequential damages arising from agreements, code contributions, intellectual property disputes, or interactions between users introduced through the platform.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">7. Governing Law & Jurisdiction</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising hereunder shall be subject to the exclusive jurisdiction of the competent courts in New Delhi / Gautam Buddha Nagar, Uttar Pradesh.
            </p>
          </section>

          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[11px] text-[var(--text-tertiary)] italic">
            Notice: This terms of service document is a template designed for early operations and should be formally reviewed by a qualified corporate attorney prior to commercial deployment.
          </div>
        </div>
      </div>
    </div>
  );
}
