# RIVQ / SynqSquad — Production Data Audit & Safe Purge Procedure

> **SAFETY DIRECTIVE**:
> 1. Never run deletion statements without a complete backup.
> 2. This procedure uses **explicit IDs and exact test identifiers**. It does NOT use broad wildcards (`id LIKE 'lst-%'`) or aggressive regexes that risk deleting real users.
> 3. Schema column names in this script are verified directly against `supabase/migrations/20261020000000_init_synqsquad.sql` and `20261020000002_talent_profiles_and_outreach.sql`.

---

## Pre-Requisite: Database Backup

Before executing any script in the Supabase SQL Editor:
1. Log into your Supabase Dashboard: `https://supabase.com/dashboard/project/kkndyiguzadfkakxjaaj`
2. Navigate to **Database** -> **Backups** -> Create a manual snapshot if supported on your plan.
3. In the **Table Editor**, export CSVs for:
   - `listings`
   - `talent_profiles`
   - `users`
   - `contacts`
   - `outreach`
   - `blocks`
   - `reports`

---

## Phase 1: Read-Only Audit (Run This First)

Execute the following read-only query in the Supabase SQL Editor. It will inspect every existing row and label it as **SEED**, **TEST_USER**, or **REAL_USER**:

```sql
-- ============================================================================
-- AUDIT QUERY 1: Inspect all listings
-- ============================================================================
SELECT 
  id,
  owner_name,
  owner_email,
  event,
  title,
  created_at,
  CASE
    WHEN id IN (
      'lst-sih-railway-01',
      'lst-neurips-mri-02',
      'lst-ethglobal-arbitrage-03',
      'lst-spaceapps-exoplanet-04',
      'lst-robotics-drone-05',
      'lst-solo-karan-06',
      'lst-sih-cyber-07',
      'lst-nlp-legal-08',
      'lst-solana-depin-09',
      'lst-climate-carbon-10',
      'lst-fintech-quant-11',
      'lst-solo-priya-12'
    ) THEN 'SEED_ROW'
    WHEN LOWER(owner_email) IN (
      'alice@gmail.com',
      'bob@gmail.com',
      'test@gmail.com',
      'testuser@gmail.com',
      'qa@gmail.com'
    ) OR owner_id IN ('usr-alice', 'usr-bob', 'usr-test') THEN 'TEST_AUTOMATION_ROW'
    ELSE 'REAL_USER_ROW (DO NOT DELETE)'
  END AS classification
FROM public.listings
ORDER BY created_at ASC;

-- ============================================================================
-- AUDIT QUERY 2: Inspect all talent profiles
-- ============================================================================
SELECT 
  id,
  user_id,
  display_name,
  email,
  headline,
  created_at,
  CASE
    WHEN id IN (
      'prf-ananya-ai-01',
      'prf-dev-systems-02',
      'prf-priya-frontend-03',
      'prf-rahul-robotics-04',
      'prf-sarah-nlp-05',
      'prf-kabir-web3-06',
      'prf-tanvi-bioinfo-07',
      'prf-arjun-fullstack-08'
    ) THEN 'SEED_ROW'
    WHEN LOWER(email) IN (
      'alice@gmail.com',
      'bob@gmail.com',
      'test@gmail.com',
      'testuser@gmail.com',
      'qa@gmail.com'
    ) OR user_id IN ('usr-alice', 'usr-bob', 'usr-test') THEN 'TEST_AUTOMATION_ROW'
    ELSE 'REAL_USER_ROW (DO NOT DELETE)'
  END AS classification
FROM public.talent_profiles
ORDER BY created_at ASC;

-- ============================================================================
-- AUDIT QUERY 3: Inspect all registered users
-- ============================================================================
SELECT 
  id,
  name,
  email,
  college,
  created_at,
  CASE
    WHEN id IN (
      'usr-aarav-01',
      'usr-elena-02',
      'usr-vikram-03',
      'usr-maya-04',
      'usr-chen-05',
      'usr-karan-06',
      'usr-ananya-07',
      'usr-rohan-08',
      'usr-tanya-09',
      'usr-samuel-10',
      'usr-aditya-11',
      'usr-priya-12',
      'usr-dev-02',
      'usr-priya-03',
      'usr-rahul-04',
      'usr-sarah-05',
      'usr-kabir-06',
      'usr-tanvi-07',
      'usr-arjun-08'
    ) THEN 'SEED_ROW'
    WHEN LOWER(email) IN (
      'alice@gmail.com',
      'bob@gmail.com',
      'test@gmail.com',
      'testuser@gmail.com',
      'qa@gmail.com'
    ) OR id IN ('usr-alice', 'usr-bob', 'usr-test') THEN 'TEST_AUTOMATION_ROW'
    ELSE 'REAL_USER_ROW (DO NOT DELETE)'
  END AS classification
FROM public.users
ORDER BY created_at ASC;
```

---

## Phase 2: Transaction-Wrapped Safe Purge

Once you have visually reviewed Phase 1 and confirmed that **NO REAL USERS** are classified under the explicit deletion IDs, run this script in the Supabase SQL Editor.

It runs in a single ACID transaction (`BEGIN; ... COMMIT;`). If any error occurs, the entire operation is automatically rolled back:

```sql
BEGIN;

-- 1. Purge contacts associated with seed listings or test emails
DELETE FROM public.contacts
WHERE listing_id IN (
  'lst-sih-railway-01',
  'lst-neurips-mri-02',
  'lst-ethglobal-arbitrage-03',
  'lst-spaceapps-exoplanet-04',
  'lst-robotics-drone-05',
  'lst-solo-karan-06',
  'lst-sih-cyber-07',
  'lst-nlp-legal-08',
  'lst-solana-depin-09',
  'lst-climate-carbon-10',
  'lst-fintech-quant-11',
  'lst-solo-priya-12'
)
OR LOWER(from_user_email) IN (
  'alice@gmail.com',
  'bob@gmail.com',
  'test@gmail.com',
  'testuser@gmail.com',
  'qa@gmail.com'
);

-- 2. Purge outreach messages referencing seed profiles or test users
DELETE FROM public.outreach
WHERE profile_id IN (
  'prf-ananya-ai-01',
  'prf-dev-systems-02',
  'prf-priya-frontend-03',
  'prf-rahul-robotics-04',
  'prf-sarah-nlp-05',
  'prf-kabir-web3-06',
  'prf-tanvi-bioinfo-07',
  'prf-arjun-fullstack-08'
)
OR sender_id IN ('usr-alice', 'usr-bob', 'usr-test')
OR recipient_id IN ('usr-alice', 'usr-bob', 'usr-test')
OR LOWER(sender_email) IN (
  'alice@gmail.com',
  'bob@gmail.com',
  'test@gmail.com',
  'testuser@gmail.com',
  'qa@gmail.com'
);

-- 3. Purge seed listings and test listings
DELETE FROM public.listings
WHERE id IN (
  'lst-sih-railway-01',
  'lst-neurips-mri-02',
  'lst-ethglobal-arbitrage-03',
  'lst-spaceapps-exoplanet-04',
  'lst-robotics-drone-05',
  'lst-solo-karan-06',
  'lst-sih-cyber-07',
  'lst-nlp-legal-08',
  'lst-solana-depin-09',
  'lst-climate-carbon-10',
  'lst-fintech-quant-11',
  'lst-solo-priya-12'
)
OR owner_id IN ('usr-alice', 'usr-bob', 'usr-test')
OR LOWER(owner_email) IN (
  'alice@gmail.com',
  'bob@gmail.com',
  'test@gmail.com',
  'testuser@gmail.com',
  'qa@gmail.com'
);

-- 4. Purge seed talent profiles and test talent profiles
DELETE FROM public.talent_profiles
WHERE id IN (
  'prf-ananya-ai-01',
  'prf-dev-systems-02',
  'prf-priya-frontend-03',
  'prf-rahul-robotics-04',
  'prf-sarah-nlp-05',
  'prf-kabir-web3-06',
  'prf-tanvi-bioinfo-07',
  'prf-arjun-fullstack-08'
)
OR user_id IN ('usr-alice', 'usr-bob', 'usr-test')
OR LOWER(email) IN (
  'alice@gmail.com',
  'bob@gmail.com',
  'test@gmail.com',
  'testuser@gmail.com',
  'qa@gmail.com'
);

-- 5. Purge blocks related to test users
DELETE FROM public.blocks
WHERE LOWER(blocker_email) IN ('alice@gmail.com', 'bob@gmail.com', 'test@gmail.com')
   OR LOWER(blocked_email) IN ('alice@gmail.com', 'bob@gmail.com', 'test@gmail.com');

-- 6. Purge seed user profiles
DELETE FROM public.users
WHERE id IN (
  'usr-aarav-01',
  'usr-elena-02',
  'usr-vikram-03',
  'usr-maya-04',
  'usr-chen-05',
  'usr-karan-06',
  'usr-ananya-07',
  'usr-rohan-08',
  'usr-tanya-09',
  'usr-samuel-10',
  'usr-aditya-11',
  'usr-priya-12',
  'usr-dev-02',
  'usr-priya-03',
  'usr-rahul-04',
  'usr-sarah-05',
  'usr-kabir-06',
  'usr-tanvi-07',
  'usr-arjun-08',
  'usr-alice',
  'usr-bob',
  'usr-test'
)
OR LOWER(email) IN (
  'alice@gmail.com',
  'bob@gmail.com',
  'test@gmail.com',
  'testuser@gmail.com',
  'qa@gmail.com'
);

COMMIT;
```

---

## Phase 3: Post-Purge Verification

Run this verification check to confirm the clean state of your database:

```sql
SELECT 'listings' AS table_name, count(*) AS remaining_count FROM public.listings
UNION ALL
SELECT 'talent_profiles', count(*) FROM public.talent_profiles
UNION ALL
SELECT 'users', count(*) FROM public.users
UNION ALL
SELECT 'contacts', count(*) FROM public.contacts
UNION ALL
SELECT 'outreach', count(*) FROM public.outreach;
```

Expected result:
- Seed rows (12 listings, 8 talent profiles) are completely removed.
- Any legitimate user accounts created by actual testers remain untouched.
- Table row counts match only real user data.
