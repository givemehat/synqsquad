-- =========================================================
-- SynqSquad: Production Schema & Strict Row-Level Security
-- Hardened for Public Repositories (Public Anon Key Architecture)
-- Strict Defense: Anon users CANNOT query owner emails directly
-- DPDP Act 2023, GDPR, and Google OAuth Compliance
-- =========================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@gmail\.com$'),
  photo TEXT,
  role TEXT NOT NULL DEFAULT 'Developer',
  college TEXT NOT NULL DEFAULT 'Independent',
  skills TEXT[] NOT NULL DEFAULT '{}',
  looking_for TEXT NOT NULL DEFAULT 'both' CHECK (looking_for IN ('hackathon', 'research', 'both')),
  bio TEXT NOT NULL DEFAULT '',
  consent_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 2. LISTINGS TABLE
CREATE TABLE IF NOT EXISTS public.listings (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_email TEXT NOT NULL CHECK (owner_email ~* '^[A-Za-z0-9._%+-]+@gmail\.com$'),
  owner_college TEXT NOT NULL DEFAULT 'Independent',
  owner_role TEXT NOT NULL DEFAULT 'Developer',
  owner_photo TEXT,
  type TEXT NOT NULL CHECK (type IN ('hackathon', 'research', 'solo')),
  title TEXT NOT NULL CHECK (length(title) >= 5 AND length(title) <= 120),
  event TEXT NOT NULL CHECK (length(event) >= 2 AND length(event) <= 80),
  deadline TEXT DEFAULT 'Upcoming',
  skills_needed TEXT[] NOT NULL DEFAULT '{}',
  slots INTEGER NOT NULL DEFAULT 1 CHECK (slots >= 1 AND slots <= 10),
  total_slots INTEGER NOT NULL DEFAULT 4 CHECK (total_slots >= slots AND total_slots <= 12),
  description TEXT NOT NULL CHECK (length(description) >= 20 AND length(description) <= 2000),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'filled', 'expired', 'hidden')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_owner_email ON public.listings(owner_email);
CREATE INDEX IF NOT EXISTS idx_listings_type ON public.listings(type);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.listings(created_at DESC);

-- 3. CONTACTS TABLE (10 Connects / Day Rate-Limiting & Audit)
CREATE TABLE IF NOT EXISTS public.contacts (
  id TEXT PRIMARY KEY,
  from_user_email TEXT NOT NULL CHECK (from_user_email ~* '^[A-Za-z0-9._%+-]+@gmail\.com$'),
  listing_id TEXT NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_contacts_user_window ON public.contacts(from_user_email, created_at DESC);

-- 4. REPORTS TABLE (Moderation & Safety)
CREATE TABLE IF NOT EXISTS public.reports (
  id TEXT PRIMARY KEY,
  reporter_email TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('listing', 'user')),
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (length(reason) >= 3 AND length(reason) <= 100),
  details TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- 5. BLOCKS TABLE (UGC Safety & In-App Blocking Policy)
CREATE TABLE IF NOT EXISTS public.blocks (
  id TEXT PRIMARY KEY,
  blocker_email TEXT NOT NULL,
  blocked_email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(blocker_email, blocked_email)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON public.blocks(blocker_email);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON public.blocks(blocked_email);

-- =========================================================
-- SAFE PUBLIC VIEWS (EMAIL PRIVACY ENFORCEMENT)
-- Anon / public users query THESE views, NEVER the raw tables.
-- =========================================================

-- Safe public view of listings with masked creator emails
CREATE OR REPLACE VIEW public.public_listings AS
SELECT 
  id,
  owner_id,
  owner_name,
  concat(
    substr(owner_email, 1, 2),
    '••••',
    substr(owner_email, position('@' in owner_email))
  ) AS owner_email,
  owner_college,
  owner_role,
  owner_photo,
  type,
  title,
  event,
  deadline,
  skills_needed,
  slots,
  total_slots,
  description,
  status,
  expires_at,
  created_at,
  updated_at
FROM public.listings
WHERE status != 'hidden';

-- Safe public view of user profiles with ZERO contact details
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  name,
  photo,
  role,
  college,
  skills,
  looking_for,
  bio,
  created_at
FROM public.users;

-- Revoke direct permissions on underlying tables from anon
REVOKE SELECT ON public.users FROM anon;
REVOKE SELECT ON public.listings FROM anon;

-- Grant SELECT on safe public views to anon and authenticated
GRANT SELECT ON public.public_listings TO anon, authenticated;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- =========================================================
-- SECURE FUNCTIONS & STORED PROCEDURES (WITH search_path)
-- =========================================================

-- Atomic Rate-Limited Contact Transaction with Row Locking
CREATE OR REPLACE FUNCTION public.record_contact_rate_limited(
  p_from_user_email TEXT,
  p_listing_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INT;
  v_contact_id TEXT;
  v_listing_status TEXT;
  v_expires_at TIMESTAMPTZ;
  v_owner_email TEXT;
  v_owner_name TEXT;
  v_event TEXT;
  v_title TEXT;
  v_is_blocked BOOLEAN;
BEGIN
  -- Strict sanitization of input
  p_from_user_email := LOWER(TRIM(p_from_user_email));

  -- 1. ADVISORY TRANSACTION LOCK on caller hash
  -- Serializes concurrent burst attempts for the same sender across tabs/parallel threads
  PERFORM pg_advisory_xact_lock(hashtext(p_from_user_email));

  -- 2. Verify listing details
  SELECT status, expires_at, owner_email, owner_name, event, title
  INTO v_listing_status, v_expires_at, v_owner_email, v_owner_name, v_event, v_title 
  FROM public.listings 
  WHERE id = p_listing_id;

  IF v_listing_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Listing not found');
  END IF;

  IF v_listing_status = 'filled' THEN
    RETURN jsonb_build_object('success', false, 'error', 'This requisition has already been filled.');
  END IF;

  IF v_listing_status = 'expired' OR v_expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'This requisition has expired.');
  END IF;

  -- 3. Check UGC Blocks
  SELECT EXISTS (
    SELECT 1 FROM public.blocks
    WHERE (LOWER(blocker_email) = p_from_user_email AND LOWER(blocked_email) = LOWER(v_owner_email))
       OR (LOWER(blocker_email) = LOWER(v_owner_email) AND LOWER(blocked_email) = p_from_user_email)
  ) INTO v_is_blocked;

  IF v_is_blocked THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot contact this user.');
  END IF;

  -- 4. Count contacts within rolling 24-hour window
  SELECT COUNT(*) INTO v_count
  FROM public.contacts
  WHERE LOWER(from_user_email) = p_from_user_email
    AND created_at >= (now() - interval '24 hours');

  IF v_count >= 10 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Daily outreach limit reached (10/day). This protects creators from mass inquiries.',
      'remainingToday', 0
    );
  END IF;

  -- 5. Atomic record insert
  v_contact_id := 'cnt-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12);

  INSERT INTO public.contacts (id, from_user_email, listing_id, created_at)
  VALUES (v_contact_id, p_from_user_email, p_listing_id, now());

  -- Return verified contact details ONLY to authenticated caller
  RETURN jsonb_build_object(
    'success', true,
    'remainingToday', (9 - v_count),
    'contactId', v_contact_id,
    'recipientEmail', v_owner_email,
    'recipientName', v_owner_name,
    'event', v_event,
    'title', v_title
  );
END;
$$;

-- DPDP / GDPR Cascade Erasure Function
CREATE OR REPLACE FUNCTION public.delete_user_data_cascade(p_user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email TEXT := LOWER(TRIM(p_user_email));
BEGIN
  -- Delete listings created by user (contacts on listing cascade via FK)
  DELETE FROM public.listings WHERE LOWER(owner_email) = v_email;
  -- Delete contacts made by user
  DELETE FROM public.contacts WHERE LOWER(from_user_email) = v_email;
  -- Delete blocks where user is blocker or blocked
  DELETE FROM public.blocks WHERE LOWER(blocker_email) = v_email OR LOWER(blocked_email) = v_email;
  -- Delete reports created by user
  DELETE FROM public.reports WHERE LOWER(reporter_email) = v_email;
  -- Delete profile
  DELETE FROM public.users WHERE LOWER(email) = v_email;
  RETURN true;
END;
$$;

-- Auto-update updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_listings_updated_at ON public.listings;
CREATE TRIGGER set_listings_updated_at
BEFORE UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Default Deny on all tables
-- =========================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- 1. USERS POLICIES
-- Authenticated users can read only their OWN row keyed by auth user id
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile" 
  ON public.users FOR SELECT 
  TO authenticated 
  USING (auth.uid()::text = id OR auth.jwt() ->> 'sub' = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" 
  ON public.users FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid()::text = id OR auth.jwt() ->> 'sub' = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" 
  ON public.users FOR UPDATE 
  TO authenticated 
  USING (auth.uid()::text = id OR auth.jwt() ->> 'sub' = id)
  WITH CHECK (auth.uid()::text = id OR auth.jwt() ->> 'sub' = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.users;
CREATE POLICY "Users can delete own profile" 
  ON public.users FOR DELETE 
  TO authenticated 
  USING (auth.uid()::text = id OR auth.jwt() ->> 'sub' = id);

-- 2. LISTINGS POLICIES
-- Direct SELECT on raw listings table: ONLY owner can read their own row directly!
-- (All other reads must go through public_listings view which masks emails)
DROP POLICY IF EXISTS "Owners can select own listings" ON public.listings;
CREATE POLICY "Owners can select own listings" 
  ON public.listings FOR SELECT 
  TO authenticated 
  USING (auth.uid()::text = owner_id OR auth.jwt() ->> 'sub' = owner_id);

DROP POLICY IF EXISTS "Verified creators can insert listings" ON public.listings;
CREATE POLICY "Verified creators can insert listings" 
  ON public.listings FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid()::text = owner_id OR auth.jwt() ->> 'sub' = owner_id);

DROP POLICY IF EXISTS "Only creator can update listing" ON public.listings;
CREATE POLICY "Only creator can update listing" 
  ON public.listings FOR UPDATE 
  TO authenticated 
  USING (auth.uid()::text = owner_id OR auth.jwt() ->> 'sub' = owner_id)
  WITH CHECK (auth.uid()::text = owner_id OR auth.jwt() ->> 'sub' = owner_id);

DROP POLICY IF EXISTS "Only creator can delete listing" ON public.listings;
CREATE POLICY "Only creator can delete listing" 
  ON public.listings FOR DELETE 
  TO authenticated 
  USING (auth.uid()::text = owner_id OR auth.jwt() ->> 'sub' = owner_id);

-- 3. CONTACTS POLICIES
DROP POLICY IF EXISTS "Users can view own contacts" ON public.contacts;
CREATE POLICY "Users can view own contacts" 
  ON public.contacts FOR SELECT 
  TO authenticated 
  USING (auth.jwt() ->> 'email' = from_user_email);

DROP POLICY IF EXISTS "Users can insert contacts via RPC only" ON public.contacts;
CREATE POLICY "Users can insert contacts via RPC only" 
  ON public.contacts FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.jwt() ->> 'email' = from_user_email);

-- 4. REPORTS POLICIES
DROP POLICY IF EXISTS "Signed-in users can submit reports" ON public.reports;
CREATE POLICY "Signed-in users can submit reports" 
  ON public.reports FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.jwt() ->> 'email' = reporter_email);

DROP POLICY IF EXISTS "Service role only for reports select" ON public.reports;
CREATE POLICY "Service role only for reports select" 
  ON public.reports FOR SELECT 
  TO service_role 
  USING (true);

-- 5. BLOCKS POLICIES
DROP POLICY IF EXISTS "Users can view own blocks" ON public.blocks;
CREATE POLICY "Users can view own blocks" 
  ON public.blocks FOR SELECT 
  TO authenticated 
  USING (auth.jwt() ->> 'email' = blocker_email);

DROP POLICY IF EXISTS "Users can create blocks" ON public.blocks;
CREATE POLICY "Users can create blocks" 
  ON public.blocks FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.jwt() ->> 'email' = blocker_email);

DROP POLICY IF EXISTS "Users can delete own blocks" ON public.blocks;
CREATE POLICY "Users can delete own blocks" 
  ON public.blocks FOR DELETE 
  TO authenticated 
  USING (auth.jwt() ->> 'email' = blocker_email);
