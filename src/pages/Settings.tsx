// Settings page: theme toggle and user preferences.
//
// The dark mode toggle is fully functional (uses ThemeContext). Preference
// toggles are visual placeholders for Phase 1.
import { useState } from 'react'
import { Sun, Moon, Bell, Mail } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { PageHeader } from '@/components/ui/states'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/** A small on/off toggle switch (visual only for Phase 1 preferences). */
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        'relative h-6 w-11 rounded-full transition-colors',
        checked ? 'bg-royal' : 'bg-gray-300 dark:bg-gray-600',
      )}
      aria-pressed={checked}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

export default function Settings() {
  const { theme, toggleTheme } = useTheme()
  // Placeholder preferences (not persisted in Phase 1).
  const [emailNotif, setEmailNotif] = useState(true)
  const [pushNotif, setPushNotif] = useState(false)

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Settings" description="Manage your app preferences" />

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how FixTrack looks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="h-5 w-5 text-gray-400" />
              ) : (
                <Sun className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <Label>Dark Mode</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Toggle between light and dark appearance
                </p>
              </div>
            </div>
            <Toggle checked={theme === 'dark'} onChange={toggleTheme} />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose how you want to be notified</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <Label>Email notifications</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Receive updates about your complaints via email
                </p>
              </div>
            </div>
            <Toggle checked={emailNotif} onChange={() => setEmailNotif(!emailNotif)} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-gray-400" />
              <div>
                <Label>Push notifications</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Get in-app notifications for real-time updates
                </p>
              </div>
            </div>
            <Toggle checked={pushNotif} onChange={() => setPushNotif(!pushNotif)} />
          </div>
        </CardContent>
      </Card>

      {/* Account */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Manage your account settings</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => toggleTheme()}>
            {theme === 'dark' ? (
              <>
                <Sun className="h-4 w-4" />
                Switch to Light Mode
              </>
            ) : (
              <>
                <Moon className="h-4 w-4" />
                Switch to Dark Mode
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
