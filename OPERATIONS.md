# RIVQ — Production Operations, Reliability & Security Runbook

This runbook defines standard operating procedures, reliability checks, incident mitigation, and data security policies for RIVQ in production.

---

## 1. Structured Logging & PII Scrubbing

### Policy
- **No PII in Logs**: Never log plaintext email addresses, authentication tokens, session secrets, or full user names to stdout/stderr.
- **Log Format**: All production logs must use standard JSON or bracketed tags:
  ```json
  {"timestamp":"2026-10-21T08:30:00Z","level":"info","route":"/api/listings","event":"listing_created","listingId":"lst-xxx"}
  ```
- **Error Sanitization**: Database error messages containing SQL fragments or connection details are caught and logged with sanitized context before returning generic status codes (500) to API clients.

---

## 2. Uptime Monitoring & Health Checks

- **Endpoint**: `GET /api/health`
- **Output**:
  ```json
  {
    "status": "healthy",
    "version": "1.3.0",
    "db_configured": true,
    "db_reachable": true,
    "auth_configured": true,
    "timestamp": "2026-10-21T08:30:00.000Z"
  }
  ```
- **Setup Recommendation**:
  - Configure a free uptime monitor (e.g., Better Uptime, UptimeRobot, or Checkly) pinging `https://synqsquad.vercel.app/api/health` every 5 minutes.
  - Alert trigger: HTTP status != 200 or `status != "healthy"`.

---

## 3. Database Backups and Disaster Recovery

### Supabase Backups
1. Automated daily backups run on Supabase (retained for 7 days on Pro, or manual CSV export on Free tier).
2. Before any schema change or data purge:
   - Export CSV snapshots from the Supabase Table Editor.
   - Run `SELECT count(*)` across all tables and save the baseline.

### Point-in-Time Restore (PITR) & Disaster Recovery Note
- In the event of catastrophic data corruption or bad migration:
  - If on Supabase Pro: Use PITR to roll back to a timestamp 5 minutes prior to incident.
  - If on Supabase Free: Re-run migration SQL files against a fresh project and restore from exported CSVs using Supabase Table Editor Import.

---

## 4. Rollback Procedures

### Bad Deployment (Vercel)
1. Go to Vercel Dashboard -> **Deployments**.
2. Locate the previous healthy deployment (e.g., commit tagged `v1.2.0`).
3. Click the three dots `...` -> **Promote to Production** (instant zero-downtime rollback).

### Bad Database Migration
1. Migrations are idempotent (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`).
2. If a migration broke production:
   - Prepare a forward-fix migration or drop newly added index/view.
   - Never run `DROP TABLE` on live tables with production user records.

---

## 5. Moderation & Abuse Runbook (Google Play UGC Compliance)

### 24-Hour Moderation SLA
1. **Flag Ingestion**: Reports submitted via `/api/report` are stored in `public.reports` with status `pending`.
2. **Review Triage**:
   - Query pending reports weekly or via daily automated script:
     ```sql
     SELECT * FROM public.reports WHERE status = 'pending' ORDER BY created_at DESC;
     ```
3. **Action Pathways**:
   - **Objectionable Content**: Set `status = 'resolved'`, delete listing or hide talent profile:
     ```sql
     UPDATE public.listings SET status = 'filled' WHERE id = '<target_id>';
     -- or
     UPDATE public.talent_profiles SET visible = false, availability = 'hidden' WHERE id = '<target_id>';
     ```
   - **Abusive User**: Ban user by cascading deletion or adding to global blocks:
     ```sql
     SELECT public.delete_user_data_cascade('<abusive_user_email>');
     ```
   - **Frivolous Flag**: Set `status = 'dismissed'`.

---

## 6. Security Vulnerability Disclosure & Secret Scanning

- **Security Policy**: Available publicly at `SECURITY.md`.
- **Security Contact**: RFC 9116 compliant `/.well-known/security.txt` published on production domain:
  - Email: `rajnishsingh.work@gmail.com`
- **Secret Scanning**:
  - GitHub Secret Scanning and Dependabot alerts enabled on repository.
  - CI pipeline enforces Gitleaks scan on every commit.

---

## 7. CI/CD Pipeline Summary (`.github/workflows/ci.yml`)

The automated pipeline runs on every push and pull request to `main`:
1. **Gitleaks**: Scans git history for accidental token leaks.
2. **npm audit**: Fails build on `high` or `critical` severity CVEs.
3. **TypeScript**: `tsc --noEmit` ensures complete type safety across all routes.
4. **ESLint**: Catches syntax and Next.js rule deprecations.
5. **Unit Tests**: Executes pure validation and business logic tests.
6. **Live DB Tests**: Runs integration test suite if `SUPABASE_TEST_URL` secret is configured.
7. **Production Build**: Compiles webpack production bundles.
8. **Client Bundle Scan**: Greps `.next/static` to prove zero server secrets (`SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`) leaked into client-side JS.
