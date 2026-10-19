import React from "react";
import Link from "next/link";
import { ArrowLeft, Mail, MapPin, ShieldCheck, Flag } from "lucide-react";

export const metadata = {
  title: "Support & Grievances | SynqSquad",
  description: "Get in touch with the SynqSquad team for support, grievances, or inquiries under DPDP Act 2023.",
};

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] px-4 py-12 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-xl mx-auto space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors min-h-[36px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Feed</span>
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
            Support & Grievance Officer
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            We respond to community inquiries, account requests, and privacy issues within 24 hours.
          </p>
        </div>

        <div className="p-6 rounded-2xl surface-card space-y-4 text-xs">
          <div className="flex items-start gap-3">
            <Mail className="w-4 h-4 text-[var(--accent-primary)] mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-[var(--text-primary)] block">Support Inquiries</span>
              <a
                href="mailto:support@synqsquad.app"
                className="text-[var(--accent-primary)] hover:underline font-mono"
              >
                support@synqsquad.app
              </a>
              <span className="text-[11px] text-[var(--text-tertiary)] block mt-0.5">
                Technical help, account assistance, or feedback.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 pt-3 border-t border-[var(--border-subtle)]">
            <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-[var(--text-primary)] block">
                Statutory Grievance Officer (DPDP Act 2023 / IT Rules)
              </span>
              <span className="text-[var(--text-secondary)] block">Officer: Rajnish Singh</span>
              <a
                href="mailto:grievance@synqsquad.app"
                className="text-[var(--accent-primary)] hover:underline font-mono"
              >
                grievance@synqsquad.app
              </a>
              <span className="text-[11px] text-[var(--text-tertiary)] block mt-0.5">
                Statutory redressal for privacy, consent revocation, or compliance queries.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 pt-3 border-t border-[var(--border-subtle)]">
            <Flag className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-[var(--text-primary)] block">Report Listing or Abuse</span>
              <Link href="/report" className="text-[var(--accent-primary)] hover:underline">
                Open Report Form →
              </Link>
            </div>
          </div>

          <div className="flex items-start gap-3 pt-3 border-t border-[var(--border-subtle)]">
            <MapPin className="w-4 h-4 text-[var(--text-tertiary)] mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-[var(--text-primary)] block">Official Address</span>
              <span className="text-[var(--text-secondary)]">
                Gautam Buddha University Campus, Greater Noida, Uttar Pradesh, 201312, India
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
