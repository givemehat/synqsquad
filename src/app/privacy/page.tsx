import React from "react";
import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | RIVQ",
  description:
    "How RIVQ handles Google user data, DPDP Act 2023 compliance, GDPR rights, and Gmail contact privacy.",
};

export default function PrivacyPolicyPage() {
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
            <Shield className="w-5 h-5 text-blue-500" />
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Privacy Policy
            </h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Effective Date: October 19, 2026 • Compliant with DPDP Act 2023 (India) & GDPR
          </p>
        </div>

        <div className="space-y-6 text-xs text-[var(--text-secondary)] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">1. Introduction & Overview</h2>
            <p>
              RIVQ is an introduction platform connecting students and developers for hackathons and academic research collaborations. Our core principle is privacy by default: we do not sell data, we do not host closed chat servers, and we never expose your verified email address to public web scrapers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">2. Google API Services & Limited Use Disclosure</h2>
            <p>
              RIVQ’s use and transfer to any other app of information received from Google APIs will adhere to the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
            <p>
              We request <strong>only minimum authentication scopes</strong> (basic profile and email). We <strong>never</strong> request scopes to read, draft, or send emails on your behalf. All email outreach is initiated in your own browser using native Gmail compose links.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">3. Data We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Profile Information:</strong> Your name, verified Gmail address, and avatar provided via Google sign-in.</li>
              <li><strong>Collaborator Details & Talent Profiles:</strong> Your selected role, university, top skills, headline, bio, and optional portfolio links (GitHub, LinkedIn) published in the Talent Directory.</li>
              <li><strong>Requisitions:</strong> Project titles, competition names, deadlines, and technical descriptions you publish.</li>
              <li><strong>Contact & Outreach Audit Log:</strong> Timestamps of &quot;Connect on Gmail&quot; and collaboration outreaches to enforce our 10-connects/day anti-spam threshold.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">4. Email Privacy Guarantee</h2>
            <p>
              Your email address is never published in plain HTML or API payloads to unauthenticated visitors. It is revealed only to logged-in Google users at the moment they click &quot;Connect on Gmail&quot; to populate their pre-filled draft.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">5. Your Rights (DPDP Act 2023 & GDPR)</h2>
            <p>
              Under the Digital Personal Data Protection Act 2023 (India) and the General Data Protection Regulation (EU/UK), you have the right to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Export your data:</strong> Download a full machine-readable JSON copy of your profile and records anytime from your Settings page.</li>
              <li><strong>Right to be forgotten:</strong> Delete your account and all associated requisitions and logs permanently in 1 click.</li>
              <li><strong>Correct inaccurate data:</strong> Edit your profile information at any time.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">6. Grievance Officer & Contact</h2>
            <p>
              In accordance with the Information Technology Act 2000 and Rules thereunder:
              <br />
              <strong>Grievance Officer:</strong> Rajnish Singh
              <br />
              <strong>Email:</strong> grievance@rivq.app
              <br />
              <strong>Address:</strong> Gautam Buddha University, Greater Noida, UP, India
            </p>
          </section>

          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[11px] text-[var(--text-tertiary)] italic">
            Notice: This document is a operational privacy policy template and should be reviewed by a qualified legal professional prior to formal corporate incorporation.
          </div>
        </div>
      </div>
    </div>
  );
}
