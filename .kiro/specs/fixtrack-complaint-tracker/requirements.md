# Requirements Document

## Introduction

FixTrack is a simple, beginner-friendly full-stack web application for reporting and tracking maintenance complaints in colleges, hostels, apartments, offices, and residential communities. Users submit maintenance problems such as water leakage, broken lights, garbage accumulation, electrical faults, or plumbing issues; administrators assign these complaints to maintenance staff who update progress until resolution.

The application is built with React, TypeScript, and Vite on the frontend using Tailwind CSS and shadcn/ui, backed by Supabase Authentication and Supabase PostgreSQL. This is a college project focused on a working, easy-to-understand application rather than an enterprise system.

This document defines the Phase 1 (core) requirements for FixTrack. A "Remaining Features" section at the end lists advanced features that are deliberately deferred to keep the project simple and buildable step by step.

## Glossary

- **FixTrack_Application**: The full-stack web application described in this document, consisting of the React frontend and Supabase backend.
- **Administrator**: A user role that can view and manage all complaints, assign and reassign complaints, manage categories and maintenance personnel, configure SLA targets, and view reports.
- **Maintenance_Staff**: A user role that can view authorized assigned complaints, update progress, add notes, upload progress images, and record resolution details. Staff specialization and department are stored as fields on the Profile record.
- **Resident**: A user role (resident, student, or employee) that can submit complaints, track their own complaints, comment, and confirm or reopen resolutions.
- **Profile**: A user's account record in the profiles table, containing full name, phone, avatar, role, account status, and optional maintenance staff fields.
- **Complaint**: A maintenance problem report submitted by a Resident.
- **Complaint_Number**: A human-readable, database-generated identifier in the format `CMP-2026-0001`.
- **Complaint_Category**: A classification of a complaint, such as Plumbing and Water Supply, Electrical Issues, or Cleaning and Garbage.
- **Complaint_Status**: The current state of a complaint: Pending, Assigned, In Progress, Resolved, Reopened, or Cancelled.
- **Complaint_Priority**: The urgency level of a complaint: Low, Medium, High, or Critical.
- **Status_Transition**: An authorized change of a complaint from one Complaint_Status to another, recorded in the complaint_status_history table.
- **SLA_Target**: The maximum allowed resolution time by priority: Critical 4 hours, High 24 hours, Medium 72 hours, Low 7 days.
- **Deadline**: The target resolution date and time calculated from the submission time and the SLA_Target.
- **Overdue**: A complaint whose Deadline has passed and whose status is neither Resolved nor Cancelled.
- **Assignment**: An Administrator assigning or reassigning a complaint to an active Maintenance_Staff member.
- **Notification**: An in-app message about a complaint event, stored in the notifications table.
- **Public_Comment**: A comment on a complaint visible to authorized complaint participants.
- **Internal_Note**: A comment restricted to authorized Administrators and Maintenance_Staff.
- **RLS**: Row Level Security, a PostgreSQL feature that enforces per-row access control based on policies.
- **Service_Role_Key**: A privileged Supabase key used only in server-side code, never exposed in browser-accessible code.

## Requirements

### Requirement 1: User Registration and Login

**User Story:** As a Resident, I want to register, log in, log out, and recover my password, so that I can securely access FixTrack.

#### Acceptance Criteria

1. WHEN a user submits a valid registration form, THE FixTrack_Application SHALL create a Supabase Auth account and a Profile record with the role set to `resident` and `account_status` set to `active`.
2. WHEN a registered user submits valid login credentials, THE FixTrack_Application SHALL authenticate the user and persist the session.
3. WHEN a user requests password recovery, THE FixTrack_Application SHALL send a Supabase password recovery email.
4. WHEN a user submits a valid password reset request, THE FixTrack_Application SHALL update the password through Supabase Auth.
5. WHEN a user logs out, THE FixTrack_Application SHALL terminate the session and redirect the user to the login page.
6. THE FixTrack_Application SHALL protect routes that require authentication and redirect unauthenticated users to the login page.

### Requirement 2: Role Assignment and Protection

**User Story:** As an Administrator, I want new users to receive the Resident role by default and to be unable to self-promote, so that privileges remain controlled.

#### Acceptance Criteria

1. WHEN a new user self-registers, THE FixTrack_Application SHALL assign the `resident` role by default using trusted server-side logic.
2. IF a user attempts to grant themselves the Administrator or Maintenance_Staff role, THEN THE FixTrack_Application SHALL reject the request through server-side authorization.
3. WHEN an Administrator changes a user's role, THE FixTrack_Application SHALL perform the change through a secure server-side operation and record the change in an audit log.
4. THE FixTrack_Application SHALL document a safe method to provision the first Administrator without creating insecure default administrator credentials.

### Requirement 3: Role-Based Navigation and Access Control

**User Story:** As a user, I want navigation and accessible pages to reflect my role, so that I only see options relevant to my permissions.

#### Acceptance Criteria

1. WHILE a Resident is authenticated, THE FixTrack_Application SHALL display navigation items for Dashboard, My Complaints, Submit Complaint, Notifications, Profile, and Settings.
2. WHILE an Administrator is authenticated, THE FixTrack_Application SHALL display navigation items for Dashboard, All Complaints, My Complaints, Submit Complaint, Assigned to Me, Categories, Maintenance Team, Reports and Analytics, Notifications, Profile, and Settings.
3. WHILE Maintenance_Staff is authenticated, THE FixTrack_Application SHALL display navigation items for Dashboard, Assigned to Me, My Complaints, Submit Complaint, Notifications, Profile, and Settings.
4. THE FixTrack_Application SHALL hide navigation items a user cannot access and enforce the same permissions in the database.
5. IF an unauthorized user attempts to access a restricted page, THEN THE FixTrack_Application SHALL redirect the user to an Access Denied page.
6. WHEN a user navigates to a non-existent route, THE FixTrack_Application SHALL display a custom 404 page.

### Requirement 4: Database Architecture

**User Story:** As a developer, I want a PostgreSQL schema with migrations, constraints, and Row Level Security, so that data integrity and access control are enforced at the database level.

#### Acceptance Criteria

1. THE FixTrack_Application SHALL create PostgreSQL migrations under `supabase/migrations/` defining the core tables: profiles, complaint_categories, complaints, complaint_attachments, complaint_comments, complaint_status_history, complaint_assignments, notifications, complaint_feedback, system_settings, and audit_logs.
2. THE FixTrack_Application SHALL use UUID primary keys and add foreign keys, unique constraints, check constraints, timestamps, and indexes.
3. THE FixTrack_Application SHALL create indexes on commonly filtered fields including status, priority, category, submitter, assignee, and submitted time.
4. THE FixTrack_Application SHALL add consistent `updated_at` behavior using database triggers.
5. THE FixTrack_Application SHALL keep deactivated complaint categories associated with historical complaints.
6. THE FixTrack_Application SHALL use database transactions or atomic server-side operations for status changes, assignments, and history records.
7. THE FixTrack_Application SHALL define check constraints for valid Complaint_Status and Complaint_Priority values.
8. THE FixTrack_Application SHALL enable RLS on protected tables and define policies for each role and operation.
9. THE FixTrack_Application SHALL create development seed data under `supabase/seed.sql` that contains no default administrator password and no production personal data.

### Requirement 5: Complaint Number Generation

**User Story:** As a user, I want each complaint to have a readable, unique identifier, so that I can reference it easily.

#### Acceptance Criteria

1. WHEN a complaint is created, THE FixTrack_Application SHALL generate a Complaint_Number in the format `CMP-2026-0001` using a concurrency-safe database sequence.
2. THE FixTrack_Application SHALL enforce a database uniqueness constraint on the Complaint_Number.

### Requirement 6: Complaint Submission

**User Story:** As a Resident, I want to submit a complaint with details and optional images, so that a maintenance issue can be reported and tracked.

#### Acceptance Criteria

1. WHEN a Resident submits the complaint form, THE FixTrack_Application SHALL require the fields: complaint title, description, category, building, location, and priority.
2. WHERE floor or room number information is applicable, THE FixTrack_Application SHALL accept those fields as optional inputs.
3. WHERE the Resident chooses to attach supporting images, THE FixTrack_Application SHALL accept optional image uploads.
4. WHEN a Resident submits invalid or incomplete form data, THE FixTrack_Application SHALL display validation errors and prevent submission.
5. WHEN a Resident submits a valid complaint, THE FixTrack_Application SHALL persist the complaint to PostgreSQL, generate the Complaint_Number, record the submission timestamp, set the initial status to Pending, and calculate the Deadline from the SLA_Target.
6. WHEN a valid complaint is created, THE FixTrack_Application SHALL create the initial complaint_status_history record.
7. WHEN a valid complaint is created, THE FixTrack_Application SHALL redirect the Resident to the complaint details page.
8. IF a database or upload failure occurs during complaint creation, THEN THE FixTrack_Application SHALL display a useful error notification and shall prevent a false success indication.
9. THE FixTrack_Application SHALL prevent duplicate complaint submission.

### Requirement 7: Complaint Attachments

**User Story:** As a user, I want to upload and view images attached to complaints, so that I can provide and review supporting evidence.

#### Acceptance Criteria

1. WHEN a user uploads a file, THE FixTrack_Application SHALL validate the file type and size on the client and on the trusted storage or backend side.
2. WHEN a valid attachment is uploaded, THE FixTrack_Application SHALL store the file in private Supabase Storage and record metadata in the complaint_attachments table.
3. THE FixTrack_Application SHALL provide image preview during upload and a submission loading indicator.
4. WHEN Maintenance_Staff upload work-progress images, THE FixTrack_Application SHALL store the images as private supporting evidence.
5. THE FixTrack_Application SHALL enforce attachment access through RLS and storage policies.

### Requirement 8: Complaint Categories Management

**User Story:** As an Administrator, I want to manage complaint categories, so that complaints can be classified consistently.

#### Acceptance Criteria

1. THE FixTrack_Application SHALL provide default categories: Plumbing and Water Supply, Electrical Issues, Cleaning and Garbage, Internet and Networking, Furniture and Equipment, Building Maintenance, Air Conditioning, Safety and Security, Parking and Common Areas, and Other.
2. WHEN an Administrator creates a new category, THE FixTrack_Application SHALL store the category name, description, default_priority, and active status in the complaint_categories table.
3. WHEN an Administrator deactivates a category, THE FixTrack_Application SHALL mark the category as inactive while preserving its association with historical complaints.

### Requirement 9: Complaint Status and Transitions

**User Story:** As a user, I want complaints to follow a defined status workflow, so that progress is tracked consistently and authoritatively.

#### Acceptance Criteria

1. THE FixTrack_Application SHALL support the Complaint_Status values: Pending, Assigned, In Progress, Resolved, Reopened, and Cancelled.
2. THE FixTrack_Application SHALL support the Complaint_Priority values: Low, Medium, High, and Critical.
3. THE FixTrack_Application SHALL display accessible color-coded badges for status and priority.
4. WHEN a valid Status_Transition occurs, THE FixTrack_Application SHALL record the complaint ID, previous status, new status, acting user, timestamp, and reason in the complaint_status_history table.
5. THE FixTrack_Application SHALL enforce the baseline status transitions: Pending to Assigned or Cancelled; Assigned to In Progress or back to Pending through authorized unassignment; In Progress to Resolved, Assigned through authorized reassignment, or Cancelled with a reason; Resolved to Reopened only through the authorized reopening workflow; Reopened to Assigned, In Progress, or Cancelled with an authorized reason.
6. THE FixTrack_Application SHALL document which roles can initiate each status transition.
7. IF a Resident attempts to arbitrarily change status, THEN THE FixTrack_Application SHALL reject the attempt; Residents may only request reopening.
8. THE FixTrack_Application SHALL write status history through trusted database or server logic.
9. THE FixTrack_Application SHALL present a visual status timeline on the complaint details page.

### Requirement 10: Basic Assignment

**User Story:** As an Administrator, I want to assign complaints to maintenance staff, so that each complaint is handled by a responsible person.

#### Acceptance Criteria

1. WHEN an Administrator opens the assignment module, THE FixTrack_Application SHALL display active Maintenance_Staff with their specializations and current workloads.
2. WHEN an Administrator assigns a complaint, THE FixTrack_Application SHALL validate that the selected staff member is active and eligible.
3. WHEN an Administrator confirms an assignment, THE FixTrack_Application SHALL record the assignment in the complaint_assignments table, update the current assignee, follow the status-transition rules, notify the assigned staff member, and record the change in an audit log.
4. WHEN an Administrator reassigns a complaint, THE FixTrack_Application SHALL record the previous assignee and reason in the complaint_assignments table.

### Requirement 11: SLA and Overdue Detection

**User Story:** As an Administrator, I want SLA targets and overdue detection, so that resolution times are monitored.

#### Acceptance Criteria

1. THE FixTrack_Application SHALL set default SLA_Targets to Critical 4 hours, High 24 hours, Medium 72 hours, and Low 7 days.
2. WHEN a complaint is created, THE FixTrack_Application SHALL calculate the Deadline on the server or database based on the submission time and the SLA_Target for the complaint priority.
3. WHERE an Administrator changes an SLA_Target, THE FixTrack_Application SHALL update the value in the system_settings table through a protected operation and record the change in an audit log.
4. THE FixTrack_Application SHALL mark a complaint as Overdue when its Deadline has passed and its status is neither Resolved nor Cancelled, calculated server-side.
5. THE FixTrack_Application SHALL display Overdue badges, elapsed time beyond the Deadline, dashboard alerts, and an overdue filter.
6. THE FixTrack_Application SHALL provide resolution performance statistics and basic SLA reports.
7. THE FixTrack_Application SHALL document scheduled proactive reminders as a deferred feature.

### Requirement 12: In-App Notifications

**User Story:** As a user, I want in-app notifications about complaint events, so that I stay informed about relevant changes.

#### Acceptance Criteria

1. THE FixTrack_Application SHALL provide an in-app notification center with unread count, mark-as-read, mark-all-as-read, timestamps, and links to complaints.
2. WHEN any of the following events occurs, THE FixTrack_Application SHALL generate a notification: complaint submission, assignment or reassignment, work starting, public comments, resolution, and reopening requests.
3. THE FixTrack_Application SHALL generate notifications through secure database triggers or server-side functions.
4. WHILE a user uses the notification center, THE FixTrack_Application SHALL allow the user to read or update only their own notifications.
5. THE FixTrack_Application SHALL document email integration as a deferred feature.

### Requirement 13: Comments and Resolution Verification

**User Story:** As a user, I want to add comments and verify resolutions, so that communication and resolution quality are supported.

#### Acceptance Criteria

1. THE FixTrack_Application SHALL support Public_Comments visible to authorized complaint participants.
2. THE FixTrack_Application SHALL support Internal_Notes restricted to authorized Administrators and Maintenance_Staff.
3. THE FixTrack_Application SHALL enforce comment visibility through RLS policies.
4. WHEN Maintenance_Staff resolve a complaint, THE FixTrack_Application SHALL require resolution notes, record the Resolved status and timestamp, record the status history, and notify the complainant.
5. WHEN the complainant confirms resolution, THE FixTrack_Application SHALL record the confirmation.
6. WHEN the complainant requests reopening because the issue persists, THE FixTrack_Application SHALL require a reason and apply the documented reopening workflow.
7. THE FixTrack_Application SHALL store ratings and feedback in the complaint_feedback table.
8. IF an unauthorized user attempts to resolve, confirm, or reopen a complaint, THEN THE FixTrack_Application SHALL reject the attempt.

### Requirement 14: Basic Dashboards

**User Story:** As a user, I want a dashboard showing relevant complaint data, so that I can monitor the state of complaints for my role.

#### Acceptance Criteria

1. THE FixTrack_Application SHALL display on the Administrator dashboard total, pending, assigned, in-progress, resolved, and overdue complaint counts, simple Recharts charts for status and category distribution, and a recent complaints table.
2. THE FixTrack_Application SHALL display on the Resident dashboard the Resident's total, pending, in-progress, and resolved complaint counts, a Submit Complaint action, and recent complaints.
3. THE FixTrack_Application SHALL display on the Maintenance Staff dashboard the staff member's assigned complaints, pending tasks, in-progress tasks, and overdue tasks with priority-based lists and deadlines.
4. THE FixTrack_Application SHALL compute all dashboard statistics from actual authorized database records.
5. THE FixTrack_Application SHALL document the metric formulas used on the dashboards.

### Requirement 15: Search, Filters, and Pagination

**User Story:** As a user, I want to search, filter, sort, and paginate complaints, so that I can find relevant records efficiently.

#### Acceptance Criteria

1. THE FixTrack_Application SHALL provide authorized global search by Complaint_Number, title, category, and status.
2. THE FixTrack_Application SHALL provide filters by date range, category, priority, and status.
3. THE FixTrack_Application SHALL implement sorting and pagination for complaint lists.

### Requirement 16: Reports and CSV Export

**User Story:** As an Administrator, I want basic reports and CSV export, so that I can analyze and share complaint data.

#### Acceptance Criteria

1. THE FixTrack_Application SHALL provide basic reports for complaints by category, by priority, and overdue complaints.
2. THE FixTrack_Application SHALL use Recharts for analytics visualizations.
3. WHEN a user exports CSV, THE FixTrack_Application SHALL include only records the user is authorized to access and shall respect active filters.
4. WHEN a user exports CSV, THE FixTrack_Application SHALL escape commas, quotes, and newlines correctly.
5. THE FixTrack_Application SHALL hide Internal_Notes and sensitive fields from Residents in CSV exports.

### Requirement 17: Required Pages

**User Story:** As a user, I want a complete set of pages with appropriate states, so that I can use every feature of the application.

#### Acceptance Criteria

1. THE FixTrack_Application SHALL build the following pages with role-appropriate access: Login, Registration, Forgot Password, Reset Password, Administrator Dashboard, Resident Dashboard, Maintenance Staff Dashboard, Submit Complaint, My Complaints, All Complaints, Complaint Details, Assigned to Me, Categories, Maintenance Team, Reports and Analytics, Notifications, User Profile, Settings, Access Denied, and custom 404.
2. THE FixTrack_Application SHALL protect restricted routes with frontend protection backed by database authorization.
3. THE FixTrack_Application SHALL provide loading, error, and empty states on every page where appropriate.

### Requirement 18: Responsive Layout and Branding

**User Story:** As a user, I want a professional, responsive interface with dark mode, so that I can use the application on any device.

#### Acceptance Criteria

1. THE FixTrack_Application SHALL use navy blue for primary navigation, royal blue for buttons and active elements, white and light gray for backgrounds, and cyan for informational accents.
2. THE FixTrack_Application SHALL use green for resolved complaints, amber for pending complaints, and red for critical and overdue complaints.
3. THE FixTrack_Application SHALL provide a collapsible left sidebar and top navigation with global search, notification center, and user profile menu.
4. THE FixTrack_Application SHALL provide a dark mode toggle.
5. THE FixTrack_Application SHALL support desktop, tablet, and mobile layouts.
6. THE FixTrack_Application SHALL use clear component names, a simple folder structure, and comments explaining important code.

### Requirement 19: Security and Row Level Security

**User Story:** As a developer, I want security enforced at the database and server side, so that data is protected even if the frontend is bypassed.

#### Acceptance Criteria

1. THE FixTrack_Application SHALL enable RLS on protected tables and define policies for each role and operation.
2. THE FixTrack_Application SHALL enforce permissions through PostgreSQL RLS policies and server-side operations.
3. THE FixTrack_Application SHALL protect internal notes, private attachments, audit logs, and status history from unauthorized access or modification.
4. THE FixTrack_Application SHALL keep Service_Role_Keys and secrets out of browser-accessible code.
5. THE FixTrack_Application SHALL use private storage for sensitive attachments.
6. THE FixTrack_Application SHALL NOT create insecure default administrator credentials.

### Requirement 20: Testing

**User Story:** As a developer, I want beginner-friendly tests, so that the implementation is verified to work correctly.

#### Acceptance Criteria

1. THE FixTrack_Application SHALL provide basic tests for authentication including registration, login, logout, and protected routes.
2. THE FixTrack_Application SHALL provide basic tests for complaint workflows including submission, assignment, and status transitions.
3. THE FixTrack_Application SHALL provide security tests verifying that Residents cannot access other Residents' complaints and that users cannot promote themselves.
4. THE FixTrack_Application SHALL run available linting, TypeScript checks, automated tests, and a production build.
5. THE FixTrack_Application SHALL report honestly what is implemented, what builds, and what tests passed.

### Requirement 21: Environment Configuration

**User Story:** As a developer, I want a documented environment configuration, so that the application can be configured without exposing secrets.

#### Acceptance Criteria

1. THE FixTrack_Application SHALL provide a `.env.example` file using the supported public Supabase client configuration with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
2. THE FixTrack_Application SHALL NOT place a Service_Role_Key or privileged secret in a `VITE_` variable.
3. IF required environment variables are missing, THE FixTrack_Application SHALL validate them and display a clear, non-sensitive configuration error.
4. IF credentials are unavailable, THE FixTrack_Application SHALL implement frontend and integration code where feasible, create migrations and RLS policies, document required Supabase setup, and shall never invent credentials.

### Requirement 22: README and Setup

**User Story:** As a developer or student, I want beginner-friendly documentation, so that I can set up and explain the project.

#### Acceptance Criteria

1. THE FixTrack_Application SHALL provide a README.md covering project overview and features, technology stack, prerequisites and installation, environment configuration, Supabase project setup, database migrations and seed data, authentication and role setup, safe first-administrator provisioning, storage configuration, local development and production build, and known limitations.
2. THE FixTrack_Application SHALL include a beginner-friendly architecture guide explaining what the major folders and files do, how login works, how a complaint travels from the form to PostgreSQL, how assignment and status changes are authorized and recorded, how RLS protects data, how notifications and SLA deadlines work, and how dashboards retrieve data.
3. THE FixTrack_Application SHALL ensure documentation describes the actual code, not planned functionality.

## Remaining Features

The following features from the original project specification are deliberately deferred beyond Phase 1 to keep FixTrack simple and buildable step by step. They are listed here so they are not forgotten, but they are out of scope for the Phase 1 requirements above.

- **Smart Assignment Recommendation Engine**: explainable recommendations based on staff specialization, workload, employment status, and department. Phase 1 uses simple manual assignment instead.
- **Scheduled server-side proactive reminders**: cron-based reminder processing for overdue complaints. Phase 1 uses on-demand overdue badges and dashboard alerts instead.
- **Email notification integration**: server-side email delivery of notifications. Phase 1 uses in-app notifications only.
- **Advanced audit log management UI**: a dedicated interface for browsing and filtering audit logs. Phase 1 records audit logs but provides no dedicated management UI.
- **Advanced analytics and trend reports**: monthly trends, location-based complaints, and staff performance reports. Phase 1 provides basic category and priority reports.
- **Advanced CSV formula injection protection**: protection beyond basic comma, quote, and newline escaping. Phase 1 implements basic escaping only.
- **System settings management UI**: a full settings interface beyond basic SLA target configuration. Phase 1 stores SLA targets without a full settings UI.
- **Advanced SLA deadline recalculation**: handling edge cases when priority changes after submission. Phase 1 calculates the deadline at submission time only.
- **Production deployment configuration**: deployment scripts and hosting setup. Phase 1 focuses on a local development build.
