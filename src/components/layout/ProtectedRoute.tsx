// ProtectedRoute: wraps routes that require authentication.
// Waits for the AuthContext loading state before redirecting, so that
// a page refresh does not incorrectly bounce the user to /login while
// Supabase is still restoring the session asynchronously.
import { Navigate, Outlet } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export function ProtectedRoute() {
  const { user, loading } = useAuth()

  // Still checking session — render a spinner instead of redirecting.
  // This prevents the /login bounce on page refresh.
  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950'>
        <Loader2 className='h-8 w-8 animate-spin text-royal' />
      </div>
    )
  }

  if (!user) {
    return <Navigate to='/login' replace />
  }

  return <Outlet />
}
