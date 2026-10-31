// Shared domain types for FixTrack.
//
// This file re-exports the database row types and adds enriched domain
// interfaces (with relations/enums), input types, and query/result helpers
// used across services, hooks, and components.

// ---------------------------------------------------------------------------
// Enums / union types (mirror the database check constraints)
// ---------------------------------------------------------------------------

export type Role = 'resident' | 'maintenance_staff' | 'administrator'

export type ComplaintStatus =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'reopened'
  | 'cancelled'

export type Priority = 'low' | 'medium' | 'high' | 'critical'

export type AccountStatus = 'active' | 'suspended' | 'deactivated'

export type EmploymentStatus = 'active' | 'on_leave' | 'inactive'

export type CommentVisibility = 'public' | 'internal'

export type NotificationType =
  | 'complaint_submitted'
  | 'assigned'
  | 'reassigned'
  | 'work_started'
  | 'public_comment'
  | 'resolved'
  | 'reopening_requested'
  | 'overdue'

export type AttachmentType = 'evidence' | 'progress' | 'resolution'

// Re-export the raw database row types for convenience.
export type {
  ProfileRow,
  MaintenanceStaffRow,
  ComplaintCategoryRow,
  ComplaintRow,
  ComplaintAttachmentRow,
  ComplaintCommentRow,
  ComplaintStatusHistoryRow,
  ComplaintAssignmentRow,
  NotificationRow,
  ComplaintFeedbackRow,
  SystemSettingRow,
  AuditLogRow,
} from './database.types'

// ---------------------------------------------------------------------------
// Enriched domain interfaces (rows + commonly joined relations/enums)
// ---------------------------------------------------------------------------

/** A user profile, with role represented as the typed Role union. */
export interface Profile {
  id: string
  fullName: string
  phone: string | null
  avatarUrl: string | null
  role: Role
  accountStatus: AccountStatus
  createdAt: string
  updatedAt: string
}

/** Complaint category with the default priority typed. */
export interface ComplaintCategory {
  id: string
  name: string
  description: string | null
  defaultPriority: Priority
  active: boolean
  createdAt: string
  updatedAt: string
}

/** A maintenance staff member (profile + staff extension + workload). */
export interface MaintenanceStaff {
  id: string
  profileId: string
  staffCode: string
  department: string | null
  specialization: string | null
  employmentStatus: EmploymentStatus
  // Joined profile fields for display:
  fullName: string
  phone: string | null
  // Number of complaints currently assigned (for workload display):
  activeWorkload: number
  createdAt: string
  updatedAt: string
}

/** A maintenance complaint with commonly joined relations. */
export interface Complaint {
  id: string
  complaintNumber: string // e.g. "CMP-2026-0001"
  title: string
  description: string
  categoryId: string
  location: string
  building: string
  floor: string | null
  roomNumber: string | null
  priority: Priority
  status: ComplaintStatus
  submittedBy: string
  assignedTo: string | null
  submittedAt: string
  dueAt: string | null
  resolvedAt: string | null
  resolutionNotes: string | null
  createdAt: string
  updatedAt: string
  // Optional joined relations (populated where useful):
  category?: Pick<ComplaintCategory, 'id' | 'name'> | null
  submitter?: Pick<Profile, 'id' | 'fullName'> | null
  assignee?: { id: string; fullName: string; staffCode?: string; department?: string | null } | null
}

/** An attachment attached to a complaint (private storage). */
export interface ComplaintAttachment {
  id: string
  complaintId: string
  uploadedBy: string
  storagePath: string
  fileName: string
  contentType: string | null
  fileSize: number | null
  attachmentType: AttachmentType
  createdAt: string
}

/** A comment (public) or internal note on a complaint. */
export interface ComplaintComment {
  id: string
  complaintId: string
  authorId: string
  comment: string
  visibility: CommentVisibility
  createdAt: string
  updatedAt: string
  author?: Pick<Profile, 'id' | 'fullName'> | null
}

/** One entry in a complaint's status timeline (append-only). */
export interface ComplaintStatusHistory {
  id: string
  complaintId: string
  previousStatus: ComplaintStatus | null
  newStatus: ComplaintStatus
  changedBy: string
  reason: string | null
  createdAt: string
  changedByUser?: Pick<Profile, 'id' | 'fullName'> | null
}

/** An assignment or reassignment record. */
export interface ComplaintAssignment {
  id: string
  complaintId: string
  assignedTo: string
  assignedBy: string
  previousAssigneeId: string | null
  reason: string | null
  createdAt: string
  assignedToUser?: Pick<Profile, 'id' | 'fullName'> | null
  assignedByUser?: Pick<Profile, 'id' | 'fullName'> | null
}

/** An in-app notification. */
export interface Notification {
  id: string
  recipientId: string
  complaintId: string | null
  notificationType: NotificationType
  title: string
  message: string
  isRead: boolean
  createdAt: string
  readAt: string | null
}

/** A complainant's rating/feedback, or reopening reason. */
export interface ComplaintFeedback {
  id: string
  complaintId: string
  submittedBy: string
  rating: number | null // 1-5
  feedback: string | null
  reopeningReason: string | null
  createdAt: string
}

/** A key-value system setting (e.g. SLA targets). */
export interface SystemSetting {
  id: string
  settingKey: string
  settingValue: string
  updatedBy: string | null
  updatedAt: string
}

/** Append-only audit log entry. */
export interface AuditLog {
  id: string
  actorId: string | null
  action: string
  entityType: string
  entityId: string | null
  oldValues: Record<string, unknown> | null
  newValues: Record<string, unknown> | null
  createdAt: string
}

// ---------------------------------------------------------------------------
// Input / query / result types
// ---------------------------------------------------------------------------

/** Fields needed to create a new complaint (resident submission). */
export interface ComplaintCreateInput {
  title: string
  description: string
  categoryId: string
  building: string
  location: string
  floor?: string
  roomNumber?: string
  priority: Priority
}

/** Parameters for listing/searching/filtering complaints. */
export interface ComplaintQueryParams {
  search?: string // complaint number, title, category, status
  status?: ComplaintStatus
  priority?: Priority
  categoryId?: string
  assignedTo?: string
  submittedBy?: string // restrict to a resident's own complaints
  overdue?: boolean // only overdue complaints
  dateFrom?: string // ISO date
  dateTo?: string // ISO date
  sortBy?: 'submitted_at' | 'updated_at' | 'priority' | 'status' | 'complaint_number'
  sortDir?: 'asc' | 'desc'
  page?: number // 1-based
  pageSize?: number
}

/** Generic paginated result wrapper. */
export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** Staff member plus their current workload (for the assignment panel). */
export interface StaffWithWorkload {
  id: string
  profileId: string
  fullName: string
  staffCode: string
  department: string | null
  specialization: string | null
  employmentStatus: EmploymentStatus
  activeWorkload: number // count of assigned + in_progress complaints
}

// ---------------------------------------------------------------------------
// Dashboard / report stats
// ---------------------------------------------------------------------------

/** Aggregated counts used on dashboards and reports. */
export interface DashboardStats {
  total: number
  pending: number
  assigned: number
  inProgress: number
  resolved: number
  overdue: number
  critical: number
}

/** Count of complaints per status (for charts). */
export interface StatusCounts {
  pending: number
  assigned: number
  inProgress: number
  resolved: number
  reopened: number
  cancelled: number
}

/** Count of complaints per category (for charts). */
export interface CategoryCount {
  categoryId: string
  name: string
  count: number
}

/** A simple date range used by reports. */
export interface DateRange {
  from?: string // ISO date
  to?: string // ISO date
}

/** Parameters for CSV export (respect RLS + active filters). */
export interface CsvExportParams {
  query?: ComplaintQueryParams
  dateRange?: DateRange
}
