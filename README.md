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
synqsquad/
├── data/                    # Atomic JSON persistence engine
│   ├── listings.json        # 12+ realistic hackathon & paper requisitions
│   ├── contacts.json        # User contact outreach history & rate limits
│   ├── users.json           # User profiles & consent records
│   └── reports.json         # Moderation & triage reports
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/             # REST endpoints (listings, contact, report, user, export)
│   │   ├── about/           # Product mission & story
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
│   │   ├── globals.css      # Core design tokens & typography
│   │   ├── layout.tsx       # Root layout with Providers
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
│   │   ├── SuggestMatchesModal.tsx
│   │   └── UserProfileDrawer.tsx
│   ├── context/             # React context providers
│   │   ├── AuthContext.tsx  # Google session & contacted tracker
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
│   └── unit-tests.mjs       # Core unit & security test suite
├── next.config.ts           # Security headers (CSP, nosniff, DENY)
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
Configure your Google OAuth credentials in `.env.local`:
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Google OAuth 2.0 Client ID (from Google Cloud Console)
- `GOOGLE_CLIENT_SECRET`: Google OAuth Client Secret

### 3. Running Locally
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
# Core unit & security test suite (25/25 tests passing)
node --experimental-strip-types tests/unit-tests.mjs

# Linter and type-checker (0 errors, 0 warnings)
npm run lint
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
