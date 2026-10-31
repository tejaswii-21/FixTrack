// RoleDashboard: renders the correct dashboard based on the user's role.
//
// This is the component mounted at the /dashboard route. It delegates to
// AdminDashboard, StaffDashboard, or ResidentDashboard.
import { useAuth } from '@/contexts/AuthContext'
import AdminDashboard from './AdminDashboard'
import ResidentDashboard from './ResidentDashboard'
import StaffDashboard from './StaffDashboard'

export default function RoleDashboard() {
  const { role } = useAuth()

  if (role === 'administrator') return <AdminDashboard />
  if (role === 'maintenance_staff') return <StaffDashboard />
  return <ResidentDashboard />
}
