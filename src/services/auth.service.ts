// auth.service.ts - Supabase authentication operations
// All functions fall back gracefully if Supabase is not configured.
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Profile, Role } from '@/types'

/** Map a raw profiles row (snake_case) to the frontend Profile type (camelCase). */
export function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    fullName: (row.full_name as string) ?? '',
    phone: row.phone as string | null,
    avatarUrl: row.avatar_url as string | null,
    role: (row.role as Role) ?? 'resident',
    accountStatus: (row.account_status as Profile['accountStatus']) ?? 'active',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

/** Fetch a user profile from the profiles table. */
export async function getProfile(userId: string): Promise<Profile | null> {
  if (!isSupabaseConfigured || !supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error || !data) return null
  return mapProfile(data as Record<string, unknown>)
}

/** Sign up a new user. The on_auth_user_created trigger creates the profile row. */
export async function signUp(
  email: string,
  password: string,
  fullName: string,
  phone?: string,
) {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, phone: phone ?? null } },
  })
  if (error) throw error
  return data
}

/** Sign in with email + password. */
export async function signIn(email: string, password: string) {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

/** Sign out the current user. */
export async function signOut() {
  if (!isSupabaseConfigured || !supabase) return
  await supabase.auth.signOut()
}

/** Send a password reset email. */
export async function resetPassword(email: string) {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw error
}

/** Update the current user's password (used on the reset-password page). */
export async function updatePassword(password: string) {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}