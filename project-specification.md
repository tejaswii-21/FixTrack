FIXTRACK — SMART COMPLAINT AND MAINTENANCE TRACKER
Full-Stack Web Application Development Specification
Act as a senior full-stack engineer, software architect, UI/UX designer, database engineer, and security specialist.
Build a functional full-stack web application called FixTrack — Smart Complaint and Maintenance Tracker. It helps colleges, hostels, apartments, offices, and residential communities report maintenance problems, assign them to responsible personnel, monitor resolution progress, and identify recurring issues.
Examples include water leakage, broken lights, garbage accumulation, internet connectivity problems, electrical faults, damaged furniture, plumbing issues, and building maintenance.
Build a functional full-stack application, not merely a frontend prototype. Core features must connect to a real database. Never invent credentials or claim untested functionality works. Clearly document anything that remains unconfigured or unverified.
---
1. KI RO DEVELOPMENT WORKFLOW
Step 1: Inspect the project
Before making changes:
Inspect the current project directory, framework, dependencies, source files, and configuration.
Identify existing functionality that should be preserved.
Check whether Supabase is already configured.
Identify missing components and dependencies.
Do not overwrite working files unnecessarily.
Do not expose or print secrets found in environment files.
Step 2: Create or update the specification
Create or update:
`requirements.md`
`design.md`
`tasks.md`
Describe the functional requirements, roles and permissions, database design, frontend architecture, security, testing, and implementation tasks. Keep the three documents consistent and give each task clear completion criteria.
Step 3: Implement incrementally
Implement in this order:
Project configuration and reusable UI components.
Responsive layout and routing.
Authentication and user roles.
PostgreSQL schema, migrations, and Row Level Security (RLS).
Complaint submission and tracking.
Assignment and maintenance workflows.
Notifications and overdue detection.
Dashboards and analytics.
Search, filters, reports, and CSV export.
Testing, error handling, documentation, and deployment preparation.
After each phase, run the relevant checks, fix errors, and update `tasks.md` based on actual progress. Do not mark a task complete simply because code was generated. Keep the app runnable after each phase.
---
2. TECHNOLOGY STACK
Use this stack unless the existing project requires a compatible adjustment:
Frontend: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router, Lucide React, Recharts, React Hook Form, Zod, Sonner.
Backend: Supabase Authentication, Supabase PostgreSQL, Supabase Storage, and Supabase Edge Functions where server-side processing is required.
Database logic: PostgreSQL functions, triggers, constraints, and transactions where appropriate.
Utilities: `date-fns`, CSV export, environment variables, automated tests.
Keep code modular, reusable, type-safe, readable, and beginner-friendly. Avoid unnecessary dependencies. Never expose Supabase service-role keys or other secrets in browser-accessible code.
---
3. PRODUCT DESIGN AND BRANDING
Application name: FixTrack  
Tagline: Smart Complaint & Maintenance Management
Create a professional SaaS-style interface.
Colors
Navy blue for primary navigation.
Royal blue for buttons and active elements.
White and light gray for backgrounds.
Cyan for informational accents.
Green for resolved complaints.
Amber for pending complaints.
Red for critical and overdue complaints.
Layout
Create a responsive dashboard with:
Collapsible left sidebar and top navigation.
Global search, notification center, and user profile menu.
Dark mode toggle.
Main content area, reusable cards, tables, charts, filters, modal dialogs, and confirmation dialogs.
Consistent spacing, rounded cards, subtle shadows, readable typography, and accessible contrast.
Loading, empty, error, and success states.
Show sidebar options according to the user's role:
Dashboard.
All Complaints.
My Complaints.
Submit Complaint.
Assigned to Me.
Categories.
Maintenance Team.
Reports & Analytics.
Notifications.
Profile.
Settings.
Hide navigation items a user cannot access, but enforce permissions in the database and server-side operations as well. Support desktop, tablet, and mobile layouts.
---
4. AUTHENTICATION AND AUTHORIZATION
Use Supabase Auth. Implement:
Registration, login, logout, password recovery, password reset, and session persistence.
Protected routes and role-aware navigation.
Create three roles.
Administrator
Can:
View and manage all complaints.
Assign and reassign complaints.
Manage categories and maintenance personnel.
Manage authorized user roles through a secure operation.
Configure SLA targets.
Monitor overdue complaints.
View reports and analytics and export reports.
View audit logs and manage system settings.
Maintenance Staff
Can:
View authorized assigned complaints.
Update progress and add progress notes.
Upload work-progress images.
Record resolution details.
View assigned, overdue, and completed tasks.
Resident / Student / Employee
Can:
Submit complaints and upload images.
Track their own complaints and view status history.
Add authorized public comments.
Receive notifications.
Confirm resolutions or request reopening when an issue persists.
Security requirements
New self-registered users must receive the `resident` role by default.
Users must not be able to grant themselves administrator or maintenance staff privileges.
Role changes must use trusted server-side authorization.
Enforce permissions through PostgreSQL RLS policies and server-side operations, not just frontend route protection.
Keep service-role keys and secrets out of browser code.
Protect internal notes, private attachments, audit logs, and status history from unauthorized access or modification.
Use private storage for sensitive attachments.
Do not create insecure default administrator credentials.
Document a safe way to provision the first administrator.
---
5. DATABASE ARCHITECTURE
Create PostgreSQL migrations under `supabase/migrations/` and development seed data under `supabase/seed.sql`.
Create these tables:
`profiles`
`maintenance_staff`
`complaint_categories`
`complaints`
`complaint_attachments`
`complaint_comments`
`complaint_status_history`
`complaint_assignments`
`notifications`
`complaint_feedback`
`system_settings`
`audit_logs`
Use UUID primary keys where appropriate. Add foreign keys, unique and check constraints, timestamps, and indexes. Reference authenticated users consistently and document relationships.
Important fields
profiles
`id`, `full_name`, `phone`, `avatar_url`, `role`, `account_status`, `created_at`, `updated_at`
maintenance_staff
`id`, `profile_id`, `staff_code`, `department`, `specialization`, `employment_status`, `created_at`, `updated_at`
complaint_categories
`id`, `name`, `description`, `default_priority`, `active`, `created_at`, `updated_at`
complaints
`id`, `complaint_number`, `title`, `description`, `category_id`, `location`, `building`, `floor`, `room_number`, `priority`, `status`, `submitted_by`, `assigned_to`, `submitted_at`, `due_at`, `resolved_at`, `resolution_notes`, `created_at`, `updated_at`
complaint_attachments
`id`, `complaint_id`, `uploaded_by`, `storage_path`, `file_name`, `content_type`, `file_size`, `attachment_type`, `created_at`
complaint_comments
`id`, `complaint_id`, `author_id`, `comment`, `visibility`, `created_at`, `updated_at`
complaint_status_history
`id`, `complaint_id`, `previous_status`, `new_status`, `changed_by`, `reason`, `created_at`
complaint_assignments
`id`, `complaint_id`, `assigned_to`, `assigned_by`, `previous_assignee_id`, `reason`, `created_at`
notifications
`id`, `recipient_id`, `complaint_id`, `notification_type`, `title`, `message`, `is_read`, `created_at`, `read_at`
complaint_feedback
`id`, `complaint_id`, `submitted_by`, `rating`, `feedback`, `reopening_reason`, `created_at`
system_settings
`id`, `setting_key`, `setting_value`, `updated_by`, `updated_at`
audit_logs
`id`, `actor_id`, `action`, `entity_type`, `entity_id`, `old_values`, `new_values`, `created_at`
Database integrity and security
Generate readable complaint IDs such as `CMP-2026-0001` using a database sequence or another concurrency-safe method, with a database uniqueness constraint. Do not generate IDs using a frontend count-then-increment approach.
Use consistent foreign keys to `auth.users` and `profiles`.
Add indexes for commonly filtered fields, including status, priority, category, submitter, assignee, submitted time, and deadline.
Use database transactions or atomic server-side operations for status changes, assignments, history, and related notifications where appropriate.
Define deletion behavior deliberately and preserve important complaint and audit history.
Add consistent `updated_at` behavior.
Deactivated categories must remain associated with historical complaints.
Protect audit logs and status/assignment history from direct unauthorized edits.
Enable RLS on protected tables and define policies for each role and operation.
Test that residents can access only their own complaints, maintenance staff can access only permitted assigned complaints, and administrators can access authorized management records.
Protect internal comments and private attachments through database/storage policies, not merely UI hiding.
Include safe development seed data but no default administrator password or production personal data.
---
6. COMPLAINT SUBMISSION
Build a complete complaint submission form.
Required fields
Complaint title.
Description.
Category.
Building.
Location.
Floor or room number, when applicable.
Priority.
Supporting images should be optional unless the project requirements explicitly require them.
Default categories
Plumbing and Water Supply.
Electrical Issues.
Cleaning and Garbage.
Internet and Networking.
Furniture and Equipment.
Building Maintenance.
Air Conditioning.
Safety and Security.
Parking and Common Areas.
Other.
Administrators can manage categories.
Features
Required-field and input-length validation.
Image preview and secure upload.
File type and size validation on the client and trusted storage/backend side.
Submission loading indicator and useful success/error notifications.
Duplicate-submission prevention.
Database persistence.
Automatically generated complaint ID, submission timestamp, initial status, and target resolution date.
Create the initial status-history record.
Redirect to the complaint details page only after successful creation.
Handle upload or database failures without falsely reporting success.
---
7. COMPLAINT STATUS AND PRIORITY
Support statuses:
Pending.
Assigned.
In Progress.
Resolved.
Reopened.
Cancelled.
Support priorities:
Low.
Medium.
High.
Critical.
Use accessible color-coded badges.
Define and enforce valid status transitions. Suggested baseline:
Pending → Assigned or Cancelled.
Assigned → In Progress, or back to Pending through an authorized unassignment.
In Progress → Resolved, Assigned through authorized reassignment, or Cancelled with a reason.
Resolved → Reopened only through the authorized reopening workflow.
Reopened → Assigned or In Progress, or Cancelled with an authorized reason.
Cancelled is terminal unless an explicit administrator restoration workflow is implemented.
Document which roles can initiate each transition. Residents may request reopening but must not arbitrarily change status.
For every accepted transition, record complaint ID, previous status, new status, acting user, timestamp, and reason where applicable. Create a visual timeline. History must be written by trusted database/server logic and must not be directly editable by ordinary clients.
---
8. SMART ASSIGNMENT
Create an assignment module for administrators.
Allow administrators to:
Assign and reassign complaints to active maintenance staff.
View staff specializations and current workloads.
Review completed tasks.
Identify overloaded staff.
Implement an explainable recommendation based on:
Complaint category and staff specialization.
Current active workload.
Active employment status.
Department or location when that information is available.
Recommendations must not assign complaints automatically. An authorized administrator must confirm the assignment.
Validate staff eligibility, record assignment history, update the current assignee consistently, follow the status-transition rules, notify the assigned staff member, and record important changes in audit logs.
---
9. OVERDUE DETECTION AND SLA
Default resolution targets:
Critical: 4 hours.
High: 24 hours.
Medium: 72 hours.
Low: 7 days.
Administrators can change these targets through protected settings.
Implement:
Server/database-calculated deadlines.
Overdue badges and elapsed time beyond the deadline.
Dashboard alerts and overdue filters.
Staff notifications where configured.
Resolution performance statistics and SLA reports.
Audit records for deadline changes.
A scheduled server-side process for proactive reminders if supported by the configured environment.
A complaint is overdue when its deadline has passed and it is neither Resolved nor Cancelled. Do not depend solely on frontend timers. Make reminder processing idempotent to avoid duplicate notifications. Document deadline behavior when priority changes and test future, expired, resolved, cancelled, and reopened complaints.
---
10. NOTIFICATIONS
Create an in-app notification center with unread count, mark-as-read, mark-all-as-read, timestamps, links to complaints, and notification history.
Generate notifications for:
Complaint submission.
Assignment or reassignment.
Work starting.
Public comments.
Resolution.
Reopening requests or accepted reopening.
Overdue complaints.
Critical complaints.
Use secure database triggers or server-side functions. Users may read or update only their own notifications. Avoid duplicate notifications on retries.
Provide an optional server-side email integration point. The app must work without email configuration. Never expose email provider API keys in frontend code, and do not claim email works until it is configured and tested.
---
11. COMMENTS AND RESOLUTION VERIFICATION
Support:
Public comments visible to authorized complaint participants.
Internal staff notes restricted to authorized administrators and maintenance staff.
Supporting evidence and maintenance progress images stored privately.
Enforce comment visibility and attachment access through RLS and storage policies. Validate upload types, sizes, and permissions.
When staff resolve a complaint:
Require resolution notes.
Record resolved status and timestamp.
Record status history and notify the complainant.
Allow the complainant to confirm resolution.
Allow the complainant to request reopening with a reason if the issue persists.
Apply the documented authorization and status-transition rules.
Store eligible ratings and feedback.
Prevent unauthorized users from resolving, confirming, or reopening complaints.
---
12. DASHBOARDS
All dashboard statistics must use actual authorized database records, not hardcoded values. Clearly identify any development seed data.
Administrator dashboard
Show:
Total, pending, assigned, in-progress, resolved, overdue, and critical complaints.
Active maintenance staff.
Average resolution time.
Resolution rate.
Charts:
Status distribution.
Daily, weekly, and monthly trends.
Category distribution.
Location-based complaints.
Resolution performance.
Staff workload.
Overdue complaints.
Include a recent complaints table and authorized quick actions.
Resident dashboard
Show:
My total, pending, in-progress, resolved, and overdue complaints.
Submit Complaint action.
Recent complaints, status timelines, and notifications.
Maintenance staff dashboard
Show:
Assigned complaints.
Pending tasks.
In-progress tasks.
Completed tasks.
Overdue tasks.
Include priority-based task lists and deadlines.
Document metric formulas and ensure data access and aggregate queries respect role permissions.
---
13. SEARCH, FILTERS, AND REPORTS
Implement authorized global search by:
Complaint ID.
Title.
Description where authorized.
Category.
Building and location.
Status.
Assigned staff where permitted.
Filters:
Date range.
Category.
Priority.
Status.
Location.
Assigned staff.
Overdue status.
Implement sorting and pagination.
Create reports for:
Complaints by date range.
Complaints by category.
Complaints by priority.
Overdue complaints.
Frequently reported problems.
Complaints by building and location.
Average resolution time.
Resolution rate.
Staff workload and performance.
Monthly complaint trends.
Use Recharts for analytics.
Implement working CSV export that:
Includes only records the user is authorized to access.
Respects active filters.
Escapes commas, quotes, and newlines correctly.
Protects against spreadsheet formula injection.
Does not expose internal notes or sensitive fields to residents.
---
14. REQUIRED PAGES
Build these pages with role-appropriate access:
Login.
Registration.
Forgot Password.
Reset Password.
Administrator Dashboard.
Resident Dashboard.
Maintenance Staff Dashboard.
Submit Complaint.
My Complaints.
All Complaints.
Complaint Details.
Assigned to Me.
Categories.
Maintenance Team.
Reports and Analytics.
Notifications.
User Profile.
Settings.
Access Denied.
Custom 404.
Protect restricted routes. Every page should have loading, error, and empty states where appropriate. Frontend protection must be backed by database authorization.
---
15. PROJECT STRUCTURE
Use a modular structure, adapting it to the existing project:
```text
src/
  components/
    ui/
    layout/
    dashboard/
    complaints/
    forms/
    notifications/
    charts/
  pages/
    auth/
    dashboard/
    complaints/
    maintenance/
    reports/
    settings/
  hooks/
  contexts/
  lib/
    supabase.ts
    utils.ts
    validation.ts
  services/
    auth.service.ts
    complaints.service.ts
    assignments.service.ts
    notifications.service.ts
    reports.service.ts
  types/
  routes/
supabase/
  migrations/
  functions/
  seed.sql
tests/
package.json
.env.example
README.md
requirements.md
design.md
tasks.md
```
Do not create unnecessary empty files. Keep code readable and explain important logic with comments.
---
16. TESTING AND VALIDATION
Test the actual implementation.
Authentication
Registration, login, logout, password reset, and session persistence.
Protected routes.
New users receive the resident role.
Unauthorized role changes are rejected.
Complaint workflows
Submit a complaint and upload images.
Assign and reassign complaints.
Validate status transitions.
Add public comments and restricted internal notes.
Resolve with required notes.
Confirm resolution and request reopening.
Verify history records.
Security
Residents cannot access other residents' complaints.
Maintenance staff cannot access unauthorized unassigned complaints.
Users cannot promote themselves.
Unauthorized assignment and status changes are rejected.
Internal notes and private attachments are protected.
Audit logs and history cannot be tampered with by ordinary users.
Test RLS through direct API/database requests, not only the frontend.
Check that secrets are not exposed in browser bundles.
SLA and notifications
Test future and expired deadlines.
Ensure resolved/cancelled complaints are excluded from open overdue counts.
Verify notification recipients and read permissions.
Verify scheduled reminders do not create duplicates.
Dashboard and reports
Compare dashboard metrics and charts with database records.
Test date filters, pagination, and CSV export permissions.
Verify CSV escaping and documented metric formulas.
Build and responsiveness
Run available linting, TypeScript checks, automated tests, and production build.
Check browser console errors.
Test desktop, tablet, and mobile layouts.
Fix discovered issues.
Report separately what is implemented, what builds successfully, which tests actually passed, what was integration-tested against Supabase, and what remains unverified. Never claim tests passed unless they were run.
---
17. ENVIRONMENT VARIABLES
Create `.env.example` using the supported public Supabase client configuration:
```dotenv
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```
Use the current supported Supabase publishable key configuration. Never put a service-role key or privileged secret in a `VITE_` variable.
If credentials are unavailable:
Implement frontend and integration code where feasible.
Create migrations and RLS policies.
Document required Supabase setup.
State which tests and integrations could not be verified.
Never invent credentials.
Validate required environment variables and display a clear, non-sensitive configuration error when missing.
---
18. README AND SETUP
Create a beginner-friendly `README.md` covering:
Project overview and features.
Technology stack.
Prerequisites and installation.
Environment configuration.
Supabase project setup.
Database migrations and seed data.
Authentication and role setup.
Safe first-administrator provisioning.
Storage configuration and access policies.
Local development, tests, and production build.
Deployment and troubleshooting.
Known limitations and unverified features.
Also include a short architecture/viva guide explaining:
What the major folders and files do.
How login works.
How a complaint travels from the form to PostgreSQL.
How assignment and status changes are authorized and recorded.
How RLS protects data.
How notifications and SLA deadlines work.
How dashboards and reports retrieve data.
Important functions and database operations.
Keep explanations beginner-friendly and ensure they describe the actual code, not planned functionality.
---
19. FINAL ACCEPTANCE CRITERIA
The project is complete only when:
Authentication works with configured Supabase Auth.
Role permissions are enforced in the database/server-side operations.
Complaints can be submitted and tracked, with records persisted in PostgreSQL.
Administrators can assign and reassign complaints.
Maintenance staff can update authorized assignments.
Status and assignment histories are recorded.
Private attachments are protected.
Overdue detection and configured notifications work.
Dashboard metrics use real authorized database data.
Search, filters, sorting, pagination, reports, and CSV export work.
SLA settings are configurable by authorized administrators.
Error handling and responsive layouts are implemented.
Migrations and RLS policies are provided.
Documentation and the beginner-friendly viva guide are complete.
The production build succeeds in the available environment.
Core workflows and security rules have been tested.
Remaining limitations are documented honestly.
Do not claim full completion if a requirement remains unimplemented or unverified.
---
20. FINAL INSTRUCTION TO KI RO
Begin by inspecting the existing project. First create or update `requirements.md`, `design.md`, and `tasks.md`. Then implement incrementally, starting with the frontend foundation and database architecture.
Before broad implementation, summarize the planned architecture, major security decisions, phases, and acceptance criteria for review.
Prioritize functionality, data integrity, security, professional design, and beginner-friendly code. Use real Supabase integration rather than hardcoded dashboard data. Do not leave essential buttons as placeholders, skip migrations/RLS/testing, overwrite working files unnecessarily, or invent credentials.
After each phase, verify the implementation and fix errors before continuing. Update task status based on actual evidence. At the end, summarize:
Features implemented.
Important files and migrations created.
Tests and commands actually run and their results.
Required manual setup.
Known limitations and unverified functionality.
How the main code paths work so the student can explain the project to faculty.
Do not implement the entire application in one step. Keep it runnable and understandable throughout development.