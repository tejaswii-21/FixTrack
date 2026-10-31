// MyComplaints.tsx - Fetches real complaints from Supabase for the signed-in user.
import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, PlusCircle, FileText } from 'lucide-react'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { PriorityBadge } from '@/components/dashboard/PriorityBadge'
import { PageHeader, EmptyState, LoadingState, ErrorState } from '@/components/ui/states'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectItem } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { useAuth } from '@/contexts/AuthContext'
import { isSupabaseConfigured } from '@/lib/supabase'
import { getMyComplaints } from '@/services/complaints.service'
import { useComplaintsRealtime } from '@/hooks/useComplaintsRealtime'
import { mockComplaints, MOCK_RESIDENT_ID } from '@/lib/mockData'
import { formatRelativeTime } from '@/lib/utils'
import type { Complaint, ComplaintStatus } from '@/types'

export default function MyComplaints() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !user?.id) {
      // Demo fallback
      setComplaints(mockComplaints.filter(c => c.submittedBy === MOCK_RESIDENT_ID))
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await getMyComplaints(user.id, {
        search: search || undefined,
        status: (statusFilter as ComplaintStatus) || undefined,
        priority: (priorityFilter as Complaint['priority']) || undefined,
      })
      setComplaints(result.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load complaints')
    } finally {
      setLoading(false)
    }
  }, [user?.id, search, statusFilter, priorityFilter])

  useEffect(() => { load() }, [load])

  // Realtime: refresh when a new complaint is inserted for this user
  useComplaintsRealtime({
    onInsert: load,
    onUpdate: load,
    filter: user?.id ? `submitted_by=eq.${user.id}` : undefined,
  })

  return (
    <div>
      <PageHeader
        title="My Complaints"
        description="Complaints you have submitted"
        action={
          <Button onClick={() => navigate('/complaints/new')}>
            <PlusCircle className="h-4 w-4" /> Submit Complaint
          </Button>
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by title or number…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="sm:w-44">
          <SelectItem value="">All Statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="assigned">Assigned</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
          <SelectItem value="reopened">Reopened</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </Select>
        <Select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="sm:w-44">
          <SelectItem value="">All Priorities</SelectItem>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="critical">Critical</SelectItem>
        </Select>
      </div>
      {loading ? (
        <LoadingState message="Loading your complaints…" />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : complaints.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No complaints found"
          description="Submit your first complaint to get started."
          action={
            <Button onClick={() => navigate('/complaints/new')}>
              <PlusCircle className="h-4 w-4" /> Submit Complaint
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complaints.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.complaintNumber}</TableCell>
                    <TableCell>
                      <Link to={`/complaints/${c.id}`} className="text-royal hover:underline">
                        {c.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-gray-500">{c.category?.name ?? '—'}</TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
                    <TableCell><PriorityBadge priority={c.priority} /></TableCell>
                    <TableCell className="text-sm text-gray-500">{c.assignee ? (c.assignee.fullName + (c.assignee.department ? ' (' + c.assignee.department + ')' : '')) : 'Not Yet Assigned'}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatRelativeTime(c.submittedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
