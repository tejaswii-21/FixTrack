-- Migration 009: Allow students to delete their own complaints
-- Run in: Supabase Dashboard -> SQL Editor -> New Query -> Run

-- Students can only delete complaints they submitted (submitted_by = auth.uid())
-- Related records (attachments, comments, notifications, feedback) have ON DELETE CASCADE
-- so they will be cleaned up automatically by PostgreSQL.

-- Allow students to delete their own complaints
DROP POLICY IF EXISTS complaints_delete ON public.complaints;
CREATE POLICY complaints_delete ON public.complaints
  FOR DELETE TO authenticated
  USING (submitted_by = (SELECT auth.uid()));

-- Grant DELETE privilege (may have been revoked by an earlier migration)
GRANT DELETE ON public.complaints TO authenticated;

NOTIFY pgrst, 'reload schema';
