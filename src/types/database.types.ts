// Database row types for FixTrack.
//
// These interfaces map 1:1 to the PostgreSQL tables defined in the Supabase
// migrations (see supabase/migrations/). They mirror the column types so the
// frontend can stay type-safe end to end. Keep these in sync with the schema.
//
// Column naming follows the database (snake_case). The domain types in
// ./index.ts build on top of these where needed.

/** A user account record in the profiles table. */
export interface ProfileRow {
  id: string
  full_name: string
  phone: string | null
  avatar_url: string | null
  role: 'resident' | 'maintenance_staff' | 'administrator'
  account_status: 'active' | 'suspended' | 'deactivated'
  created_at: string // ISO timestamp
  updated_at: string // ISO timestamp
}

/** Staff-specific fields; one row per maintenance_staff profile (1:1). */
export interface MaintenanceStaffRow {
  id: string
  profile_id: string
  staff_code: string
  department: string | null
  specialization: string | null
  employment_status: 'active' | 'on_leave' | 'inactive'
  created_at: string
  updated_at: string
}

/** A complaint classification (e.g. Plumbing, Electrical). */
export interface ComplaintCategoryRow {
  id: string
  name: string
  description: string | null
  default_priority: 'low' | 'medium' | 'high' | 'critical'
  active: boolean
  created_at: string
  updated_at: string
}

/** A maintenance complaint report. */
export interface ComplaintRow {
  id: string
  complaint_number: string // e.g. "CMP-2026-0001"
  title: string
  description: string
  category_id: string
  location: string
  building: string
  floor: string | null
  room_number: string | null
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'reopened' | 'cancelled'
  submitted_by: string
  assigned_to: string | null
  submitted_at: string
  due_at: string | null // SLA deadline
  resolved_at: string | null
  resolution_notes: string | null
  created_at: string
  updated_at: string
}

/** An image/file attached to a complaint (stored in private Supabase Storage). */
export interface ComplaintAttachmentRow {
  id: string
  complaint_id: string
  uploaded_by: string
  storage_path: string
  file_name: string
  content_type: string | null
  file_size: number | null
  attachment_type: 'evidence' | 'progress' | 'resolution'
  created_at: string
}

/** A comment or internal note on a complaint. */
export interface ComplaintCommentRow {
  id: string
  complaint_id: string
  author_id: string
  comment: string
  visibility: 'public' | 'internal'
  created_at: string
  updated_at: string
}

/** Append-only record of every status change on a complaint. */
export interface ComplaintStatusHistoryRow {
  id: string
  complaint_id: string
  previous_status: ComplaintStatus | null
  new_status: ComplaintStatus
  changed_by: string
  reason: string | null
  created_at: string
}

/** An assignment or reassignment of a complaint to a staff member. */
export interface ComplaintAssignmentRow {
  id: string
  complaint_id: string
  assigned_to: string
  assigned_by: string
  previous_assignee_id: string | null
  reason: string | null
  created_at: string
}

/** An in-app notification for a user. */
export interface NotificationRow {
  id: string
  recipient_id: string
  complaint_id: string | null
  notification_type:
    | 'complaint_submitted'
    | 'assigned'
    | 'reassigned'
    | 'work_started'
    | 'public_comment'
    | 'resolved'
    | 'reopening_requested'
    | 'overdue'
  title: string
  message: string
  is_read: boolean
  created_at: string
  read_at: string | null
}

/** A complainant's rating/feedback after resolution, or reopening reason. */
export interface ComplaintFeedbackRow {
  id: string
  complaint_id: string
  submitted_by: string
  rating: number | null // 1-5
  feedback: string | null
  reopening_reason: string | null
  created_at: string
}

/** A key-value system setting (e.g. SLA targets). */
export interface SystemSettingRow {
  id: string
  setting_key: string
  setting_value: string
  updated_by: string | null
  updated_at: string
}

/** Append-only audit log entry. */
export interface AuditLogRow {
  id: string
  actor_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  created_at: string
}

// Re-export the shared status type so row types can reference it without a
// circular import (index.ts imports from database.types.ts).
export type ComplaintStatus =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'reopened'
  | 'cancelled'
