-- ============================================================
-- Migration 007: Complete maintenance_staff schema alignment
-- Safe to run even if migration 006 has already been applied.
-- All ADD COLUMN statements use IF NOT EXISTS (idempotent).
-- Run in: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ============================================================

BEGIN;

-- 1. Make profile_id nullable so staff can be added without a Supabase auth account.
--    IF it is still NOT NULL this will make it nullable; if already nullable, no-op.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'maintenance_staff'
      AND column_name  = 'profile_id'
      AND is_nullable  = 'NO'
  ) THEN
    ALTER TABLE public.maintenance_staff ALTER COLUMN profile_id DROP NOT NULL;
    RAISE NOTICE 'profile_id made nullable';
  ELSE
    RAISE NOTICE 'profile_id already nullable or missing — skipped';
  END IF;
END
$$;

-- 2. Add all columns the application expects.
--    Every statement is IF NOT EXISTS — safe to run multiple times.
ALTER TABLE public.maintenance_staff
  ADD COLUMN IF NOT EXISTS staff_code      TEXT,
  ADD COLUMN IF NOT EXISTS full_name       TEXT,
  ADD COLUMN IF NOT EXISTS email           TEXT,
  ADD COLUMN IF NOT EXISTS phone           TEXT,
  ADD COLUMN IF NOT EXISTS specialization  TEXT;

-- 3. RLS: allow authenticated administrators to INSERT maintenance staff.
DROP POLICY IF EXISTS maintenance_staff_insert ON public.maintenance_staff;
CREATE POLICY maintenance_staff_insert ON public.maintenance_staff
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) = 'administrator');

-- 4. RLS: administrators can read all staff; staff can read their own row.
DROP POLICY IF EXISTS maintenance_staff_select ON public.maintenance_staff;
CREATE POLICY maintenance_staff_select ON public.maintenance_staff
  FOR SELECT TO authenticated
  USING (
    (profile_id IS NOT NULL AND profile_id = (SELECT auth.uid()))
    OR (SELECT public.get_user_role()) = 'administrator'
  );

-- 5. RLS: only administrators can UPDATE staff records.
DROP POLICY IF EXISTS maintenance_staff_update ON public.maintenance_staff;
CREATE POLICY maintenance_staff_update ON public.maintenance_staff
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) = 'administrator');

-- 6. RLS: administrators can deactivate (UPDATE) staff.
--    Covered by policy 5 above — no separate policy needed.

-- 6b. Re-grant INSERT and UPDATE privileges revoked by migration 001.
--     Migration 001 runs: REVOKE INSERT, UPDATE, DELETE ON maintenance_staff FROM anon, authenticated
--     That strips the privilege before RLS even runs, so all insert/update attempts fail.
--     We restore INSERT and UPDATE for authenticated users; RLS policies then enforce admin-only.
GRANT INSERT, UPDATE ON public.maintenance_staff TO authenticated;

-- 7. Reload PostgREST schema cache so new columns are visible immediately.
NOTIFY pgrst, 'reload schema';

COMMIT;
