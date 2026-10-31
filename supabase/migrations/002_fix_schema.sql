-- ============================================================
-- FixTrack Migration 002: Fix Schema Mismatches
-- Run this in Supabase Dashboard -> SQL Editor -> New Query
-- Safe to run on fresh project or after migration 001
-- ============================================================
BEGIN;

-- 1. Add avatar_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Maintenance staff extras
ALTER TABLE public.maintenance_staff
  ADD COLUMN IF NOT EXISTS staff_code TEXT,
  ADD COLUMN IF NOT EXISTS specialization TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 3. Categories: add updated_at
ALTER TABLE public.complaint_categories
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 4. Rename resident_id to submitted_by
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='complaints' AND column_name='resident_id')
  THEN ALTER TABLE public.complaints RENAME COLUMN resident_id TO submitted_by;
  END IF;
END $$;

-- 5. Add missing complaint columns
ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id);

-- 6. Fix status values (drop old check, migrate data, add new check)
ALTER TABLE public.complaints DROP CONSTRAINT IF EXISTS complaints_status_check;
UPDATE public.complaints SET status='pending' WHERE status IN ('submitted','acknowledged','on_hold');
UPDATE public.complaints SET status='resolved' WHERE status='closed';
UPDATE public.complaints SET status='cancelled' WHERE status='rejected';
ALTER TABLE public.complaints ADD CONSTRAINT complaints_status_check
  CHECK (status IN ('pending','assigned','in_progress','resolved','reopened','cancelled'));

-- Rename FT- complaint numbers to CMP-
UPDATE public.complaints SET complaint_number=REPLACE(complaint_number,'FT-','CMP-')
  WHERE complaint_number LIKE 'FT-%';

-- 7. Update complaint number generator: CMP-YYYY-NNNN format + SLA due_at
CREATE OR REPLACE FUNCTION public.generate_complaint_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path='' AS $$
DECLARE v_hours NUMERIC := 72;
BEGIN
  IF NEW.complaint_number IS NULL OR NEW.complaint_number = '' THEN
    NEW.complaint_number := 'CMP-' || TO_CHAR(NOW(),'YYYY') || '-' ||
      LPAD(NEXTVAL('public.complaint_number_seq')::TEXT,4,'0');
  END IF;
  IF NEW.submitted_at IS NULL THEN NEW.submitted_at := NOW(); END IF;
  IF NEW.due_at IS NULL THEN
    v_hours := CASE NEW.priority
      WHEN 'critical' THEN 4 WHEN 'high' THEN 24 WHEN 'medium' THEN 72 ELSE 168 END;
    NEW.due_at := NEW.submitted_at + (v_hours * INTERVAL '1 hour');
  END IF;
  RETURN NEW;
END $$;

-- 8. Comment visibility column
ALTER TABLE public.complaint_comments
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='complaint_comments' AND column_name='internal_note')
  THEN UPDATE public.complaint_comments SET visibility='internal' WHERE internal_note=TRUE;
  END IF;
END $$;
ALTER TABLE public.complaint_comments DROP CONSTRAINT IF EXISTS complaint_comments_visibility_check;
ALTER TABLE public.complaint_comments ADD CONSTRAINT complaint_comments_visibility_check
  CHECK (visibility IN ('public','internal'));

-- 9. Notifications: add type, is_read, read_at
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS notification_type TEXT NOT NULL DEFAULT 'complaint_submitted',
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_notification_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_notification_type_check
  CHECK (notification_type IN (
    'complaint_submitted','assigned','reassigned','work_started',
    'public_comment','resolved','reopening_requested','overdue'));

-- 10. System settings SLA seed
ALTER TABLE public.system_settings
  ADD COLUMN IF NOT EXISTS setting_key TEXT,
  ADD COLUMN IF NOT EXISTS setting_value TEXT;
INSERT INTO public.system_settings(key,value,setting_key,setting_value) VALUES
  ('sla_critical_hours','4',  'sla_critical_hours','4'),
  ('sla_high_hours',   '24', 'sla_high_hours',   '24'),
  ('sla_medium_hours', '72', 'sla_medium_hours', '72'),
  ('sla_low_hours',   '168','sla_low_hours',    '168')
ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,
  setting_key=EXCLUDED.setting_key, setting_value=EXCLUDED.setting_value;

-- 11. Status change audit trigger
CREATE OR REPLACE FUNCTION public.record_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.complaint_status_history(complaint_id,changed_by,old_status,new_status)
    VALUES(NEW.id,(SELECT auth.uid()),OLD.status,NEW.status);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS complaints_record_status_change ON public.complaints;
CREATE TRIGGER complaints_record_status_change
  AFTER UPDATE OF status ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.record_status_change();

-- 12. Notification on submit trigger
CREATE OR REPLACE FUNCTION public.notify_on_submit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  INSERT INTO public.notifications(recipient_id,complaint_id,notification_type,title,message)
  VALUES(NEW.submitted_by,NEW.id,'complaint_submitted',
    'Complaint submitted',
    'Your complaint '||NEW.complaint_number||' has been received.');
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS complaints_notify_submitted ON public.complaints;
CREATE TRIGGER complaints_notify_submitted
  AFTER INSERT ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_submit();

-- 13. Fix RLS: update policies to use submitted_by
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT LANGUAGE SQL STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT role FROM public.profiles WHERE id=(SELECT auth.uid()) AND account_status='active' LIMIT 1;
$$;

DROP POLICY IF EXISTS complaints_select ON public.complaints;
DROP POLICY IF EXISTS complaints_insert ON public.complaints;
DROP POLICY IF EXISTS complaints_update_resident ON public.complaints;
DROP POLICY IF EXISTS complaints_update_staff_admin ON public.complaints;

CREATE POLICY complaints_select ON public.complaints FOR SELECT TO authenticated USING(
  submitted_by=(SELECT auth.uid()) OR (SELECT public.get_user_role()) IN ('maintenance_staff','administrator'));
CREATE POLICY complaints_insert ON public.complaints FOR INSERT TO authenticated
  WITH CHECK(submitted_by=(SELECT auth.uid()));
CREATE POLICY complaints_update_staff_admin ON public.complaints FOR UPDATE TO authenticated
  USING((SELECT public.get_user_role()) IN ('maintenance_staff','administrator') OR
        (submitted_by=(SELECT auth.uid()) AND status='pending'))
  WITH CHECK((SELECT public.get_user_role()) IN ('maintenance_staff','administrator') OR
             (submitted_by=(SELECT auth.uid()) AND status='pending'));

-- Allow profile insert on signup
DROP POLICY IF EXISTS profiles_insert ON public.profiles;
CREATE POLICY profiles_insert ON public.profiles FOR INSERT TO authenticated
  WITH CHECK(id=(SELECT auth.uid()));

-- Storage bucket for complaint attachments (run separately if bucket missing)
-- INSERT INTO storage.buckets(id,name,public) VALUES('complaint-attachments','complaint-attachments',false)
-- ON CONFLICT(id) DO NOTHING;

-- Storage RLS: users can upload to their own folder, read their own files
-- CREATE POLICY IF NOT EXISTS "Users upload own attachments"
--   ON storage.objects FOR INSERT TO authenticated
--   WITH CHECK(bucket_id='complaint-attachments' AND (storage.foldername(name))[1]=(SELECT auth.uid())::text);
-- CREATE POLICY IF NOT EXISTS "Users read own attachments"
--   ON storage.objects FOR SELECT TO authenticated
--   USING(bucket_id='complaint-attachments' AND (storage.foldername(name))[1]=(SELECT auth.uid())::text);

COMMIT;