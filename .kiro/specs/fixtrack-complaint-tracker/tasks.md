# Implementation Plan: FixTrack

## Overview

FixTrack is a beginner-friendly, full-stack web application for reporting and tracking maintenance complaints in colleges, hostels, apartments, offices, and residential communities. The frontend is React + TypeScript + Vite with Tailwind CSS and shadcn/ui; the backend is Supabase (PostgreSQL, Auth, Storage, Edge Functions).

This plan converts the simplified Phase 1 design into a series of incremental, code-generation prompts. Each task builds on the previous one and ends with wiring things together so the application stays runnable after every phase. There is no hanging or orphaned code.

Implementation language: **TypeScript** (frontend, Edge Functions) and **SQL** (PostgreSQL migrations). The design document uses concrete TypeScript and SQL, so no language selection is needed.

Scope reminders (deferred features are out of scope for these tasks):

- Manual assignment only — no smart recommendation engine.
- In-app notifications only — no email integration.
- On-demand overdue detection only — no scheduled cron reminders.
- Basic reports/charts only (status distribution + category distribution).
- Basic CSV escaping only (commas, quotes, newlines) — no advanced formula-injection protection.
- No system settings management UI (SLA targets are stored and updatable, but there is no full settings interface).
- No priority-change deadline recalculation (deadline is set once at submission).
- Beginner-friendly Vitest tests only — no fast-check property-based tests.
- The `maintenance_staff` table is kept as a 1:1 extension of `profiles`.

Task status legend: `[ ]` not started, `[~]` in progress, `[x]` completed.

## Tasks

---

## Phase 1: Frontend Project Setup, Layout, and Routing

Build the actual frontend: project scaffolding, dependencies, reusable utilities, layout, routing, route guards, shared UI components, and page shells for all 20 required pages so navigation works end to end.

- [x] 1.1 Initialize Vite + React + TypeScript + Tailwind CSS project
  - Completion: `npm run dev` starts the dev server; `tsc --noEmit` passes; Tailwind utility classes render correctly.
  - Requirements: 18.5, 18.6

- [x] 1.2 Install dependencies (React Router, Lucide React, Recharts, React Hook Form, Zod, Sonner, date-fns, @supabase/supabase-js)
  - Completion: All packages installed and importable; `tsc --noEmit` passes; no TypeScript errors.
  - Requirements: 18.6

- [x] 1.3 Initialize shadcn/ui and add base components (Button, Card, Dialog, Table, Badge, Input, Select, Label, DropdownMenu, Skeleton)
  - Completion: shadcn/ui CLI initialized; base components available and render; Tailwind theme configured with the navy/royal/cyan color tokens.
  - Requirements: 18.1, 18.3

- [x] 1.4 Configure Supabase client in `lib/supabase.ts` with environment validation and create `.env.example`
  - Completion: `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` read from env; missing variables show a configuration error screen instead of crashing; `.env.example` contains only public keys (no service-role key).
  - Requirements: 21.1, 21.2, 21.3

- [x] 1.5 Define TypeScript types in `types/database.types.ts` and `types/index.ts` matching the database schema
  - Completion: Types for all 12 tables defined; Role, Status, and Priority enums exported; `tsc --noEmit` passes.
  - Requirements: 4.1, 4.2

- [x] 1.6 Create utility functions in `lib/utils.ts` (`cn` helper, date formatting with date-fns, basic CSV escaping)
  - Completion: `cn()` merges Tailwind classes; date formatters work; CSV escape wraps values containing commas, quotes, or newlines in double quotes and doubles internal quotes.
  - Requirements: 16.4, 18.6

- [x] 1.7 Create Zod validation schemas in `lib/validation.ts`
  - Completion: Schemas for complaint submission, registration, login, password reset, category, feedback, and comment forms; required vs optional fields correctly modeled.
  - Requirements: 6.1, 6.2, 6.3, 6.4, 9.2

- [x] 1.8 Create ThemeContext with dark mode toggle
  - Completion: ThemeContext persists choice to localStorage; dark mode toggle in top nav works; Tailwind `dark:` classes apply.
  - Requirements: 18.4

- [x] 1.9 Create AppLayout with collapsible sidebar and top navigation
  - Completion: Sidebar collapses on mobile; top nav has global search, notification bell slot, profile menu slot, and theme toggle; layout renders on desktop, tablet, and mobile breakpoints.
  - Requirements: 18.3, 18.5

- [x] 1.10 Implement role-based sidebar navigation with role filtering
  - Completion: Sidebar shows only items the user's role can access; item sets match Resident, Administrator, and Maintenance Staff navigation requirements.
  - Requirements: 3.1, 3.2, 3.3, 3.4

- [x] 1.11 Create ProtectedRoute and RoleGuard components (with a minimal placeholder AuthContext)
  - Completion: ProtectedRoute redirects unauthenticated users to `/login`; RoleGuard redirects unauthorized roles to `/access-denied`; a minimal AuthContext placeholder is created (Phase 2 wires it to Supabase).
  - Requirements: 1.6, 3.4, 3.5

- [x] 1.12 Define all routes in `routes/index.tsx` and create Access Denied + custom 404 pages
  - Completion: All required pages have route definitions; auth routes are public; protected routes wrapped in guards; catch-all route shows the custom 404 page; Access Denied page renders for unauthorized access.
  - Requirements: 3.5, 3.6, 17.1, 17.2

- [x] 1.13 Create loading, empty, and error state components
  - Completion: LoadingState (skeleton/spinner), EmptyState (illustrated with CTA), and ErrorState (message with retry) are created and reusable.
  - Requirements: 17.3

- [x] 1.14 Create shared domain components (StatusBadge, PriorityBadge, StatCard)
  - Completion: Color-coded badges (green=resolved, amber=pending, red=critical/overdue) with aria labels; StatCard shows label, value, and icon; components are reusable across pages.
  - Requirements: 9.3, 14.1

- [x] 1.15 Create auth page shells (Login, Register, ForgotPassword, ResetPassword)
  - Completion: Four auth page components exist and render inside the layout; forms are placeholders wired to validation schemas; navigation reaches them.
  - Requirements: 17.1

- [x] 1.16 Create dashboard page shells (Administrator, Resident, Maintenance Staff)
  - Completion: Three dashboard page components exist and render; show placeholder StatCards and chart slots; navigation reaches them.
  - Requirements: 17.1

- [x] 1.17 Create complaint page shells (SubmitComplaint, MyComplaints, AllComplaints, ComplaintDetails)
  - Completion: Four complaint page components exist and render; SubmitComplaint has a placeholder form; list pages show placeholder tables; ComplaintDetails shows placeholder sections.
  - Requirements: 17.1

- [x] 1.18 Create admin/maintenance page shells (AssignedToMe, Categories, MaintenanceTeam, ReportsAnalytics)
  - Completion: Four page components exist and render; placeholder content with appropriate access via RoleGuard.
  - Requirements: 17.1

- [x] 1.19 Create user page shells (Notifications, Profile, Settings)
  - Completion: Three page components exist and render; placeholder content; navigation reaches them.
  - Requirements: 17.1

- [ ] Checkpoint — Phase 1: Ensure `tsc --noEmit` and `vite build` pass and sidebar navigation reaches every page. Ask the user if questions arise.

---

## Phase 2: Database, Authentication, and Roles

Create all 12 tables with migrations, constraints, indexes, triggers, and Row Level Security; configure private storage and seed data; then wire real Supabase auth into the pages and document safe first-administrator provisioning.

- [ ] 2.1 Create migration for `profiles` (with auto-create-on-signup trigger and `updated_at` trigger function) and `maintenance_staff` tables
  - Completion: Tables created with UUID keys, role/account_status check constraints; trigger on `auth.users` INSERT creates a `profiles` row with role `resident`; `updated_at` maintained by trigger.
  - Requirements: 4.1, 4.2, 4.4, 2.1, 1.1

- [ ] 2.2 Create migration for `complaint_categories` (with default seed) and `complaints` (with complaint number sequence, generate trigger, and due_at calculation)
  - Completion: `complaint_categories` seeded with 10 defaults; `complaints` has check constraints and indexes; `complaint_number_seq` created; BEFORE INSERT trigger generates `CMP-YYYY-NNNN` and sets `due_at` from SLA target; unique constraint on `complaint_number`.
  - Requirements: 4.1, 4.3, 4.6, 4.7, 5.1, 5.2, 8.1, 11.2

- [ ] 2.3 Create migration for `complaint_attachments` and `complaint_comments` tables
  - Completion: Attachments table has storage_path, file metadata, attachment_type constraint, index on complaint_id; comments table has visibility (`public`/`internal`) constraint and index.
  - Requirements: 4.1, 7.2, 13.1, 13.2

- [ ] 2.4 Create migration for `complaint_status_history` (with status-change trigger) and `complaint_assignments` tables
  - Completion: Status history is append-only with an AFTER UPDATE trigger recording previous/new status, acting user, timestamp, reason; assignments table records assigned_by, previous_assignee_id, reason; indexes created.
  - Requirements: 4.1, 9.4, 10.4

- [ ] 2.5 Create migration for `notifications` and `complaint_feedback` tables
  - Completion: Notifications table has notification_type check, is_read flag, read_at, indexes; feedback table has rating check (1-5), feedback, reopening_reason, index.
  - Requirements: 4.1, 12.1, 13.7

- [ ] 2.6 Create migration for `system_settings` (with default SLA targets seed) and `audit_logs` tables
  - Completion: system_settings has unique setting_key; SLA defaults seeded (critical=4h, high=24h, medium=72h, low=168h); audit_logs has action, entity_type, entity_id, JSONB old/new values, indexes.
  - Requirements: 4.1, 11.1, 11.3

- [ ] 2.7 Implement `get_user_role()` helper and RLS policies for all protected tables
  - Completion: RLS enabled on every protected table; policies defined per role and operation; residents see only their own complaints; staff see only assigned; admins see all; status history and audit logs protected from unauthorized changes.
  - Requirements: 4.8, 19.1, 19.2, 19.3

- [ ] 2.8 Configure private Supabase Storage bucket and storage policies for attachments
  - Completion: Private bucket created for complaint attachments; storage policies enforce that only authorized users can upload and read; service-role key is never browser-accessible.
  - Requirements: 7.2, 7.5, 19.4, 19.5

- [ ] 2.9 Create development seed data in `supabase/seed.sql`
  - Completion: Seed includes sample categories, sample staff, and sample complaints with history; no default admin password; no production personal data.
  - Requirements: 4.9

- [ ] 2.10 Implement AuthContext with Supabase session management (replace the placeholder)
  - Completion: AuthContext subscribes to `onAuthStateChange`; exposes user, profile, role, loading; session persists across reloads; guards and sidebar now reflect the real session.
  - Requirements: 1.2

- [ ] 2.11 Implement auth service module (`auth.service.ts`)
  - Completion: signUp, signIn, signOut, resetPassword, updatePassword implemented and typed; no secrets in client code.
  - Requirements: 1.1, 1.3, 1.4, 1.5

- [ ] 2.12 Wire Registration and Login pages to Supabase
  - Completion: Registration creates an auth account and a `resident` profile via trigger, shows a success toast, and redirects; Login authenticates, persists session, and redirects to the role-appropriate dashboard; errors show toasts.
  - Requirements: 1.1, 1.2, 2.1

- [ ] 2.13 Implement Forgot Password, Reset Password, Logout, and profile menu
  - Completion: Forgot Password sends a recovery email; Reset Password updates the password; Logout terminates the session and redirects to login; profile menu shows logout.
  - Requirements: 1.3, 1.4, 1.5

- [ ] 2.14 Document first administrator provisioning (SQL statement and README section)
  - Completion: A one-time SQL statement to set `role = 'administrator'` is documented; no insecure default admin credentials are ever created.
  - Requirements: 2.4, 19.6

- [ ] Checkpoint — Phase 2: Ensure migrations apply, RLS is enabled, and auth flows (register, login, logout) work. Ask the user if questions arise.

---

## Phase 3: Functional Complaint Management

Implement complaint submission, search/filter/sort/pagination, lists, details with status timeline, public comments and internal notes, and the status transition Edge Function.

- [ ] 3.1 Create complaints service module (`complaints.service.ts`)
  - Completion: `create`, `getById`, and `list` functions implemented and typed; queries respect RLS.
  - Requirements: 6.5, 15.1

- [ ] 3.2 Implement search, filters, sorting, and pagination in the complaints service
  - Completion: Search by complaint number, title, category, status; filters by date range, category, priority, status; sortable columns; pagination with configurable page size; all combine correctly and respect RLS.
  - Requirements: 15.1, 15.2, 15.3

- [ ] 3.3 Build Submit Complaint form with React Hook Form and Zod validation
  - Completion: Required fields validated (title, description, category, building, location, priority); optional fields (floor, room_number) accepted; inline errors displayed; submission loading indicator shown.
  - Requirements: 6.1, 6.2, 6.3, 6.4

- [ ] 3.4 Implement image upload component with preview and validation
  - Completion: File picker with image preview; client-side file type (images only) and size validation; uploads to private Supabase Storage; attachment_type supports evidence and progress.
  - Requirements: 7.1, 7.3, 7.4

- [ ] 3.5 Wire complaint submission to database persistence
  - Completion: Valid complaint inserted; complaint number auto-generated; initial status set to Pending; initial status_history created; due_at calculated; redirect to complaint details on success; error toast on failure with no false success.
  - Requirements: 6.5, 6.6, 6.7, 6.8, 5.1

- [ ] 3.6 Implement duplicate submission prevention
  - Completion: Submit button disabled during submission; debounce prevents rapid double-submit; database constraints enforce integrity.
  - Requirements: 6.9

- [ ] 3.7 Build My Complaints page for residents
  - Completion: Shows only the resident's own complaints (RLS-enforced); displays status badges, priority badges, and complaint numbers; links to complaint details.
  - Requirements: 3.1, 14.2

- [ ] 3.8 Implement StatusTimeline component
  - Completion: Visual history of status changes rendered from `complaint_status_history`; shows previous/new status, acting user, timestamp, and reason.
  - Requirements: 9.9

- [ ] 3.9 Implement public comments
  - Completion: Authorized participants can add public comments; comments visible per RLS policy; timestamps displayed.
  - Requirements: 13.1, 13.3

- [ ] 3.10 Implement internal notes
  - Completion: Administrators and maintenance staff can add internal notes; notes restricted via RLS; residents cannot see internal notes.
  - Requirements: 13.2, 13.3

- [ ] 3.11 Implement status transition Edge Function (`update-complaint-status`)
  - Completion: Validates transition against the allowed matrix; checks role authorization; updates status; creates status_history record; returns a structured error on invalid transition or unauthorized role.
  - Requirements: 9.5, 9.6, 9.7, 9.8

- [ ] 3.12 Build All Complaints page for administrators
  - Completion: Shows all complaints (RLS-enforced for admin); includes search, filters, sorting, and pagination; status and priority badges render.
  - Requirements: 3.2, 15.1, 15.2, 15.3

- [ ] 3.13 Build Complaint Details page
  - Completion: Shows full complaint info, status timeline, attachment gallery, public comments and internal notes based on role, and role/status-appropriate action buttons; attachments served via private storage.
  - Requirements: 6.7, 9.9, 17.1

- [ ] Checkpoint — Phase 3: Ensure complaint submission, lists, details, comments, and status transitions work. Ask the user if questions arise.

---

## Phase 4: Assignment and Maintenance Workflow

Implement manual assignment and reassignment, the Assigned to Me and Maintenance Team pages, and the staff and resident action workflows (start work, resolve, confirm, reopen) with notifications.

- [ ] 4.1 Create assignments service module (`assignments.service.ts`)
  - Completion: `assign`, `reassign`, and `getStaffWithWorkload` functions implemented and typed; staff with inactive employment_status excluded from eligible lists.
  - Requirements: 10.1, 10.2

- [ ] 4.2 Build Assignment panel component
  - Completion: Shows active maintenance staff with specializations, department, and current workload; admin can pick a staff member (manual only, no automated recommendations).
  - Requirements: 10.1

- [ ] 4.3 Implement assignment Edge Function (`assign-complaint`)
  - Completion: Validates staff is active and eligible; updates `assigned_to`; records assignment with previous assignee and reason; transitions status per rules; notifies the assigned staff; writes an audit log.
  - Requirements: 10.3, 10.4

- [ ] 4.4 Wire assign and reassign into the Complaint Details page
  - Completion: Admin can assign and reassign from the details page; the assignment panel and Edge Function are integrated; status and history update correctly.
  - Requirements: 10.3, 10.4

- [ ] 4.5 Build Assigned to Me page for maintenance staff
  - Completion: Shows complaints assigned to the current staff member; organized by priority and deadline; overdue tasks highlighted.
  - Requirements: 3.3, 14.3

- [ ] 4.6 Build Maintenance Team management page for administrators
  - Completion: Lists all maintenance staff with department, specialization, employment status, and workload; admin can add, edit, and deactivate staff records.
  - Requirements: 3.2

- [ ] 4.7 Implement staff start-work and resolution actions
  - Completion: Staff can transition Assigned to In Progress (work started); staff can resolve only with required resolution_notes; resolved_at recorded; status history and notifications created.
  - Requirements: 9.5, 13.4

- [ ] 4.8 Implement resident resolution confirmation and reopening request
  - Completion: Complainant can confirm resolution; complainant can request reopening with a required reason; reopening triggers a notification to admin; status transitions follow the documented rules; unauthorized users rejected.
  - Requirements: 13.5, 13.6, 13.8

- [ ] Checkpoint — Phase 4: Ensure assign/reassign, staff work updates, resolution, confirmation, and reopening work. Ask the user if questions arise.

---

## Phase 5: SLA and Notifications

Implement on-demand overdue detection, the in-app notification center, notification generation triggers, overdue UI, and a basic SLA target update operation.

- [ ] 5.1 Implement overdue detection query (on-demand, server-side)
  - Completion: A complaint is overdue when `due_at < now()` AND status is not Resolved or Cancelled; computed via a database query (not solely frontend timers); exposed to the service layer.
  - Requirements: 11.4

- [ ] 5.2 Create notifications service module (`notifications.service.ts`)
  - Completion: `list`, `markRead`, `markAllRead`, and `getUnreadCount` implemented and typed; users can read/update only their own notifications (RLS).
  - Requirements: 12.1, 12.4

- [ ] 5.3 Build Notification Bell component for top navigation
  - Completion: Shows unread count badge; dropdown preview of recent notifications; links to the full notification center.
  - Requirements: 12.1

- [ ] 5.4 Build Notifications page
  - Completion: Full notification list with timestamps; links to related complaints; mark-as-read and mark-all-as-read actions; users see only their own notifications.
  - Requirements: 12.1, 12.4

- [ ] 5.5 Implement notification generation triggers/functions
  - Completion: Notifications generated for complaint submission, assignment/reassignment, work starting, public comments, resolution, and reopening requests; generated through database triggers or server-side functions.
  - Requirements: 12.2, 12.3

- [ ] 5.6 Implement overdue badges, dashboard alerts, and overdue filter in the UI
  - Completion: Overdue complaints show red badges with elapsed time beyond the deadline; dashboard alert counts include overdue; an overdue filter works on complaint lists.
  - Requirements: 11.5

- [ ] 5.7 Implement SLA target update operation (administrator)
  - Completion: Admin can update SLA targets in `system_settings` through a protected operation; the change is recorded in an audit log; new complaints use the updated targets. No full settings management UI is built.
  - Requirements: 11.3

- [ ] Checkpoint — Phase 5: Ensure overdue detection, the notification center, and notification generation work. Ask the user if questions arise.

---

## Phase 6: Dashboards and Reports

Build the three role dashboards with Recharts, basic reports, and CSV export with basic escaping.

- [ ] 6.1 Create reports service module (`reports.service.ts`)
  - Completion: Overview stats, status distribution, category distribution, overdue list, and CSV export functions implemented and typed; all queries respect role-based RLS.
  - Requirements: 14.4, 16.1, 16.2

- [ ] 6.2 Build Administrator Dashboard
  - Completion: Shows total, pending, assigned, in-progress, resolved, and overdue counts; status and category distribution charts; a recent complaints table; all metrics from real authorized database data.
  - Requirements: 14.1, 14.4

- [ ] 6.3 Build Resident Dashboard
  - Completion: Shows the resident's total, pending, in-progress, and resolved counts; a Submit Complaint action; recent complaints.
  - Requirements: 14.2, 14.4

- [ ] 6.4 Build Maintenance Staff Dashboard
  - Completion: Shows assigned complaints, pending tasks, in-progress tasks, and overdue tasks with priority-based lists and deadlines.
  - Requirements: 14.3, 14.4

- [ ] 6.5 Implement Recharts visualizations
  - Completion: Status distribution chart and category distribution chart render correctly with real data and are responsive. (Advanced charts such as trends and staff performance are deferred.)
  - Requirements: 14.1, 16.2

- [ ] 6.6 Implement CSV export with basic escaping
  - Completion: Exports only authorized records; respects active filters; escapes commas, quotes, and newlines; hides internal notes and sensitive fields from residents in exports.
  - Requirements: 16.3, 16.4, 16.5

- [ ] 6.7 Build Reports and Analytics page
  - Completion: Basic reports for complaints by category, by priority, and overdue complaints; Recharts visualizations; respects RLS.
  - Requirements: 16.1, 16.2

- [ ] 6.8 Document dashboard metric formulas
  - Completion: The metric formulas used on the dashboards (counts, overdue definition) are documented in code comments or a metrics doc and match the database query results.
  - Requirements: 14.5

- [ ] Checkpoint — Phase 6: Ensure dashboards render real data, reports work, and CSV export respects authorization. Ask the user if questions arise.

---

## Phase 7: Security and Testing

Set up Vitest, write beginner-friendly tests for auth, complaint workflows, and security, verify no secrets are exposed, and run linting, type checks, and the production build. (No fast-check property-based tests; use plain Vitest unit and integration tests with specific examples and edge cases.)

- [ ] 7.1 Set up Vitest test runner
  - Completion: Vitest configured; test scripts in `package.json`; `npm run test` (single execution, not watch mode) runs the test suite.
  - Requirements: 20.4

- [ ] 7.2 Write authentication tests
  - Completion: Tests cover registration, login, logout, protected routes, the default resident role on signup, and rejection of unauthorized role changes.
  - Requirements: 20.1

- [ ] 7.3 Write complaint workflow tests
  - Completion: Tests cover submission, assignment, and status transitions (including rejection of invalid transitions).
  - Requirements: 20.2

- [ ] 7.4 Write security tests for RLS
  - Completion: Tests verify residents cannot access other residents' complaints, staff cannot access unassigned complaints, and users cannot self-promote; internal notes and private attachments are protected.
  - Requirements: 20.3, 19.3

- [ ] 7.5 Write unit tests for SLA/overdue, CSV escaping, and form validation
  - Completion: Beginner-friendly Vitest tests with specific examples and edge cases (no fast-check): deadline equals submission plus SLA hours; overdue correctness; resolved/cancelled excluded from overdue; CSV escaping round trip for strings with commas, quotes, and newlines; required-field and length validation; rejection of resolve without notes and reopen without a reason.
  - Requirements: 11.2, 11.4, 16.4, 6.4, 13.4, 13.6

- [ ] 7.6 Verify no secrets are exposed in the browser bundle
  - Completion: Production build inspected; no service-role key or secret in client bundle; `.env.example` has no `VITE_` service-role variable.
  - Requirements: 19.4, 21.2

- [ ] 7.7 Run linting, TypeScript checks, and production build
  - Completion: ESLint passes; `tsc --noEmit` passes; `vite build` succeeds; no build errors.
  - Requirements: 20.4

- [ ] Checkpoint — Phase 7: Ensure all tests pass and the production build succeeds. Ask the user if questions arise.

---

## Phase 8: Local Execution and Documentation

Write beginner-friendly documentation (README, architecture guide, setup and viva guide) and an honest final report of what is implemented, what builds, and what was tested.

- [ ] 8.1 Write README.md
  - Completion: Covers project overview and features, technology stack, prerequisites and installation, environment configuration, Supabase project setup, database migrations and seed data, authentication and role setup, safe first-administrator provisioning, storage configuration, local development and production build, and known limitations.
  - Requirements: 22.1

- [ ] 8.2 Write a beginner-friendly architecture guide
  - Completion: Explains the folder structure, how login works, how a complaint travels from the form to PostgreSQL, how assignment and status changes are authorized and recorded, how RLS protects data, how notifications and SLA deadlines work, and how dashboards retrieve data; describes the actual code, not planned features.
  - Requirements: 22.2

- [ ] 8.3 Write setup instructions and a viva explanation guide
  - Completion: Step-by-step local run instructions (env config, migrations, seed, storage) and a concise guide a student can use to explain the project in a viva; content matches the actual code.
  - Requirements: 22.1, 22.3

- [ ] 8.4 Write the final honest implementation report
  - Completion: Summarizes features implemented, important files and migrations created, tests and commands run with results, required manual Supabase setup, and known limitations; honestly states what builds, what tests passed, and what remains unverified.
  - Requirements: 20.5, 22.3

- [ ] Checkpoint — Phase 8: Ensure documentation describes the actual code and the final report is honest. Ask the user if questions arise.

## Notes

- Each phase should keep the application runnable; run `tsc --noEmit` and `vite build` after each phase to catch errors early.
- Edge Functions and integration tests require a provisioned Supabase project. If credentials are unavailable, implement the frontend and create migration/function files, then document what could not be verified. Never invent Supabase credentials.
- Tests are beginner-friendly Vitest unit and integration tests only — no fast-check property-based tests. Run tests with single execution (`vitest --run`), never watch mode.
- Assignment is manual only; the smart recommendation engine is a deferred feature and is not implemented here.
- Notifications are in-app only; email integration is deferred and not implemented here.
- Overdue detection is on demand; scheduled cron reminders are deferred and not implemented here.
- Reports and charts are basic (status and category distribution) only; advanced analytics are deferred.
- CSV export uses basic escaping (commas, quotes, newlines) only; advanced formula-injection protection is deferred.
- The deadline is calculated once at submission; recalculation after a priority change is deferred.
- The `maintenance_staff` table is intentionally kept as a 1:1 extension of `profiles`.
- Never mark a task complete just because code was written; a task is complete only when its completion criteria are verified.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3", "1.4", "1.5", "1.6", "1.7", "1.8"] },
    { "id": 3, "tasks": ["1.9", "1.11", "1.13", "1.14"] },
    { "id": 4, "tasks": ["1.10", "1.15", "1.16", "1.17", "1.18", "1.19"] },
    { "id": 5, "tasks": ["1.12"] },
    { "id": 6, "tasks": ["2.1", "2.2", "2.3", "2.4", "2.5", "2.6"] },
    { "id": 7, "tasks": ["2.7", "2.8", "2.9", "2.10", "2.11", "2.14"] },
    { "id": 8, "tasks": ["2.12", "2.13", "3.1"] },
    { "id": 9, "tasks": ["3.2", "3.3", "3.4", "3.8", "3.9", "3.11"] },
    { "id": 10, "tasks": ["3.5", "3.7", "3.10", "3.12"] },
    { "id": 11, "tasks": ["3.6", "3.13"] },
    { "id": 12, "tasks": ["4.1"] },
    { "id": 13, "tasks": ["4.2", "4.3", "4.5", "4.6"] },
    { "id": 14, "tasks": ["4.4"] },
    { "id": 15, "tasks": ["4.7"] },
    { "id": 16, "tasks": ["4.8"] },
    { "id": 17, "tasks": ["5.1", "5.2", "5.5"] },
    { "id": 18, "tasks": ["5.3", "5.4", "5.6", "5.7"] },
    { "id": 19, "tasks": ["6.1"] },
    { "id": 20, "tasks": ["6.5", "6.6"] },
    { "id": 21, "tasks": ["6.2", "6.3", "6.4", "6.7"] },
    { "id": 22, "tasks": ["6.8"] },
    { "id": 23, "tasks": ["7.1"] },
    { "id": 24, "tasks": ["7.2", "7.3", "7.4", "7.5", "7.6"] },
    { "id": 25, "tasks": ["7.7"] },
    { "id": 26, "tasks": ["8.1", "8.2", "8.3"] },
    { "id": 27, "tasks": ["8.4"] }
  ]
}
```
