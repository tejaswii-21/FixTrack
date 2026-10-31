// Sidebar: the navy-blue left navigation panel.
//
// Renders navigation items filtered by the current user's role. Active links
// are highlighted with bg-navy-light. On mobile the sidebar slides in/out
// (controlled by AppLayout); clicking a link calls onNavigate to close it.
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  PlusCircle,
  Wrench,
  Tags,
  Users,
  BarChart3,
  Bell,
  User,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import type { Role } from '@/types'
import { cn } from '@/lib/utils'

// One navigation entry. `roles` lists which roles can see this item.
interface NavItem {
  label: string
  path: string
  icon: LucideIcon
  roles: Role[]
}

// Master list — order here determines the order shown for every role.
const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    roles: ['resident', 'maintenance_staff', 'administrator'],
  },
  {
    label: 'All Complaints',
    path: '/complaints',
    icon: ClipboardList,
    roles: ['administrator'],
  },
  {
    label: 'Assigned to Me',
    path: '/assigned',
    icon: Wrench,
    roles: ['maintenance_staff', 'administrator'],
  },
  {
    label: 'My Complaints',
    path: '/complaints/my',
    icon: FileText,
    roles: ['resident', 'maintenance_staff'],
  },
  {
    label: 'Submit Complaint',
    path: '/complaints/new',
    icon: PlusCircle,
    roles: ['resident', 'maintenance_staff'],
  },
  {
    label: 'Categories',
    path: '/categories',
    icon: Tags,
    roles: ['administrator'],
  },
  {
    label: 'Maintenance Team',
    path: '/maintenance-team',
    icon: Users,
    roles: ['administrator'],
  },
  {
    label: 'Reports & Analytics',
    path: '/reports',
    icon: BarChart3,
    roles: ['administrator'],
  },
  {
    label: 'Notifications',
    path: '/notifications',
    icon: Bell,
    roles: ['resident', 'maintenance_staff', 'administrator'],
  },
  {
    label: 'Profile',
    path: '/profile',
    icon: User,
    roles: ['resident', 'maintenance_staff', 'administrator'],
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: Settings,
    roles: ['resident', 'maintenance_staff', 'administrator'],
  },
]

interface SidebarProps {
  /** Called when a nav link is clicked (closes the mobile sidebar). */
  onNavigate?: () => void
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { role } = useAuth()
  const items = navItems.filter((item) => item.roles.includes(role))

  return (
    <div className="flex h-full w-64 flex-col bg-navy text-white">
      {/* Logo header */}
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-navy-light px-6">
        <Wrench className="h-6 w-6 text-cyan-400" />
        <span className="text-lg font-bold">FixTrack</span>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-navy-light text-white'
                  : 'text-gray-300 hover:bg-navy-light/50 hover:text-white',
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-navy-light p-3">
        <p className="px-3 text-xs text-gray-400">FixTrack v0.1.0</p>
      </div>
    </div>
  )
}
