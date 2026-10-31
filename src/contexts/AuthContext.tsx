// AuthContext.tsx - Real Supabase auth with mock fallback.
// When VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY are set, uses real
// Supabase Auth and fetches the profile row. Otherwise falls back to the
// original mock sign-in so the UI still works for demos.
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { getProfile, signIn as sbSignIn, signOut as sbSignOut, signUp as sbSignUp } from '@/services/auth.service'
import type { Profile, Role } from '@/types'

interface AuthContextValue {
  user: Profile | null
  profile: Profile | null
  role: Role
  loading: boolean
  /** Sign in. In demo mode, pass a third arg to pick a role. */
  signIn: (email: string, password: string, demoRole?: Role) => Promise<void>
  /** Sign out. */
  signOut: () => Promise<void>
  /** Register a new account (real Supabase only). */
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<void>
  /** Refresh the profile from the database (call after profile edits). */
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [role, setRole] = useState<Role>('resident')
  const [loading, setLoading] = useState(isSupabaseConfigured) // true while Supabase checks session

  // -------------------------------------------------------------------------
  // REAL SUPABASE AUTH
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false)
      return
    }

    // Restore session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await getProfile(session.user.id)
        if (profile) {
          setUser(profile)
          setRole(profile.role)
        }
      }
      setLoading(false)
    })

    // Listen for future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await getProfile(session.user.id)
        if (profile) {
          setUser(profile)
          setRole(profile.role)
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setRole('resident')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // -------------------------------------------------------------------------
  // Auth actions
  // -------------------------------------------------------------------------

  const signIn = async (email: string, password: string, demoRole?: Role) => {
    if (isSupabaseConfigured) {
      setLoading(true)
      try {
        await sbSignIn(email, password)
        // onAuthStateChange will set user/role automatically
      } finally {
        setLoading(false)
      }
    } else {
      // DEMO / mock mode
      setLoading(true)
      await new Promise(r => setTimeout(r, 400))
      const mock: Profile = {
        id: 'mock-user-id',
        fullName: email.split('@')[0]?.replace(/[._]/g, ' ') || 'Demo User',
        phone: null, avatarUrl: null,
        role: demoRole ?? 'resident',
        accountStatus: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setUser(mock)
      setRole(demoRole ?? 'resident')
      setLoading(false)
    }
  }

  const signOut = async () => {
    if (isSupabaseConfigured) await sbSignOut()
    setUser(null)
    setRole('resident')
  }

  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    if (!isSupabaseConfigured) {
      // Demo mode: just redirect to login
      throw new Error('Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to enable real registration.')
    }
    await sbSignUp(email, password, fullName, phone)
  }

  const refreshProfile = async () => {
    if (!isSupabaseConfigured || !supabase) return
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      const profile = await getProfile(authUser.id)
      if (profile) { setUser(profile); setRole(profile.role) }
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile: user, role, loading, signIn, signOut, signUp, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}