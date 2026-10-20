# Security Policy & Vulnerability Disclosure

RIVQ (`com.rivq.app`, https://synqsquad.vercel.app) is committed to protecting the privacy, identity, and security of developers, researchers, and students collaborating across hackathons and academic research projects.

---

## 1. Reporting a Vulnerability

If you discover a security vulnerability, flaw, or data leakage in RIVQ, please report it privately rather than publicly disclosing it.

* **Security Email:** `rajnishsingh.work@gmail.com`
* **Response SLA:** Initial acknowledgment within **24 hours**, triage and assessment within **72 hours**.
* **Coordinated Disclosure:** We ask that you allow reasonable time for a fix to be deployed before publicly discussing any findings.

Please include in your report:
1. Target endpoint, route, or Android component affected.
2. Step-by-step reproduction guide or proof-of-concept (POC).
3. The potential impact (e.g., identity spoofing, IDOR, data leakage, denial of service).

---

## 2. Core Security Architecture & Standards

RIVQ enforces a zero-trust, defense-in-depth model across all endpoints:

1. **Authentication:**
   - Identity is verified strictly server-side via Supabase Auth JSON Web Tokens (`getUser`).
   - Client headers (e.g., `x-user-email`) and body claims are strictly ignored for authorization.
   - Test backdoors (`.test_sig`, `ALLOW_TEST_AUTH`) are prohibited and excluded from the production build.

2. **Authorization & Row-Level Security (RLS):**
   - Direct database access to raw tables (`listings`, `talent_profiles`, `outreach`, `blocks`) is restricted.
   - Public feeds read exclusively from SQL views (`public_listings`, `public_talent_profiles`) that cryptographically mask email addresses inside PostgreSQL.
   - Mutations strictly verify that `auth.uid() = owner_id` or `auth.jwt() ->> 'email' = owner_email`.

3. **Data Protection & Compliance:**
   - Compliant with India's Digital Personal Data Protection (DPDP) Act 2023 and GDPR.
   - Instant in-app account erasure (`DELETE /api/user`) permanently deletes user profile, listings, outreach, and blocks in a single cascading transaction.
   - Full data portability export available as structured JSON (`GET /api/user/export`).

4. **Rate Limits & Anti-Spam:**
   - Direct outreach is capped at 10 requests per user per rolling 24-hour window.
   - Automated server-side content sanitizers block off-platform phishing, Telegram handles, Discord invites, WhatsApp short-links, and crypto airdrop spam.

---

## 3. Abuse & Moderation Runbook

### Report Ingestion & Triage
1. User-submitted reports (`POST /api/report`) are immutably logged into the Supabase `reports` table with status `pending`.
2. Severity triage criteria:
   - **Critical (Action within 4 hours):** Child safety, hate speech, malicious links/malware, extortion, targeted harassment.
   - **High (Action within 12 hours):** External chat spam, unauthorized impersonation, scam recruitment.
   - **Normal (Action within 24 hours):** Commercial advertising, duplicate requisitions, outdated listings.

### Moderator Actions
- **Hide Content:** Sets `status = 'hidden'` on the target listing or talent profile. Immediately removes the item from public feeds and views.
- **User Ban:** Terminates the offender's Supabase session and sets `visible = false`, preventing future listing or talent profile publishing.
- **Account Deletion Request:** Any formal GDPR/DPDP deletion request sent via email is processed within 48 hours if not executed via the self-serve in-app button.
