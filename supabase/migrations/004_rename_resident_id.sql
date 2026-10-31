-- ============================================================
-- FixTrack Migration 004: Rename resident_id to submitted_by
--
-- Run ONCE in: Supabase Dashboard > SQL Editor > New Query > Run
--
-- What this does:
--   1. Renames resident_id to submitted_by (preserves all data and FKs).
--   2. Rebuilds RLS policies (RENAME COLUMN does NOT rewrite their text).
--   3. Adds missing columns expected by the application code.
--   4. Fixes the status CHECK constraint values.
--   5. Replaces the complaint-number trigger to use CMP-YYYY-NNNN.
--   6. Reloads the PostgREST schema cache.
-- Does NOT drop any data, disable RLS, or recreate the table.
-- ============================================================

BEGIN;

-- Step 1: Rename resident_id -> submitted_by (guarded, idempotent).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='complaints' AND column_name='resident_id'
  ) THEN
    ALTER TABLE public.complaints RENAME COLUMN resident_id TO submitted_by;
    RAISE NOTICE 'Renamed resident_id -> submitted_by.';
  ELSE
    RAISE NOTICE 'submitted_by already exists; rename skipped.';
  END IF;
END
$$;

-- Step 2: Add submitted_by if somehow neither column exists (fresh install guard).
ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES public.profiles(id);

-- Step 3: Add other columns the application expects.
ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS submitted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS due_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
  ADD COLUMN IF NOT EXISTS assigned_to      UUID REFERENCES public.profiles(id);

-- Step 4: Fix the status CHECK constraint.
ALTER TABLE public.complaints DROP CONSTRAINT IF EXISTS complaints_status_check;
UPDATE public.complaints SET status='pending'
  WHERE status IN ('submitted','acknowledged','on_hold');
UPDATE public.complaints SET status='resolved'  WHERE status='closed';
UPDATE public.complaints SET status='cancelled' WHERE status='rejected';
ALTER TABLE public.complaints
  ADD CONSTRAINT complaints_status_check
  CHECK (status IN ('pending','assigned','in_progress','resolved','reopened','cancelled'));

-- Step 5: Rebuild RLS policies to reference submitted_by.
-- (RENAME COLUMN does not rewrite existing policy expression strings.)
DROP POLICY IF EXISTS complaints_select          ON public.complaints;
DROP POLICY IF EXISTS complaints_insert          ON public.complaints;
DROP POLICY IF EXISTS complaints_update_resident     ON public.complaints;
DROP POLICY IF EXISTS complaints_update_staff_admin  ON public.complaints;

CREATE POLICY complaints_select ON public.complaints
  FOR SELECT TO authenticated USING (
    submitted_by = (SELECT auth.uid())
    OR (SELECT public.get_user_role()) IN ('maintenance_staff','administrator')
  );

CREATE POLICY complaints_insert ON public.complaints
  FOR INSERT TO authenticated
  WITH CHECK (submitted_by = (SELECT auth.uid()));

CREATE POLICY complaints_update_staff_admin ON public.complaints
  FOR UPDATE TO authenticated
  USING (
    (SELECT public.get_user_role()) IN ('maintenance_staff','administrator')
    OR (submitted_by = (SELECT auth.uid()) AND status = 'pending')
  )
  WITH CHECK (
    (SELECT public.get_user_role()) IN ('maintenance_staff','administrator')
    OR (submitted_by = (SELECT auth.uid()) AND status = 'pending')
  );

-- Step 6: Update complaint-number trigger function to CMP-YYYY-NNNN format.
CREATE OR REPLACE FUNCTION public.generate_complaint_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE v_hours NUMERIC := 72;
BEGIN
  IF NEW.complaint_number IS NULL OR NEW.complaint_number = '' THEN
    NEW.complaint_number :=
      'CMP-' || TO_CHAR(NOW(),'YYYY') || '-' ||
      LPAD(NEXTVAL('public.complaint_number_seq')::TEXT,4,'0');
  END IF;
  IF NEW.submitted_at IS NULL THEN NEW.submitted_at := NOW(); END IF;
  IF NEW.due_at IS NULL THEN
    v_hours := CASE NEW.priority
      WHEN 'critical' THEN 4  WHEN 'high'   THEN 24
      WHEN 'medium'   THEN 72 ELSE 168 END;
    NEW.due_at := NEW.submitted_at + (v_hours * INTERVAL '1 hour');
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS complaints_generate_number ON public.complaints;
CREATE TRIGGER complaints_generate_number
  BEFORE INSERT ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.generate_complaint_number();

-- Step 7: Ensure profiles has a SELECT policy (needed by getProfile() in frontend).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_select'
  ) THEN
    CREATE POLICY profiles_select ON public.profiles
      FOR SELECT TO authenticated
      USING (
        id = (SELECT auth.uid())
        OR (SELECT public.get_user_role()) = 'administrator'
      );
    RAISE NOTICE 'Created profiles_select policy.';
  ELSE
    RAISE NOTICE 'profiles_select already exists; skipped.';
  END IF;
END
$$;

-- Step 8: Reload PostgREST schema cache immediately.
NOTIFY pgrst, 'reload schema';

COMMIT;

-- ============================================================
-- Verification queries (run separately after COMMIT succeeds)
-- ============================================================
-- Confirm submitted_by exists and resident_id is gone:
--   SELECT column_name, data_type, is_nullable
--   FROM information_schema.columns
--   WHERE table_schema='public' AND table_name='complaints'
--   ORDER BY ordinal_position;
--
-- Confirm RLS policies all reference submitted_by:
--   SELECT policyname, cmd, qual
--   FROM pg_policies
--   WHERE schemaname='public' AND tablename='complaints';
--
-- Smoke test (auto-rolls back, does not persist):
--   BEGIN;
--   INSERT INTO public.complaints(title,description,building,location,priority,status,submitted_by)
--   VALUES('Test smoke','Migration smoke test.','Bldg A','Room 1','medium','pending',auth.uid());
--   SELECT complaint_number, submitted_by, status FROM public.complaints
--   ORDER BY created_at DESC LIMIT 1;
--   ROLLBACK;