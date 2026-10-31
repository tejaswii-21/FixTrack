-- Migration 008: Fix complaints.assigned_to to reference maintenance_staff.id
-- Run in: Supabase Dashboard -> SQL Editor -> New Query -> Run
--
-- Background: assigned_to was added as FK to profiles(id), but maintenance staff
-- added manually (without Supabase auth) only have a maintenance_staff.id, not a
-- profiles.id. We change the FK to reference maintenance_staff(id) instead.

BEGIN;

-- 1. Drop the old FK constraint on assigned_to -> profiles
ALTER TABLE public.complaints
  DROP CONSTRAINT IF EXISTS complaints_assigned_to_fkey;

-- 2. Null out any existing assigned_to values that don't exist in maintenance_staff
--    (safe no-op if no such rows exist)
UPDATE public.complaints
  SET assigned_to = NULL, status = 'pending'
  WHERE assigned_to IS NOT NULL
    AND assigned_to NOT IN (SELECT id FROM public.maintenance_staff);

-- 3. Add new FK constraint pointing to maintenance_staff(id)
ALTER TABLE public.complaints
  ADD CONSTRAINT complaints_assigned_to_fkey
  FOREIGN KEY (assigned_to) REFERENCES public.maintenance_staff(id)
  ON DELETE SET NULL;

-- 4. Update the SELECT query join alias used by the app
--    (No SQL change needed — the app already handles null assignee gracefully)

NOTIFY pgrst, 'reload schema';

COMMIT;
