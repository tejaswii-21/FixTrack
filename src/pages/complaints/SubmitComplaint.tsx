// SubmitComplaint.tsx - Wired to real Supabase with image upload support.
// Falls back to demo mode when Supabase is not configured.
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Upload, X, Loader2 } from 'lucide-react'
import { complaintSchema, type ComplaintFormValues } from '@/lib/validation'
import { useAuth } from '@/contexts/AuthContext'
import { isSupabaseConfigured } from '@/lib/supabase'
import { createComplaint, getCategories } from '@/services/complaints.service'
import { PageHeader } from '@/components/ui/states'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectItem } from '@/components/ui/select'
import { mockCategories } from '@/lib/mockData'
import type { ComplaintCategory } from '@/types'

export default function SubmitComplaint() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [categories, setCategories] = useState<ComplaintCategory[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load real categories from DB, or fall back to mock
  useEffect(() => {
    if (isSupabaseConfigured) {
      getCategories()
        .then(setCategories)
        .catch(() => setCategories(mockCategories))
    } else {
      setCategories(mockCategories)
    }
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ComplaintFormValues>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      title: '',
      description: '',
      category_id: '',
      building: '',
      location: '',
      floor: '',
      room_number: '',
      priority: 'medium',
    },
  })

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const valid = files.filter(
      (f) => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024,
    )
    if (valid.length < files.length)
      toast.warning('Some files were skipped (images only, max 10 MB each)')
    setImageFiles((prev) => [...prev, ...valid])
    valid.forEach((f) => setPreviews((prev) => [...prev, URL.createObjectURL(f)]))
    // Reset so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeImage(idx: number) {
    URL.revokeObjectURL(previews[idx])
    setImageFiles((prev) => prev.filter((_, i) => i !== idx))
    setPreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  const onSubmit = async (data: ComplaintFormValues) => {
    if (!user?.id) {
      toast.error('Please sign in to submit a complaint.')
      navigate('/login')
      return
    }

    if (!isSupabaseConfigured) {
      toast.success('Demo: complaint submitted (Supabase not configured — not saved to DB)')
      navigate('/complaints/my')
      return
    }

    try {
      await createComplaint(
        {
          title: data.title,
          description: data.description,
          categoryId: data.category_id,
          building: data.building,
          location: data.location,
          floor: data.floor || undefined,
          roomNumber: data.room_number || undefined,
          priority: data.priority,
        },
        user.id,
        imageFiles,
      )
      // Clean up object URLs
      previews.forEach((url) => URL.revokeObjectURL(url))
      toast.success('Complaint submitted successfully!')
      navigate('/complaints/my')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed. Please try again.'
      toast.error(msg)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Submit a Complaint"
        description="Report a maintenance issue that needs attention"
      />
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="Brief summary of the issue" {...register('title')} />
              {errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                rows={4}
                placeholder="Describe the issue in detail (at least 20 characters)"
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/60 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-xs text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category_id">Category</Label>
              <Select {...register('category_id')}>
                <SelectItem value="">Select a category…</SelectItem>
                {categories
                  .filter((c) => c.active)
                  .map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
              </Select>
              {errors.category_id && (
                <p className="text-xs text-red-600">{errors.category_id.message}</p>
              )}
            </div>

            {/* Building + Location */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="building">Building</Label>
                <Input id="building" placeholder="e.g. Building A" {...register('building')} />
                {errors.building && (
                  <p className="text-xs text-red-600">{errors.building.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="e.g. Unit 302, Kitchen" {...register('location')} />
                {errors.location && (
                  <p className="text-xs text-red-600">{errors.location.message}</p>
                )}
              </div>
            </div>

            {/* Floor + Room */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="floor">Floor (optional)</Label>
                <Input id="floor" placeholder="e.g. 3" {...register('floor')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="room_number">Room number (optional)</Label>
                <Input id="room_number" placeholder="e.g. 302" {...register('room_number')} />
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select {...register('priority')}>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </Select>
            </div>

            {/* Image upload */}
            <div className="space-y-2">
              <Label>Attach images (optional)</Label>
              {previews.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {previews.map((src, i) => (
                    <div key={i} className="relative">
                      <img
                        src={src}
                        alt={`Preview ${i + 1}`}
                        className="h-20 w-20 rounded-md object-cover border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                        aria-label={`Remove image ${i + 1}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 transition-colors hover:border-royal dark:border-gray-700"
              >
                <Upload className="h-6 w-6 text-gray-400" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Click to upload images (JPEG, PNG, WebP · max 10 MB each)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate('/complaints/my')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  'Submit Complaint'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}