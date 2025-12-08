import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug logging for production issues
console.log('[Supabase] Initializing with URL:', supabaseUrl?.substring(0, 30) + '...')
console.log('[Supabase] Anon key present:', !!supabaseAnonKey)

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Test connection on init
supabase.auth.getSession().then(({ data, error }) => {
  console.log('[Supabase] Connection test - Session:', !!data.session, 'Error:', error?.message)
})

// Type helpers voor gebruik in de app
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// Convenience types
export type Member = Tables<'members'>
export type Subscription = Tables<'subscriptions'>
export type Checkin = Tables<'checkins'>
export type Lead = Tables<'leads'>
export type Revenue = Tables<'revenue'>

// Dashboard stats view type
export type DashboardStats = Database['public']['Views']['dashboard_stats']['Row']
