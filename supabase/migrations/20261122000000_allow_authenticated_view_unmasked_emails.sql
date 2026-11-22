-- ==============================================================================
-- RIVQ / SynqSquad Migration: Allow Authenticated Users to View Verified Gmails
-- ==============================================================================
-- 1. Unauthenticated / Logged-out visitors: Emails remain strictly masked via 
--    public_talent_profiles and public_listings views.
-- 2. Authenticated users (Signed in with Google): Can view verified emails 
--    directly on talent_profiles and listings for seamless teammate outreach.
-- ==============================================================================

-- Grant SELECT permissions on base tables to authenticated role
GRANT SELECT ON public.talent_profiles TO authenticated;
GRANT SELECT ON public.listings TO authenticated;

-- Allow authenticated members to view active talent profiles and their Gmail
DROP POLICY IF EXISTS "Authenticated users can select talent profiles" ON public.talent_profiles;
CREATE POLICY "Authenticated users can select talent profiles" 
  ON public.talent_profiles FOR SELECT 
  TO authenticated 
  USING (visible = true AND availability != 'hidden');

-- Allow authenticated members to view active requisitions and creator Gmail
DROP POLICY IF EXISTS "Authenticated users can select listings" ON public.listings;
CREATE POLICY "Authenticated users can select listings" 
  ON public.listings FOR SELECT 
  TO authenticated 
  USING (status != 'hidden');
