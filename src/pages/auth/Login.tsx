// Login.tsx - Two-card landing: Student Login + Administrator Login.
// If already authenticated, redirects to /dashboard immediately.
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { GraduationCap, ShieldCheck, Mail, Lock, Eye, EyeOff, Loader2, Wrench, ArrowLeft } from 'lucide-react'
import { loginSchema, type LoginFormValues } from '@/lib/validation'
import { useAuth } from '@/contexts/AuthContext'
import { isSupabaseConfigured } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

type Panel = null | 'student' | 'admin'

export default function Login() {
  const { signIn, signOut, user, loading, role } = useAuth()
  const navigate = useNavigate()
  const [panel, setPanel] = useState<Panel>(null)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (loading || !user || !panel) return
    // After Supabase sets the role from the DB, verify it matches what was selected
    const expectedRole = panel === 'admin' ? 'administrator' : 'resident'
    if (role === expectedRole) {
      toast.success('Signed in successfully.')
      navigate('/dashboard', { replace: true })
    } else if (role && role !== expectedRole) {
      // Role mismatch — sign out and show error
      signOut()
      if (panel === 'admin') {
        toast.error('Access denied. This account is not authorised as an administrator.')
      } else {
        toast.error('Access denied. Please use the correct login option for your account.')
      }
    }
  }, [user, loading, role, panel, navigate, signOut])

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await signIn(data.email, data.password, panel === 'admin' ? 'administrator' : 'resident')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      if (msg.includes('Invalid login credentials')) toast.error('Incorrect email or password.')
      else if (msg.includes('Email not confirmed')) toast.error('Please confirm your email first.')
      else toast.error(msg)
    }
    // Role verification happens in the useEffect below via the role state
  }

  if (loading) return <div className='flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950'><Loader2 className='h-8 w-8 animate-spin text-royal' /></div>

  if (panel) {
    const isAdmin = panel === 'admin'
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-950'>
        <div className='w-full max-w-md'>
          <div className='mb-6 text-center'>
            <div className='flex items-center justify-center gap-2 mb-2'>
              <Wrench className='h-7 w-7 text-royal' />
              <span className='text-2xl font-bold text-navy dark:text-white'>FixTrack</span>
            </div>
            <div className='flex items-center justify-center gap-2 mb-1'>
              {isAdmin ? <ShieldCheck className='h-5 w-5 text-royal' /> : <GraduationCap className='h-5 w-5 text-royal' />}
              <h2 className='text-lg font-semibold text-gray-800 dark:text-gray-100'>{isAdmin ? 'Administrator Login' : 'Student Login'}</h2>
            </div>
            <p className='text-sm text-gray-500'>{isAdmin ? 'Manage complaints and monitor maintenance activities.' : 'Submit complaints and track their progress.'}</p>
          </div>
          <div className='rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-900'>
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='email'>Email</Label>
                <div className='relative'><Mail className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' /><Input id='email' type='email' placeholder='you@example.com' className='pl-9' {...register('email')} /></div>
                {errors.email && <p className='text-xs text-red-600'>{errors.email.message}</p>}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='password'>Password</Label>
                <div className='relative'><Lock className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' /><Input id='password' type={showPassword ? 'text' : 'password'} placeholder='••••••••' className='px-9' {...register('password')} /><button type='button' onClick={() => setShowPassword(!showPassword)} className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600' tabIndex={-1}>{showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}</button></div>
                {errors.password && <p className='text-xs text-red-600'>{errors.password.message}</p>}
              </div>
              {!isSupabaseConfigured && <p className='text-xs text-amber-600'>Demo mode — Supabase not configured.</p>}
              <Button type='submit' disabled={isSubmitting} className='w-full'>
                {isSubmitting ? <><Loader2 className='h-4 w-4 animate-spin' /> Signing in…</> : 'Sign in'}
              </Button>
            </form>
            {!isAdmin && <div className='mt-4 space-y-1 text-center text-sm text-gray-600 dark:text-gray-400'><p>Don't have an account? <Link to='/register' className='font-medium text-royal hover:underline'>Register</Link></p><p><Link to='/forgot-password' className='font-medium text-royal hover:underline'>Forgot password?</Link></p></div>}
          </div>
          <button onClick={() => { setPanel(null); reset() }} className='mt-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 mx-auto'>
            <ArrowLeft className='h-4 w-4' /> Back to role selection
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 dark:bg-gray-950'>
      <div className='mb-10 text-center'>
        <div className='flex items-center justify-center gap-3 mb-3'>
          <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-royal shadow-md'><Wrench className='h-7 w-7 text-white' /></div>
          <span className='text-3xl font-extrabold text-navy dark:text-white'>FixTrack</span>
        </div>
        <p className='text-sm text-gray-500 max-w-xs'>Smart Complaint &amp; Maintenance Management</p>
      </div>
      <div className='grid w-full max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2'>
        <button onClick={() => setPanel('student')} className='group flex flex-col items-center gap-4 rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-md transition-all hover:border-royal hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-royal dark:border-gray-700 dark:bg-gray-900'>
          <div className='flex h-16 w-16 items-center justify-center rounded-full bg-royal/10 group-hover:bg-royal/20 transition-colors'><GraduationCap className='h-8 w-8 text-royal' /></div>
          <div className='text-center'><h3 className='text-xl font-bold text-gray-900 dark:text-white mb-2'>Student Login</h3><p className='text-sm text-gray-500 leading-relaxed'>Submit maintenance complaints and track their progress in real time.</p></div>
          <span className='mt-2 w-full rounded-lg bg-royal py-2.5 text-center text-sm font-semibold text-white group-hover:bg-royal-dark transition-colors'>Student Login</span>
        </button>
        <button onClick={() => setPanel('admin')} className='group flex flex-col items-center gap-4 rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-md transition-all hover:border-navy hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-navy dark:border-gray-700 dark:bg-gray-900'>
          <div className='flex h-16 w-16 items-center justify-center rounded-full bg-navy/10 group-hover:bg-navy/20 transition-colors'><ShieldCheck className='h-8 w-8 text-navy dark:text-blue-400' /></div>
          <div className='text-center'><h3 className='text-xl font-bold text-gray-900 dark:text-white mb-2'>Administrator Login</h3><p className='text-sm text-gray-500 leading-relaxed'>Manage complaints, assign staff, and monitor maintenance activities.</p></div>
          <span className='mt-2 w-full rounded-lg bg-navy py-2.5 text-center text-sm font-semibold text-white group-hover:bg-navy-dark transition-colors'>Administrator Login</span>
        </button>
      </div>
    </div>
  )
}
