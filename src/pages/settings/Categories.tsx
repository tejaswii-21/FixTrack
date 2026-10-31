// Categories.tsx - Full CRUD for complaint categories.
import { useState, useEffect, useCallback } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Tags, Plus, Pencil, Power, X, Trash2 } from 'lucide-react'
import { PageHeader, EmptyState, LoadingState } from '@/components/ui/states'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Select, SelectItem } from '@/components/ui/select'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

const catSchema = z.object({ name: z.string().trim().min(1,'Category name required').max(100), description: z.string().trim().optional(), default_priority: z.enum(['low','medium','high','critical']) })
type CatForm = z.infer<typeof catSchema>
interface CatRow { id:string; name:string; description:string|null; default_priority:string; active:boolean; created_at:string }

export default function Categories() {
  const [cats, setCats] = useState<CatRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<CatRow|null>(null)
  const [confirmDelete, setConfirmDelete] = useState<CatRow|null>(null)
  const { register, handleSubmit, formState:{errors,isSubmitting}, reset, setValue, watch } = useForm<CatForm>({ resolver:zodResolver(catSchema), defaultValues:{name:'',description:'',default_priority:'medium'} })

  const load = useCallback(async()=>{ if (!isSupabaseConfigured||!supabase){setLoading(false);return} const{data,error}=await supabase.from('complaint_categories').select('*').order('name'); if(!error&&data)setCats(data as CatRow[]); setLoading(false) },[]) 
  useEffect(()=>{load()},[load])

  const openAdd = () => { setEditing(null); reset({name:'',description:'',default_priority:'medium'}); setShowForm(true) }
  const openEdit = (cat:CatRow) => { setEditing(cat); setValue('name',cat.name); setValue('description',cat.description??''); setValue('default_priority',cat.default_priority as CatForm['default_priority']); setShowForm(true) }

  const onSubmit = async(data:CatForm) => {
    if (!isSupabaseConfigured||!supabase){toast.error('Supabase not configured');return}
    const trimName = data.name.trim()
    const dup = cats.find(c=>c.name.trim().toLowerCase()===trimName.toLowerCase()&&c.id!==(editing?.id??''))
    if (dup){toast.error('Category ' + dup.name + ' already exists.');return}
    if (editing){
      const{error}=await supabase.from('complaint_categories').update({name:trimName,description:data.description||null,default_priority:data.default_priority}).eq('id',editing.id)
      if(error){toast.error(error.message);return}; toast.success('Category updated.')
    } else {
      const{error}=await supabase.from('complaint_categories').insert({name:trimName,description:data.description||null,default_priority:data.default_priority,active:true})
      if(error){toast.error(error.message);return}; toast.success('Category added.')
    }
    setShowForm(false); load()
  }

  const toggle = async(cat:CatRow)=>{ if(!supabase)return; const{error}=await supabase.from('complaint_categories').update({active:!cat.active}).eq('id',cat.id); if(error){toast.error(error.message);return}; toast.success(cat.active ? (cat.name + ' deactivated.') : (cat.name + ' activated.')); load() }

  const deleteCategory = async(cat:CatRow) => {
    if (!supabase) return
    // Check if any complaints use this category
    const { count } = await supabase.from('complaints').select('id',{count:'exact',head:true}).eq('category_id',cat.id)
    if ((count??0) > 0) {
      toast.error(cat.name + ' is used by ' + count + ' complaint(s). Deactivate it instead of deleting.')
      setConfirmDelete(null); return
    }
    const { error } = await supabase.from('complaint_categories').delete().eq('id',cat.id)
    if (error) { toast.error(error.message); return }
    toast.success(cat.name + ' deleted.'); setConfirmDelete(null); load()
  }

  if(loading)return <LoadingState message='Loading categories...' />

  return (<div>
    <PageHeader title='Categories' description='Manage complaint categories' action={<Button onClick={openAdd}><Plus className='h-4 w-4' /> Add Category</Button>} />
    {showForm&&(<Card className='mb-6'><CardHeader><CardTitle className='flex items-center justify-between'><span>{editing?'Edit Category':'Add Category'}</span><button onClick={()=>setShowForm(false)} className='text-gray-400 hover:text-gray-600'><X className='h-5 w-5'/></button></CardTitle></CardHeader><CardContent><form onSubmit={handleSubmit(onSubmit)} className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
      <div className='space-y-1 sm:col-span-2'><Label>Category Name *</Label><Input placeholder='e.g. Electrical Issues' {...register('name')} />{errors.name&&<p className='text-xs text-red-600'>{errors.name.message}</p>}</div>
      <div className='space-y-1 sm:col-span-2'><Label>Description (optional)</Label><Input placeholder='Brief description...' {...register('description')} /></div>
      <div className='space-y-1'><Label>Default Priority</Label><Select value={watch('default_priority')} onChange={e=>setValue('default_priority',e.target.value as CatForm['default_priority'])}><SelectItem value='low'>Low</SelectItem><SelectItem value='medium'>Medium</SelectItem><SelectItem value='high'>High</SelectItem><SelectItem value='critical'>Critical</SelectItem></Select></div>
      <div className='col-span-full flex justify-end gap-2'><Button type='button' variant='outline' onClick={()=>setShowForm(false)}>Cancel</Button><Button type='submit' disabled={isSubmitting}>{isSubmitting?'Saving...':editing?'Update':'Add Category'}</Button></div>
    </form></CardContent></Card>)}
    {cats.length===0?(<EmptyState icon={Tags} title='No categories' description='Click Add Category to create the first one.' />):(
      <Card><CardContent className='p-0'><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Description</TableHead><TableHead>Default Priority</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead className='text-right'>Actions</TableHead></TableRow></TableHeader><TableBody>
        {cats.map(cat=>(<TableRow key={cat.id}><TableCell className='font-medium'>{cat.name}</TableCell><TableCell className='text-sm text-gray-500'>{cat.description??'—'}</TableCell><TableCell><span className='capitalize text-sm'>{cat.default_priority}</span></TableCell><TableCell>{cat.active?<Badge variant='success'>Active</Badge>:<Badge variant='secondary'>Inactive</Badge>}</TableCell><TableCell className='text-sm text-gray-500'>{formatDate(cat.created_at)}</TableCell><TableCell className='text-right'><div className='flex justify-end gap-1'><Button variant='ghost' size='sm' onClick={()=>openEdit(cat)}><Pencil className='h-4 w-4'/></Button><Button variant='ghost' size='sm' onClick={()=>toggle(cat)}><Power className='h-4 w-4'/></Button><Button variant='ghost' size='sm' className='text-red-500 hover:text-red-700' onClick={()=>setConfirmDelete(cat)}><Trash2 className='h-4 w-4'/></Button></div></TableCell></TableRow>))}
      </TableBody></Table></CardContent></Card>)}
  {confirmDelete&&(<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'><div className='w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900'><h3 className='text-lg font-semibold text-gray-900 dark:text-white'>Delete Category?</h3><p className='mt-2 text-sm text-gray-500'>Delete <strong>{confirmDelete.name}</strong>? This cannot be undone. Categories used by existing complaints cannot be deleted.</p><div className='mt-4 flex justify-end gap-2'><Button variant='outline' onClick={()=>setConfirmDelete(null)}>Cancel</Button><Button variant='destructive' onClick={()=>deleteCategory(confirmDelete)}>Delete</Button></div></div></div>)}
  </div>)
}
