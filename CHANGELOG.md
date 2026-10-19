# CHANGELOG — SynqSquad

All notable changes to the SynqSquad project are documented in this file.

## [1.0.0] - 2026-10-19 — Production Release

### Audit & Core Architectural Fixes
- **Fixed Zero-Count Bug:** Resolved root cause where hero summary showed total count (6) while requisition feed displayed 0 due to query filter mismatch and desynced active tabs.
- **Fixed Chip Clipping:** Fixed `overflow-x-auto` horizontal container clipping ("achine Learning") by replacing negative-scroll centered flex with `justify-start` and padding.
- **Enforced Gmail-Only USP:** Completely removed all references, inputs, and UI icons for Telegram, Discord, WhatsApp, and 6-digit PINs. Replaced with single verified Google Sign-In and native Gmail compose workflows.
- **Purged AI-Template Tropes:** Removed gradient keywords, neon shadows, purple-on-dark glow, floating emojis, and fabricated metrics (`+18.2%`, `$340,000+`, `-42 min`).
- **Implemented Editorial Design System:** Dual theme (warm near-black `#0c0e12` and clean editorial light mode `#fbfbfb`) with persistent localStorage toggle, 1px low-contrast borders, 44px+ touch targets, and tabular numerals.

### Privacy & Security
- **Email Masking:** Logged-out visitors only see masked emails (`ra••••h@gmail.com`). Only authenticated users clicking "Connect on Gmail" receive unmasked email addresses.
- **Anti-Spam & Injection Prevention:** Server-side validation with Zod that blocks external chat invite links (t.me, discord.gg, wa.me, whatsapp) and promotional crypto airdrop links.
- **Rate Limiting:** Enforced hard limit of 10 "Connect on Gmail" actions per user per 24-hour rolling window.
- **DPDP Act 2023 & GDPR Compliance:** Implemented full user data export (`/api/user/export`) and one-click permanent account erasure (`/api/user` DELETE) with cascade deletion of listings and contact logs.
- **HTTP Security Headers:** Strict CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.

### Standard App Features & Pages
- **Auth & 30-Second Onboarding:** One-click Google sign-in modal with quick onboarding (Role, College, Skills, Bio) and "Skip for now" option. Session persistence and state synchronization.
- **Post Requirement:** 6-field focused modal with real-time card preview, autosave, and 30-day auto-expiry with renew.
- **Progressive Disclosure:** Slide-over desktop drawer / mobile bottom sheet with 48px touch target "Connect on Gmail" button, compose URL pre-filling, and clipboard fallbacks.
- **Honest Matching:** "Suggested for you" modal based strictly on skill overlap and recency, without fabricated percentage badges.
- **Full Legal Suite:** Plain-language templates for Privacy Policy (DPDP/GDPR), Terms of Service (Indian jurisdiction), Community Guidelines, Disclaimers, How It Works, FAQ, Support, and Report Abuse portal.
- **Resilience & Offline Handling:** Dedicated OfflineBanner detecting network disconnections, standalone `/offline` page, `/profile` and `/settings` pages, custom `not-found.tsx` (404), and global `error.tsx` boundary.
- **SEO & Accessibility:** Dynamic `sitemap.xml`, `robots.txt`, and web app `manifest.json`. WCAG AA contrast compliance and keyboard shortcuts sheet (`?` or `Cmd/Ctrl+K`).
