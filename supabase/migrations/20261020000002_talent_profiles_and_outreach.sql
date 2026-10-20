-- =========================================================
-- SynqSquad Migration: Talent Profiles & Two-Way Outreach
-- Supply-side "Open to Collaborate" Discovery + Safe Outreach
-- =========================================================

-- 1. TALENT PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.talent_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL CHECK (length(display_name) >= 2 AND length(display_name) <= 60),
  email TEXT NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@gmail\.com$'),
  headline TEXT NOT NULL CHECK (length(headline) >= 5 AND length(headline) <= 120),
  skills TEXT[] NOT NULL DEFAULT '{}',
  looking_for TEXT[] NOT NULL DEFAULT '{}',
  experience_level TEXT NOT NULL DEFAULT 'student' CHECK (experience_level IN ('student', 'early-career', 'experienced')),
  bio TEXT NOT NULL DEFAULT '' CHECK (length(bio) <= 500),
  github TEXT DEFAULT NULL,
  portfolio TEXT DEFAULT NULL,
  linkedin TEXT DEFAULT NULL,
  availability TEXT NOT NULL DEFAULT 'open' CHECK (availability IN ('open', 'busy', 'hidden')),
  visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_talent_profiles_user_id ON public.talent_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_talent_profiles_availability ON public.talent_profiles(availability);
CREATE INDEX IF NOT EXISTS idx_talent_profiles_experience ON public.talent_profiles(experience_level);
CREATE INDEX IF NOT EXISTS idx_talent_profiles_visible ON public.talent_profiles(visible);
CREATE INDEX IF NOT EXISTS idx_talent_profiles_created_at ON public.talent_profiles(created_at DESC);

-- Trigger for talent_profiles updated_at
DROP TRIGGER IF EXISTS set_talent_profiles_updated_at ON public.talent_profiles;
CREATE TRIGGER set_talent_profiles_updated_at
BEFORE UPDATE ON public.talent_profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. SAFE PUBLIC VIEW OF TALENT PROFILES (Zero raw email exposure)
CREATE OR REPLACE VIEW public.public_talent_profiles AS
SELECT 
  id,
  user_id,
  display_name,
  concat(
    substr(email, 1, 2),
    '••••',
    substr(email, position('@' in email))
  ) AS email,
  headline,
  skills,
  looking_for,
  experience_level,
  bio,
  github,
  portfolio,
  linkedin,
  availability,
  visible,
  created_at,
  updated_at
FROM public.talent_profiles
WHERE visible = true AND availability != 'hidden';

-- Revoke direct permissions on underlying talent_profiles from anon
REVOKE SELECT ON public.talent_profiles FROM anon;
GRANT SELECT ON public.public_talent_profiles TO anon, authenticated;

-- 3. OUTREACH TABLE (Team -> Person Collaboration Requests)
CREATE TABLE IF NOT EXISTS public.outreach (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  sender_email TEXT NOT NULL CHECK (sender_email ~* '^[A-Za-z0-9._%+-]+@gmail\.com$'),
  sender_name TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  recipient_email TEXT NOT NULL CHECK (recipient_email ~* '^[A-Za-z0-9._%+-]+@gmail\.com$'),
  profile_id TEXT NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  listing_id TEXT REFERENCES public.listings(id) ON DELETE SET NULL,
  message TEXT NOT NULL CHECK (length(message) >= 10 AND length(message) <= 600),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_outreach_recipient ON public.outreach(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outreach_sender ON public.outreach(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outreach_profile ON public.outreach(profile_id);
CREATE INDEX IF NOT EXISTS idx_outreach_status ON public.outreach(status);

-- Trigger for outreach updated_at
DROP TRIGGER IF EXISTS set_outreach_updated_at ON public.outreach;
CREATE TRIGGER set_outreach_updated_at
BEFORE UPDATE ON public.outreach
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. COMBINED RATE-LIMITED OUTREACH RPC
CREATE OR REPLACE FUNCTION public.record_outreach_rate_limited(
  p_sender_id TEXT,
  p_sender_email TEXT,
  p_sender_name TEXT,
  p_recipient_id TEXT,
  p_profile_id TEXT,
  p_listing_id TEXT,
  p_message TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_contact_count INT;
  v_outreach_count INT;
  v_total_count INT;
  v_outreach_id TEXT;
  v_profile_user_id TEXT;
  v_recipient_email TEXT;
  v_profile_visible BOOLEAN;
  v_profile_avail TEXT;
  v_is_blocked BOOLEAN;
BEGIN
  -- Strict sanitization of input
  p_sender_email := LOWER(TRIM(p_sender_email));

  -- Prevent self-outreach
  IF p_sender_id = p_recipient_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'You cannot send outreach to your own talent profile.');
  END IF;

  -- Advisory lock on sender hash
  PERFORM pg_advisory_xact_lock(hashtext(p_sender_email));

  -- Verify target talent profile
  SELECT user_id, email, visible, availability
  INTO v_profile_user_id, v_recipient_email, v_profile_visible, v_profile_avail
  FROM public.talent_profiles
  WHERE id = p_profile_id;

  IF v_profile_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Talent profile not found.');
  END IF;

  IF NOT v_profile_visible OR v_profile_avail = 'hidden' THEN
    RETURN jsonb_build_object('success', false, 'error', 'This talent profile is currently hidden.');
  END IF;

  -- Ensure recipient_id matches profile owner
  IF v_profile_user_id != p_recipient_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Recipient mismatch.');
  END IF;

  -- Check UGC Blocks (either direction)
  SELECT EXISTS (
    SELECT 1 FROM public.blocks
    WHERE (LOWER(blocker_email) = p_sender_email AND LOWER(blocked_email) = LOWER(v_recipient_email))
       OR (LOWER(blocker_email) = LOWER(v_recipient_email) AND LOWER(blocked_email) = p_sender_email)
  ) INTO v_is_blocked;

  IF v_is_blocked THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot contact this user.');
  END IF;

  -- Count total connects (contacts + outreach) within rolling 24-hour window
  SELECT COUNT(*) INTO v_contact_count
  FROM public.contacts
  WHERE LOWER(from_user_email) = p_sender_email
    AND created_at >= (now() - interval '24 hours');

  SELECT COUNT(*) INTO v_outreach_count
  FROM public.outreach
  WHERE LOWER(sender_email) = p_sender_email
    AND created_at >= (now() - interval '24 hours');

  v_total_count := v_contact_count + v_outreach_count;

  IF v_total_count >= 10 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Daily outreach limit reached (10/day). This protects talent from mass messaging.',
      'remainingToday', 0
    );
  END IF;

  -- Insert outreach record
  v_outreach_id := 'out-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12);

  INSERT INTO public.outreach (
    id, sender_id, sender_email, sender_name,
    recipient_id, recipient_email, profile_id,
    listing_id, message, status, created_at, updated_at
  ) VALUES (
    v_outreach_id, p_sender_id, p_sender_email, p_sender_name,
    p_recipient_id, v_recipient_email, p_profile_id,
    p_listing_id, p_message, 'pending', now(), now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'outreachId', v_outreach_id,
    'remainingToday', (9 - v_total_count)
  );
END;
$$;

-- 5. RESPOND TO OUTREACH (Accept / Decline)
CREATE OR REPLACE FUNCTION public.respond_outreach(
  p_user_id TEXT,
  p_outreach_id TEXT,
  p_action TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_outreach RECORD;
BEGIN
  IF p_action NOT IN ('accept', 'decline') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid action. Must be accept or decline.');
  END IF;

  SELECT * INTO v_outreach
  FROM public.outreach
  WHERE id = p_outreach_id;

  IF v_outreach.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Outreach request not found.');
  END IF;

  -- Caller must be the recipient
  IF v_outreach.recipient_id != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized. Only the recipient can respond.');
  END IF;

  IF v_outreach.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'This request has already been resolved.');
  END IF;

  UPDATE public.outreach
  SET status = CASE WHEN p_action = 'accept' THEN 'accepted' ELSE 'declined' END,
      updated_at = now()
  WHERE id = p_outreach_id;

  IF p_action = 'accept' THEN
    RETURN jsonb_build_object(
      'success', true,
      'status', 'accepted',
      'senderEmail', v_outreach.sender_email,
      'senderName', v_outreach.sender_name,
      'recipientEmail', v_outreach.recipient_email
    );
  ELSE
    RETURN jsonb_build_object(
      'success', true,
      'status', 'declined'
    );
  END IF;
END;
$$;

-- 6. UPDATE DPDP / GDPR CASCADE ERASURE TO INCLUDE TALENT PROFILES & OUTREACH
-- Also allow reporting 'profile' targets in moderation reports
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_target_type_check;
ALTER TABLE public.reports ADD CONSTRAINT reports_target_type_check CHECK (target_type IN ('listing', 'user', 'profile'));

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
  -- Delete talent profile (outreach cascades via FK profile_id)
  DELETE FROM public.talent_profiles WHERE LOWER(email) = v_email;
  -- Delete outreach sent or received by user
  DELETE FROM public.outreach WHERE LOWER(sender_email) = v_email OR LOWER(recipient_email) = v_email;
  -- Delete user profile
  DELETE FROM public.users WHERE LOWER(email) = v_email;
  RETURN true;
END;
$$;

-- =========================================================
-- ROW LEVEL SECURITY (RLS) FOR NEW TABLES
-- =========================================================

ALTER TABLE public.talent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach ENABLE ROW LEVEL SECURITY;

-- Talent Profiles Policies
DROP POLICY IF EXISTS "Owners can select own talent profile" ON public.talent_profiles;
CREATE POLICY "Owners can select own talent profile" 
  ON public.talent_profiles FOR SELECT 
  TO authenticated 
  USING (auth.uid()::text = user_id OR auth.jwt() ->> 'sub' = user_id);

DROP POLICY IF EXISTS "Owners can insert own talent profile" ON public.talent_profiles;
CREATE POLICY "Owners can insert own talent profile" 
  ON public.talent_profiles FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid()::text = user_id OR auth.jwt() ->> 'sub' = user_id);

DROP POLICY IF EXISTS "Owners can update own talent profile" ON public.talent_profiles;
CREATE POLICY "Owners can update own talent profile" 
  ON public.talent_profiles FOR UPDATE 
  TO authenticated 
  USING (auth.uid()::text = user_id OR auth.jwt() ->> 'sub' = user_id)
  WITH CHECK (auth.uid()::text = user_id OR auth.jwt() ->> 'sub' = user_id);

DROP POLICY IF EXISTS "Owners can delete own talent profile" ON public.talent_profiles;
CREATE POLICY "Owners can delete own talent profile" 
  ON public.talent_profiles FOR DELETE 
  TO authenticated 
  USING (auth.uid()::text = user_id OR auth.jwt() ->> 'sub' = user_id);

-- Outreach Policies
DROP POLICY IF EXISTS "Users can view outreach involving them" ON public.outreach;
CREATE POLICY "Users can view outreach involving them" 
  ON public.outreach FOR SELECT 
  TO authenticated 
  USING (
    auth.uid()::text = sender_id OR 
    auth.uid()::text = recipient_id OR 
    auth.jwt() ->> 'email' = sender_email OR 
    auth.jwt() ->> 'email' = recipient_email
  );

DROP POLICY IF EXISTS "Users can create outreach via RPC" ON public.outreach;
CREATE POLICY "Users can create outreach via RPC" 
  ON public.outreach FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid()::text = sender_id);

DROP POLICY IF EXISTS "Recipients can update outreach" ON public.outreach;
CREATE POLICY "Recipients can update outreach" 
  ON public.outreach FOR UPDATE 
  TO authenticated 
  USING (auth.uid()::text = recipient_id)
  WITH CHECK (auth.uid()::text = recipient_id);

DROP POLICY IF EXISTS "Participants can delete outreach" ON public.outreach;
CREATE POLICY "Participants can delete outreach" 
  ON public.outreach FOR DELETE 
  TO authenticated 
  USING (auth.uid()::text = sender_id OR auth.uid()::text = recipient_id);
