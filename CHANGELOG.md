# CHANGELOG — RIVQ

All notable changes to the RIVQ project are documented in this file.

## [1.5.0] - 2026-10-20 — Two-Way Discovery (Talent Profiles & Outreach) & Pre-Launch Audit

### Phase A: Two-Way Discovery & Talent Directory
- **Talent Profiles ("Availability Cards"):** Created the Supply-Side talent directory (`/people`) where developers and researchers publish their skills, goals, bio, allow-listed portfolio links (GitHub, LinkedIn), and collaboration availability (Open/Busy/Hidden).
- **Two-Way Collaboration Outreach:** Built Team → Person outreach flow allowing project leads to send personalized collaboration invitations with optional attached requisitions.
- **Combined 10 Connects/Day Rate Limit:** Unified the rate limiting engine (`record_outreach_rate_limited`) so that requisition connects and talent outreaches share a single 10-connects/day quota per user, serialized by PostgreSQL advisory transaction locks.
- **Recipient Resolution Inbox:** Built recipient response handling (`/api/people/outreach/[id]`) allowing recipients to Accept (reveals verified Gmail contact info to both parties) or Decline requests with strict IDOR protections.
- **Database Schema Migration (`20261020000002_talent_profiles_and_outreach.sql`):** Added `talent_profiles` and `outreach` tables with Row-Level Security, public masked views, and updated `delete_user_data_cascade`.
- **Comprehensive DPDP & Deletion Coverage:** Updated data export (`/api/user/export`) and cascade account erasure (`/api/user` and `/account-deletion`) to completely include and purge talent profiles and outreach history.

### Phase B: Security Hardening & Android Launch Audit
- **Upload Keystore Cryptographic Rotation:** Rotated upload keystore using OpenJDK 21 keytool and generated a new high-entropy RSA 2048 keypair. Keystore secrets stored strictly in untracked local files.
- **Digital Asset Links Updated:** Synchronized new SHA-256 fingerprint (`BC:8E:FA:C2:...:C9`) across `public/.well-known/assetlinks.json` and dynamic App Router endpoint.
- **Target SDK 36 & Verified Binaries:** Rebuilt and verified `android/app-release.aab` (versionCode 2, versionName 1.1.0) targeting Android 16 (API 36) with only `android.permission.INTERNET`.
- **Pre-Launch Hygiene & Dependency Audit:** Cleaned unused starter assets, eliminated console logs and unused variables. 0 ESLint errors/warnings, 0 TypeScript errors.
- **Automated Verification:** 133 automated tests passing (101 in native `node:test` + 32 in Supabase/Security suite).


### Critical Identity & Authentication Overhaul (Step 1)
- **Eliminated Client-Supplied Identity:** Removed all reliance on client-supplied `ownerEmail`, `ownerId`, `fromUserEmail`, and `x-user-email` headers. Caller identity across every mutating API route is strictly extracted and verified from the Supabase session JWT (`getAuthenticatedUser` via `supabase.auth.getUser(token)`).
- **Single Auth Path:** Standardized purely on Supabase Auth with Google Provider (`Auth > Providers > Google`). Removed parallel `GOOGLE_CLIENT_SECRET` from Next.js application configuration.
- **Ownership Keyed by Auth User ID:** Updated database RLS policies to enforce `auth.uid()::text = owner_id` rather than mutable email strings.
- **Authentication Test Suite:** Added `tests/auth-server.test.mjs` verifying rejection of requests with no token, expired tokens, tampered signatures, and deleted accounts.

### Database Architecture & File I/O Deprecation (Step 2)
- **Eradicated JSON File Persistence:** Deleted `writeJsonAtomic`, local disk file dependencies (`./data/*.json`), and Node memory mutexes. Replaced entirely with a serverless-safe Supabase PostgreSQL client.
- **Database Row-Level Advisory Locks:** Concurrency-safe atomic insert-with-count using `pg_advisory_xact_lock(hashtext(p_from_user_email))` in PostgreSQL stored procedure `record_contact_rate_limited`.
- **Safe Public Views:** Configured `public_listings` and `public_profiles` with server-side email redaction; revoked direct `anon` SELECT access on base tables.

### AI Engine Upgrade (Step 5)
- **Updated to Current Model:** Configured Anthropic Claude Haiku model `claude-haiku-5-5` (customizable via `ANTHROPIC_MODEL` env var).
- **Enforced Server-Side Auth & Rate Limits:** Route `/api/ai/improve-message` requires verified user session, enforces 20 calls/day quota in database, and truncates untrusted prompt injection attempts with silent static template fallbacks.

### Automated CI Pipeline & Verification Suite (Step 6)
- **Full Test Suite:** 84/84 passing automated tests across unit, integration, auth, and security suites.
- **CI Pipeline:** Configured GitHub Actions to run tests, production build, E2E verification, and static bundle secret scanning against test project credentials.

## [1.3.0] - 2026-10-20 — Google Play Store Hardening, API 36 & Policy Compliance Audit

### Security & Keystore Overhaul
- **New Upload Keystore:** Generated a fresh, high-entropy upload keystore (`android/keystores/synqsquad-upload-key.jks`) using a strong 32-character random secret. Completely eradicated previous weak passwords from Git history, build scripts, and documentation.
- **Untracked Secret Storage:** Keystore secrets are isolated in untracked local properties (`android/keystore.properties` and `android/keystores/.keystore-secret.txt`), protected by `.gitignore`.
- **Client Bundle Secret Leak Prevention:** Completely decoupled Supabase browser client (`src/lib/supabase-browser.ts`) from server-only admin modules (`src/lib/supabase-server.ts`), guaranteeing zero exposure of `SUPABASE_SERVICE_ROLE_KEY`.

### Platform & Policy Compliance
- **Target SDK 36 (Android 16):** Upgraded Android project (`compileSdkVersion 36`, `targetSdkVersion 36`, `buildToolsVersion "36.0.0"`) to comply with current Google Play requirements.
- **Server-Side UGC Safety & In-App Blocking:** Migrated user blocking from local storage to a dedicated Supabase `blocks` table with Row-Level Security, cascading deletion upon account erasure, and a cross-device Unblock manager in Preferences & Settings.
- **Domain Verification & Clean Digital Asset Links:** Verified live domain `https://synqsquad.vercel.app` (HTTP 200) and removed references to non-existent `synqsquad.app`. Added Next.js route handler for `/.well-known/assetlinks.json` serving the new upload key fingerprint.
- **Real Live App Screenshots:** Captured all 4 store screenshots (1080x1920 PNG) directly from the running live application via headless Chrome.


### Branded Splash Screen (Task 1)
- **First-Load Splash:** Branded minimal splash screen with logo mark, app name, and subtle progress indicator.
- **Micro-Timing & Motion:** Enforced 800ms minimum to prevent flickering, 2000ms max timeout, `sessionStorage` single-session persistence (no re-triggering on navigation), and instant bypass when `prefers-reduced-motion` is active.
- **Zero CLS & Lighthouse Preservation:** Mounted via non-blocking portal with skeleton backdrop matching feed layout.

### Logged-Out vs. Logged-In Security Architecture (Task 2)
- **Strict Server-Side Email Redaction:** Public feed API (`/api/listings`) and listing details API (`/api/listings/[id]`) strictly mask owner emails on the server. Real emails are never present in HTML, JSON, SSR payloads, or client bundles.
- **Point-of-Action Email Disclosure:** Real email is only revealed to authenticated users via `POST /api/contact`, atomic rate-limited and logged.
- **Strict IDOR Mitigation:** Verified caller authentication across `/api/listings/[id]`, `/api/user/export`, `/api/user`, and `/api/blocks`. Unauthorized callers cannot mutate status, delete listings, or exfiltrate private records.
- **Clean Modal Copy:** Auth modal updated to exact human copy: *"Sign in with Google to contact people. You will talk on Gmail."* with button *"Continue with Google"*.

### Gmail Composer Suite & AI Message Enhancement (Task 3)
- **4 Professional Outreach Templates:** Pre-configured editable templates for Hackathon Teammate, Research Collaboration, Skill-Specific Ask, and Short & Casual.
- **Interactive Composer:** Real-time character counter (1500 chars limit), editable subject and body, and URL encoding defense preventing CRLF injection and parameter pollution (`&bcc=`, `&cc=`).
- **AI Message Enhancer Endpoint (`/api/ai/improve-message`):** Anthropic Claude 3.5 Haiku integration with prompt injection neutralization, 20 calls/day user rate limiting, input sanitization, and graceful static fallback if API key is unset.

### Database, Secrets & CI Hardening (Task 4)
- **Supabase Production Migration:** Added safe public views `public_listings` and `public_profiles`. Revoked direct `anon` SELECT access on base `users` and `listings` tables.
- **Advisory Row Locking:** Implemented `pg_advisory_xact_lock(hashtext(p_from_user_email))` in Postgres and mutex locking in Node.js, eliminating parallel request race conditions on the 10 connects/day limit.
- **HSTS & Security Headers:** Enforced `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` and updated CSP.
- **Automated CI Pipeline (`.github/workflows/ci.yml`):** Added Gitleaks secret scanning, dependency audit, TypeScript typechecking, Next.js linting, 74-test security suite, production build, and static bundle secret leak verification.

### Comprehensive 74-Test Security & Integration Suite (Task 5)
- **63 Dedicated Threat Vector Tests:** Explicit tests across 14 security categories covering email unmasking, IDOR, race condition bursting (50 concurrent requests), XSS, open redirects, crypto/spam detection, and prompt injection.
- **100% Pass Rate:** 74/74 tests passing (0 failures, 0 errors, 0 warnings).

## [1.1.0] - 2026-10-20 — Google Play Store & Android TWA Readiness

### Progressive Web App (PWA) & Offline Shell
- **PWA Manifest & High-Res Icons:** Generated complete multi-tier icon suite (192px, 512px, 512px maskable with safe-zone padding, and monochrome icon). Configured `manifest.ts` and static `public/manifest.webmanifest`.
- **Production Service Worker:** Implemented `public/sw.js` with App Shell precaching, Stale-While-Revalidate caching for read-only listings, dedicated `/offline` page fallback, and strict zero-caching of authenticated endpoints.
- **TWA Environment Detection:** Created `PwaManager` component with automatic detection of Android Trusted Web Activity (`data-twa="true"`), hiding web-only install badges and applying native safe-area insets.
- **Mobile Polish:** Added `overscroll-behavior-y: contain` to prevent pull-to-refresh conflicts, enforced 44px+ minimum touch targets, and eliminated double-tap delays.

### Android Trusted Web Activity (TWA) & Packaging
- **Target SDK 35 (Android 15):** Created complete `/android` project conforming to current Google Play API requirements (Target SDK 35, compileSdk 35, minSdk 21).
- **Google AndroidBrowserHelper 2.5.0:** Configured `LauncherActivity` with warm near-black status and navigation bars (`#0c0e12`), immersive display cutout mode (`shortEdges`), and deep-link intent filters (`autoVerify="true"`).
- **Secure Cryptographic Build:** Generated RSA 2048-bit release keystore (`android/keystores/synqsquad-upload-key.jks`) with strict Git-ignore protection. Built and verified signed `app-release.aab`, test debug APK, and update-test `app-release-v2.aab`.
- **Digital Asset Links:** Deployed `public/.well-known/assetlinks.json` with upload certificate SHA-256 fingerprint and explicit `application/json` Content-Type headers for zero-URL-bar verification.

### Google Play Store Policy Compliance & Store Assets
- **Public Account Deletion URL:** Built dedicated, accessible `/account-deletion` web portal allowing users to permanently erase their account and all associated data without needing the app installed.
- **In-App User Blocking (UGC Policy):** Added one-click "Block Creator" mechanism to listing drawers, immediately hiding all requisitions by that creator to comply with Google Play User Generated Content safety rules.
- **Play Store Assets (`/store`):** Generated 512x512 app icon, 1024x500 feature graphic, 4 exact 1080x1920 phone screenshots, editorial store listing copy, and complete Data Safety & Content Rating questionnaire answers.
- **Play Console Guide:** Authored `PLAY_STORE_GUIDE.md` detailing the click-by-click submission workflow, Google Play App Signing, and the mandatory 12-tester / 14-day closed testing track.

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
