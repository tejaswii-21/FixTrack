// complaints.service.ts - All complaint CRUD, queries, and image uploads.
// Maps database snake_case columns to frontend camelCase types.
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type {
  Complaint, ComplaintCreateInput, ComplaintQueryParams, PaginatedResult,
  ComplaintStatus, ComplaintStatusHistory, ComplaintCategory,
} from '@/types'

// ---------------------------------------------------------------------------
// Type mapping helpers
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapComplaint(row: any): Complaint {
  return {
    id: row.id,
    complaintNumber: row.complaint_number,
    title: row.title,
    description: row.description,
    categoryId: row.category_id,
    location: row.location ?? '',
    building: row.building ?? '',
    floor: row.floor ?? null,
    roomNumber: row.room_number ?? null,
    priority: row.priority,
    status: row.status,
    submittedBy: row.submitted_by,
    assignedTo: row.assigned_to ?? null,
    submittedAt: row.submitted_at ?? row.created_at,
    dueAt: row.due_at ?? null,
    resolvedAt: row.resolved_at ?? null,
    resolutionNotes: row.resolution_notes ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Joined relations (optional)
    category: row.complaint_categories
      ? { id: row.complaint_categories.id, name: row.complaint_categories.name }
      : null,
    submitter: row.submitter_profile
      ? { id: row.submitter_profile.id, fullName: row.submitter_profile.full_name ?? '' }
      : null,
    assignee: row.assignee_profile
      ? { id: row.assignee_profile.id, fullName: row.assignee_profile.full_name || row.assignee_profile.staff_code || '', staffCode: row.assignee_profile.staff_code ?? undefined, department: row.assignee_profile.department ?? null }
      : null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCategory(row: any): ComplaintCategory {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    defaultPriority: row.default_priority ?? 'medium',
    active: row.active ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  }
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function getCategories(): Promise<ComplaintCategory[]> {
  if (!isSupabaseConfigured || !supabase) return []
  const { data, error } = await supabase
    .from('complaint_categories')
    .select('*')
    .eq('active', true)
    .order('name')
  if (error) throw error
  return (data ?? []).map(mapCategory)
}

// ---------------------------------------------------------------------------
// Create complaint (with optional image uploads)
// ---------------------------------------------------------------------------

export async function createComplaint(
  input: ComplaintCreateInput,
  userId: string,
  imageFiles: File[] = [],
): Promise<Complaint> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase not configured')

  // Insert the complaint row — plain select(*) to avoid FK alias issues
  const { data: inserted, error } = await supabase
    .from('complaints')
    .insert({
      title: input.title,
      description: input.description,
      category_id: input.categoryId,
      building: input.building,
      location: input.location,
      floor: input.floor ?? null,
      room_number: input.roomNumber ?? null,
      priority: input.priority,
      status: 'pending',
      submitted_by: userId,
    })
    .select('*')
    .single()

  if (error) {
    // Surface the real Supabase error code and message for debugging
    const detail = [error.code, error.message, error.details, error.hint]
      .filter(Boolean).join(' | ')
    throw new Error(detail || 'Insert failed')
  }
  if (!inserted) throw new Error('Complaint insert returned no data')

  const complaint = mapComplaint(inserted)

  // Upload images if any
  if (imageFiles.length > 0) {
    await uploadAttachments(complaint.id, userId, imageFiles)
  }

  return complaint
}

// ---------------------------------------------------------------------------
// Upload images to Supabase Storage
// ---------------------------------------------------------------------------

export async function uploadAttachments(
  complaintId: string,
  userId: string,
  files: File[],
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return

  for (const file of files) {
    // Validate type and size
    if (!file.type.startsWith('image/')) continue
    if (file.size > 10 * 1024 * 1024) continue // 10MB limit

    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${userId}/${complaintId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('complaint-attachments')
      .upload(path, file, { contentType: file.type, upsert: false })

    if (uploadError) {
      console.error('Upload error:', uploadError.message)
      continue
    }

    // Save metadata
    await supabase.from('complaint_attachments').insert({
      complaint_id: complaintId,
      uploaded_by: userId,
      file_name: file.name,
      file_path: path,
      content_type: file.type,
      file_size: file.size,
    })
  }
}

/** Get a signed URL for a private attachment. */
export async function getAttachmentUrl(path: string): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null
  const { data } = await supabase.storage
    .from('complaint-attachments')
    .createSignedUrl(path, 3600) // 1 hour
  return data?.signedUrl ?? null
}

// ---------------------------------------------------------------------------
// Fetch complaints
// ---------------------------------------------------------------------------

/** Base query — joins category name. Profile joins are done without FK alias
 *  to avoid PostgREST errors when FK constraint names differ from column names.
 */
function baseSelect() {
  return supabase!
    .from('complaints')
    .select(`
      *,
      complaint_categories(id, name),
      submitter_profile:profiles!submitted_by(id, full_name),
      assignee_profile:maintenance_staff!assigned_to(id, full_name, staff_code, department)
    `)
}

export async function getMyComplaints(
  userId: string,
  params: Partial<ComplaintQueryParams> = {},
): Promise<PaginatedResult<Complaint>> {
  if (!isSupabaseConfigured || !supabase) return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 }

  let q = baseSelect().eq('submitted_by', userId)

  if (params.status) q = q.eq('status', params.status)
  if (params.priority) q = q.eq('priority', params.priority)
  if (params.search) q = q.ilike('title', `%${params.search}%`)

  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await q
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error
  const items = (data ?? []).map(mapComplaint)
  const total = count ?? items.length
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export async function getAllComplaints(
  params: Partial<ComplaintQueryParams> = {},
): Promise<PaginatedResult<Complaint>> {
  if (!isSupabaseConfigured || !supabase) return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 }

  let q = baseSelect()
  if (params.status) q = q.eq('status', params.status)
  if (params.priority) q = q.eq('priority', params.priority)
  if (params.search) q = q.ilike('title', `%${params.search}%`)

  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await q
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error
  const items = (data ?? []).map(mapComplaint)
  const total = count ?? items.length
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export async function getComplaintById(id: string): Promise<Complaint | null> {
  if (!isSupabaseConfigured || !supabase) return null
  const { data, error } = await baseSelect().eq('id', id).single()
  if (error || !data) return null
  return mapComplaint(data)
}

export async function getComplaintAttachments(complaintId: string) {
  if (!isSupabaseConfigured || !supabase) return []
  const { data } = await supabase
    .from('complaint_attachments')
    .select('*')
    .eq('complaint_id', complaintId)
    .order('created_at')
  return data ?? []
}

export async function updateComplaintStatus(
  id: string,
  newStatus: ComplaintStatus,
  resolutionNotes?: string,
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase not configured')
  const update: Record<string, unknown> = { status: newStatus }
  if (newStatus === 'resolved') {
    update.resolved_at = new Date().toISOString()
    if (resolutionNotes) update.resolution_notes = resolutionNotes
  }
  const { error } = await supabase.from('complaints').update(update).eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Status history
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapHistory(row: any): ComplaintStatusHistory {
  return {
    id: row.id,
    complaintId: row.complaint_id,
    previousStatus: row.old_status ?? null,
    newStatus: row.new_status,
    changedBy: row.changed_by ?? '',
    reason: row.note ?? null,
    createdAt: row.created_at,
    changedByUser: row.changed_by_profile
      ? { id: row.changed_by_profile.id, fullName: row.changed_by_profile.full_name ?? '' }
      : null,
  }
}

export async function getStatusHistory(complaintId: string): Promise<ComplaintStatusHistory[]> {
  if (!isSupabaseConfigured || !supabase) return []
  const { data, error } = await supabase
    .from('complaint_status_history')
    .select('*, changed_by_profile:profiles!changed_by(id, full_name)')
    .eq('complaint_id', complaintId)
    .order('created_at')
  if (error) return []
  return (data ?? []).map(mapHistory)
}

// ---------------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------------

export async function getDashboardStats(userId?: string) {
  if (!isSupabaseConfigured || !supabase) {
    return { total: 0, pending: 0, assigned: 0, inProgress: 0, resolved: 0, overdue: 0, critical: 0 }
  }

  let q = supabase.from('complaints').select('status, priority, due_at', { count: 'exact' })
  if (userId) q = q.eq('submitted_by', userId)

  const { data, error } = await q
  if (error) {
    return { total: 0, pending: 0, assigned: 0, inProgress: 0, resolved: 0, overdue: 0, critical: 0 }
  }

  const rows = data ?? []
  const now = new Date()
  return {
    total: rows.length,
    pending: rows.filter(r => r.status === 'pending').length,
    assigned: rows.filter(r => r.status === 'assigned').length,
    inProgress: rows.filter(r => r.status === 'in_progress').length,
    resolved: rows.filter(r => r.status === 'resolved').length,
    overdue: rows.filter(r =>
      r.due_at && new Date(r.due_at) < now &&
      !['resolved','cancelled'].includes(r.status)
    ).length,
    critical: rows.filter(r => r.priority === 'critical').length,
  }
}
// ---------------------------------------------------------------------------
// Maintenance staff (for admin assignment dropdown)
// ---------------------------------------------------------------------------

export interface StaffOption { id: string; fullName: string; staffCode: string; department: string | null; employmentStatus: string }

export async function getMaintenanceStaff(): Promise<StaffOption[]> {
  if (!isSupabaseConfigured || !supabase) return []
  // Join maintenance_staff with profiles to get the display name
  // Use maintenance_staff.id (not profile_id) and full_name directly on the table
  const { data, error } = await supabase
    .from('maintenance_staff')
    .select('id, staff_code, full_name, department, employment_status')
    .eq('employment_status', 'active')
    .order('staff_code')
  if (error) { console.error('getMaintenanceStaff:', error.message); return [] }
  return (data ?? []).map((row: any) => ({
    id: row.id as string,  // maintenance_staff.id — the UUID for assignComplaint()
    fullName: (row.full_name as string) || row.staff_code,
    staffCode: row.staff_code as string,
    department: row.department as string | null,
    employmentStatus: row.employment_status as string,
  }))
}

// Assign a complaint to a maintenance_staff member. staffId = maintenance_staff.id (not profile_id).
export async function assignComplaint(complaintId: string, staffId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase not configured')
  const { error } = await supabase
    .from('complaints')
    .update({ assigned_to: staffId, status: 'assigned' })
    .eq('id', complaintId)
  if (error) {
    const detail = [error.code, error.message].filter(Boolean).join(' | ')
    throw new Error(detail || 'Assign failed')
  }
}

// Delete a complaint (student can only delete their own — enforced by RLS).
export async function deleteComplaint(complaintId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase not configured')
  const { error } = await supabase
    .from('complaints')
    .delete()
    .eq('id', complaintId)
  if (error) {
    const detail = [error.code, error.message].filter(Boolean).join(' | ')
    throw new Error(detail || 'Delete failed')
  }
}
