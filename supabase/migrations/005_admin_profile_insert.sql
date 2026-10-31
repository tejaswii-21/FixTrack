-- Migration 005: Allow administrators to insert profile rows for new staff members.
-- Run in: Supabase Dashboard -> SQL Editor -> New Query -> Run

-- The existing profiles_insert policy only allows users to insert their OWN row.
-- Administrators need to create profile rows for maintenance staff they add.
-- This adds a second policy that permits admins to insert any profile.

DROP POLICY IF EXISTS profiles_insert_admin ON public.profiles;
CREATE POLICY profiles_insert_admin ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    id = (SELECT auth.uid())
    OR (SELECT public.get_user_role()) = 'administrator'
  );

-- Also allow admins to UPDATE any profile (for editing staff names/phones)
DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR (SELECT public.get_user_role()) = 'administrator'
  )
  WITH CHECK (
    id = (SELECT auth.uid())
    OR ((SELECT public.get_user_role()) = 'administrator' AND role = 'maintenance_staff')
  );

-- Allow admins to read ALL profiles (needed to show staff lists)
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR (SELECT public.get_user_role()) = 'administrator'
  );
