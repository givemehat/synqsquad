# ⚡ SynqSquad — The Zero-Friction Hackathon & Research Matchmaker

> **One-Line Pitch:** Find winning hackathon teammates and research paper co-authors in under 60 seconds — with direct 1-click outreach via Telegram, Discord, and WhatsApp, zero sign-up walls, zero customer service overhead, and an automated self-serve monetization engine.

---

## 🎯 The Problem SynqSquad Solves
- **Dead Chat Groups & Ghost Inboxes:** Traditional platforms force users to register, wait for review, and chat inside walled inboxes where 85% of messages go unanswered.
- **Skill Asymmetry:** Machine learning researchers lack UI builders; frontend developers lack AI/backend leads.
- **Maintenance Nightmare:** Most team finders break because of complex database servers, user support tickets, password resets, and manual listing moderation.

## 💡 The Astrocrate Architecture
1. **Zero Customer Service Overhead:** 
   - Every poster receives an automated **6-digit Manage PIN** upon publishing.
   - Users mark their teams as "Filled / Closed", update requirements, or delete their posts at any time using their PIN. No support tickets or admin intervention required.
2. **Zero-Ops Self-Healing Storage:** 
   - Atomic file-backed persistent JSON database (`data/listings.json`). Runs instantly out of the box with `npm run dev` or `npm run build` on any machine or server without requiring PostgreSQL servers or cloud credentials.
3. **Automated Self-Serve Monetization:**
   - **Starter Spike (₹99 / $1.49):** 72-hour top feed placement.
   - **Pro Spotlight (₹199 / $2.99):** 7-day golden pinned placement + 5x Discord syndication.
   - **Grand Slam (₹349 / $4.99):** 14-day tournament/paper cycle spotlight.
   - Direct UPI QR and Card checkout simulation with instant automated activation.
4. **AI Skill Scout & Matcher:**
   - Evaluates complementary roles and skill matrices to rank the top 5 compatible teams for any developer profile in milliseconds.
5. **Live Hackathons & Research Grants Radar:**
   - Curated upcoming hackathons (Smart India Hackathon, ETHGlobal, NASA Space Apps, NeurIPS Workshop, Solana) with 1-click team discovery filters.

---

## 🚀 Quick Start (Runs with One Command)

### 1. Install & Run
```bash
# Clone or navigate to the directory
cd 8all

# Install dependencies (already installed)
npm install

# Run in Development mode
npm run dev

# Or build & start Production mode
npm run build
npm run start
```
Visit **`http://localhost:3000`** in your browser.

---

## 🧪 Automated Test Suite (100% Pass Rate)

An automated end-to-end integration test is provided in `tests/api-e2e.mjs`:
```bash
npm run build
npm run start -p 3000

# In another terminal:
node tests/api-e2e.mjs
```
**Test Coverage:**
- `GET /api/listings` — Verifies listing feed, search, and pre-seeded listings.
- `GET /api/hackathons` — Verifies competition tracker.
- `POST /api/listings` — Tests listing creation, validation, and PIN generation.
- `POST /api/boost` — Tests monetization upgrade, duration calculation, and receipt generation.
- `PATCH /api/listings/[id]` — Verifies PIN authentication, preventing unauthorized edits while permitting verified status changes.
- `DELETE /api/listings/[id]` — Verifies self-serve deletion with PIN.

---

## 🌐 Publish to Google & Production Deploy

### Step 1: Deploy to Vercel (1-Click)
1. Push this directory to your GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "feat: SynqSquad platform"
   git remote add origin https://github.com/YOUR_USERNAME/synqsquad.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com), click **Add New Project**, and select your repo.
3. Vercel automatically detects Next.js. Click **Deploy**.

### Step 2: Google Search Console Indexing
1. `public/robots.txt` and `public/sitemap.xml` are already configured for Googlebot.
2. Go to [Google Search Console](https://search.google.com/search-console).
3. Add your production domain (e.g., `https://synqsquad.app`).
4. Under **Sitemaps**, submit: `https://YOUR_DOMAIN/sitemap.xml`.
5. Google will index your landing page and all competition category feeds within 24-48 hours.

---

## 📁 Clean Folder Structure

```
8all/
├── data/
│   └── listings.json              # Persistent zero-ops database
├── public/
│   ├── robots.txt                 # Google bot crawler rules
│   └── sitemap.xml                # SEO sitemap
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── boost/route.ts     # Monetization & boost activation
│   │   │   ├── hackathons/route.ts# Upcoming hackathons API
│   │   │   └── listings/
│   │   │       ├── route.ts       # Feed list & create endpoints
│   │   │       └── [id]/route.ts  # PIN-guarded update & delete
│   │   ├── globals.css            # Dark theme, glows & typography
│   │   ├── layout.tsx             # Root layout with SEO meta tags
│   │   └── page.tsx               # Primary app page & filter engine
│   ├── components/
│   │   ├── BoostModal.tsx         # Self-serve payment & boost UI
│   │   ├── CreateListingModal.tsx # Zero-friction posting + PIN modal
│   │   ├── Footer.tsx             # Trust badges, links & SEO
│   │   ├── HackathonRadar.tsx     # Competitions & grants tracker
│   │   ├── Hero.tsx               # Search, domain pills & stats
│   │   ├── ListingCard.tsx        # Direct contact buttons & badges
│   │   ├── ManageListingModal.tsx # 6-digit PIN self-moderation
│   │   ├── Navbar.tsx             # Responsive header & live badge
│   │   └── SmartMatcherModal.tsx  # AI algorithm skill matcher
│   ├── data/
│   │   └── seed.ts                # Rich seed listings & events
│   ├── lib/
│   │   └── db.ts                  # Atomic file DB & helper methods
│   └── types/
│       └── index.ts               # Shared TypeScript definitions
├── tests/
│   └── api-e2e.mjs                # Comprehensive automated test suite
├── package.json
└── tsconfig.json
```

---

## 💰 Monetization Model Breakdown
1. **Self-Service Boost Tiers:**
   - ₹99 ($1.49) — 3-Day Spike
   - ₹199 ($2.99) — 7-Day Spotlight (Pinned #1 with glowing gold badge)
   - ₹349 ($4.99) — 14-Day Grand Slam
2. **Featured Sponsor Slots:**
   - Banner slots for hackathon organizers seeking more registrants.
3. **Zero Overhead:**
   - Payments run through automated UPI QR codes and card processing — transactions confirm automatically, activating perks instantly with zero human customer support tickets.
