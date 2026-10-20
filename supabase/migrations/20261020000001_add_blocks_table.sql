-- =========================================================
-- SynqSquad: Production UGC Safety — Blocks Table & RLS Migration
-- Run this in your Supabase SQL Editor if not already applied.
-- =========================================================

CREATE TABLE IF NOT EXISTS public.blocks (
  id TEXT PRIMARY KEY,
  blocker_email TEXT NOT NULL,
  blocked_email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(blocker_email, blocked_email)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON public.blocks(blocker_email);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON public.blocks(blocked_email);

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

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

-- Post-apply verification query:
-- SELECT table_name, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND table_name = 'blocks';
