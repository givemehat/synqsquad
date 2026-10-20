# SynqSquad — The One-Click Teammate Matchmaker on Gmail

> **The One USP:** One person finds the one collaborator they want for hackathons or research papers, and connects with them directly on verified Gmail. That is the entire product. Zero noise, zero closed inboxes, zero fake AI hype.

---

## 🎯 Architectural Principles: Calm, Editorial & Trustworthy
- **Gmail-Only Contact Channel:** Zero internal chat silos. Telegram, Discord, WhatsApp, and temporary PIN codes are completely purged. Every collaborator signs in with Google, providing a verified Gmail.
- **Privacy by Default:** Public visitors cannot scrape creator emails (masked as `a••••a@gmail.com`). Unmasked emails are returned only upon authenticated "Connect on Gmail" clicks.
- **Anti-AI Aesthetic:** Clean, editorial design inspired by Linear and Notion. Warm near-black dark mode (`#0c0e12`) and crisp editorial light mode (`#fbfbfb`), 1px low-contrast borders, solid colors, and tabular numerals.
- **Abuse Prevention:** Hard limit of 10 "Connect on Gmail" actions per user per day to protect creators from mass scraping.
- **DPDP Act 2023 & GDPR Compliance:** Built-in machine-readable JSON data export (`/api/user/export`) and one-click permanent account erasure with cascade deletion.

---

## 💡 Core User Flows
1. **Browse Without Friction:** Visitors can browse and search open listings immediately without creating an account or logging in.
2. **Connect on Gmail:**
   - Clicking opens a prefilled Gmail compose window (`https://mail.google.com/mail/?view=cm...`) with a respectful, editable introduction template.
   - Includes automatic clipboard copy fallback and `mailto:` fallbacks.
   - Saves the interaction to the user's personal **Contacted** list.
3. **6-Field Requirement Posting:**
   - Quick form (Title, Type, Event & Deadline, Skills, Slots, Description) with live card preview, validation, and draft autosave. Auto-expires after 30 days with one-click renew.
4. **Honest Suggestions ("Suggested for you"):**
   - Simple, rule-based matching (skill overlap + recency) with honest plain-English reasoning. Zero fabricated percentages.

---

## 📁 Folder Structure
```
├── android/                 # Android Trusted Web Activity (TWA) project
│   ├── app/                 # App module (compileSdk 36, targetSdk 36, minSdk 21)
│   │   ├── build.gradle     # Android application build configuration
│   │   └── src/main/        # AndroidManifest.xml & resource densities
│   ├── keystores/           # Secure upload keystore (synqsquad-upload-key.jks, git-ignored)
│   ├── app-release.aab      # Production-ready signed Android App Bundle (v1.0.0, API 36)
│   ├── app-debug.apk        # Direct installable debug APK for emulator testing
│   └── app-release-v2.aab   # Update verification bundle (v1.0.1, versionCode 2, API 36)
├── store/                   # Google Play Store listing graphics and policy declarations
│   ├── icon-512.png         # 512x512 32-bit hi-res app icon
│   ├── feature-graphic.png  # 1024x500 banner feature graphic
│   ├── screenshot-*.png     # 4 authentic phone screenshots (1080x1920)
│   ├── listing_metadata.txt # App title, short/full descriptions, and release notes
│   └── play_console_form_answers.md # Exact answers for Data Safety & IARC forms
├── PLAY_STORE_GUIDE.md      # Step-by-step Play Console submission and closed-testing checklist
├── data/                    # Atomic JSON persistence engine
│   ├── listings.json        # 12+ realistic hackathon & paper requisitions
│   ├── contacts.json        # User contact outreach history & rate limits
│   ├── users.json           # User profiles & consent records
│   ├── reports.json         # Moderation & triage reports
│   └── blocks.json          # Cross-device user blocking (UGC Safety)
├── public/
│   ├── .well-known/
│   │   └── assetlinks.json  # Digital Asset Links with upload & Play signing SHA-256
│   ├── icons/               # PWA icons (192, 512, maskable 512, monochrome)
│   └── sw.js                # App shell caching & stale-while-revalidate service worker
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/             # REST endpoints (listings, contact, report, user, export)
│   │   ├── about/           # Product mission & story
│   │   ├── account-deletion/# Public web deletion request portal (Play policy compliance)
│   │   ├── contact/         # Support & grievance officer contact
│   │   ├── disclaimers/     # Introduction platform liability disclaimers
│   │   ├── faq/             # Plain-language FAQs
│   │   ├── guidelines/      # Community safety & meet-up guidelines
│   │   ├── how-it-works/    # 3-step explanation of Gmail matchmaking
│   │   ├── offline/         # Dedicated offline fallback view
│   │   ├── privacy/         # DPDP Act 2023 & GDPR Privacy Policy
│   │   ├── profile/         # Profile management, listings, data export & erasure
│   │   ├── report/          # Listing/user abuse reporting portal
│   │   ├── settings/        # Theme switcher & outreach preferences
│   │   ├── terms/           # Terms of Service (Indian jurisdiction)
│   │   ├── manifest.ts      # Web App Manifest
│   │   ├── robots.ts        # Search engine crawlers config
│   │   ├── sitemap.ts       # Dynamic XML sitemap
│   │   ├── not-found.tsx    # Editorial 404 page
│   │   ├── error.tsx        # Global React error boundary
│   │   ├── globals.css      # Core design tokens, safe areas & typography
│   │   ├── layout.tsx       # Root layout with Providers & Viewport
│   │   └── page.tsx         # Feed page with search, filters & drawers
│   ├── components/          # Reusable UI components
│   │   ├── CreateListingModal.tsx
│   │   ├── Footer.tsx
│   │   ├── GoogleAuthModal.tsx
│   │   ├── Hero.tsx
│   │   ├── KeyboardShortcutsModal.tsx
│   │   ├── ListingCard.tsx
│   │   ├── ListingDetailDrawer.tsx
│   │   ├── Navbar.tsx
│   │   ├── OfflineBanner.tsx
│   │   ├── Providers.tsx
│   │   ├── PwaManager.tsx   # Service worker registration & TWA detection
│   │   ├── SuggestMatchesModal.tsx
│   │   └── UserProfileDrawer.tsx
│   ├── context/             # React context providers
│   │   ├── AuthContext.tsx  # Google session, contacted & blocked users tracker
│   │   └── ThemeContext.tsx # Dark/Light/System theme provider
│   ├── data/
│   │   └── seed.ts          # 12 realistic seed listings (SIH, NeurIPS, ETHGlobal)
│   ├── lib/
│   │   ├── db.ts            # Persistent data store with atomic operations
│   │   └── validations.ts   # Zod input validation & anti-spam regex
│   └── types/
│       └── index.ts         # TypeScript schema definitions
├── tests/
│   ├── api-e2e.mjs          # Network integration tests
│   ├── integration.test.mjs # In-process node integration tests
│   ├── unit.test.mjs        # Core unit & security test suite
│   └── unit-tests.mjs       # Supabase & strip-types test suite
├── next.config.ts           # Security headers, CSP & assetlinks Content-Type
├── package.json             # Scripts & dependencies
└── tsconfig.json            # Strict TypeScript configuration
```

---

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### 3. Dual Supabase Architecture (Test vs. Prod)
Create two separate projects in [Supabase](https://supabase.com):
1. **`synqsquad-test`**: Dedicated project for live security and automated test pipelines.
2. **`synqsquad-prod`**: Live production database.

Run the SQL migration [`supabase/migrations/20261020000000_init_synqsquad.sql`](./supabase/migrations/20261020000000_init_synqsquad.sql) in both projects.

Configure your `.env.local` (untracked):
- `NEXT_PUBLIC_APP_URL`: Your web application URL (`http://localhost:3000` or production domain)
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL (`https://your-project.supabase.co`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Public Anonymous Key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Secret Service Role Key (server-only)
- `ANTHROPIC_API_KEY`: *(Optional)* Anthropic API Key for AI message improvement
- `ANTHROPIC_MODEL`: Model name (defaults to `claude-haiku-5-5`)

### 4. Single Auth Path: Supabase Auth (Google Provider)
All Google authentication is handled natively through Supabase Auth:
1. In Google Cloud Console, configure OAuth Client ID (Web Application) with redirect URI: `https://<your-supabase-project-id>.supabase.co/auth/v1/callback`.
2. In Supabase Dashboard, navigate to **Auth > Providers > Google**, enable it, and enter your Google Client ID and Secret.
3. The Next.js application never touches or logs `GOOGLE_CLIENT_SECRET`. Server-side identity is strictly verified from Supabase JWT session tokens (`supabase.auth.getUser(token)`).

### 5. Running Locally
```bash
# Start development server
npm run dev

# Or build and start production server
npm run build
npm run start
```
Open **`http://localhost:3000`** in your browser.

---

## 🧪 Testing

Run the automated test suites:
```bash
# Full security, auth, unit, and integration test suite (84/84 tests passing)
npm test

# End-to-end API verification suite (requires server running on port 3000)
npm run test:e2e

# TypeScript typecheck (0 errors)
npx tsc --noEmit

# Next.js linter (0 errors, 0 warnings)
npm run lint

# Production build test
npm run build
```

---

## 🔒 Google OAuth Setup Guide
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project named **SynqSquad**.
3. Navigate to **APIs & Services > OAuth consent screen**:
   - User Type: **External**
   - Scopes: Request **only** `.../auth/userinfo.email` and `.../auth/userinfo.profile`. Do **not** request Gmail send or read scopes.
4. Under **Credentials**, create an **OAuth 2.0 Client ID** (Web Application):
   - Authorized JavaScript origins: `http://localhost:3000` and your production domain (e.g., `https://synqsquad.vercel.app`).
   - Authorized redirect URIs: `http://localhost:3000` and `https://synqsquad.vercel.app`.
5. Add the generated Client ID to `.env.local`.
