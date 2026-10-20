# RIVQ — The Teammate Matchmaker on Verified Gmail

> **The USP:** One person finds the one collaborator they want for hackathons or research papers, and connects with them directly on verified Gmail. That is the entire product. Zero noise, zero closed inboxes, zero fake AI hype.

---

## 🎯 Architecture: Calm, Editorial & Trustworthy
- **Two-Way Discovery:**
  1. **Demand Side (Requisitions):** Team leads post open positions for upcoming hackathons (SIH, ETHGlobal) or research manuscripts (NeurIPS, ICRA, ACL).
  2. **Supply Side (Talent Profiles / Availability Cards):** Developers and researchers publish their skills, goals, and availability on `/people` to be discovered and invited by project leads.
- **Gmail-Only Contact Channel:** Zero internal chat silos. Telegram, Discord, WhatsApp, and temporary PIN codes are completely prohibited. Every collaborator signs in with Google, providing a verified Gmail.
- **Privacy by Default:** Public visitors cannot scrape emails (masked as `a••••a@gmail.com`). True emails are revealed only upon authenticated connect/outreach acceptance.
- **Supabase PostgreSQL Persistence:** Direct PostgreSQL queries with strict Row Level Security (RLS), stored procedures (`record_contact_rate_limited`, `record_outreach_rate_limited`), and advisory locks. Zero local JSON file database dependencies.
- **Abuse Prevention:** Shared limit of 10 connect/outreach actions per user per rolling 24 hours to protect collaborators from mass outreach.
- **DPDP Act 2023 & GDPR Compliance:** Built-in machine-readable JSON data export (`/api/user/export`) including requisitions, talent profiles, contacts, and outreach history, plus 1-click permanent account cascade erasure (`/api/user` DELETE & `/account-deletion`).
- **Android TWA (Target API 36):** Signed Android App Bundle targeting Android 16 (API 36) with Digital Asset Links domain verification for full-screen chrome-less experience.

---

## 📁 Repository Structure
```
├── android/                 # Android Trusted Web Activity (TWA) project
│   ├── app/                 # App module (compileSdk 36, targetSdk 36, minSdk 21)
│   │   ├── build.gradle     # Android application build configuration (versionCode 2, versionName 1.1.0)
│   │   └── src/main/        # AndroidManifest.xml & resource densities
│   ├── keystores/           # Secure upload keystore (synqsquad-upload-key.jks, git-ignored)
│   ├── app-release.aab      # Signed Android App Bundle (v1.1.0, versionCode 2, API 36)
│   └── app-debug.apk        # Installable debug APK for device testing
├── store/                   # Google Play Store assets and compliance declarations
│   ├── icon-512.png         # 512x512 hi-res store icon
│   ├── feature-graphic.png  # 1024x500 banner feature graphic
│   ├── screenshot-*.png     # Real running app screenshots (Feed, Drawer, People, Settings)
│   ├── listing_metadata.txt # App title, short/full descriptions, and release notes
│   └── play_console_form_answers.md # Exact answers for Data Safety & IARC forms
├── supabase/
│   └── migrations/          # PostgreSQL migrations (users, listings, contacts, reports, blocks, talent_profiles, outreach)
├── public/
│   ├── .well-known/
│   │   └── assetlinks.json  # Digital Asset Links with rotated SHA-256 fingerprint
│   ├── icons/               # PWA icons (192, 512, maskable 512, monochrome)
│   └── sw.js                # Service worker with strict zero-caching of private APIs
├── src/
│   ├── app/                 # Next.js App Router (36 routes)
│   │   ├── api/             # Authenticated REST API routes
│   │   │   ├── listings/    # Requisitions endpoints
│   │   │   ├── people/      # Talent profiles & two-way outreach endpoints
│   │   │   ├── contact/     # Requisition connect endpoint
│   │   │   ├── blocks/      # UGC blocking endpoint
│   │   │   ├── report/      # Moderation report endpoint
│   │   │   └── user/        # Profile, cascade deletion, and DPDP export
│   │   ├── people/          # Supply-side Talent Directory page
│   │   ├── profile/         # User profile, listings, and availability card management
│   │   ├── account-deletion/# Public GDPR/Play Store web deletion portal
│   │   └── ...              # Policy, guide, and terms pages
│   ├── components/          # Reusable UI components (PersonCard, ListingCard, Drawers)
│   ├── context/             # AuthContext (Supabase Google OAuth) & ThemeContext
│   ├── lib/                 # Core utilities (db, auth-server, api-client, validations)
│   └── types/               # TypeScript data definitions
└── tests/                   # Automated test suites (133 tests passing)
```

---

## 🛠️ Environment Variables Checklist

Set these in your local `.env.local` for development and in your **Vercel Project Settings > Environment Variables** for production:

| Variable Name | Description | Visibility |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Application root URL (e.g. `https://synqsquad.vercel.app`) | Client & Server |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (`https://<project-ref>.supabase.co`) | Client & Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Public Key (protected by RLS) | Client & Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Secret Key | Server-Only (Never Client) |
| `ANTHROPIC_API_KEY` | Anthropic API Key for message improvements | Server-Only |
| `ANTHROPIC_MODEL` | AI model name (`claude-haiku-5-5`) | Server-Only |

*(Note: Never place Google Client Secret in Next.js or Vercel. Google OAuth is configured exclusively in Supabase Dashboard > Authentication > Providers > Google).*

---

## 🧪 Automated Verification & Testing

RIVQ features 164 automated unit, integration, and security tests across multiple test runners:

```bash
# 1. Run core test suite (Auth Server, Privacy, Rate Limiting, UGC Blocks, Talent Profiles & Outreach)
npm test

# 2. Run standalone Supabase & Security unit test suite
node --experimental-strip-types tests/unit-tests.mjs

# 3. TypeScript type check
npx tsc --noEmit

# 4. ESLint check (0 errors, 0 warnings)
npm run lint

# 5. Production build compilation
npm run build
```

---

## 🚀 Deployment & Launch Steps

1. **Apply Supabase Migrations:**
   In your Supabase project SQL Editor, run:
   - `supabase/migrations/20261020000000_init_synqsquad.sql`
   - `supabase/migrations/20261020000001_add_blocks_table.sql`
   - `supabase/migrations/20261020000002_talent_profiles_and_outreach.sql`
2. **Deploy to Vercel:**
   Push code to GitHub. Vercel automatically compiles and deploys the 36 static and dynamic routes.
3. **Verify AssetLinks in Production:**
   ```bash
   curl -s https://synqsquad.vercel.app/.well-known/assetlinks.json
   ```
4. **Upload to Google Play Console:**
   Upload `android/app-release.aab` to your Closed Testing track.
