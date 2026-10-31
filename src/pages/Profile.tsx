// Profile page: user profile card with editable fields.
//
// Shows the current user's name, email, phone, role, and avatar placeholder.
// Fields are editable and save shows a toast. Phase 2 will persist to Supabase.
import { useState } from 'react'
import { toast } from 'sonner'
import { User as UserIcon, Mail, Phone, Lock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/components/ui/states'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function Profile() {
  const { profile, role } = useAuth()
  const [fullName, setFullName] = useState(profile?.fullName ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')

  const handleSave = () => {
    // Phase 2 will call supabase to update the profile.
    toast.success('Profile updated successfully.')
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Profile" description="Manage your personal information" />

      <Card>
        {/* Avatar + name header */}
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-royal text-2xl font-bold text-white">
            {(profile?.fullName ?? 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <CardTitle>{profile?.fullName ?? 'Guest User'}</CardTitle>
            <CardDescription>
              <Badge variant="default" className="mt-1 capitalize">
                {role.replace('_', ' ')}
              </Badge>
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Full name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="email"
                value={profile?.id ? 'demo@fixtrack.app' : ''}
                readOnly
                disabled
                className="pl-9"
              />
            </div>
            <p className="text-xs text-gray-500">Email cannot be changed.</p>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="pl-9"
              />
            </div>
          </div>

          {/* Change password (placeholder) */}
          <div className="space-y-2">
            <Label>Password</Label>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => toast.info('Password change dialog will open here.')}
            >
              <Lock className="h-4 w-4" />
              Change Password
            </Button>
          </div>

          {/* Save */}
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
