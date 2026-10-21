# Pull Request: Round 6 Audit Overhaul — Single Data Path, RLS Defense-in-Depth & Backdoor Elimination

**Target Branch**: `main`  
**Source Branch**: `release/round-6`  
**Status**: Ready for Manual Review & Merge (Strictly following rule: No automated pushes to `main`)

---

## Executive Summary

This pull request completes the **ROUND 6** engineering overhaul of RIVQ (`com.rivq.app`), resolving the critical architectural flaws, false green claims, and security backdoors discovered in prior iterations:

1. **Root Cause Resolved (Silent Memory Fallback)**:
   - Live Supabase holds 12 seeded listings, but production `/api/listings` returned `count: 0` because `SUPABASE_SERVICE_ROLE_KEY` was missing on Vercel. Previously, `db.ts` silently fell back to an in-memory array (`inMemoryListings = []`), causing user data to be lost upon Lambda recycling.
   - **Fix**: Completely deleted all in-memory arrays from `src/lib/db.ts`. The application now has **strictly one data path** (PostgreSQL via Supabase). If credentials or connectivity fail, the API fails loudly with structured server error logs and generic 500 responses.

2. **Test Backdoors Completely Eradicated**:
   - Removed `.test_sig` mock JWT validation, `DEMO_MODE`, and `ALLOW_TEST_AUTH` from `src/lib/auth-server.ts`.
   - Verified via a clean production build (`rm -rf .next && npm run build`) and recursive grep that zero test backdoor strings exist anywhere in the `.next` bundle.

3. **RLS Defense-in-Depth Implemented**:
   - Created `src/lib/supabase-admin.ts` to strictly isolate `SUPABASE_SERVICE_ROLE_KEY` for narrow administrative operations (cascade account deletion, rate-limiting stored procedures, and moderation reports).
   - Created `getSupabaseUserClient(userJwt)` in `src/lib/supabase-server.ts`. User-scoped mutations and reads across `listings`, `people`, `contacts`, `blocks`, and `user` pass the verified caller's Bearer JWT, enforcing PostgreSQL Row-Level Security as a second layer of defense behind application code.

4. **Brand Centralization (`BRAND.md` & `src/config/brand.ts`)**:
   - Centralized application branding, domain, legal name, support email, and Android package ID into `src/config/brand.ts`.
   - Documented the permanent nature of the Android `applicationId` (`com.rivq.app`) once uploaded to the Google Play Developer Console in `BRAND.md`.

5. **Lighthouse Performance & Mobile Accessibility on `/people`**:
   - Replaced eager modal imports with Next.js code-split dynamic imports (`PersonDetailModal`, `UserProfileDrawer`, `CreateListingModal`).
   - Added client-side pagination (`PAGE_SIZE = 12`) with a "Load More" action.
   - Ensured all input fields, selects, and buttons meet WCAG 2.1 Target Size (minimum 44px) and have descriptive `aria-label` attributes.
   - Added keyboard navigation support (`role="button"`, `tabIndex={0}`, Space/Enter listeners) to `PersonCard`.

6. **Production Health & Operational Deliverables**:
   - Added `GET /api/health` returning system availability booleans without leaking secrets or counts.
   - Created `PURGE_PROCEDURE.md` providing a safe, transaction-wrapped SQL purge for seeded and test rows based on explicit IDs only.
   - Created `LAUNCH_ANNOUNCEMENT.md` with honest, unhyped copy for LinkedIn, WhatsApp, and X.
   - Created `OPERATIONS.md` detailing structured logging, PII scrubbing, backups, rollback procedures, and the 24-hour moderation SLA.

---

## Changed Files & Line Diffs

| File | Type | Description |
|---|---|---|
| `src/config/brand.ts` | New | Centralized brand, domain, and package ID configuration |
| `BRAND.md` | New | Brand occurrence catalog and Play Console permanence warning |
| `src/app/api/health/route.ts` | New | Health check endpoint returning boolean system status |
| `src/lib/supabase-admin.ts` | New | Isolated service-role client with audit documentation |
| `src/lib/supabase-server.ts` | Modified | Added user-scoped JWT client and anon client helpers |
| `src/lib/auth-server.ts` | Modified | Eradicated `.test_sig`, `DEMO_MODE`, and `ALLOW_TEST_AUTH` |
| `src/lib/db.ts` | Modified | Deleted all in-memory stores; wired JWT tokens into DB queries |
| `src/app/api/listings/route.ts` | Modified | Injected `auth.token` for user-scoped listing creation |
| `src/app/api/listings/[id]/route.ts` | Modified | Injected `auth.token` for user-scoped patch/delete |
| `src/app/api/people/route.ts` | Modified | Injected `auth.token` for talent profile upsert |
| `src/app/api/people/[id]/route.ts` | Modified | Injected `auth.token` for visibility update & delete |
| `src/app/api/contact/route.ts` | Modified | Injected `auth.token` for contacted listing history |
| `src/app/api/user/route.ts` | Modified | Injected `auth.token` for user profile upsert & fetch |
| `src/app/api/user/export/route.ts` | Modified | Injected `auth.token` for GDPR/DPDP export |
| `src/app/api/blocks/route.ts` | Modified | Injected `auth.token` for blocking & unblocking |
| `src/app/people/page.tsx` | Modified | Code-split modals, paginated rendering, 44px targets, ARIA labels |
| `src/components/PersonCard.tsx` | Modified | Keyboard navigation, role, tabIndex, focus rings |
| `PURGE_PROCEDURE.md` | New | Safe, transaction-wrapped production SQL purge script |
| `LAUNCH_ANNOUNCEMENT.md` | New | Clean student founder launch copy (no hype, no emojis) |
| `OPERATIONS.md` | New | Production runbook, PII scrubbing, backups & rollback |

---

## Manual Verification & Evidence

### 1. TypeScript & Production Build
```bash
npx tsc --noEmit
# Exit code: 0 (Zero compiler errors across entire codebase)

rm -rf .next && npm run build
# Exit code: 0 (Compiled successfully in 3.6s, all 36 routes generated)
```

### 2. Bundle Backdoor Audit
```bash
grep -rnE "(\.test_sig|DEMO_MODE|ALLOW_TEST_AUTH)" .next/
# Exit code: 1 (0 matches found in entire production build)
```

### 3. Unit Test Suite
```bash
node tests/unit.test.mjs
# 6/6 tests passing (Anti-spam, validation, expiry math, UGC block filter, brand alignment)
```

---

## Manual Steps for the Repository Owner

Follow these exact steps in order:

### Step 1: Decide Final Brand & Package ID
- Confirm whether the final brand is **RIVQ** (`com.rivq.app`) or **SynqSquad** (`com.synqsquad.app`).
- **CRITICAL WARNING**: Once an AAB with `applicationId "com.rivq.app"` is uploaded to the Google Play Console, that package ID is **permanently locked to that Play Console entry forever**.

### Step 2: Configure Environment Variables in Vercel
In the Vercel Dashboard -> Project Settings -> Environment Variables, ensure the following are set:
- `NEXT_PUBLIC_SUPABASE_URL`: `https://kkndyiguzadfkakxjaaj.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `<your_anon_key>`
- `SUPABASE_SERVICE_ROLE_KEY`: `<your_service_role_key>` *(Do NOT prefix with `NEXT_PUBLIC_`)*
- `NEXT_PUBLIC_APP_URL`: `https://synqsquad.vercel.app` (or your custom domain)

### Step 3: Run the Safe Data Purge in Supabase
1. Review [`PURGE_PROCEDURE.md`](file:///Users/rajnishsingh/Downloads/8all/PURGE_PROCEDURE.md).
2. Take a manual backup/CSV export from the Supabase Dashboard.
3. Run Phase 1 (Audit SELECT queries) to verify classifications.
4. Run Phase 2 (Transaction-wrapped DELETE statements) to remove only seed rows and test automation users.

### Step 4: Merge Branch `release/round-6` Manually
Once satisfied with this pull request:
```bash
git checkout main
git merge release/round-6
git push origin main
```
*(This triggers automatic deployment on Vercel with clean single-path Supabase database connectivity)*.

### Step 5: Verify Live Production Health
Once deployed, verify:
```bash
curl -s https://synqsquad.vercel.app/api/health
```
Expected response:
```json
{"status":"healthy","version":"1.3.0","db_configured":true,"db_reachable":true,"auth_configured":true}
```
