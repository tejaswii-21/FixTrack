// StaffDashboard.tsx - Shows real assigned complaints for maintenance staff.
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Wrench, Clock, Activity, CheckCircle, AlertTriangle } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { PriorityBadge } from '@/components/dashboard/PriorityBadge'
import { PageHeader, EmptyState, LoadingState } from '@/components/ui/states'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { isSupabaseConfigured } from '@/lib/supabase'
import { getDashboardStats, getAllComplaints } from '@/services/complaints.service'
import { useComplaintsRealtime } from '@/hooks/useComplaintsRealtime'
import { staffStats, mockComplaints, MOCK_STAFF_ID } from '@/lib/mockData'
import { formatRelativeTime, isOverdue } from '@/lib/utils'
import type { Complaint } from '@/types'

export default function StaffDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(staffStats)
  const [tasks, setTasks] = useState<Complaint[]>(
    mockComplaints.filter(c => c.assignedTo === MOCK_STAFF_ID && !['resolved','cancelled'].includes(c.status))
  )
  const [loading, setLoading] = useState(isSupabaseConfigured && !!user?.id)

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !user?.id) return
    try {
      const [s, r] = await Promise.all([
        getDashboardStats(),
        getAllComplaints({ pageSize: 50 }),
      ])
      const assigned = r.items.filter(
        c => c.assignedTo === user.id && !['resolved','cancelled'].includes(c.status)
      )
      setStats({ ...s, total: assigned.length })
      setTasks(assigned)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [user?.id])

  useEffect(() => { load() }, [load])
  useComplaintsRealtime({ onInsert: load, onUpdate: load })

  if (loading) return <LoadingState message="Loading your tasks…" />

  return (
    <div>
      <PageHeader title="Staff Dashboard" description="Your assigned maintenance tasks" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard title="Assigned" value={tasks.filter(c=>c.status==='assigned').length} icon={Wrench} color="royal" />
        <StatCard title="Pending" value={tasks.filter(c=>c.status==='pending').length} icon={Clock} color="amber" />
        <StatCard title="In Progress" value={tasks.filter(c=>c.status==='in_progress').length} icon={Activity} color="indigo" />
        <StatCard title="Completed" value={stats.resolved} icon={CheckCircle} color="green" />
        <StatCard title="Overdue" value={tasks.filter(c=>isOverdue(c.dueAt,c.status)).length} icon={AlertTriangle} color="red" />
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle>My Tasks</CardTitle><CardDescription>Sorted by priority</CardDescription></CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <EmptyState icon={CheckCircle} title="No active tasks" description="New assignments will appear here." />
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {tasks.map(c => (
                <li key={c.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <Link to={`/complaints/${c.id}`} className="block truncate font-medium text-royal hover:underline">
                      {c.title}
                    </Link>
                    <p className="text-sm text-gray-500">
                      {c.complaintNumber} · {c.category?.name ?? '—'} · {formatRelativeTime(c.submittedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {isOverdue(c.dueAt, c.status) && (
                      <span className="text-xs font-medium text-red-600"><AlertTriangle className="inline h-3 w-3" /> Overdue</span>
                    )}
                    <PriorityBadge priority={c.priority} />
                    <StatusBadge status={c.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}