// AppRoutes: defines all routes for FixTrack.
//
// Public routes (login, register, etc.) are accessible without authentication.
// Protected routes are wrapped in <ProtectedRoute> (checks auth) and
// <AppLayout> (sidebar + top nav). Admin/staff-only routes additionally use
// <RoleGuard> to restrict access by role.
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { RoleGuard } from '@/components/layout/RoleGuard'

// Auth pages (public)
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'

// Dashboard (renders the right dashboard by role)
import RoleDashboard from '@/pages/dashboard/RoleDashboard'

// Complaint pages
import AllComplaints from '@/pages/complaints/AllComplaints'
import MyComplaints from '@/pages/complaints/MyComplaints'
import SubmitComplaint from '@/pages/complaints/SubmitComplaint'
import ComplaintDetails from '@/pages/complaints/ComplaintDetails'

// Admin / maintenance pages
import AssignedToMe from '@/pages/maintenance/AssignedToMe'
import Categories from '@/pages/settings/Categories'
import MaintenanceTeam from '@/pages/maintenance/MaintenanceTeam'
import ReportsAnalytics from '@/pages/reports/ReportsAnalytics'

// User pages
import Notifications from '@/pages/Notifications'
import Profile from '@/pages/Profile'
import Settings from '@/pages/Settings'

// Error pages
import AccessDenied from '@/pages/AccessDenied'
import NotFound from '@/pages/NotFound'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Root: redirect to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected routes (require auth + app layout) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Dashboard */}
          <Route path="/dashboard" element={<RoleDashboard />} />

          {/* Complaints */}
          <Route
            path="/complaints"
            element={
              <RoleGuard roles={['administrator']}>
                <AllComplaints />
              </RoleGuard>
            }
          />
          <Route path="/complaints/my" element={<MyComplaints />} />
          <Route path="/complaints/new" element={<SubmitComplaint />} />
          <Route path="/complaints/:id" element={<ComplaintDetails />} />

          {/* Assigned to me (staff + admin) */}
          <Route
            path="/assigned"
            element={
              <RoleGuard roles={['administrator', 'maintenance_staff']}>
                <AssignedToMe />
              </RoleGuard>
            }
          />

          {/* Admin-only pages */}
          <Route
            path="/categories"
            element={
              <RoleGuard roles={['administrator']}>
                <Categories />
              </RoleGuard>
            }
          />
          <Route
            path="/maintenance-team"
            element={
              <RoleGuard roles={['administrator']}>
                <MaintenanceTeam />
              </RoleGuard>
            }
          />
          <Route
            path="/reports"
            element={
              <RoleGuard roles={['administrator']}>
                <ReportsAnalytics />
              </RoleGuard>
            }
          />

          {/* User pages */}
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Error pages */}
      <Route path="/access-denied" element={<AccessDenied />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
