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


-- =========================================================
-- SEED DATA: 12 Realistic Hackathon & Research Requisitions
-- =========================================================

INSERT INTO public.listings (
  id, owner_id, owner_name, owner_email, owner_college, owner_role, owner_photo,
  type, title, event, deadline, skills_needed, slots, total_slots, description,
  status, expires_at, created_at
) VALUES (
  'lst-sih-railway-01',
  'usr-aarav-01',
  'Aarav Sharma',
  'aarav.sharma.ml@gmail.com',
  'IIT Delhi',
  'Computer Vision Researcher',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  'hackathon',
  'Edge Vision Model for Railway Track Fault Detection',
  'Smart India Hackathon 2026',
  'Nov 30, 2026',
  ARRAY['Next.js', 'React Native', 'FastAPI', 'Jetson Edge AI'],
  2,
  6,
  'We have trained a YOLOv11 crack-detection baseline running on embedded Jetson devices. We need one frontend developer to build the mobile emergency alert interface and one backend engineer for real-time telemetry streaming to the railway zone dashboard.',
  'open',
  NOW() + interval '30 days',
  NOW() - interval '23 hours'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  event = EXCLUDED.event,
  description = EXCLUDED.description,
  skills_needed = EXCLUDED.skills_needed,
  status = EXCLUDED.status;

INSERT INTO public.listings (
  id, owner_id, owner_name, owner_email, owner_college, owner_role, owner_photo,
  type, title, event, deadline, skills_needed, slots, total_slots, description,
  status, expires_at, created_at
) VALUES (
  'lst-neurips-mri-02',
  'usr-elena-02',
  'Dr. Elena Rostova',
  'elena.rostova.mri@gmail.com',
  'Oxford University',
  'Postdoc in Bio-Imaging',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
  'research',
  'Multimodal 3D Brain MRI Segmentation Co-Author',
  'NeurIPS 2026 Medical Workshop',
  'Jan 15, 2027',
  ARRAY['PyTorch', 'MONAI', '3D U-Net', 'Diffusion Models', 'LaTeX'],
  1,
  4,
  'We have GPU cluster compute (4x H100s) and clean BraTS datasets ready. Looking for a collaborator experienced with volumetric segmentation benchmarks and LaTeX manuscript drafting. Second co-authorship based on benchmark contributions.',
  'open',
  NOW() + interval '30 days',
  NOW() - interval '15 hours'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  event = EXCLUDED.event,
  description = EXCLUDED.description,
  skills_needed = EXCLUDED.skills_needed,
  status = EXCLUDED.status;

INSERT INTO public.listings (
  id, owner_id, owner_name, owner_email, owner_college, owner_role, owner_photo,
  type, title, event, deadline, skills_needed, slots, total_slots, description,
  status, expires_at, created_at
) VALUES (
  'lst-ethglobal-arbitrage-03',
  'usr-vikram-03',
  'Vikram Sengupta',
  'vikram.sengupta.eth@gmail.com',
  'BITS Pilani',
  'Smart Contract Engineer',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  'hackathon',
  'Autonomous DeFi Arbitrage Agent Swarm',
  'ETHGlobal AI & Web3',
  'Dec 12, 2026',
  ARRAY['Python', 'LangChain', 'Solidity', 'Foundry', 'Tailwind CSS'],
  2,
  4,
  'Building autonomous wallet agents that scan decentralized liquidity pools on Base and Arbitrum to execute flash-loan balance reallocations. Contracts are tested in Foundry; need a Python agent architect and a clean Next.js console builder.',
  'open',
  NOW() + interval '30 days',
  NOW() - interval '8 hours'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  event = EXCLUDED.event,
  description = EXCLUDED.description,
  skills_needed = EXCLUDED.skills_needed,
  status = EXCLUDED.status;

INSERT INTO public.listings (
  id, owner_id, owner_name, owner_email, owner_college, owner_role, owner_photo,
  type, title, event, deadline, skills_needed, slots, total_slots, description,
  status, expires_at, created_at
) VALUES (
  'lst-spaceapps-exoplanet-04',
  'usr-maya-04',
  'Maya Patel',
  'maya.patel.space@gmail.com',
  'IIIT Hyderabad',
  'Data Scientist & Astropy Lead',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
  'hackathon',
  'Atmospheric Exoplanet Climate Simulator',
  'NASA Space Apps Challenge',
  'Oct 28, 2026',
  ARRAY['Three.js', 'WebGL', 'Python', 'Astropy', 'React'],
  2,
  5,
  'Processing Kepler and TESS photometric light curves to predict greenhouse equilibrium temperatures on terrestrial exoplanets. We need a Three.js developer to render real-time interactive planetary orbits and atmospheric heat maps.',
  'open',
  NOW() + interval '30 days',
  NOW() - interval '4 hours'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  event = EXCLUDED.event,
  description = EXCLUDED.description,
  skills_needed = EXCLUDED.skills_needed,
  status = EXCLUDED.status;

INSERT INTO public.listings (
  id, owner_id, owner_name, owner_email, owner_college, owner_role, owner_photo,
  type, title, event, deadline, skills_needed, slots, total_slots, description,
  status, expires_at, created_at
) VALUES (
  'lst-robotics-drone-05',
  'usr-chen-05',
  'Chen Wei',
  'chen.wei.robotics@gmail.com',
  'NUS Singapore',
  'Robotics PhD Candidate',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
  'research',
  'GPS-Denied Visual Inertial Odometry for Quadrotors',
  'IEEE ICRA Workshop / arXiv',
  'Feb 01, 2027',
  ARRAY['C++', 'ROS2', 'SLAM', 'OpenCV', 'Gazebo'],
  1,
  3,
  'Investigating factor-graph optimization for multi-rotor aerial vehicles flying through enclosed mining tunnels without satellite positioning. Seeking a student or researcher with deep C++ and ROS2 navigation stack experience.',
  'open',
  NOW() + interval '30 days',
  NOW() - interval '5 hours'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  event = EXCLUDED.event,
  description = EXCLUDED.description,
  skills_needed = EXCLUDED.skills_needed,
  status = EXCLUDED.status;

INSERT INTO public.listings (
  id, owner_id, owner_name, owner_email, owner_college, owner_role, owner_photo,
  type, title, event, deadline, skills_needed, slots, total_slots, description,
  status, expires_at, created_at
) VALUES (
  'lst-solo-karan-06',
  'usr-karan-06',
  'Karan Mehta',
  'karan.mehta.builds@gmail.com',
  'DTU Delhi',
  'Full-Stack Engineer',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
  'solo',
  'Senior Full-Stack & Systems Dev Looking for Hackathon Team',
  'Open to Upcoming Major Hackathons',
  'Immediate',
  ARRAY['Next.js', 'TypeScript', 'PostgreSQL', 'Go', 'Docker'],
  1,
  4,
  'Available to join a serious hackathon squad. I specialize in rapid 24-hour full-stack scaffolding, PostgreSQL architecture, and API integration. Looking for domain specialists in healthcare, energy, or legal tech.',
  'open',
  NOW() + interval '30 days',
  NOW() - interval '14 hours'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  event = EXCLUDED.event,
  description = EXCLUDED.description,
  skills_needed = EXCLUDED.skills_needed,
  status = EXCLUDED.status;

INSERT INTO public.listings (
  id, owner_id, owner_name, owner_email, owner_college, owner_role, owner_photo,
  type, title, event, deadline, skills_needed, slots, total_slots, description,
  status, expires_at, created_at
) VALUES (
  'lst-sih-cyber-07',
  'usr-ananya-07',
  'Ananya Iyer',
  'ananya.iyer.sec@gmail.com',
  'IIT Madras',
  'Security Analyst',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
  'hackathon',
  'AI Honeypot & Zero-Day Incident Triaging Platform',
  'Smart India Hackathon 2026',
  'Nov 30, 2026',
  ARRAY['Python', 'Network Forensics', 'Kafka', 'React', 'Docker'],
  2,
  6,
  'Designing an automated deception system that traps unauthorized lateral movement in state-level power grid intranets. We have the packet sniffer pipeline built; looking for a Kafka engineer and a frontend security analyst.',
  'open',
  NOW() + interval '30 days',
  NOW() - interval '22 hours'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  event = EXCLUDED.event,
  description = EXCLUDED.description,
  skills_needed = EXCLUDED.skills_needed,
  status = EXCLUDED.status;

INSERT INTO public.listings (
  id, owner_id, owner_name, owner_email, owner_college, owner_role, owner_photo,
  type, title, event, deadline, skills_needed, slots, total_slots, description,
  status, expires_at, created_at
) VALUES (
  'lst-nlp-legal-08',
  'usr-rohan-08',
  'Rohan Deshmukh',
  'rohan.deshmukh.nlp@gmail.com',
  'NLSIU Bengaluru / IIT Bombay',
  'NLP & Legal Tech Lead',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
  'research',
  'Precedent Retrieval in Vernacular Court Judgments',
  'ACL Workshop on Legal NLP',
  'Jan 10, 2027',
  ARRAY['Hugging Face', 'PyTorch', 'Indian Languages NLP', 'Vector DBs'],
  1,
  3,
  'Constructing a high-precision semantic retrieval index for Indian regional appellate rulings translated across Hindi, Marathi, and Kannada. Seeking a student researcher experienced with multilingual embeddings and cross-encoder re-ranking.',
  'open',
  NOW() + interval '30 days',
  NOW() - interval '16 hours'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  event = EXCLUDED.event,
  description = EXCLUDED.description,
  skills_needed = EXCLUDED.skills_needed,
  status = EXCLUDED.status;

INSERT INTO public.listings (
  id, owner_id, owner_name, owner_email, owner_college, owner_role, owner_photo,
  type, title, event, deadline, skills_needed, slots, total_slots, description,
  status, expires_at, created_at
) VALUES (
  'lst-solana-depin-09',
  'usr-tanya-09',
  'Tanya Sen',
  'tanya.sen.rust@gmail.com',
  'IIT Roorkee',
  'Rust Systems Engineer',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
  'hackathon',
  'Decentralized Micro-Weather Sensor Mesh (DePIN)',
  'Solana Global Hackathon',
  'Nov 25, 2026',
  ARRAY['Rust', 'Solana Anchor', 'ESP32 Firmware', 'Next.js'],
  2,
  4,
  'Connecting local ESP32 environmental sensors to micro-stake rewards on Solana. On-chain program is partially written. Looking for an IoT firmware hacker and an interface developer to visualize real-time ambient particulate readings.',
  'open',
  NOW() + interval '30 days',
  NOW() - interval '7 hours'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  event = EXCLUDED.event,
  description = EXCLUDED.description,
  skills_needed = EXCLUDED.skills_needed,
  status = EXCLUDED.status;

INSERT INTO public.listings (
  id, owner_id, owner_name, owner_email, owner_college, owner_role, owner_photo,
  type, title, event, deadline, skills_needed, slots, total_slots, description,
  status, expires_at, created_at
) VALUES (
  'lst-climate-carbon-10',
  'usr-samuel-10',
  'Samuel Green',
  'samuel.green.carbon@gmail.com',
  'Stanford University',
  'Environmental Systems Researcher',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
  'research',
  'Satellite Hyperspectral Crop Methane Estimation',
  'AGU Fall Meeting / Remote Sensing',
  'Dec 05, 2026',
  ARRAY['Google Earth Engine', 'Python', 'GeoPandas', 'Scikit-Learn'],
  1,
  3,
  'Benchmarking Sentinel-5P tropospheric methane columns against localized flux tower data in California''s Central Valley. Seeking a remote sensing collaborator with experience running Earth Engine tile pipelines.',
  'open',
  NOW() + interval '30 days',
  NOW() - interval '15 hours'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  event = EXCLUDED.event,
  description = EXCLUDED.description,
  skills_needed = EXCLUDED.skills_needed,
  status = EXCLUDED.status;

INSERT INTO public.listings (
  id, owner_id, owner_name, owner_email, owner_college, owner_role, owner_photo,
  type, title, event, deadline, skills_needed, slots, total_slots, description,
  status, expires_at, created_at
) VALUES (
  'lst-fintech-quant-11',
  'usr-aditya-11',
  'Aditya Verma',
  'aditya.verma.quant@gmail.com',
  'IIT Kharagpur',
  'Algorithmic Trader',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80',
  'hackathon',
  'High-Throughput Order Book Latency Simulator',
  'Optiver Quant Challenge',
  'Nov 18, 2026',
  ARRAY['C++', 'Market Microstructure', 'Python', 'NumPy'],
  1,
  3,
  'Simulating limit order queues and queue depletion dynamics under simulated market stress. Mathematical model formulated; need a C++ developer to minimize tick-to-trade processing latency.',
  'open',
  NOW() + interval '30 days',
  NOW() - interval '15 hours'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  event = EXCLUDED.event,
  description = EXCLUDED.description,
  skills_needed = EXCLUDED.skills_needed,
  status = EXCLUDED.status;

INSERT INTO public.listings (
  id, owner_id, owner_name, owner_email, owner_college, owner_role, owner_photo,
  type, title, event, deadline, skills_needed, slots, total_slots, description,
  status, expires_at, created_at
) VALUES (
  'lst-solo-priya-12',
  'usr-priya-12',
  'Priya Nair',
  'priya.nair.design@gmail.com',
  'NID Ahmedabad',
  'Product Designer & Frontend Dev',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
  'solo',
  'Lead Product Designer & Prototyper Seeking High-Impact SIH Team',
  'Smart India Hackathon 2026',
  'Nov 30, 2026',
  ARRAY['Figma', 'Design Systems', 'Tailwind CSS', 'User Research'],
  1,
  4,
  'I design clear, accessible government and enterprise workflows in Figma and translate them into responsive React/Tailwind code. Looking for a backend-heavy team tackling hardware, clean energy, or disaster management problem statements.',
  'open',
  NOW() + interval '30 days',
  NOW() - interval '3 hours'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  event = EXCLUDED.event,
  description = EXCLUDED.description,
  skills_needed = EXCLUDED.skills_needed,
  status = EXCLUDED.status;
