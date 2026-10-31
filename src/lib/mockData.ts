// Mock data for Phase 1 page shells.
//
// This file provides placeholder data so pages can render meaningful content
// before the Supabase backend is wired up in Phase 2. All data here is
// clearly fake and should be replaced with real database queries later.

import type {
  Complaint,
  ComplaintCategory,
  MaintenanceStaff,
  Notification,
  DashboardStats,
} from '@/types'

// ---------------------------------------------------------------------------
// Date helpers (relative to "now" so relative-time formatting works)
// ---------------------------------------------------------------------------

const now = new Date()
const daysAgo = (n: number): string =>
  new Date(now.getTime() - n * 86_400_000).toISOString()
const daysAhead = (n: number): string =>
  new Date(now.getTime() + n * 86_400_000).toISOString()

// ---------------------------------------------------------------------------
// Mock user IDs
// ---------------------------------------------------------------------------

export const MOCK_RESIDENT_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
export const MOCK_STAFF_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
export const MOCK_ADMIN_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc'

// ---------------------------------------------------------------------------
// Mock categories
// ---------------------------------------------------------------------------

export const mockCategories: ComplaintCategory[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Plumbing',
    description: 'Leaks, clogs, fixtures, water supply',
    defaultPriority: 'medium',
    active: true,
    createdAt: daysAgo(120),
    updatedAt: daysAgo(120),
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Electrical',
    description: 'Outlets, lighting, wiring, breakers',
    defaultPriority: 'high',
    active: true,
    createdAt: daysAgo(120),
    updatedAt: daysAgo(120),
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'HVAC',
    description: 'Heating, ventilation, air conditioning',
    defaultPriority: 'high',
    active: true,
    createdAt: daysAgo(120),
    updatedAt: daysAgo(120),
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Structural',
    description: 'Walls, doors, windows, flooring',
    defaultPriority: 'medium',
    active: true,
    createdAt: daysAgo(120),
    updatedAt: daysAgo(120),
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'Pest Control',
    description: 'Insects, rodents, infestation',
    defaultPriority: 'low',
    active: true,
    createdAt: daysAgo(120),
    updatedAt: daysAgo(120),
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    name: 'Cleaning',
    description: 'Common area cleaning, sanitation',
    defaultPriority: 'low',
    active: false,
    createdAt: daysAgo(120),
    updatedAt: daysAgo(30),
  },
]

// ---------------------------------------------------------------------------
// Mock complaints
// ---------------------------------------------------------------------------

export const mockComplaints: Complaint[] = [
  {
    id: 'c0000001-0000-0000-0000-000000000001',
    complaintNumber: 'CMP-2026-0001',
    title: 'Kitchen faucet leaking continuously',
    description:
      'The kitchen faucet in unit 302 has been leaking for two days. Water pools around the base and drips even when fully closed.',
    categoryId: '11111111-1111-1111-1111-111111111111',
    location: 'Building A, Unit 302',
    building: 'Building A',
    floor: '3',
    roomNumber: '302',
    priority: 'medium',
    status: 'in_progress',
    submittedBy: MOCK_RESIDENT_ID,
    assignedTo: MOCK_STAFF_ID,
    submittedAt: daysAgo(5),
    dueAt: daysAhead(2),
    resolvedAt: null,
    resolutionNotes: null,
    createdAt: daysAgo(5),
    updatedAt: daysAgo(1),
    category: { id: '11111111-1111-1111-1111-111111111111', name: 'Plumbing' },
    submitter: { id: MOCK_RESIDENT_ID, fullName: 'Alice Resident' },
    assignee: { id: MOCK_STAFF_ID, fullName: 'John Smith' },
  },
  {
    id: 'c0000002-0000-0000-0000-000000000002',
    complaintNumber: 'CMP-2026-0002',
    title: 'Hallway lights flickering on floor 2',
    description:
      'The fluorescent lights in the second-floor hallway flicker every few seconds, making it difficult to walk safely at night.',
    categoryId: '22222222-2222-2222-2222-222222222222',
    location: 'Building B, Floor 2 Hallway',
    building: 'Building B',
    floor: '2',
    roomNumber: null,
    priority: 'high',
    status: 'assigned',
    submittedBy: MOCK_RESIDENT_ID,
    assignedTo: MOCK_STAFF_ID,
    submittedAt: daysAgo(3),
    dueAt: daysAhead(1),
    resolvedAt: null,
    resolutionNotes: null,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(2),
    category: { id: '22222222-2222-2222-2222-222222222222', name: 'Electrical' },
    submitter: { id: MOCK_RESIDENT_ID, fullName: 'Alice Resident' },
    assignee: { id: MOCK_STAFF_ID, fullName: 'John Smith' },
  },
  {
    id: 'c0000003-0000-0000-0000-000000000003',
    complaintNumber: 'CMP-2026-0003',
    title: 'AC not cooling in common lounge',
    description:
      'The air conditioning unit in the ground-floor lounge is running but only blowing warm air. The room gets very hot during the afternoon.',
    categoryId: '33333333-3333-3333-3333-333333333333',
    location: 'Building A, Ground Floor Lounge',
    building: 'Building A',
    floor: 'G',
    roomNumber: 'Lounge',
    priority: 'critical',
    status: 'pending',
    submittedBy: MOCK_RESIDENT_ID,
    assignedTo: null,
    submittedAt: daysAgo(1),
    dueAt: daysAhead(3),
    resolvedAt: null,
    resolutionNotes: null,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    category: { id: '33333333-3333-3333-3333-333333333333', name: 'HVAC' },
    submitter: { id: MOCK_RESIDENT_ID, fullName: 'Alice Resident' },
    assignee: null,
  },
  {
    id: 'c0000004-0000-0000-0000-000000000004',
    complaintNumber: 'CMP-2026-0004',
    title: 'Broken window latch in gym',
    description:
      'The window latch in the gym is broken and the window will not stay closed. Wind keeps blowing it open.',
    categoryId: '44444444-4444-4444-4444-444444444444',
    location: 'Building C, Gym',
    building: 'Building C',
    floor: '1',
    roomNumber: 'Gym',
    priority: 'medium',
    status: 'resolved',
    submittedBy: MOCK_RESIDENT_ID,
    assignedTo: MOCK_STAFF_ID,
    submittedAt: daysAgo(20),
    dueAt: daysAgo(10),
    resolvedAt: daysAgo(8),
    resolutionNotes: 'Replaced the window latch with a new locking mechanism.',
    createdAt: daysAgo(20),
    updatedAt: daysAgo(8),
    category: { id: '44444444-4444-4444-4444-444444444444', name: 'Structural' },
    submitter: { id: MOCK_RESIDENT_ID, fullName: 'Alice Resident' },
    assignee: { id: MOCK_STAFF_ID, fullName: 'John Smith' },
  },
  {
    id: 'c0000005-0000-0000-0000-000000000005',
    complaintNumber: 'CMP-2026-0005',
    title: 'Ant infestation in storage room',
    description:
      'There is a trail of ants coming through a crack near the storage room door. The trail leads to the pantry area.',
    categoryId: '55555555-5555-5555-5555-555555555555',
    location: 'Building A, Storage Room',
    building: 'Building A',
    floor: '1',
    roomNumber: 'Storage',
    priority: 'low',
    status: 'resolved',
    submittedBy: MOCK_RESIDENT_ID,
    assignedTo: MOCK_STAFF_ID,
    submittedAt: daysAgo(15),
    dueAt: daysAgo(5),
    resolvedAt: daysAgo(6),
    resolutionNotes: 'Applied pest control treatment and sealed the crack.',
    createdAt: daysAgo(15),
    updatedAt: daysAgo(6),
    category: { id: '55555555-5555-5555-5555-555555555555', name: 'Pest Control' },
    submitter: { id: MOCK_RESIDENT_ID, fullName: 'Alice Resident' },
    assignee: { id: MOCK_STAFF_ID, fullName: 'John Smith' },
  },
  {
    id: 'c0000006-0000-0000-0000-000000000006',
    complaintNumber: 'CMP-2026-0006',
    title: 'Elevator making grinding noises',
    description:
      'The elevator in Building B has been making loud grinding noises when moving between floors 1 and 4.',
    categoryId: '44444444-4444-4444-4444-444444444444',
    location: 'Building B, Main Elevator',
    building: 'Building B',
    floor: null,
    roomNumber: null,
    priority: 'critical',
    status: 'assigned',
    submittedBy: MOCK_RESIDENT_ID,
    assignedTo: MOCK_STAFF_ID,
    submittedAt: daysAgo(2),
    dueAt: daysAgo(1), // overdue
    resolvedAt: null,
    resolutionNotes: null,
    createdAt: daysAgo(2),
    updatedAt: daysAgo(1),
    category: { id: '44444444-4444-4444-4444-444444444444', name: 'Structural' },
    submitter: { id: MOCK_RESIDENT_ID, fullName: 'Alice Resident' },
    assignee: { id: MOCK_STAFF_ID, fullName: 'John Smith' },
  },
  {
    id: 'c0000007-0000-0000-0000-000000000007',
    complaintNumber: 'CMP-2026-0007',
    title: 'Toilet not flushing in restroom 3',
    description:
      'The toilet in the third-floor men restroom does not flush. The handle moves but nothing happens.',
    categoryId: '11111111-1111-1111-1111-111111111111',
    location: 'Building A, Floor 3 Restroom',
    building: 'Building A',
    floor: '3',
    roomNumber: 'Restroom',
    priority: 'high',
    status: 'in_progress',
    submittedBy: MOCK_RESIDENT_ID,
    assignedTo: MOCK_STAFF_ID,
    submittedAt: daysAgo(4),
    dueAt: daysAhead(1),
    resolvedAt: null,
    resolutionNotes: null,
    createdAt: daysAgo(4),
    updatedAt: daysAgo(1),
    category: { id: '11111111-1111-1111-1111-111111111111', name: 'Plumbing' },
    submitter: { id: MOCK_RESIDENT_ID, fullName: 'Alice Resident' },
    assignee: { id: MOCK_STAFF_ID, fullName: 'John Smith' },
  },
  {
    id: 'c0000008-0000-0000-0000-000000000008',
    complaintNumber: 'CMP-2026-0008',
    title: 'Cracked tile near pool entrance',
    description:
      'There is a large cracked tile near the pool entrance that could cause someone to trip. The crack is getting wider.',
    categoryId: '44444444-4444-4444-4444-444444444444',
    location: 'Building C, Pool Entrance',
    building: 'Building C',
    floor: 'G',
    roomNumber: 'Pool',
    priority: 'medium',
    status: 'reopened',
    submittedBy: MOCK_RESIDENT_ID,
    assignedTo: MOCK_STAFF_ID,
    submittedAt: daysAgo(30),
    dueAt: daysAhead(5),
    resolvedAt: daysAgo(10),
    resolutionNotes: null, // was resolved but reopened
    createdAt: daysAgo(30),
    updatedAt: daysAgo(2),
    category: { id: '44444444-4444-4444-4444-444444444444', name: 'Structural' },
    submitter: { id: MOCK_RESIDENT_ID, fullName: 'Alice Resident' },
    assignee: { id: MOCK_STAFF_ID, fullName: 'John Smith' },
  },
]

// ---------------------------------------------------------------------------
// Mock maintenance staff
// ---------------------------------------------------------------------------

export const mockStaff: MaintenanceStaff[] = [
  {
    id: 'staff-0001-0000-0000-0000-000000000001',
    profileId: MOCK_STAFF_ID,
    staffCode: 'MT-001',
    department: 'Plumbing',
    specialization: 'Pipes, fixtures, water systems',
    employmentStatus: 'active',
    fullName: 'John Smith',
    phone: '+1 (555) 123-4567',
    activeWorkload: 4,
    createdAt: daysAgo(200),
    updatedAt: daysAgo(1),
  },
  {
    id: 'staff-0002-0000-0000-0000-000000000002',
    profileId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    staffCode: 'MT-002',
    department: 'Electrical',
    specialization: 'Wiring, outlets, lighting',
    employmentStatus: 'active',
    fullName: 'Jane Doe',
    phone: '+1 (555) 234-5678',
    activeWorkload: 2,
    createdAt: daysAgo(180),
    updatedAt: daysAgo(2),
  },
  {
    id: 'staff-0003-0000-0000-0000-000000000003',
    profileId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    staffCode: 'MT-003',
    department: 'HVAC',
    specialization: 'Heating, cooling, ventilation',
    employmentStatus: 'on_leave',
    fullName: 'Mike Johnson',
    phone: '+1 (555) 345-6789',
    activeWorkload: 0,
    createdAt: daysAgo(150),
    updatedAt: daysAgo(5),
  },
  {
    id: 'staff-0004-0000-0000-0000-000000000004',
    profileId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    staffCode: 'MT-004',
    department: 'General',
    specialization: 'Structural repairs, carpentry',
    employmentStatus: 'active',
    fullName: 'Sarah Williams',
    phone: '+1 (555) 456-7890',
    activeWorkload: 3,
    createdAt: daysAgo(120),
    updatedAt: daysAgo(1),
  },
]

// ---------------------------------------------------------------------------
// Mock notifications
// ---------------------------------------------------------------------------

export const mockNotifications: Notification[] = [
  {
    id: 'n0000001-0000-0000-0000-000000000001',
    recipientId: MOCK_RESIDENT_ID,
    complaintId: 'c0000002-0000-0000-0000-000000000002',
    notificationType: 'assigned',
    title: 'Complaint assigned',
    message: 'CMP-2026-0002 "Hallway lights flickering on floor 2" has been assigned to John Smith.',
    isRead: false,
    createdAt: daysAgo(2),
    readAt: null,
  },
  {
    id: 'n0000002-0000-0000-0000-000000000002',
    recipientId: MOCK_RESIDENT_ID,
    complaintId: 'c0000001-0000-0000-0000-000000000001',
    notificationType: 'work_started',
    title: 'Work started',
    message: 'Work has started on CMP-2026-0001 "Kitchen faucet leaking continuously".',
    isRead: false,
    createdAt: daysAgo(1),
    readAt: null,
  },
  {
    id: 'n0000003-0000-0000-0000-000000000003',
    recipientId: MOCK_RESIDENT_ID,
    complaintId: 'c0000004-0000-0000-0000-000000000004',
    notificationType: 'resolved',
    title: 'Complaint resolved',
    message: 'CMP-2026-0004 "Broken window latch in gym" has been marked as resolved.',
    isRead: true,
    createdAt: daysAgo(8),
    readAt: daysAgo(7),
  },
  {
    id: 'n0000004-0000-0000-0000-000000000004',
    recipientId: MOCK_RESIDENT_ID,
    complaintId: 'c0000006-0000-0000-0000-000000000006',
    notificationType: 'overdue',
    title: 'Complaint overdue',
    message: 'CMP-2026-0006 "Elevator making grinding noises" is now overdue.',
    isRead: false,
    createdAt: daysAgo(1),
    readAt: null,
  },
  {
    id: 'n0000005-0000-0000-0000-000000000005',
    recipientId: MOCK_RESIDENT_ID,
    complaintId: 'c0000008-0000-0000-0000-000000000008',
    notificationType: 'reopening_requested',
    title: 'Reopening requested',
    message: 'CMP-2026-0008 "Cracked tile near pool entrance" has been reopened.',
    isRead: true,
    createdAt: daysAgo(2),
    readAt: daysAgo(2),
  },
  {
    id: 'n0000006-0000-0000-0000-000000000006',
    recipientId: MOCK_RESIDENT_ID,
    complaintId: 'c0000003-0000-0000-0000-000000000003',
    notificationType: 'complaint_submitted',
    title: 'Complaint submitted',
    message: 'Your complaint CMP-2026-0003 "AC not cooling in common lounge" has been received.',
    isRead: true,
    createdAt: daysAgo(1),
    readAt: daysAgo(1),
  },
]

// ---------------------------------------------------------------------------
// Mock dashboard stats
// ---------------------------------------------------------------------------

export const adminStats: DashboardStats = {
  total: 156,
  pending: 34,
  assigned: 22,
  inProgress: 45,
  resolved: 89,
  overdue: 12,
  critical: 5,
}

export const residentStats: DashboardStats = {
  total: 8,
  pending: 1,
  assigned: 1,
  inProgress: 2,
  resolved: 4,
  overdue: 0,
  critical: 1,
}

export const staffStats: DashboardStats = {
  total: 4,
  pending: 0,
  assigned: 1,
  inProgress: 2,
  resolved: 0,
  overdue: 1,
  critical: 1,
}
