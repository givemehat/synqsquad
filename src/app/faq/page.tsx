import React from "react";
import Link from "next/link";
import { ArrowLeft, HelpCircle } from "lucide-react";

export const metadata = {
  title: "Frequently Asked Questions | SynqSquad",
  description: "Common questions about finding teammates on SynqSquad, Gmail connect, and security.",
};

const FAQS = [
  {
    q: "Why is Gmail the only way to connect?",
    a: "Most teammate platforms build walled internal messaging inboxes where 80%+ of inquiries get abandoned or seen days late. Everyone already checks their Gmail every day. Direct email keeps communication professional, prompt, and permanent."
  },
  {
    q: "Can anyone on the internet see my Gmail address?",
    a: "No. Unauthenticated visitors and search engine bots only see a masked representation (like a••••a@gmail.com). Your real email is only accessed when a verified Google user clicks 'Connect on Gmail'."
  },
  {
    q: "Why is there a limit of 10 connects per day?",
    a: "To prevent spam agencies or bots from mass-scraping or bombarding creators with automated messages. 10 tailored connections per day is more than enough to assemble your dream squad."
  },
  {
    q: "Does SynqSquad send emails from my account?",
    a: "Never. We do not request Gmail API write or send scopes. Clicking 'Connect on Gmail' simply opens standard Gmail in your own browser with a prefilled template that you control."
  },
  {
    q: "How long do listings stay active?",
    a: "Every listing stays active for 30 days. You can mark it as 'Filled' at any time from your profile, or click 'Renew' to extend it another 30 days with one click."
  },
  {
    q: "How do I report spam or an offensive listing?",
    a: "Every listing detail drawer contains a report link, or you can submit details via our Report portal. Our moderation team reviews flagged listings within 24 hours."
  }
];

export default function FAQPage() {
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
            <HelpCircle className="w-5 h-5 text-[var(--accent-primary)]" />
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Frequently Asked Questions
            </h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Everything you need to know about privacy, Gmail outreach, and team formation.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl surface-card space-y-1.5 text-xs"
            >
              <h2 className="font-bold text-[var(--text-primary)] text-sm">{faq.q}</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
