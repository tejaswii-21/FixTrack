import { useEffect, useRef } from "react"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import type { RealtimeChannel } from "@supabase/supabase-js"
interface Options { onInsert?: () => void; onUpdate?: () => void; filter?: string }
export function useComplaintsRealtime({ onInsert, onUpdate, filter }: Options = {}) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return
    const name = "complaints-rt-" + Date.now().toString()
    const pgCfg = { schema: "public", table: "complaints" as const }
    const ch = supabase.channel(name)
      .on("postgres_changes", { ...pgCfg, event: "INSERT", filter }, () => onInsert?.())
      .on("postgres_changes", { ...pgCfg, event: "UPDATE", filter }, () => onUpdate?.())
      .subscribe()
    channelRef.current = ch
    return () => { if (channelRef.current && supabase) { supabase.removeChannel(channelRef.current); channelRef.current = null } }
  }, [filter, onInsert, onUpdate])
}