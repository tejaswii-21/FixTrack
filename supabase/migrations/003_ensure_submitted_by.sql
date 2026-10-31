-- FixTrack Migration 003: Align complaints table with application code
-- Run this once in: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- Safe to run multiple times. Does not delete existing data.

BEGIN;

-- 1. Rename resident_id -> submitted_by (only if rename has not happened yet).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'resident_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'submitted_by'
  ) THEN
    ALTER TABLE public.complaints RENAME COLUMN resident_id TO submitted_by;
    RAISE NOTICE 'Renamed resident_id -> submitted_by';
  ELSE
    RAISE NOTICE 'No rename needed (submitted_by already exists or resident_id missing).';
  END IF;
END
$$;

-- 2. Add submitted_by in case neither column exists (fresh schema).
ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES public.profiles(id);

-- 3. Add other columns the application expects.
ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS submitted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS due_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
  ADD COLUMN IF NOT EXISTS assigned_to      UUID REFERENCES public.profiles(id);

-- 4. Fix status CHECK constraint to match the values the app sends.
ALTER TABLE public.complaints DROP CONSTRAINT IF EXISTS complaints_status_check;
UPDATE public.complaints SET status = 'pending'
  WHERE status IN ('submitted','acknowledged','on_hold');
UPDATE public.complaints SET status = 'resolved'  WHERE status = 'closed';
UPDATE public.complaints SET status = 'cancelled' WHERE status = 'rejected';
ALTER TABLE public.complaints
  ADD CONSTRAINT complaints_status_check
  CHECK (status IN ('pending','assigned','in_progress','resolved','reopened','cancelled'));

-- 5. Replace complaint-number generator: CMP-YYYY-NNNN format with SLA due_at.
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
      WHEN 'critical' THEN 4 WHEN 'high' THEN 24
      WHEN 'medium'   THEN 72 ELSE 168 END;
    NEW.due_at := NEW.submitted_at + (v_hours * INTERVAL '1 hour');
  END IF;
  RETURN NEW;
END
$$;

-- 6. Re-attach the complaint-number trigger (idempotent).
DROP TRIGGER IF EXISTS complaints_generate_number ON public.complaints;
CREATE TRIGGER complaints_generate_number
  BEFORE INSERT ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.generate_complaint_number();

-- 7. Rebuild RLS policies to reference submitted_by.
DROP POLICY IF EXISTS complaints_select         ON public.complaints;
DROP POLICY IF EXISTS complaints_insert         ON public.complaints;
DROP POLICY IF EXISTS complaints_update_resident    ON public.complaints;
DROP POLICY IF EXISTS complaints_update_staff_admin ON public.complaints;

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

-- 8. Ensure profiles has a SELECT policy (needed so get_user_role() works).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_select'
  ) THEN
    CREATE POLICY profiles_select ON public.profiles
      FOR SELECT TO authenticated
      USING (id = (SELECT auth.uid())
        OR (SELECT public.get_user_role()) = 'administrator');
  END IF;
END
$$;

-- 9. Reload PostgREST schema cache immediately.
NOTIFY pgrst, 'reload schema';

COMMIT;
