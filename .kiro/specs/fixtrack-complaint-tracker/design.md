# Design Document

## Overview

FixTrack is a simple, beginner-friendly full-stack web application for reporting and tracking maintenance complaints in places like colleges, hostels, apartments, offices, and residential communities. Users (residents) submit maintenance problems such as water leakage, broken lights, or plumbing issues. Administrators assign these complaints to maintenance staff, who update progress until the issue is resolved.

This is a college project. The goal is a working, easy-to-understand application — not an enterprise system. The design favors clear names, simple code, and comments on anything important. Advanced features listed in the "Remaining Features" section of the requirements are deliberately kept out of scope.

This document covers the system architecture, database schema, frontend structure, security model, key workflows, and correctness properties. It preserves every Phase 1 requirement and gives practical implementation guidance for each part.

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 18 with TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS |
| UI components | shadcn/ui |
| Icons | Lucide React |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Routing | React Router |
| Toast notifications | Sonner |
| Date utilities | date-fns |
| Backend (auth) | Supabase Auth |
| Database | Supabase PostgreSQL |
| File storage | Supabase Storage (private buckets) |
| Server functions | Supabase Edge Functions |

### Design Principles

1. **Security at the database layer.** Row Level Security (RLS) policies enforce access control. The frontend is never trusted as the only authority.
2. **Server-side authorization for privileged operations.** Role changes, status transitions, and assignments use Edge Functions or PostgreSQL functions with the service role. They never rely on client-side writes.
3. **Type safety end-to-end.** TypeScript types mirror the database schema. Zod schemas validate inputs at form boundaries.
4. **Modularity.** Services isolate data access. Components are reusable. Hooks encapsulate state logic.
5. **Beginner-friendly code.** Clear naming, comments on important logic, and no clever abstractions. The code should be readable by a student.

## Architecture

FixTrack follows a client-server architecture. The React frontend talks to Supabase services directly for normal read/write operations (through RLS-protected queries). Operations that need elevated privileges or cannot be safely expressed in RLS go through Edge Functions, which use the service role key on the server.

```
┌──────────────────────────────────────────────┐
│                  Frontend                      │
│  React + TypeScript + Vite + Tailwind CSS     │
│                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │  Pages    │  │ Components│  │   Services    │ │
│  │ (routes)  │  │ (ui/layout)│  │ (API clients) │ │
│  └────┬─────┘  └─────┬────┘  └──────┬───────┘ │
│       │              │              │          │
│  ┌────┴──────────────┴──────────────┴───────┐ │
│  │           Contexts / Hooks                │ │
│  │  (Auth, Theme, Notifications, Query)      │ │
│  └────────────────────┬──────────────────────┘ │
└───────────────────────┼──────────────────────────┘
                        │
              ┌─────────┴──────────┐
              │                    │
     ┌────────┴────────┐ ┌────────┴─────────┐
     │  Supabase Client  │ │  Edge Functions  │
     │  (publishable key)│ │  (service role)  │
     │                   │ │                   │
     │  ┌─────────────┐  │ │  - Role changes   │
     │  │ PostgreSQL  │  │ │  - Admin provis.  │
     │  │ + RLS       │  │ │  - Status trans. │
     │  └─────────────┘  │ │  - Assignment    │
     │  ┌─────────────┐  │ │                   │
     │  │ Auth         │  │ │                   │
     │  └─────────────┘  │ │                   │
     │  ┌─────────────┐  │ │                   │
     │  │ Storage     │  │ │                   │
     │  └─────────────┘  │ │                   │
     └───────────────────┘ └───────────────────┘
```

### Request Flow

1. The frontend calls a service function (for example, `complaints.service.create`).
2. For normal reads/writes, the service uses the Supabase client with the publishable key. RLS policies decide what the user is allowed to see or change.
3. For privileged operations (role change, status transition, assignment), the service calls an Edge Function. The Edge Function verifies the caller's role, performs the change with the service role, records history and audit logs, and returns the result.
4. The service returns data or an error to the hook/component, which updates the UI.

### Security Model Overview

- **RLS is the primary guard.** Every protected table has RLS enabled with explicit policies per role and operation. Even if someone bypasses the frontend, the database still enforces access rules.
- **Edge Functions handle privileged writes.** Anything that must not be done by the client directly — promoting users, changing complaint status, assigning complaints — goes through a server-side function that checks authorization.
- **Secrets stay server-side.** The service role key is only used inside Edge Functions. It is never placed in a `VITE_` variable or shipped to the browser.
- **No insecure default admin credentials.** The first administrator is provisioned through a documented, manual, one-time procedure (see First Administrator Provisioning).

## Components and Interfaces

This section describes the frontend structure, key components, their responsibilities, and the service interfaces they consume.

### Frontend Directory Structure

```
src/
  components/
    ui/              # shadcn/ui primitives (Button, Card, Dialog, Table, Badge, etc.)
    layout/          # AppLayout, Sidebar, TopNav, ProtectedRoute, RoleGuard
    dashboard/       # StatCard, StatusBadge, PriorityBadge
    complaints/      # ComplaintCard, ComplaintTable, ComplaintForm, StatusTimeline
    forms/           # FormField, ImageUpload, ImagePreview
    notifications/    # NotificationList, NotificationBell, NotificationItem
    charts/          # StatusChart, CategoryChart
  pages/
    auth/            # Login, Register, ForgotPassword, ResetPassword
    dashboard/       # AdminDashboard, ResidentDashboard, StaffDashboard
    complaints/      # SubmitComplaint, MyComplaints, AllComplaints, ComplaintDetails
    maintenance/     # AssignedToMe, MaintenanceTeam
    reports/         # ReportsAnalytics
    settings/        # Categories, Settings, Profile, AccessDenied, NotFound
  hooks/
    useAuth.ts       # Current user, role, session state
    useComplaints.ts # Complaint queries and mutations
    useNotifications.ts # Notification queries and mutations
    useTheme.ts      # Dark mode toggle
  contexts/
    AuthContext.tsx   # Auth provider wrapping Supabase session
    ThemeContext.tsx  # Theme provider for dark mode
  lib/
    supabase.ts       # Supabase client initialization + env validation
    utils.ts          # cn() helper, date formatting, misc utilities
    validation.ts     # Zod schemas for all forms
  services/
    auth.service.ts       # signUp, signIn, signOut, resetPassword
    complaints.service.ts # CRUD, search, filter, status transitions
    assignments.service.ts # Assign, reassign
    notifications.service.ts # List, markRead, markAllRead
    reports.service.ts    # Aggregates, CSV export
  types/
    database.types.ts  # Types matching database schema (generated or manual)
    index.ts           # Shared types (Role, Status, Priority, etc.)
  routes/
    index.tsx          # Route definitions
    guards.tsx         # ProtectedRoute, RoleGuard components
```

### Routing and Route Guards

```typescript
// routes/index.tsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/forgot-password" element={<ForgotPassword />} />
  <Route path="/reset-password" element={<ResetPassword />} />

  <Route element={<ProtectedRoute />}>
    <Route element={<AppLayout />}>
      <Route path="/dashboard" element={<RoleDashboard />} />
      <Route path="/complaints" element={<AllComplaints />} />
      <Route path="/complaints/my" element={<MyComplaints />} />
      <Route path="/complaints/new" element={<SubmitComplaint />} />
      <Route path="/complaints/:id" element={<ComplaintDetails />} />
      <Route path="/assigned" element={<RoleGuard roles={['maintenance_staff','administrator']}><AssignedToMe /></RoleGuard>} />
      <Route path="/categories" element={<RoleGuard roles={['administrator']}><Categories /></RoleGuard>} />
      <Route path="/maintenance-team" element={<RoleGuard roles={['administrator']}><MaintenanceTeam /></RoleGuard>} />
      <Route path="/reports" element={<RoleGuard roles={['administrator']}><ReportsAnalytics /></RoleGuard>} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/settings" element={<Settings />} />
    </Route>
  </Route>

  <Route path="/access-denied" element={<AccessDenied />} />
  <Route path="*" element={<NotFound />} />
</Routes>
```

`ProtectedRoute` checks for an active Supabase session and redirects to `/login` if absent. `RoleGuard` checks the user's role and redirects to `/access-denied` if unauthorized. Both guards are backed by RLS at the data layer, so a user who somehow reaches a restricted page still cannot read or write data they are not allowed to access.

### State Management

- **AuthContext** wraps the app. It subscribes to `supabase.auth.onAuthStateChange` and exposes `user`, `profile`, `role`, and `loading`.
- **Server state** is fetched through the service layer using Supabase client queries. Custom hooks (`useComplaints`, `useNotifications`) manage loading, error, and data state. A lightweight query cache via `@tanstack/react-query` can be added if needed, but is not required for the initial implementation.
- **ThemeContext** manages dark mode. The choice is persisted to `localStorage` and applied through Tailwind's `dark:` classes.

### Color System

| Semantic | Tailwind token | Usage |
|----------|---------------|-------|
| Primary nav | Navy blue | Sidebar background |
| Primary action | Royal blue | Buttons, active elements |
| Background | White / light gray | Page backgrounds, cards |
| Info accent | Cyan | Informational badges, icons |
| Resolved | Green | Resolved status badges |
| Pending | Amber | Pending status badges |
| Critical / Overdue | Red | Critical priority, overdue badges |

### Layout Components

| Component | Responsibility |
|-----------|--------------|
| `AppLayout` | Root layout with sidebar + top nav + content area |
| `Sidebar` | Collapsible navigation menu, role-filtered items |
| `TopNav` | Global search, notification bell, profile menu, theme toggle |
| `ProtectedRoute` | Redirects unauthenticated users to login |
| `RoleGuard` | Redirects unauthorized roles to access-denied |

### Shared UI Components (shadcn/ui based)

| Component | Responsibility |
|-----------|--------------|
| `Button` | Primary action buttons with royal blue variant |
| `Card` | Rounded card container with subtle shadow |
| `Dialog` | Modal dialogs for confirmations and forms |
| `Table` | Sortable, paginated data tables |
| `Badge` | Status and priority color-coded badges |
| `Toast` (Sonner) | Success and error notifications |
| `DropdownMenu` | Profile menu, row action menus |
| `Skeleton` | Loading states |

### Domain Components

| Component | Responsibility |
|-----------|--------------|
| `StatCard` | Dashboard metric card with label, value, icon |
| `ComplaintCard` | Compact complaint summary for lists |
| `ComplaintTable` | Sortable table with filters and pagination |
| `ComplaintForm` | Submit/edit complaint form with Zod validation |
| `StatusTimeline` | Visual history of status changes |
| `StatusBadge` | Color-coded status indicator |
| `PriorityBadge` | Color-coded priority indicator |
| `ImageUpload` | Image upload with preview and validation |
| `NotificationBell` | Unread count badge, dropdown preview |
| `NotificationList` | Full notification center with mark-read actions |
| `AssignmentPanel` | Staff list with specializations and workloads |
| `StatusChart` | Recharts chart for status distribution |
| `CategoryChart` | Recharts chart for complaints by category |
| `FiltersBar` | Date range, category, priority, status filters |
| `SearchBar` | Global complaint search input |
| `EmptyState` | Illustrated empty state with action CTA |
| `ErrorState` | Error message with retry action |
| `LoadingState` | Skeleton or spinner |

Note: FixTrack Phase 1 provides only basic charts (status distribution and category distribution). Advanced charts such as monthly trends, location distribution, and staff performance are deferred features.

### Service Interfaces

```typescript
// auth.service.ts
interface AuthService {
  signUp(email: string, password: string, fullName: string): Promise<Session>;
  signIn(email: string, password: string): Promise<Session>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  updatePassword(newPassword: string): Promise<void>;
}

// complaints.service.ts
interface ComplaintsService {
  create(input: ComplaintCreateInput): Promise<Complaint>;
  getById(id: string): Promise<Complaint | null>;
  list(params: ComplaintQueryParams): Promise<PaginatedResult<Complaint>>;
  updateStatus(id: string, newStatus: string, reason?: string): Promise<Complaint>;
  search(query: string, filters: ComplaintFilters): Promise<Complaint[]>;
}

// assignments.service.ts
interface AssignmentsService {
  assign(complaintId: string, staffId: string, reason?: string): Promise<void>;
  reassign(complaintId: string, staffId: string, reason: string): Promise<void>;
  getStaffWithWorkload(): Promise<StaffWithWorkload[]>;
}

// notifications.service.ts
interface NotificationsService {
  list(): Promise<Notification[]>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
  getUnreadCount(): Promise<number>;
}

// reports.service.ts
interface ReportsService {
  getOverviewStats(): Promise<DashboardStats>;
  getStatusDistribution(dateRange?: DateRange): Promise<StatusCounts>;
  getCategoryDistribution(dateRange?: DateRange): Promise<CategoryCount[]>;
  getOverdueComplaints(): Promise<Complaint[]>;
  exportCsv(params: CsvExportParams): Promise<Blob>;
}
```

Note: Assignment in Phase 1 is manual only. The `AssignmentsService` exposes `getStaffWithWorkload` to show staff specialization and current workload so an administrator can pick, but it does not produce automated recommendations. The smart assignment recommendation engine is a deferred feature.

### Form Validation with Zod

All form inputs are validated with Zod schemas before submission.

```typescript
// lib/validation.ts (representative)
export const complaintSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category_id: z.string().uuid('Please select a category'),
  building: z.string().min(1, 'Building is required'),
  location: z.string().min(1, 'Location is required'),
  floor: z.string().optional(),
  room_number: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
});
```

## Data Models

This section defines the database schema, entity relationships, database functions, triggers, and Row Level Security policies.

### Entity Relationships

```
auth.users (Supabase managed)
    │
    ├── 1:1 ── profiles
    │           │
    │           ├── 1:1 ── maintenance_staff   (staff-specific fields)
    │           │
    │           ├── 1:N ── complaints (submitted_by)
    │           ├── 1:N ── complaint_attachments (uploaded_by)
    │           ├── 1:N ── complaint_comments (author_id)
    │           ├── 1:N ── complaint_status_history (changed_by)
    │           ├── 1:N ── complaint_assignments (assigned_by / assigned_to)
    │           ├── 1:N ── notifications (recipient_id)
    │           └── 1:N ── audit_logs (actor_id)
    │
    ├── complaint_categories
    │           └── 1:N ── complaints (category_id)
    │
    └── complaints
                ├── 1:N ── complaint_attachments
                ├── 1:N ── complaint_comments
                ├── 1:N ── complaint_status_history
                ├── 1:N ── complaint_assignments
                └── 1:N ── complaint_feedback
```

### Design Note: maintenance_staff Table

The simplified requirements glossary mentions that staff specialization and department can be stored as fields on the Profile record. For cleaner separation of concerns, FixTrack keeps a separate `maintenance_staff` table as a 1:1 extension of `profiles`. This holds staff-specific fields (`staff_code`, `department`, `specialization`, `employment_status`) so the base `profiles` table stays simple for residents and administrators. This matches the explicit list of core tables requested for the implementation.

### Table Definitions

All tables use UUID primary keys, foreign keys, check constraints, timestamps, and indexes where useful. Migrations live under `supabase/migrations/`.

#### profiles

```sql
CREATE TABLE public.profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name       TEXT NOT NULL,
    phone           TEXT,
    avatar_url      TEXT,
    role            TEXT NOT NULL DEFAULT 'resident'
                    CHECK (role IN ('resident', 'maintenance_staff', 'administrator')),
    account_status  TEXT NOT NULL DEFAULT 'active'
                    CHECK (account_status IN ('active', 'suspended', 'deactivated')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- A trigger on `auth.users` INSERT creates the matching `profiles` row with `role = 'resident'`.
- `updated_at` is maintained by a trigger function.

#### maintenance_staff

```sql
CREATE TABLE public.maintenance_staff (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id          UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    staff_code          TEXT NOT NULL UNIQUE,
    department          TEXT,
    specialization      TEXT,
    employment_status   TEXT NOT NULL DEFAULT 'active'
                        CHECK (employment_status IN ('active', 'on_leave', 'inactive')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- One row per maintenance staff profile (`profile_id` is unique).
- `employment_status` is used to check eligibility for assignment (only `active` staff can be assigned).

#### complaint_categories

```sql
CREATE TABLE public.complaint_categories (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name              TEXT NOT NULL UNIQUE,
    description       TEXT,
    default_priority  TEXT NOT NULL DEFAULT 'medium'
                      CHECK (default_priority IN ('low', 'medium', 'high', 'critical')),
    active            BOOLEAN NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- Deactivating a category sets `active = false`. The row is retained so historical complaints still reference it.

#### complaints

```sql
CREATE TABLE public.complaints (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_number  TEXT NOT NULL UNIQUE,
    title             TEXT NOT NULL,
    description       TEXT NOT NULL,
    category_id       UUID NOT NULL REFERENCES public.complaint_categories(id),
    location          TEXT NOT NULL,
    building          TEXT NOT NULL,
    floor             TEXT,
    room_number       TEXT,
    priority          TEXT NOT NULL DEFAULT 'medium'
                      CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'assigned', 'in_progress', 'resolved', 'reopened', 'cancelled')),
    submitted_by      UUID NOT NULL REFERENCES public.profiles(id),
    assigned_to       UUID REFERENCES public.profiles(id),
    submitted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    due_at            TIMESTAMPTZ,
    resolved_at       TIMESTAMPTZ,
    resolution_notes  TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_complaints_status ON public.complaints(status);
CREATE INDEX idx_complaints_priority ON public.complaints(priority);
CREATE INDEX idx_complaints_category_id ON public.complaints(category_id);
CREATE INDEX idx_complaints_submitted_by ON public.complaints(submitted_by);
CREATE INDEX idx_complaints_assigned_to ON public.complaints(assigned_to);
CREATE INDEX idx_complaints_submitted_at ON public.complaints(submitted_at);
CREATE INDEX idx_complaints_due_at ON public.complaints(due_at);
```

- `complaint_number` is generated by a database trigger using a sequence.
- `due_at` (the deadline) is calculated at submission time from the SLA target for the complaint's priority. It is not recalculated if priority changes later (advanced recalculation is deferred).

#### complaint_attachments

```sql
CREATE TABLE public.complaint_attachments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id     UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    uploaded_by      UUID NOT NULL REFERENCES public.profiles(id),
    storage_path     TEXT NOT NULL,
    file_name        TEXT NOT NULL,
    content_type     TEXT,
    file_size        BIGINT,
    attachment_type  TEXT NOT NULL DEFAULT 'evidence'
                     CHECK (attachment_type IN ('evidence', 'progress', 'resolution')),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attachments_complaint_id ON public.complaint_attachments(complaint_id);
```

- Files are stored in private Supabase Storage. Only the `storage_path` and metadata live in this table.
- `attachment_type` distinguishes the initial evidence uploaded by a resident from progress/resolution images uploaded by maintenance staff.

#### complaint_comments

```sql
CREATE TABLE public.complaint_comments (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id  UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    author_id     UUID NOT NULL REFERENCES public.profiles(id),
    comment       TEXT NOT NULL,
    visibility    TEXT NOT NULL DEFAULT 'public'
                  CHECK (visibility IN ('public', 'internal')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_complaint_id ON public.complaint_comments(complaint_id);
```

- `visibility = 'public'` comments are visible to authorized complaint participants.
- `visibility = 'internal'` notes are restricted to administrators and maintenance staff.

#### complaint_status_history

```sql
CREATE TABLE public.complaint_status_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id    UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    previous_status  TEXT CHECK (previous_status IN ('pending', 'assigned', 'in_progress', 'resolved', 'reopened', 'cancelled')),
    new_status       TEXT NOT NULL CHECK (new_status IN ('pending', 'assigned', 'in_progress', 'resolved', 'reopened', 'cancelled')),
    changed_by       UUID NOT NULL REFERENCES public.profiles(id),
    reason           TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_status_history_complaint_id ON public.complaint_status_history(complaint_id);
```

- This table is append-only. RLS prevents UPDATE and DELETE by any role.

#### complaint_assignments

```sql
CREATE TABLE public.complaint_assignments (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id          UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    assigned_to           UUID NOT NULL REFERENCES public.profiles(id),
    assigned_by           UUID NOT NULL REFERENCES public.profiles(id),
    previous_assignee_id  UUID REFERENCES public.profiles(id),
    reason                TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assignments_complaint_id ON public.complaint_assignments(complaint_id);
CREATE INDEX idx_assignments_assigned_to ON public.complaint_assignments(assigned_to);
```

- Each assignment or reassignment is a new row, so the full assignment history is preserved.
- `previous_assignee_id` and `reason` are recorded on reassignment.

#### notifications

```sql
CREATE TABLE public.notifications (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    complaint_id       UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
    notification_type  TEXT NOT NULL CHECK (notification_type IN (
        'complaint_submitted', 'assigned', 'reassigned', 'work_started',
        'public_comment', 'resolved', 'reopening_requested', 'overdue'
    )),
    title              TEXT NOT NULL,
    message            TEXT NOT NULL,
    is_read            BOOLEAN NOT NULL DEFAULT false,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at            TIMESTAMPTZ
);

CREATE INDEX idx_notifications_recipient_id ON public.notifications(recipient_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
```

- Notifications are in-app only in Phase 1. Email integration is a deferred feature.

#### complaint_feedback

```sql
CREATE TABLE public.complaint_feedback (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id       UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    submitted_by       UUID NOT NULL REFERENCES public.profiles(id),
    rating             INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback           TEXT,
    reopening_reason   TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_feedback_complaint_id ON public.complaint_feedback(complaint_id);
```

- Stores a complainant's rating and feedback after resolution, plus the reason when a complainant requests reopening.

#### system_settings

```sql
CREATE TABLE public.system_settings (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key    TEXT NOT NULL UNIQUE,
    setting_value  TEXT NOT NULL,
    updated_by     UUID REFERENCES public.profiles(id),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- Stores SLA targets as key-value pairs: `sla_critical_hours`, `sla_high_hours`, `sla_medium_hours`, `sla_low_hours`.
- Phase 1 stores SLA targets in the database but does not provide a full settings management UI. A basic admin operation updates these values and writes an audit log.

#### audit_logs

```sql
CREATE TABLE public.audit_logs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id      UUID REFERENCES public.profiles(id),
    action        TEXT NOT NULL,
    entity_type   TEXT NOT NULL,
    entity_id     UUID,
    old_values    JSONB,
    new_values    JSONB,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity_type_entity_id ON public.audit_logs(entity_type, entity_id);
```

- This table is append-only. RLS allows INSERT by the service role (from Edge Functions/triggers) and SELECT by administrators only.
- Phase 1 records audit logs but provides no dedicated audit log management UI (deferred).

### Database Functions and Triggers

#### Complaint Number Generation

```sql
CREATE SEQUENCE public.complaint_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_complaint_number()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT := to_char(now(), 'YYYY');
    seq_val BIGINT := nextval('public.complaint_number_seq');
BEGIN
    -- Format: CMP-YYYY-0001 (zero-padded to 4 digits)
    RETURN 'CMP-' || year_part || '-' || lpad(seq_val::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;
```

A `BEFORE INSERT` trigger on `complaints` calls this function to set `complaint_number`, and also sets `due_at` by adding the SLA target hours (from `system_settings`) to `submitted_at`. A unique constraint on `complaint_number` guarantees uniqueness.

#### Status History Trigger

An `AFTER UPDATE` trigger on `complaints` inserts a row into `complaint_status_history` whenever `status` changes, recording the previous status, new status, the acting user (from `auth.uid()`), the timestamp, and an optional reason.

#### updated_at Trigger

A generic trigger function sets `updated_at = now()` on any UPDATE for tables that have the column.

#### Profile Creation Trigger

A trigger on `auth.users` INSERT creates the matching `profiles` row with `role = 'resident'` and `account_status = 'active'`, so self-registered users always start as residents.

### Row Level Security Policies

RLS is enabled on every protected table. A helper function reads the caller's role:

```sql
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
    r TEXT;
BEGIN
    SELECT role INTO r FROM public.profiles WHERE id = auth.uid();
    RETURN r;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Below is the policy strategy per table.

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| profiles | Own row or admin | Trigger creates on signup | Own row or admin (server-side) | Admin only (server-side) |
| maintenance_staff | Self or admin | Admin (server-side) | Admin (server-side) | Admin (server-side) |
| complaint_categories | All authenticated | Admin (server-side) | Admin (server-side) | Admin (server-side) |
| complaints | Resident: own; Staff: assigned; Admin: all | Authenticated residents | Server-side via Edge Function | Admin (server-side) |
| complaint_attachments | Per complaint access rules | Per complaint access rules | — | Admin (server-side) |
| complaint_comments | Public: participants; Internal: admin+staff | Participants | Author only | Admin (server-side) |
| complaint_status_history | Per complaint access rules | Trigger / server-side only | — | — |
| complaint_assignments | Per complaint access rules | Server-side only | — | — |
| notifications | Own only | Server-side / triggers | Own (mark read) | — |
| complaint_feedback | Per complaint access rules | Complainant | — | — |
| system_settings | Admin | Admin (server-side) | Admin (server-side) | — |
| audit_logs | Admin only | Service role (triggers/Edge Functions) | — | — |

Representative policy examples:

```sql
-- Complaints: residents see only their own; staff see assigned; admins see all
CREATE POLICY "residents_select_own_complaints"
ON public.complaints FOR SELECT
TO authenticated
USING (
    submitted_by = auth.uid()
    OR public.get_user_role() = 'administrator'
    OR (public.get_user_role() = 'maintenance_staff' AND assigned_to = auth.uid())
);

-- Notifications: a user can only read their own
CREATE POLICY "users_select_own_notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (recipient_id = auth.uid());

-- Complaint status history is append-only (no UPDATE/DELETE)
-- No UPDATE or DELETE policies are created for it.
```

### Privileged Operations via Edge Functions

Operations that need the service role and cannot be safely expressed in RLS:

1. **Role changes** (`change-user-role`): An administrator changes a user's role. The function verifies the caller is an admin, updates `profiles.role`, and writes an audit log.
2. **First admin provisioning** (`promote-first-admin`): A bootstrap function that promotes the first user, or follows a documented manual SQL procedure (see First Administrator Provisioning).
3. **Status transitions** (`update-complaint-status`): Validates the transition against the allowed matrix, checks the caller's role is authorized for that transition, updates the complaint status, creates the status history record, and sends notifications.
4. **Assignment** (`assign-complaint`): Validates the selected staff member is active and eligible, updates `assigned_to`, creates the assignment record, transitions the status if needed, notifies the staff member, and writes an audit log.

### Status Transition Matrix

The `update-complaint-status` Edge Function enforces this allowed transition set. Each transition is also restricted by role.

```
pending    → assigned, cancelled
assigned   → in_progress, pending
in_progress → resolved, assigned, cancelled
resolved   → reopened
reopened   → assigned, in_progress, cancelled
cancelled  → (terminal)
```

| Transition | Allowed roles |
|------------|--------------|
| pending → assigned | Administrator |
| pending → cancelled | Administrator |
| assigned → in_progress | Maintenance Staff |
| assigned → pending (unassign) | Administrator |
| in_progress → resolved | Maintenance Staff (requires resolution_notes) |
| in_progress → assigned (reassign) | Administrator |
| in_progress → cancelled | Administrator |
| resolved → reopened | Resident (requires reason) |
| reopened → assigned | Administrator |
| reopened → in_progress | Maintenance Staff |
| reopened → cancelled | Administrator |

Residents may only request reopening. They cannot arbitrarily change status. Any unauthorized transition is rejected.

### SLA and Overdue Detection

Default SLA targets (stored in `system_settings`):

| Priority | SLA target |
|----------|-----------|
| Critical | 4 hours |
| High | 24 hours |
| Medium | 72 hours |
| Low | 7 days (168 hours) |

- **Deadline calculation** happens once, at submission time: `due_at = submitted_at + sla_hours[priority]`. This is done server-side (trigger) so it cannot be tampered with from the client. Recalculation after a priority change is a deferred feature.
- **Overdue detection** is an on-demand server-side query. A complaint is overdue when `due_at < now()` AND `status NOT IN ('resolved', 'cancelled')`. The frontend shows overdue badges, elapsed time beyond the deadline, dashboard alerts, and an overdue filter. Scheduled proactive reminders are a deferred feature.

### Key Workflows

#### Complaint Submission Flow

```
Resident fills form → Zod validation → Image upload to private Storage
→ INSERT into complaints (trigger generates complaint_number, sets due_at, creates initial status history)
→ Redirect to /complaints/:id
→ Error: show toast, keep form data
```

#### Status Transition Flow

```
User requests transition → Edge Function validates:
  1. Is the transition allowed? (check transition matrix)
  2. Is the user's role authorized for this transition? (check role table)
→ If valid: UPDATE complaint status, INSERT status_history, send notification, write audit log
→ If invalid: return error with reason
→ Frontend updates UI, shows toast
```

#### Assignment Flow (manual)

```
Admin opens assignment panel → View active staff with specializations and current workloads
→ Admin picks a staff member → Edge Function validates eligibility
→ UPDATE assigned_to, INSERT assignment record → Transition status to assigned if needed
→ Notify staff → Write audit log
```

#### Overdue Detection Flow

```
On dashboard load: query complaints WHERE due_at < now() AND status NOT IN ('resolved', 'cancelled')
→ Display overdue badges and counts
(No scheduled cron job in Phase 1; overdue is detected on demand.)
```

#### Resolution Verification Flow

```
Staff sets status to resolved (requires resolution_notes) →
Edge Function validates + records → Notify complainant →
Complainant views complaint → Confirms resolution OR requests reopening with reason
→ If reopening: status → reopened, notify admin → Admin reassigns
```

### First Administrator Provisioning

The README documents one of the following safe methods. No insecure default administrator credentials are ever created.

1. **Supabase Dashboard SQL**: After creating an account via the registration page, the project owner runs a one-time SQL statement in the Supabase SQL Editor:
   ```sql
   UPDATE public.profiles SET role = 'administrator'
   WHERE id = '<your-auth-user-id>';
   ```
2. **Bootstrap Edge Function**: A `promote-first-admin` function that allows promotion only when no administrator exists yet, preventing privilege escalation once the first admin is set.

### Environment Configuration

#### .env.example

```dotenv
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

The Supabase client initialization in `lib/supabase.ts` checks that both variables are present. If they are missing, the application displays a configuration error screen with setup instructions instead of crashing silently.

No `VITE_` variable ever contains a service role key. Edge Functions use `SUPABASE_SERVICE_ROLE_KEY` from Edge Function environment secrets, which are never exposed to the browser.


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

FixTrack contains several pure functions whose correctness can be verified with property-based testing: the complaint number formatter, the Zod complaint form schema, the status transition state machine, the SLA deadline/overdue calculation, and the CSV escaping function. The properties below cover these. Criteria that depend on Supabase Auth, RLS, Storage, or Edge Function orchestration are verified with integration and security tests instead, as noted in the Testing Strategy.

### Property 1: Complaint Number Format

*For any* sequence value produced by `complaint_number_seq`, the generated Complaint_Number SHALL match the format `CMP-YYYY-NNNN`, where `YYYY` is the current four-digit year and `NNNN` is the sequence value zero-padded to four digits. Furthermore, for any two sequence values `a < b`, the generated number for `b` SHALL be lexicographically greater than the number for `a` (within the same year), and the number SHALL be unique.

**Validates: Requirements 5.1, 5.2**

### Property 2: Complaint Form Validation

*For any* complaint form input:

- A submission missing any required field (title, description, category_id, building, location, priority) SHALL fail Zod validation with a message identifying the missing field.
- A submission omitting optional fields (floor, room_number, images) SHALL still pass validation.
- The `priority` field SHALL accept only the values `low`, `medium`, `high`, `critical`; any other value SHALL fail validation.
- A title or description below its minimum length SHALL fail validation, while a value at or above the minimum SHALL pass.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 9.2**

### Property 3: Status Transition Validity and History

*For any* complaint in a current status `S` and any requested target status `T`:

- If `(S -> T)` is in the allowed transition matrix, the transition function SHALL accept it and the complaint's new status SHALL equal `T`.
- If `(S -> T)` is not in the allowed matrix, the transition function SHALL reject it and the complaint's status SHALL remain `S`.
- For any accepted transition, exactly one new `complaint_status_history` row SHALL exist with `previous_status = S`, `new_status = T`, the acting user, and a timestamp.
- **Invariant**: After any accepted transition, the complaint's current status SHALL equal the `new_status` of its most recent history row.

**Validates: Requirements 9.1, 9.4, 9.5**

### Property 4: SLA Deadline Calculation and Overdue Detection

*For any* submission timestamp `submitted_at` and priority `p`:

- The deadline SHALL equal `submitted_at` plus the configured SLA hours for `p` (Critical 4h, High 24h, Medium 72h, Low 168h).
- A complaint SHALL be overdue if and only if `now() > due_at` AND `status NOT IN ('resolved', 'cancelled')`.
- Calculating the deadline for the same input twice SHALL produce the same result (idempotence).

(Phase 1 calculates the deadline once at submission time. Recalculation after a priority change is a deferred feature and is not covered by this property.)

**Validates: Requirements 11.2, 11.4**

### Property 5: CSV Escaping Round Trip

*For any* string value (including values containing commas, double quotes, newlines, or tabs):

- The escaped output SHALL wrap the value in double quotes when it contains a comma, double quote, newline, or tab, and SHALL escape internal double quotes by doubling them.
- Parsing a properly escaped CSV row SHALL recover the original value (round trip).
- The CSV export SHALL include exactly the authorized rows matching the active filters, and no others (metamorphic: row set equals the authorized filtered set).

(Phase 1 implements basic comma, quote, and newline escaping only. Advanced spreadsheet formula injection protection is a deferred feature and is not covered by this property.)

**Validates: Requirements 16.3, 16.4**

## Error Handling

The application handles errors at multiple layers to keep the user informed and avoid false success indications.

### Frontend Error Handling

| Scenario | Handling |
|----------|---------|
| Network or Supabase request failure | Display error toast via Sonner, keep form data, show retry option |
| Missing environment variables | Display configuration error screen with setup instructions |
| Unauthorized route access | Redirect to Access Denied page |
| Empty data state | Display EmptyState component with a relevant CTA |
| Form validation error | Inline field error messages, prevent submission |
| Image upload failure | Display error on the upload component, allow retry |
| Session expired | Redirect to login with a message |

### Backend Error Handling

| Scenario | Handling |
|----------|---------|
| Invalid status transition | Edge Function returns a structured error with a reason code |
| Unauthorized role change | Edge Function returns 403 with a reason |
| Assignment to inactive staff | Edge Function returns a validation error |
| Database constraint violation | RLS/constraint error caught and mapped to a user message |
| Duplicate complaint submission | Prevented by submission debounce and database constraints |
| Upload size/type violation | Rejected by storage policy and client validation |

### Error Response Contract

Edge Functions return a consistent error shape:

```typescript
interface ErrorResponse {
  error: {
    code: string;       // Machine-readable: 'INVALID_TRANSITION', 'UNAUTHORIZED', etc.
    message: string;     // Human-readable explanation
  };
}
```

The frontend service layer catches these and maps `code` to appropriate user-facing messages.

## Testing Strategy

FixTrack uses a beginner-friendly dual approach: unit tests for specific examples and edge cases, and property-based tests for universal behavior. Integration tests cover Supabase Auth, RLS, Storage, and Edge Functions. The goal is verifiable correctness, not exhaustive coverage.

### Unit Tests (Vitest)

Pure functions extracted from the service and utility layers:

- SLA deadline calculation and overdue detection (Property 4)
- Status transition validation (Property 3)
- Complaint number formatting (Property 1)
- Zod complaint form schema validation (Property 2)
- CSV escaping (Property 5)
- Date formatting helpers

Unit tests also cover specific examples and edge cases:
- Resolving a complaint without resolution_notes is rejected (Req 13.4)
- Requesting reopening without a reason is rejected (Req 13.6)
- Missing environment variables show a configuration error (Req 21.3)
- Logout redirects to login (Req 1.5)
- RoleGuard redirects unauthorized users to Access Denied (Req 3.5)
- Unknown route shows the 404 page (Req 3.6)

### Property-Based Tests (fast-check + Vitest)

Properties 1-5 in this document, implemented with `fast-check` generators:

- Arbitraries for complaint status, priority, and transition pairs (Properties 2, 3)
- Arbitraries for timestamps, priorities, and SLA target hours (Property 4)
- Arbitraries for arbitrary strings including commas, quotes, and newlines (Property 5)
- Arbitraries for sequence values and years (Property 1)

Each property-based test runs a minimum of 100 iterations. Each test is tagged with a comment referencing its design property, using the format:

```
// Feature: fixtrack-complaint-tracker, Property 1: Complaint Number Format
```

### Integration Tests (Vitest + Supabase local or test project)

- **Authentication**: registration, login, logout, password reset, session persistence (Req 1, 2.1)
- **Role protection**: self-promotion rejected; residents cannot change others' roles (Req 2.2, 2.3)
- **RLS**: direct database/API queries verifying role-based access for each table (Req 19)
- **Complaint CRUD**: submission with image upload, retrieval, update (Req 6, 7)
- **Status transitions** via Edge Functions (Req 9)
- **Assignment** via Edge Functions, including rejection of inactive staff (Req 10)
- **Comments and resolution**: public/internal visibility, resolve/reopen flow (Req 13)
- **Notifications**: generation on events and read permissions (Req 12)
- **Dashboards**: metrics compared with direct database counts (Req 14.4)
- **Reports and CSV export**: aggregates match the database; CSV contains only authorized rows matching filters; residents' CSV lacks internal notes (Req 16)
- **Security**: residents cannot access other residents' complaints; users cannot self-promote (Req 20.3)

### Smoke Tests

- Migrations apply and default categories/SLA targets are seeded (Req 4, 8.1, 11.1)
- `.env.example` exists with the correct public keys and no service role key (Req 21.1, 21.2)
- Required pages exist (Req 17.1)
- First-admin provisioning method is documented and no insecure default credentials exist (Req 2.4, 19.6)

### Build and Type Checks

- `tsc --noEmit` for TypeScript type checking
- ESLint for linting
- `vite build` for the production build
- Responsive layout testing (manual: desktop, tablet, mobile breakpoints)

### Honest Reporting

Per Requirement 20.5, the project reports honestly what is implemented, what builds, and which tests passed. Tests are run with single execution (`vitest --run`) rather than watch mode during verification.

## Constraints and Assumptions

- Supabase project must be provisioned by the developer; credentials are not bundled.
- Email integration is not part of Phase 1; the application works fully with in-app notifications only.
- Scheduled proactive reminders are deferred; overdue detection works on demand at dashboard load.
- Assignment is manual in Phase 1; the smart recommendation engine is deferred.
- File uploads are limited to images; file type and size validation is enforced client-side and in storage policies.
- The application targets modern browsers; no legacy browser support is guaranteed.
- The deadline is calculated once at submission time and is not recalculated when priority changes (advanced recalculation is deferred).
