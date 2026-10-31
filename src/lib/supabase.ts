// Supabase client initialization with environment validation.
//
// The client reads VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY from the
// environment. These are PUBLIC/publishable values that work together with Row
// Level Security. The service role key is NEVER used here (browser-accessible
// code must never contain it).
//
// If the environment variables are missing or empty, the client is not
// created. The app shows a friendly configuration notice instead of crashing,
// so the UI still renders during scaffolding/development.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''

/**
 * Whether the Supabase client is fully configured (both env vars present).
 * Use this to decide whether to show the configuration notice.
 */
export const isSupabaseConfigured: boolean =
  supabaseUrl.trim().length > 0 && supabasePublishableKey.trim().length > 0

/**
 * The shared Supabase client, or null when not configured.
 * Always check isSupabaseConfigured before using this client.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        // Persist the session across reloads by default.
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

/**
 * Get the configured Supabase client, throwing a clear error if it is missing.
 * Components/services should prefer checking isSupabaseConfigured first and
 * showing the configuration notice, but this helper is useful where a client
 * is genuinely required to proceed.
 */
export function getSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and ' +
        'VITE_SUPABASE_PUBLISHABLE_KEY in your .env file.',
    )
  }
  return supabase
}
