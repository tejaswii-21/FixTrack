// RoleGuard: restricts a route to specific roles.
//
// Wrap a page with <RoleGuard roles={['administrator']}>...</RoleGuard> and
// users whose role is not in the list are redirected to /access-denied.
import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import type { Role } from '@/types'

interface RoleGuardProps {
  /** Roles that are allowed to view the wrapped content. */
  roles: Role[]
  /** The protected page or component. */
  children: ReactNode
}

export function RoleGuard({ roles, children }: RoleGuardProps) {
  const { role } = useAuth()

  if (!roles.includes(role)) {
    return <Navigate to="/access-denied" replace />
  }

  return <>{children}</>
}
