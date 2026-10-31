// ResidentDashboard.tsx - Shows the signed-in resident's real complaint stats.
import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ClipboardList, Clock, Activity, CheckCircle, PlusCircle } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { PriorityBadge } from '@/components/dashboard/PriorityBadge'
import { PageHeader, EmptyState, LoadingState } from '@/components/ui/states'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { isSupabaseConfigured } from '@/lib/supabase'
import { getDashboardStats, getMyComplaints } from '@/services/complaints.service'
import { useComplaintsRealtime } from '@/hooks/useComplaintsRealtime'
import { residentStats, mockComplaints, MOCK_RESIDENT_ID } from '@/lib/mockData'
import { formatRelativeTime } from '@/lib/utils'
import type { Complaint } from '@/types'

export default function ResidentDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stats, setStats] = useState(residentStats)
  const [complaints, setComplaints] = useState<Complaint[]>(
    mockComplaints.filter(c => c.submittedBy === MOCK_RESIDENT_ID)
  )
  const [loading, setLoading] = useState(isSupabaseConfigured && !!user?.id)

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !user?.id) return
    try {
      const [s, r] = await Promise.all([
        getDashboardStats(user.id),
        getMyComplaints(user.id, { pageSize: 6 }),
      ])
      setStats(s)
      setComplaints(r.items)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { load() }, [load])
  useComplaintsRealtime({
    onInsert: load, onUpdate: load,
    filter: user?.id ? `submitted_by=eq.${user.id}` : undefined,
  })

  if (loading) return <LoadingState message="Loading your dashboard…" />

  return (
    <div>
      <PageHeader
        title="My Dashboard"
        description="Track your submitted complaints"
        action={<Button onClick={() => navigate('/complaints/new')}><PlusCircle className="h-4 w-4" /> Submit Complaint</Button>}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="My Complaints" value={stats.total} icon={ClipboardList} color="royal" />
        <StatCard title="Pending" value={stats.pending} icon={Clock} color="amber" />
        <StatCard title="In Progress" value={stats.inProgress} icon={Activity} color="indigo" />
        <StatCard title="Resolved" value={stats.resolved} icon={CheckCircle} color="green" />
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>My Recent Complaints</CardTitle>
          <CardDescription>Complaints you have submitted</CardDescription>
        </CardHeader>
        <CardContent>
          {complaints.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No complaints yet"
              description="Submit your first complaint to get started."
              action={<Button onClick={() => navigate('/complaints/new')}><PlusCircle className="h-4 w-4" /> Submit Complaint</Button>}
            />
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {complaints.map(c => (
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