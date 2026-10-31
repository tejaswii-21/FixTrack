// AssignedToMe.tsx - Shows complaints assigned to the current logged-in user from Supabase.
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { PriorityBadge } from '@/components/dashboard/PriorityBadge'
import { PageHeader, EmptyState, LoadingState, ErrorState } from '@/components/ui/states'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { useAuth } from '@/contexts/AuthContext'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { formatRelativeTime, formatDate, isOverdue } from '@/lib/utils'
import type { Complaint } from '@/types'

export default function AssignedToMe() {
  const { user } = useAuth()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || !user?.id) { setLoading(false); return }
    setLoading(true); setError(null)
    try {
      const { data, error: err } = await supabase
        .from('complaints')
        .select('*, complaint_categories(id, name)')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false })
      if (err) throw err
      setComplaints((data ?? []).map((row: any) => ({
        id: row.id, complaintNumber: row.complaint_number, title: row.title,
        description: row.description, categoryId: row.category_id,
        location: row.location ?? '', building: row.building ?? '',
        floor: row.floor ?? null, roomNumber: row.room_number ?? null,
        priority: row.priority, status: row.status,
        submittedBy: row.submitted_by, assignedTo: row.assigned_to ?? null,
        submittedAt: row.submitted_at ?? row.created_at, dueAt: row.due_at ?? null,
        resolvedAt: row.resolved_at ?? null, resolutionNotes: row.resolution_notes ?? null,
        createdAt: row.created_at, updatedAt: row.updated_at,
        category: row.complaint_categories ? { id: row.complaint_categories.id, name: row.complaint_categories.name } : null,
        submitter: null, assignee: null,
      })))
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to load') }
    finally { setLoading(false) }
  }, [user?.id])

  useEffect(() => { load() }, [load])

  if (loading) return <LoadingState message='Loading assigned complaints...' />
  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div>
      <PageHeader title='Assigned to Me' description='Complaints assigned to you for management' />
      {complaints.length === 0 ? (
        <EmptyState icon={CheckCircle} title='No complaints assigned to you yet' description='Assignments will appear here once a complaint is assigned to your account.' />
      ) : (
        <Card><CardContent className='p-0'>
          <Table><TableHeader><TableRow>
            <TableHead>Number</TableHead><TableHead>Title</TableHead><TableHead>Category</TableHead>
            <TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead>Deadline</TableHead><TableHead>Submitted</TableHead>
          </TableRow></TableHeader>
          <TableBody>{complaints.map(complaint => {
            const overdue = isOverdue(complaint.dueAt, complaint.status)
            return (<TableRow key={complaint.id}>
              <TableCell className='font-medium'>{complaint.complaintNumber}</TableCell>
              <TableCell><Link to={`/complaints/`} className='text-royal hover:underline'>{complaint.title}</Link></TableCell>
              <TableCell className='text-gray-500'>{complaint.category?.name ?? '—'}</TableCell>
              <TableCell><PriorityBadge priority={complaint.priority} /></TableCell>
              <TableCell><StatusBadge status={complaint.status} /></TableCell>
              <TableCell>{complaint.dueAt ? <span className={overdue ? 'inline-flex items-center gap-1 text-sm font-medium text-red-600' : 'text-sm text-gray-500'}>{overdue && <AlertTriangle className='h-3 w-3' />}{formatDate(complaint.dueAt)}</span> : <span className='text-sm text-gray-400'>No deadline</span>}</TableCell>
              <TableCell className='text-sm text-gray-500'>{formatRelativeTime(complaint.submittedAt)}</TableCell>
            </TableRow>)
          })}</TableBody></Table>
        </CardContent></Card>
      )}
    </div>
  )
}
