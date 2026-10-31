// MaintenanceTeam.tsx - Full CRUD for maintenance staff using Supabase.
import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Users, Plus, Pencil, Power, X, Trash2 } from 'lucide-react'
import { PageHeader, EmptyState, LoadingState } from '@/components/ui/states'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

const staffSchema = z.object({
  full_name: z.string().min(2, 'Name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  department: z.string().optional(),
  specialization: z.string().optional(),
  staff_code: z.string().min(1, 'Staff code required'),
})
type StaffForm = z.infer<typeof staffSchema>
interface StaffRow { id: string; profile_id: string; staff_code: string; department: string|null; specialization: string|null; employment_status: string; full_name: string; phone: string|null; email: string|null }

export default function MaintenanceTeam() {
  const [staff, setStaff] = useState<StaffRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<StaffRow|null>(null)
  const [confirmDelete, setConfirmDelete] = useState<StaffRow|null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue } = useForm<StaffForm>({ resolver: zodResolver(staffSchema) })

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) { setLoading(false); return }
    const { data, error } = await supabase.from('maintenance_staff').select('id,profile_id,staff_code,full_name,email,phone,department,specialization,employment_status').order('staff_code')
    if (!error && data) setStaff(data.map((r: any) => ({ id: r.id, profile_id: r.profile_id, staff_code: r.staff_code, department: r.department, specialization: r.specialization, employment_status: r.employment_status, full_name: r.full_name ?? r.staff_code, phone: r.phone ?? null, email: r.email ?? null })))
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const openAdd = () => { setEditing(null); reset({ full_name:'', email:'', phone:'', department:'', specialization:'', staff_code:'' }); setShowForm(true) }
  const openEdit = (s: StaffRow) => { setEditing(s); setValue('full_name',s.full_name); setValue('email',''); setValue('phone',s.phone??''); setValue('department',s.department??''); setValue('specialization',s.specialization?.split('|')[0].trim()??''); setValue('staff_code',s.staff_code); setShowForm(true) }

  const onSubmit = async (data: StaffForm) => {
    if (!isSupabaseConfigured || !supabase) { toast.error('Supabase not configured'); return }
    if (editing) {
      const { error:e1 } = await supabase.from('maintenance_staff').update({ staff_code:data.staff_code, full_name:data.full_name, phone:data.phone||null, department:data.department||null, specialization:data.specialization||null }).eq('id',editing.id)
      if (e1) { toast.error(e1.message); return }
      toast.success('Staff member updated.')
    } else {
      // Store staff directly in maintenance_staff without creating a profile row.
      // profile_id is left null for manually-added staff (requires migration 006 to make it nullable).
      const { error:se } = await supabase.from('maintenance_staff').insert({ staff_code:data.staff_code, full_name:data.full_name, email:data.email||null, phone:data.phone||null, department:data.department||null, specialization:data.specialization||null, employment_status:'active' })
      if (se) { toast.error(se.message); return }
      toast.success('Staff member added.')
    }
    setShowForm(false); load()
  }

  const toggleStatus = async (s: StaffRow) => {
    if (!supabase) return
    const next = s.employment_status==='active' ? 'inactive' : 'active'
    const { error } = await supabase.from('maintenance_staff').update({ employment_status:next }).eq('id',s.id)
    if (error) { toast.error(error.message); return }
    toast.success('Staff marked as ' + next + '.'); load()
  }

  const deleteStaff = async(s:StaffRow) => {
    if (!supabase) return
    // Null out assigned_to on complaints assigned to this staff member (don't delete the complaints)
    const { count } = await supabase.from('complaints').select('id',{count:'exact',head:true}).eq('assigned_to',s.id)
    if ((count??0) > 0) {
      // Clear the assignment rather than blocking deletion
      await supabase.from('complaints').update({assigned_to:null,status:'pending'}).eq('assigned_to',s.id)
    }
    const { error } = await supabase.from('maintenance_staff').delete().eq('id',s.id)
    if (error) { toast.error(error.message); return }
    const msg = (count??0)>0 ? (s.full_name + ' deleted. ' + count + ' complaint(s) unassigned.') : (s.full_name + ' deleted.')
    toast.success(msg); setConfirmDelete(null); load()
  }

  if (loading) return <LoadingState message='Loading maintenance team...' />

  return (
    <div>
      <PageHeader title='Maintenance Team' description='Manage maintenance staff members' action={<Button onClick={openAdd}><Plus className='h-4 w-4' /> Add Person</Button>} />
      {showForm && (<Card className='mb-6'><CardHeader><CardTitle className='flex items-center justify-between'><span>{editing?'Edit':'Add'} Staff Member</span><button onClick={()=>setShowForm(false)} className='text-gray-400 hover:text-gray-600'><X className='h-5 w-5'/></button></CardTitle></CardHeader>
        <CardContent><form onSubmit={handleSubmit(onSubmit)} className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <div className='space-y-1'><Label>Full Name *</Label><Input placeholder='John Smith' {...register('full_name')} />{errors.full_name&&<p className='text-xs text-red-600'>{errors.full_name.message}</p>}</div>
          {!editing && <div className='space-y-1'><Label>Email *</Label><Input type='email' placeholder='john@example.com' {...register('email')} />{errors.email&&<p className='text-xs text-red-600'>{errors.email.message}</p>}</div>}
          <div className='space-y-1'><Label>Phone</Label><Input placeholder='+1 555 0100' {...register('phone')} /></div>
          <div className='space-y-1'><Label>Staff Code *</Label><Input placeholder='MT-001' {...register('staff_code')} />{errors.staff_code&&<p className='text-xs text-red-600'>{errors.staff_code.message}</p>}</div>
          <div className='space-y-1'><Label>Department</Label><Input placeholder='Plumbing, Electrical...' {...register('department')} /></div>
          <div className='space-y-1'><Label>Specialisation</Label><Input placeholder='Pipes, wiring...' {...register('specialization')} /></div>
          <div className='col-span-full flex justify-end gap-2'><Button type='button' variant='outline' onClick={()=>setShowForm(false)}>Cancel</Button><Button type='submit' disabled={isSubmitting}>{isSubmitting?'Saving...':editing?'Update':'Add Staff'}</Button></div>
        </form></CardContent></Card>)}
      {staff.length===0 ? (<EmptyState icon={Users} title='No staff members yet' description='Click Add Person to add maintenance staff.' />) : (
        <Card><CardContent className='p-0'><Table><TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Department</TableHead><TableHead>Specialisation</TableHead><TableHead>Phone</TableHead><TableHead>Status</TableHead><TableHead className='text-right'>Actions</TableHead></TableRow></TableHeader>
          <TableBody>{staff.map(s=>(<TableRow key={s.id}><TableCell className='font-medium'>{s.staff_code}</TableCell><TableCell>{s.full_name}</TableCell><TableCell className='text-gray-500'>{s.department??'—'}</TableCell><TableCell className='text-gray-500 text-sm'>{s.specialization?s.specialization.split('|')[0].trim():'—'}</TableCell><TableCell className='text-sm text-gray-500'>{s.phone??'—'}</TableCell><TableCell>{s.employment_status==='active'?<Badge variant='success'>Active</Badge>:<Badge variant='secondary'>Inactive</Badge>}</TableCell><TableCell className='text-right'><div className='flex justify-end gap-1'><Button variant='ghost' size='sm' onClick={()=>openEdit(s)}><Pencil className='h-4 w-4'/></Button><Button variant='ghost' size='sm' onClick={()=>toggleStatus(s)}><Power className='h-4 w-4'/></Button><Button variant='ghost' size='sm' className='text-red-500 hover:text-red-700' onClick={()=>setConfirmDelete(s)}><Trash2 className='h-4 w-4'/></Button></div></TableCell></TableRow>))}</TableBody>
        </Table></CardContent></Card>)}
    {confirmDelete&&(<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'><div className='w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900'><h3 className='text-lg font-semibold text-gray-900 dark:text-white'>Delete Staff Member?</h3><p className='mt-2 text-sm text-gray-500'>Delete <strong>{confirmDelete.full_name}</strong>? Any complaints assigned to them will be unassigned and set back to Pending.</p><div className='mt-4 flex justify-end gap-2'><Button variant='outline' onClick={()=>setConfirmDelete(null)}>Cancel</Button><Button variant='destructive' onClick={()=>deleteStaff(confirmDelete)}>Delete</Button></div></div></div>)}
    </div>)
}
