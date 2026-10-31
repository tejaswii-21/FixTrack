// Notifications.tsx - Real in-app notifications from Supabase.
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  FileText, UserCheck, Play, MessageSquare, CheckCircle,
  RefreshCw, AlertTriangle, Bell, CheckCheck, type LucideIcon,
} from 'lucide-react'
import { PageHeader, EmptyState, LoadingState } from '@/components/ui/states'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { isSupabaseConfigured } from '@/lib/supabase'
import * as notifService from '@/services/notifications.service'
import { mockNotifications } from '@/lib/mockData'
import { formatRelativeTime } from '@/lib/utils'
import type { Notification, NotificationType } from '@/types'

const icons: Record<NotificationType, LucideIcon> = {
  complaint_submitted: FileText, assigned: UserCheck, reassigned: UserCheck,
  work_started: Play, public_comment: MessageSquare, resolved: CheckCircle,
  reopening_requested: RefreshCw, overdue: AlertTriangle,
}
const colors: Record<NotificationType, string> = {
  complaint_submitted: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  assigned: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  reassigned: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  work_started: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  public_comment: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  resolved: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  reopening_requested: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  overdue: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isSupabaseConfigured) {
      notifService.getNotifications()
        .then(setNotifications)
        .catch(() => setNotifications(mockNotifications))
        .finally(() => setLoading(false))
    } else {
      setNotifications(mockNotifications)
      setLoading(false)
    }
  }, [])

  const unread = notifications.filter(n => !n.isRead).length

  const markRead = async (id: string) => {
    if (isSupabaseConfigured) await notifService.markAsRead(id)
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
    )
  }

  const markAll = async () => {
    if (isSupabaseConfigured) await notifService.markAllAsRead()
    const now = new Date().toISOString()
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: now })))
    toast.success('All notifications marked as read.')
  }

  if (loading) return <LoadingState message="Loading notifications…" />

  return (
    <div>
      <PageHeader
        title="Notifications"
        description={unread > 0 ? `${unread} unread` : 'All caught up'}
        action={unread > 0 ? <Button variant="outline" onClick={markAll}><CheckCheck className="h-4 w-4" /> Mark all read</Button> : undefined}
      />
      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="Updates about your complaints appear here." />
      ) : (
        <Card>
          <CardContent className="divide-y divide-gray-200 p-0 dark:divide-gray-700">
            {notifications.map(n => {
              const Icon = icons[n.notificationType] ?? Bell
              return (
                <div key={n.id} className={`flex gap-3 p-4 ${n.isRead ? '' : 'bg-royal/5 dark:bg-royal/10'}`}>
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colors[n.notificationType]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{n.title}</p>
                      {!n.isRead && <span className="h-2 w-2 rounded-full bg-royal" />}
                    </div>
                    <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">{n.message}</p>
                    <p className="mt-1 text-xs text-gray-400">{formatRelativeTime(n.createdAt)}</p>
                  </div>
                  {!n.isRead && (
                    <Button variant="ghost" size="sm" className="shrink-0 self-start" onClick={() => markRead(n.id)}>
                      Mark read
                    </Button>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}