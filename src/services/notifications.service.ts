// notifications.service.ts - In-app notification queries
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Notification, NotificationType } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapNotification(row: any): Notification {
  return {
    id: row.id,
    recipientId: row.recipient_id,
    complaintId: row.complaint_id ?? null,
    notificationType: (row.notification_type ?? 'complaint_submitted') as NotificationType,
    title: row.title ?? '',
    message: row.message ?? '',
    isRead: row.is_read ?? row.read_at != null,
    createdAt: row.created_at,
    readAt: row.read_at ?? null,
  }
}

export async function getNotifications(): Promise<Notification[]> {
  if (!isSupabaseConfigured || !supabase) return []
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) return []
  return (data ?? []).map(mapNotification)
}

export async function getUnreadCount(): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return 0
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)
  return count ?? 0
}

export async function markAsRead(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return
  await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', id)
}

export async function markAllAsRead(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return
  await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('is_read', false)
}