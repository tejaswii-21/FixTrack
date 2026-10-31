// AdminDashboard.tsx - Real stats from Supabase. Initial state is zeros, not mock data.
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Clock, UserCheck, Activity, CheckCircle, AlertTriangle, Flame } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { PriorityBadge } from '@/components/dashboard/PriorityBadge'
import { PageHeader, LoadingState } from '@/components/ui/states'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { isSupabaseConfigured } from '@/lib/supabase'
import { getDashboardStats, getAllComplaints } from '@/services/complaints.service'
import { useComplaintsRealtime } from '@/hooks/useComplaintsRealtime'
import { formatRelativeTime } from '@/lib/utils'
import type { Complaint } from '@/types'

// Zero stats — shown only while loading, never the mock 156 value
const EMPTY_STATS = { total: 0, pending: 0, assigned: 0, inProgress: 0, resolved: 0, overdue: 0, critical: 0 }

export default function AdminDashboard() {
  const [stats, setStats] = useState(EMPTY_STATS)
  const [recent, setRecent] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) { setLoading(false); return }
    try {
      const [s, r] = await Promise.all([getDashboardStats(), getAllComplaints({ pageSize: 5 })])
      setStats(s); setRecent(r.items)
    } catch (e) { console.error('Dashboard load error:', e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])
  useComplaintsRealtime({ onInsert: load, onUpdate: load })

  if (loading) return <LoadingState message='Loading dashboard...' />

  return (
    <div>
      <PageHeader title='Admin Dashboard' description='System-wide complaint overview' />
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
        <StatCard title='Total Complaints' value={stats.total} icon={ClipboardList} color='royal' />
        <StatCard title='Pending' value={stats.pending} icon={Clock} color='amber' />
        <StatCard title='Assigned' value={stats.assigned} icon={UserCheck} color='blue' />
        <StatCard title='In Progress' value={stats.inProgress} icon={Activity} color='indigo' />
        <StatCard title='Resolved' value={stats.resolved} icon={CheckCircle} color='green' />
        <StatCard title='Overdue' value={stats.overdue} icon={AlertTriangle} color='orange' />
        <StatCard title='Critical' value={stats.critical} icon={Flame} color='red' />
      </div>
      <Card className='mt-6'>
        <CardHeader><CardTitle>Recent Complaints</CardTitle><CardDescription>Latest activity across all buildings</CardDescription></CardHeader>
        <CardContent>
          {recent.length === 0 ? <p className='text-sm text-gray-500 py-4 text-center'>No complaints yet.</p> : (
            <Table><TableHeader><TableRow><TableHead>Number</TableHead><TableHead>Title</TableHead><TableHead>Status</TableHead><TableHead>Priority</TableHead><TableHead>Submitted</TableHead></TableRow></TableHeader>
              <TableBody>{recent.map(c => (<TableRow key={c.id}><TableCell className='font-medium'>{c.complaintNumber}</TableCell><TableCell><Link to={`/complaints/`} className='text-royal hover:underline'>{c.title}</Link></TableCell><TableCell><StatusBadge status={c.status} /></TableCell><TableCell><PriorityBadge priority={c.priority} /></TableCell><TableCell className='text-sm text-gray-500'>{formatRelativeTime(c.submittedAt)}</TableCell></TableRow>))}</TableBody>
            </Table>)}
        </CardContent>
      </Card>
    </div>
  )
}
