// ReportsAnalytics.tsx - Real stats from Supabase, no mock data.
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { ClipboardList, Clock, CheckCircle, AlertTriangle, Download } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { PageHeader, LoadingState } from '@/components/ui/states'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { getAllComplaints } from '@/services/complaints.service'
import { toCsvRow } from '@/lib/utils'
import type { Complaint } from '@/types'

const EMPTY = { total:0, pending:0, assigned:0, inProgress:0, resolved:0, overdue:0, critical:0 }

export default function ReportsAnalytics() {
  const [stats, setStats] = useState(EMPTY)
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [categoryBreakdown, setCategoryBreakdown] = useState<{name:string;count:number}[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) { setLoading(false); return }
    try {
      const { data: rows } = await supabase.from('complaints').select('status,priority,due_at,complaint_categories(name)')
      if (rows) {
        const now = new Date()
        const s = { total:rows.length, pending:0, assigned:0, inProgress:0, resolved:0, overdue:0, critical:0 }
        const catMap: Record<string,number> = {}
        rows.forEach((r:any) => {
          if (r.status==='pending') s.pending++
          else if (r.status==='assigned') s.assigned++
          else if (r.status==='in_progress') s.inProgress++
          else if (r.status==='resolved') s.resolved++
          if (r.priority==='critical') s.critical++
          if (r.due_at && new Date(r.due_at)<now && !['resolved','cancelled'].includes(r.status)) s.overdue++
          const catName = r.complaint_categories?.name ?? 'Uncategorized'
          catMap[catName] = (catMap[catName]??0)+1
        })
        setStats(s)
        setCategoryBreakdown(Object.entries(catMap).map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count))
      }
      const r2 = await getAllComplaints({ pageSize: 500 })
      setComplaints(r2.items)
    } catch(e) { console.error(e) } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleExportCsv = () => {
    const headers = ['Complaint Number','Title','Status','Priority','Category','Building','Location','Submitted At']
    const lines = [toCsvRow(headers), ...complaints.map(c => toCsvRow([c.complaintNumber,c.title,c.status,c.priority,c.category?.name??'',c.building,c.location,c.submittedAt]))]
    const blob = new Blob([lines.join(`\n`)], { type:'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download='fixtrack-report.csv'; a.click(); URL.revokeObjectURL(url)
    toast.success('CSV exported.')
  }

  if (loading) return <LoadingState message='Loading reports...' />

  return (
    <div>
      <PageHeader title='Reports & Analytics' description='Complaint statistics and trends' action={<Button variant='outline' onClick={handleExportCsv}><Download className='h-4 w-4' /> Export CSV</Button>} />
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <StatCard title='Total Complaints' value={stats.total} icon={ClipboardList} color='royal' />
        <StatCard title='Pending' value={stats.pending} icon={Clock} color='amber' />
        <StatCard title='Resolved' value={stats.resolved} icon={CheckCircle} color='green' />
        <StatCard title='Overdue' value={stats.overdue} icon={AlertTriangle} color='red' />
      </div>
      <div className='mt-6 grid gap-6 lg:grid-cols-2'>
        <Card><CardHeader><CardTitle>Complaints by Status</CardTitle><CardDescription>Current distribution</CardDescription></CardHeader><CardContent>
          <dl className='grid grid-cols-2 gap-3'>
            {([['Pending',stats.pending,'text-amber-600'],['Assigned',stats.assigned,'text-blue-600'],['In Progress',stats.inProgress,'text-indigo-600'],['Resolved',stats.resolved,'text-green-600'],['Overdue',stats.overdue,'text-red-600'],['Critical',stats.critical,'text-orange-600']] as [string,number,string][]).map(([label,val,cls])=>(<div key={label} className='rounded-lg bg-gray-50 dark:bg-gray-800 p-3'><dt className='text-sm text-gray-500'>{label}</dt><dd className={`mt-1 text-2xl font-bold `}>{val}</dd></div>))}
          </dl>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Complaints by Category</CardTitle><CardDescription>All-time breakdown</CardDescription></CardHeader><CardContent>
          {categoryBreakdown.length===0 ? <p className='text-sm text-gray-500'>No data yet.</p> : (
            <ul className='space-y-2'>{categoryBreakdown.map(({name,count})=>(
              <li key={name} className='flex items-center justify-between'>
                <span className='text-sm text-gray-700 dark:text-gray-300'>{name}</span>
                <div className='flex items-center gap-2'><div className='h-2 rounded bg-royal' style={{width:`px`}} /><span className='text-sm font-semibold w-6 text-right'>{count}</span></div>
              </li>))}
            </ul>)}
        </CardContent></Card>
      </div>
    </div>)
}
