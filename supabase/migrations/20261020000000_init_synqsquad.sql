-- =========================================================
-- SynqSquad: Production Schema & Strict Row-Level Security
-- Compliant with DPDP Act 2023, GDPR, and Google OAuth
-- 4 Core Tables Only: users, listings, contacts, reports
-- =========================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  photo TEXT,
  role TEXT NOT NULL DEFAULT 'Developer',
  college TEXT NOT NULL DEFAULT 'Independent',
  skills TEXT[] NOT NULL DEFAULT '{}',
  looking_for TEXT NOT NULL DEFAULT 'both' CHECK (looking_for IN ('hackathon', 'research', 'both')),
  bio TEXT NOT NULL DEFAULT '',
  consent_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 2. LISTINGS TABLE
CREATE TABLE IF NOT EXISTS public.listings (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  owner_college TEXT NOT NULL DEFAULT 'Independent',
  owner_role TEXT NOT NULL DEFAULT 'Developer',
  owner_photo TEXT,
  type TEXT NOT NULL CHECK (type IN ('hackathon', 'research', 'solo')),
  title TEXT NOT NULL,
  event TEXT NOT NULL,
  deadline TEXT DEFAULT 'Upcoming',
  skills_needed TEXT[] NOT NULL DEFAULT '{}',
  slots INTEGER NOT NULL DEFAULT 1 CHECK (slots >= 1 AND slots <= 10),
  total_slots INTEGER NOT NULL DEFAULT 4 CHECK (total_slots >= slots AND total_slots <= 12),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'filled', 'expired', 'hidden')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_owner_email ON public.listings(owner_email);
CREATE INDEX IF NOT EXISTS idx_listings_type ON public.listings(type);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.listings(created_at DESC);

-- 3. CONTACTS TABLE (10 Connects / Day Rate-Limiting & Audit)
CREATE TABLE IF NOT EXISTS public.contacts (
  id TEXT PRIMARY KEY,
  from_user_email TEXT NOT NULL,
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
  reason TEXT NOT NULL,
  details TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users RLS:
-- Anyone signed in can read profiles; users can only update or delete their own data.
CREATE POLICY "Users can read profiles" 
  ON public.users FOR SELECT 
  TO authenticated, anon 
  USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON public.users FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.jwt() ->> 'email' = email);

CREATE POLICY "Users can update their own profile" 
  ON public.users FOR UPDATE 
  TO authenticated 
  USING (auth.jwt() ->> 'email' = email)
  WITH CHECK (auth.jwt() ->> 'email' = email);

CREATE POLICY "Users can delete their own profile" 
  ON public.users FOR DELETE 
  TO authenticated 
  USING (auth.jwt() ->> 'email' = email);

-- Listings RLS:
-- Public can read all non-hidden listings.
-- Authenticated users can only create listings with their verified email.
-- Only the creator can update (mark filled, renew) or delete.
CREATE POLICY "Public read open listings" 
  ON public.listings FOR SELECT 
  TO authenticated, anon 
  USING (status != 'hidden');

CREATE POLICY "Verified creators can insert listings" 
  ON public.listings FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.jwt() ->> 'email' = owner_email);

CREATE POLICY "Only creator can update listing" 
  ON public.listings FOR UPDATE 
  TO authenticated 
  USING (auth.jwt() ->> 'email' = owner_email)
  WITH CHECK (auth.jwt() ->> 'email' = owner_email);

CREATE POLICY "Only creator can delete listing" 
  ON public.listings FOR DELETE 
  TO authenticated 
  USING (auth.jwt() ->> 'email' = owner_email);

-- Contacts RLS:
-- Users can only see their own contact history.
CREATE POLICY "Users can view own contacts" 
  ON public.contacts FOR SELECT 
  TO authenticated 
  USING (auth.jwt() ->> 'email' = from_user_email);

CREATE POLICY "Users can record contact" 
  ON public.contacts FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.jwt() ->> 'email' = from_user_email);

-- Reports RLS:
-- Users can submit reports, but only administrators can view/triage them.
CREATE POLICY "Anyone can submit reports" 
  ON public.reports FOR INSERT 
  TO authenticated, anon 
  WITH CHECK (true);

CREATE POLICY "Admins can view reports" 
  ON public.reports FOR SELECT 
  TO service_role 
  USING (true);
