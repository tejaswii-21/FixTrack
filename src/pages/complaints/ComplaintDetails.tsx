// ComplaintDetails.tsx - Fetches a single complaint from Supabase by UUID.
// Falls back to mock data when Supabase is not configured.
import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, MapPin, Building2, Calendar, User, Clock, MessageSquare, CheckCircle, Play, RefreshCw, XCircle, Send, UserCheck, AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { isSupabaseConfigured } from '@/lib/supabase'
import { getComplaintById, updateComplaintStatus, assignComplaint, getMaintenanceStaff, deleteComplaint } from '@/services/complaints.service'
import type { StaffOption } from '@/services/complaints.service'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { PriorityBadge } from '@/components/dashboard/PriorityBadge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { mockComplaints } from '@/lib/mockData'
import { formatDate, formatDateTime, isOverdue } from '@/lib/utils'
import type { Complaint } from '@/types'

export default function ComplaintDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { role } = useAuth()
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  // Admin action state
  const [staffList, setStaffList] = useState<StaffOption[]>([])
  const [showAssign, setShowAssign] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!id) { setNotFound(true); setLoading(false); return }
    if (!isSupabaseConfigured) {
      const found = mockComplaints.find((c) => c.id === id) ?? null
      setComplaint(found); setNotFound(!found); setLoading(false); return
    }
    setLoading(true); setFetchError(null)
    getComplaintById(id)
      .then((result) => { if (result) { setComplaint(result); setNotFound(false) } else { setNotFound(true) } })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to load complaint'
        if (msg.includes('PGRST116') || msg.includes('JSON object requested')) { setNotFound(true) } else { setFetchError(msg) }
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleAddComment = () => { if (!commentText.trim()) return; toast.success('Comment added!'); setCommentText('') }
  if (loading) return (<div className='flex items-center justify-center py-20'><Loader2 className='h-8 w-8 animate-spin text-royal' /></div>)

  if (fetchError) return (
    <div>
      <Link to='/complaints/my' className='mb-4 inline-flex items-center gap-1 text-sm text-royal hover:underline'><ArrowLeft className='h-4 w-4' /> Back</Link>
      <Card className='mx-auto max-w-lg'><CardContent className='flex flex-col items-center justify-center gap-3 py-12 text-center'>
        <AlertTriangle className='h-12 w-12 text-red-500' />
        <h3 className='text-lg font-semibold'>Could not load complaint</h3>
        <p className='text-sm text-gray-500 dark:text-gray-400'>{fetchError}</p>
        <Button variant='outline' onClick={() => navigate('/complaints/my')}>Back to My Complaints</Button>
      </CardContent></Card>
    </div>
  )

  if (notFound || !complaint) return (
    <div>
      <Link to='/complaints/my' className='mb-4 inline-flex items-center gap-1 text-sm text-royal hover:underline'><ArrowLeft className='h-4 w-4' /> Back</Link>
      <Card className='mx-auto max-w-lg'><CardContent className='flex flex-col items-center justify-center gap-3 py-12 text-center'>
        <AlertTriangle className='h-12 w-12 text-red-500' />
        <h3 className='text-lg font-semibold'>Complaint not found</h3>
        <p className='text-sm text-gray-500 dark:text-gray-400'>This complaint does not exist or you are not authorised to view it.</p>
        <Button variant='outline' onClick={() => navigate('/complaints/my')}>Back to My Complaints</Button>
      </CardContent></Card>
    </div>
  )

  // Complaint loaded successfully
  const overdue = isOverdue(complaint.dueAt, complaint.status)

  return (
    <div>
      <Link to='/complaints/my' className='mb-4 inline-flex items-center gap-1 text-sm text-royal hover:underline'><ArrowLeft className='h-4 w-4' /> Back to complaints</Link>

      <Card>
        <CardContent className='space-y-4 p-6'>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div><p className='text-sm text-gray-500'>{complaint.complaintNumber}</p><h1 className='text-xl font-bold text-gray-900 dark:text-gray-100'>{complaint.title}</h1></div>
            <div className='flex items-center gap-2'>
              {overdue && <span className='inline-flex items-center gap-1 text-xs font-medium text-red-600'><AlertTriangle className='h-3 w-3' /> Overdue</span>}
              <PriorityBadge priority={complaint.priority} /><StatusBadge status={complaint.status} />
            </div>
          </div>
          <p className='text-sm text-gray-600 dark:text-gray-300'>{complaint.description}</p>
          <dl className='grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 dark:border-gray-700 sm:grid-cols-2 lg:grid-cols-3'>
            <div><dt className='flex items-center gap-1.5 text-sm font-medium text-gray-500'><Building2 className='h-4 w-4' /> Category</dt><dd className='mt-1 text-sm'>{complaint.category?.name ?? 'Uncategorized'}</dd></div>
            <div><dt className='flex items-center gap-1.5 text-sm font-medium text-gray-500'><Building2 className='h-4 w-4' /> Building</dt><dd className='mt-1 text-sm'>{complaint.building}</dd></div>
            <div><dt className='flex items-center gap-1.5 text-sm font-medium text-gray-500'><MapPin className='h-4 w-4' /> Location</dt><dd className='mt-1 text-sm'>{complaint.location}</dd></div>
            <div><dt className='text-sm font-medium text-gray-500'>Floor</dt><dd className='mt-1 text-sm'>{complaint.floor || '—'}</dd></div>
            <div><dt className='text-sm font-medium text-gray-500'>Room</dt><dd className='mt-1 text-sm'>{complaint.roomNumber || '—'}</dd></div>
            <div><dt className='flex items-center gap-1.5 text-sm font-medium text-gray-500'><User className='h-4 w-4' /> Assignee</dt><dd className='mt-1 text-sm'>{complaint.assignee ? (complaint.assignee.fullName + (complaint.assignee.department ? ' (' + complaint.assignee.department + ')' : '')) : 'Not Yet Assigned'}</dd></div>
            <div><dt className='flex items-center gap-1.5 text-sm font-medium text-gray-500'><Calendar className='h-4 w-4' /> Submitted</dt><dd className='mt-1 text-sm'>{formatDateTime(complaint.submittedAt)}</dd></div>
            <div><dt className='flex items-center gap-1.5 text-sm font-medium text-gray-500'><Clock className='h-4 w-4' /> Due date</dt><dd className='mt-1 text-sm'>{complaint.dueAt ? formatDate(complaint.dueAt) : 'No deadline'}</dd></div>
          </dl>
          {complaint.resolutionNotes && <div className='border-t border-gray-200 pt-4 dark:border-gray-700'><p className='text-sm font-medium text-gray-500'>Resolution notes</p><p className='mt-1 text-sm'>{complaint.resolutionNotes}</p></div>}
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className='mt-4 flex flex-wrap gap-2'>
        {role === 'resident' && complaint.status === 'resolved' && <Button variant='outline' onClick={() => toast.success('Reopening requested.')}><RefreshCw className='h-4 w-4' /> Request Reopening</Button>}
        {role === 'resident' && complaint.status === 'pending' && <Button variant='destructive' onClick={() => toast.success('Complaint cancelled.')}><XCircle className='h-4 w-4' /> Cancel Complaint</Button>}
        {role === 'resident' && <Button variant='destructive' onClick={() => setConfirmDelete(true)}><Trash2 className='h-4 w-4' /> Delete Complaint</Button>}
        {role === 'maintenance_staff' && complaint.status === 'assigned' && <Button onClick={() => toast.success('Work started.')}><Play className='h-4 w-4' /> Start Work</Button>}
        {role === 'maintenance_staff' && complaint.status === 'in_progress' && <Button onClick={() => toast.success('Marked as resolved.')}><CheckCircle className='h-4 w-4' /> Mark as Resolved</Button>}
        {role === 'administrator' && !['resolved','cancelled'].includes(complaint.status) && (
          <Button disabled={actionLoading} onClick={async () => {
            // Always try to load staff, always show the panel even if load fails
            if (staffList.length === 0) {
              setActionLoading(true)
              try {
                const s = await getMaintenanceStaff()
                setStaffList(s)
              } catch (err) {
                console.error('Failed to load staff:', err)
                toast.error('Could not load staff list. Check Supabase connection.')
              } finally {
                setActionLoading(false)
              }
            }
            setShowAssign(true)  // always open the panel
          }}><UserCheck className='h-4 w-4' /> Assign Staff</Button>

        )}
        {role === 'administrator' && !['resolved','cancelled'].includes(complaint.status) && (
          <select className='h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-royal/60 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100'
            value={complaint.status}
            disabled={actionLoading}
            onChange={async (e) => {
              const newStatus = e.target.value as import('@/types').ComplaintStatus
              setActionLoading(true)
              try {
                await updateComplaintStatus(complaint.id, newStatus)
                setComplaint({ ...complaint, status: newStatus })
                toast.success('Status updated to ' + newStatus.replace('_', ' '))
              } catch (err) { toast.error(err instanceof Error ? err.message : 'Update failed') }
              finally { setActionLoading(false) }
            }}>
            <option value='pending'>Pending</option>
            <option value='assigned'>Assigned</option>
            <option value='in_progress'>In Progress</option>
            <option value='resolved'>Resolved</option>
            <option value='cancelled'>Cancelled</option>
          </select>
        )}
        {/* Assign Staff Panel — shown when showAssign is true */}
        {showAssign && role === 'administrator' && (
          <div className='mt-2 flex w-full flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900'>
            <p className='text-sm font-medium'>Select maintenance staff to assign:</p>
            {staffList.length === 0 ? <p className='text-sm text-gray-500'>No active staff found. Add staff in the Maintenance Team page.</p> : (
              <div className='flex gap-2'>
                <select className='h-9 flex-1 rounded-md border border-gray-300 bg-white px-2 text-sm dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100'
                  value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)}>
                  <option value=''>-- choose staff --</option>
                  {staffList.map(s => <option key={s.id} value={s.id}>{s.fullName}{s.department ? ' (' + s.department + ')' : ''}</option>)}
                </select>
                <Button size='sm' disabled={!selectedStaff || actionLoading} onClick={async () => {
                  setActionLoading(true)
                  try {
                    await assignComplaint(complaint.id, selectedStaff)
                    const staffName = staffList.find(s => s.id === selectedStaff)?.fullName ?? 'staff'
                    setComplaint({ ...complaint, status: 'assigned', assignedTo: selectedStaff, assignee: { id: selectedStaff, fullName: staffName } })
                    toast.success('Assigned to ' + staffName)
                    setShowAssign(false); setSelectedStaff('')
                  } catch (err) { toast.error(err instanceof Error ? err.message : 'Assign failed') }
                  finally { setActionLoading(false) }
                }}>Confirm</Button>
                <Button size='sm' variant='outline' onClick={() => setShowAssign(false)}>Cancel</Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status timeline */}
      <Card className='mt-6'>
        <CardHeader><CardTitle>Status Timeline</CardTitle><CardDescription>Track the progress of this complaint</CardDescription></CardHeader>
        <CardContent><div className='space-y-0'>
          <div className='flex gap-3'><div className='flex flex-col items-center'><div className='flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'><Clock className='h-4 w-4' /></div><div className='w-px flex-1 bg-gray-200 dark:bg-gray-700' /></div><div className='pb-4'><p className='text-sm font-medium'>Submitted</p><p className='text-xs text-gray-500'>{formatDateTime(complaint.submittedAt)}</p></div></div>
          {complaint.status !== 'pending' && <div className='flex gap-3'><div className='flex flex-col items-center'><div className='flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'><UserCheck className='h-4 w-4' /></div><div className='w-px flex-1 bg-gray-200 dark:bg-gray-700' /></div><div className='pb-4'><p className='text-sm font-medium'>Assigned to {complaint.assignee?.fullName ?? 'staff'}</p></div></div>}
          {['in_progress','resolved','reopened'].includes(complaint.status) && <div className='flex gap-3'><div className='flex flex-col items-center'><div className='flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'><Play className='h-4 w-4' /></div><div className='w-px flex-1 bg-gray-200 dark:bg-gray-700' /></div><div className='pb-4'><p className='text-sm font-medium'>Work started</p></div></div>}
          {complaint.status === 'resolved' && <div className='flex gap-3'><div className='flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'><CheckCircle className='h-4 w-4' /></div><div><p className='text-sm font-medium'>Resolved</p></div></div>}
        </div></CardContent>
      </Card>

      {/* Comments */}
      <Card className='mt-6'>
        <CardHeader><CardTitle>Comments</CardTitle><CardDescription>Public discussion about this complaint</CardDescription></CardHeader>
        <CardContent className='space-y-4'>
          <div className='border-t border-gray-200 pt-4 dark:border-gray-700'>
            <div className='flex gap-3'>
              <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-500 dark:bg-gray-700'><MessageSquare className='h-4 w-4' /></div>
              <div className='flex-1 space-y-2'>
                <textarea rows={2} placeholder='Write a comment...' value={commentText} onChange={(e) => setCommentText(e.target.value)} className='flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/60 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100' />
                <div className='flex justify-end'><Button size='sm' onClick={handleAddComment} disabled={!commentText.trim()}><Send className='h-4 w-4' /> Post Comment</Button></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    {confirmDelete && (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
        <div className='w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>Delete Complaint?</h3>
          <p className='mt-2 text-sm text-gray-500'>Delete <strong>{complaint.complaintNumber}</strong>? This cannot be undone. Only your own complaints can be deleted.</p>
          <div className='mt-4 flex justify-end gap-2'>
            <Button variant='outline' onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant='destructive' onClick={async () => {
              try {
                await deleteComplaint(complaint.id)
                toast.success('Complaint deleted.')
                navigate('/complaints/my')
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Delete failed')
                setConfirmDelete(false)
              }
            }}>Delete</Button>
          </div>
        </div>
      </div>
    )}
    </div>
  )
}
