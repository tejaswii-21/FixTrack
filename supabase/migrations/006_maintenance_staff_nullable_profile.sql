-- Migration 006: Allow maintenance_staff.profile_id to be nullable
-- and add direct name/phone columns so staff can be added without creating a Supabase auth account.
-- Run in: Supabase Dashboard -> SQL Editor -> New Query -> Run

-- 1. Make profile_id nullable (it was NOT NULL before)
ALTER TABLE public.maintenance_staff ALTER COLUMN profile_id DROP NOT NULL;

-- 2. Add full_name and phone directly on maintenance_staff for manually-added staff
ALTER TABLE public.maintenance_staff
  ADD COLUMN IF NOT EXISTS staff_code TEXT,
  ADD COLUMN IF NOT EXISTS full_name  TEXT,
  ADD COLUMN IF NOT EXISTS phone      TEXT;

-- 3. Drop the old restrictive INSERT policy and add one for admins
DROP POLICY IF EXISTS maintenance_staff_insert ON public.maintenance_staff;
CREATE POLICY maintenance_staff_insert ON public.maintenance_staff
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) = 'administrator');

-- 4. Allow admins to SELECT all staff
DROP POLICY IF EXISTS maintenance_staff_select ON public.maintenance_staff;
CREATE POLICY maintenance_staff_select ON public.maintenance_staff
  FOR SELECT TO authenticated
  USING (
    profile_id = (SELECT auth.uid())
    OR (SELECT public.get_user_role()) = 'administrator'
  );

-- 5. Allow admins to UPDATE staff records
DROP POLICY IF EXISTS maintenance_staff_update ON public.maintenance_staff;
CREATE POLICY maintenance_staff_update ON public.maintenance_staff
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) = 'administrator');

-- 6. Allow admins to read/update/insert categories
DROP POLICY IF EXISTS categories_insert ON public.complaint_categories;
DROP POLICY IF EXISTS categories_update ON public.complaint_categories;
CREATE POLICY categories_insert ON public.complaint_categories
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) = 'administrator');
CREATE POLICY categories_update ON public.complaint_categories
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) = 'administrator');
