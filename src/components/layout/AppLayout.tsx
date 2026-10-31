// AppLayout: the main application shell.
//
// Renders a collapsible sidebar (fixed on desktop, overlay on mobile), a top
// navigation bar with search + notifications + dark-mode toggle + profile
// dropdown, and a main content area where the routed page is shown via <Outlet>.
import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Menu, Search, Bell, Sun, Moon, User, Settings, LogOut } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export function AppLayout() {
  // Sidebar open/closed state (mobile only; always visible on desktop).
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { profile, role, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Mobile overlay: dims the page behind the sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar (fixed position, slides in on mobile) */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 transition-transform duration-200 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* Main content area (offset by sidebar width on desktop) */}
      <div className="lg:pl-64">
        {/* Top navigation bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-900">
          {/* Hamburger toggle (mobile only) */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Logo (shown on mobile since sidebar is hidden by default) */}
          <span className="text-lg font-bold text-navy dark:text-white lg:hidden">
            FixTrack
          </span>

          {/* Global search (hidden on small screens) */}
          <div className="relative hidden max-w-md flex-1 md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search complaints..." className="pl-9" />
          </div>

          {/* Right-side actions */}
          <div className="ml-auto flex items-center gap-1">
            {/* Dark mode toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* Notification bell (placeholder — navigates to notifications page) */}
            <Button
              variant="ghost"
              size="sm"
              className="relative"
              aria-label="Notifications"
              onClick={() => navigate('/notifications')}
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </Button>

            {/* Profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-full">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-royal text-white">
                  <User className="h-4 w-4" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>{profile?.fullName ?? 'Guest'}</DropdownMenuLabel>
                <DropdownMenuLabel className="text-xs font-normal capitalize text-gray-500">
                  {role.replace('_', ' ')}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Routed page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
