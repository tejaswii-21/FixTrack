/// <reference types="vite/client" />

// Type the public environment variables used by the Supabase client.
// NOTE: only VITE_ variables are visible to the browser. The service role key
// must NEVER be placed in a VITE_ variable.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
