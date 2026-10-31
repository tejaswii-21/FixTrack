
-- ============================================================
-- FIXTRACK - INITIAL DATABASE MIGRATION
-- Target: Fresh Supabase project
-- File: supabase/migrations/001_initial_schema.sql
-- ============================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. PROFILES
-- ============================================================

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL DEFAULT '',
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'resident'
        CHECK (role IN ('resident', 'maintenance_staff', 'administrator')),
    account_status TEXT NOT NULL DEFAULT 'active'
        CHECK (account_status IN ('active', 'suspended', 'deactivated')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. MAINTENANCE STAFF
-- ============================================================

CREATE TABLE public.maintenance_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL UNIQUE
        REFERENCES public.profiles(id) ON DELETE CASCADE,
    department TEXT,
    employment_status TEXT NOT NULL DEFAULT 'active'
        CHECK (employment_status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. COMPLAINT CATEGORIES
-- ============================================================

CREATE TABLE public.complaint_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    default_priority TEXT NOT NULL DEFAULT 'medium'
        CHECK (default_priority IN ('low', 'medium', 'high', 'critical')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. COMPLAINTS
-- Matches complaintSchema in src/lib/validation.ts
-- ============================================================

CREATE SEQUENCE public.complaint_number_seq START WITH 1;

CREATE TABLE public.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_number TEXT NOT NULL UNIQUE DEFAULT '',
    resident_id UUID NOT NULL REFERENCES public.profiles(id),
    category_id UUID REFERENCES public.complaint_categories(id),
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 5 AND 200),
    description TEXT NOT NULL
        CHECK (char_length(description) BETWEEN 20 AND 2000),
    building TEXT NOT NULL,
    location TEXT NOT NULL,
    floor TEXT,
    room_number TEXT,
    priority TEXT NOT NULL DEFAULT 'medium'
        CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'submitted'
        CHECK (status IN (
            'submitted', 'acknowledged', 'assigned',
            'in_progress', 'on_hold', 'resolved', 'closed', 'rejected'
        )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE OR REPLACE FUNCTION public.generate_complaint_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF NEW.complaint_number IS NULL OR NEW.complaint_number = '' THEN
        NEW.complaint_number :=
            'FT-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' ||
            LPAD(NEXTVAL('public.complaint_number_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER complaints_generate_number
BEFORE INSERT ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.generate_complaint_number();

-- ============================================================
-- 5. COMPLAINT ATTACHMENTS
-- ============================================================

CREATE TABLE public.complaint_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL
        REFERENCES public.complaints(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    content_type TEXT,
    file_size BIGINT CHECK (file_size IS NULL OR file_size >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. COMPLAINT COMMENTS
-- ============================================================

CREATE TABLE public.complaint_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL
        REFERENCES public.complaints(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id),
    comment TEXT NOT NULL CHECK (char_length(comment) BETWEEN 1 AND 2000),
    internal_note BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 7. COMPLAINT STATUS HISTORY
-- ============================================================

CREATE TABLE public.complaint_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL
        REFERENCES public.complaints(id) ON DELETE CASCADE,
    changed_by UUID REFERENCES public.profiles(id),
    old_status TEXT,
    new_status TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 8. COMPLAINT ASSIGNMENTS
-- ============================================================

CREATE TABLE public.complaint_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL
        REFERENCES public.complaints(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL
        REFERENCES public.maintenance_staff(id),
    assigned_by UUID REFERENCES public.profiles(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unassigned_at TIMESTAMPTZ
);

-- ============================================================
-- 9. NOTIFICATIONS
-- ============================================================

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL
        REFERENCES public.profiles(id) ON DELETE CASCADE,
    complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 10. COMPLAINT FEEDBACK
-- ============================================================

CREATE TABLE public.complaint_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL UNIQUE
        REFERENCES public.complaints(id) ON DELETE CASCADE,
    submitted_by UUID NOT NULL REFERENCES public.profiles(id),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 11. SYSTEM SETTINGS
-- ============================================================

CREATE TABLE public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::JSONB,
    updated_by UUID REFERENCES public.profiles(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 12. AUDIT LOGS
-- ============================================================

CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX complaints_resident_idx
    ON public.complaints(resident_id);
CREATE INDEX complaints_status_idx
    ON public.complaints(status);
CREATE INDEX complaints_category_idx
    ON public.complaints(category_id);
CREATE INDEX complaints_created_idx
    ON public.complaints(created_at DESC);
CREATE INDEX attachments_complaint_idx
    ON public.complaint_attachments(complaint_id);
CREATE INDEX comments_complaint_idx
    ON public.complaint_comments(complaint_id);
CREATE INDEX status_history_complaint_idx
    ON public.complaint_status_history(complaint_id);
CREATE INDEX assignments_complaint_idx
    ON public.complaint_assignments(complaint_id);
CREATE INDEX notifications_recipient_idx
    ON public.notifications(recipient_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER complaints_set_updated_at
BEFORE UPDATE ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- AUTH: CREATE A RESIDENT PROFILE ON SIGN-UP
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
        NEW.raw_user_meta_data ->> 'phone'
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function for role checks without recursive profile RLS.
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT p.role
    FROM public.profiles AS p
    WHERE p.id = (SELECT auth.uid())
      AND p.account_status = 'active'
    LIMIT 1;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY profiles_select ON public.profiles
FOR SELECT TO authenticated
USING (
    id = (SELECT auth.uid())
    OR (SELECT public.get_user_role()) = 'administrator'
);

CREATE POLICY profiles_update ON public.profiles
FOR UPDATE TO authenticated
USING (id = (SELECT auth.uid()))
WITH CHECK (
    id = (SELECT auth.uid())
    AND role = 'resident'
    AND account_status = 'active'
);

-- Categories
CREATE POLICY categories_select ON public.complaint_categories
FOR SELECT TO authenticated
USING (
    active OR (SELECT public.get_user_role()) = 'administrator'
);

-- Complaints
CREATE POLICY complaints_select ON public.complaints
FOR SELECT TO authenticated
USING (
    resident_id = (SELECT auth.uid())
    OR (SELECT public.get_user_role()) IN ('maintenance_staff', 'administrator')
);

CREATE POLICY complaints_insert ON public.complaints
FOR INSERT TO authenticated
WITH CHECK (
    resident_id = (SELECT auth.uid())
    AND (SELECT public.get_user_role()) = 'resident'
);

-- Residents cannot alter status or ownership through this update policy.
CREATE POLICY complaints_update_resident ON public.complaints
FOR UPDATE TO authenticated
USING (
    resident_id = (SELECT auth.uid())
    AND status = 'submitted'
)
WITH CHECK (
    resident_id = (SELECT auth.uid())
    AND status = 'submitted'
);

-- Attachments: owner can read their own complaint's attachments.
CREATE POLICY attachments_select ON public.complaint_attachments
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.complaints c
        WHERE c.id = complaint_id
          AND (
              c.resident_id = (SELECT auth.uid())
              OR (SELECT public.get_user_role()) = 'administrator'
              OR (
                  (SELECT public.get_user_role()) = 'maintenance_staff'
                  AND EXISTS (
                      SELECT 1
                      FROM public.complaint_assignments a
                      JOIN public.maintenance_staff s ON s.id = a.staff_id
                      WHERE a.complaint_id = c.id
                        AND s.profile_id = (SELECT auth.uid())
                        AND a.unassigned_at IS NULL
                  )
              )
          )
    )
);

CREATE POLICY attachments_insert ON public.complaint_attachments
FOR INSERT TO authenticated
WITH CHECK (
    uploaded_by = (SELECT auth.uid())
    AND EXISTS (
        SELECT 1 FROM public.complaints c
        WHERE c.id = complaint_id
          AND c.resident_id = (SELECT auth.uid())
    )
);

-- Comments: hide internal notes from residents.
CREATE POLICY comments_select ON public.complaint_comments
FOR SELECT TO authenticated
USING (
    (
        internal_note = FALSE
        OR (SELECT public.get_user_role()) IN ('maintenance_staff', 'administrator')
    )
    AND EXISTS (
        SELECT 1 FROM public.complaints c
        WHERE c.id = complaint_id
          AND (
              c.resident_id = (SELECT auth.uid())
              OR (SELECT public.get_user_role()) = 'administrator'
              OR (
                  (SELECT public.get_user_role()) = 'maintenance_staff'
                  AND EXISTS (
                      SELECT 1
                      FROM public.complaint_assignments a
                      JOIN public.maintenance_staff s ON s.id = a.staff_id
                      WHERE a.complaint_id = c.id
                        AND s.profile_id = (SELECT auth.uid())
                        AND a.unassigned_at IS NULL
                  )
              )
          )
    )
);

CREATE POLICY comments_insert ON public.complaint_comments
FOR INSERT TO authenticated
WITH CHECK (
    author_id = (SELECT auth.uid())
    AND internal_note = FALSE
    AND EXISTS (
        SELECT 1 FROM public.complaints c
        WHERE c.id = complaint_id
          AND c.resident_id = (SELECT auth.uid())
    )
);

-- Status history: readable only by complaint participants/admin.
CREATE POLICY status_history_select ON public.complaint_status_history
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.complaints c
        WHERE c.id = complaint_id
          AND (
              c.resident_id = (SELECT auth.uid())
              OR (SELECT public.get_user_role()) = 'administrator'
              OR (
                  (SELECT public.get_user_role()) = 'maintenance_staff'
                  AND EXISTS (
                      SELECT 1
                      FROM public.complaint_assignments a
                      JOIN public.maintenance_staff s ON s.id = a.staff_id
                      WHERE a.complaint_id = c.id
                        AND s.profile_id = (SELECT auth.uid())
                        AND a.unassigned_at IS NULL
                  )
              )
          )
    )
);

-- Assignments: visible to assigned staff, complaint owner, or administrator.
CREATE POLICY assignments_select ON public.complaint_assignments
FOR SELECT TO authenticated
USING (
    (SELECT public.get_user_role()) = 'administrator'
    OR EXISTS (
        SELECT 1 FROM public.maintenance_staff s
        WHERE s.id = staff_id
          AND s.profile_id = (SELECT auth.uid())
    )
    OR EXISTS (
        SELECT 1 FROM public.complaints c
        WHERE c.id = complaint_id
          AND c.resident_id = (SELECT auth.uid())
    )
);

-- Notifications
CREATE POLICY notifications_select ON public.notifications
FOR SELECT TO authenticated
USING (recipient_id = (SELECT auth.uid()));

CREATE POLICY notifications_update ON public.notifications
FOR UPDATE TO authenticated
USING (recipient_id = (SELECT auth.uid()))
WITH CHECK (recipient_id = (SELECT auth.uid()));

-- Feedback
CREATE POLICY feedback_select ON public.complaint_feedback
FOR SELECT TO authenticated
USING (
    submitted_by = (SELECT auth.uid())
    OR (SELECT public.get_user_role()) = 'administrator'
);

CREATE POLICY feedback_insert ON public.complaint_feedback
FOR INSERT TO authenticated
WITH CHECK (
    submitted_by = (SELECT auth.uid())
    AND EXISTS (
        SELECT 1 FROM public.complaints c
        WHERE c.id = complaint_id
          AND c.resident_id = (SELECT auth.uid())
          AND c.status IN ('resolved', 'closed')
    )
);

-- Settings and audit logs: administrator read access only.
CREATE POLICY settings_select ON public.system_settings
FOR SELECT TO authenticated
USING ((SELECT public.get_user_role()) = 'administrator');

CREATE POLICY audit_logs_select ON public.audit_logs
FOR SELECT TO authenticated
USING ((SELECT public.get_user_role()) = 'administrator');

-- Prevent direct client writes to sensitive administrative tables.
REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.system_settings FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.maintenance_staff FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.complaint_assignments FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.complaint_status_history FROM anon, authenticated;

-- ============================================================
-- DEFAULT CATEGORIES
-- ============================================================

INSERT INTO public.complaint_categories
    (name, description, default_priority)
VALUES
    ('Electrical', 'Electrical faults and lighting', 'high'),
    ('Plumbing', 'Leaks, drains, and water supply', 'medium'),
    ('Cleaning', 'Cleaning and waste management', 'medium'),
    ('Facilities', 'Building and shared facility issues', 'medium'),
    ('Safety', 'Safety-related maintenance concerns', 'critical'),
    ('Other', 'Other maintenance issues', 'low')
ON CONFLICT (name) DO NOTHING;

COMMIT;
