import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Shop Platform Supabase client (separate project)
const shopSupabaseUrl = import.meta.env.VITE_SHOP_SUPABASE_URL
const shopSupabaseAnonKey = import.meta.env.VITE_SHOP_SUPABASE_ANON_KEY
const shopTenantId = import.meta.env.VITE_SHOP_TENANT_ID

let shopClient: SupabaseClient | null = null

if (shopSupabaseUrl && shopSupabaseAnonKey) {
  shopClient = createClient(shopSupabaseUrl, shopSupabaseAnonKey)
} else if (import.meta.env.DEV) {
  console.warn('Shop Supabase environment variables are missing.')
}

export const shopSupabase = shopClient
export const getShopSupabaseClient = () => shopClient
export const getShopTenantId = () => shopTenantId

// Helper to check if shop is configured
export const isShopConfigured = () => !!(shopClient && shopTenantId)
