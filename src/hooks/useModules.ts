import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

// Tenant ID - later configureerbaar per gym
const TENANT_ID = 'reconnect'

// Owner tenant heeft altijd volledige toegang tot alle modules
const OWNER_TENANT_ID = 'reconnect'

export type ModuleStatus = 'active' | 'trial' | 'available' | 'expired' | 'cancelled'

export interface TenantModule {
  module_id: string
  slug: string
  name: string
  icon: string | null
  external_url: string | null
  status: ModuleStatus
  is_core: boolean
  trial_ends_at: string | null
}

// Default modules als fallback
const DEFAULT_MODULES: TenantModule[] = [
  {
    module_id: 'shop',
    slug: 'shop',
    name: 'Shop',
    icon: 'ShoppingBag',
    external_url: 'https://www.mmagym.be/shop',
    status: 'trial',
    is_core: false,
    trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

async function fetchModules(): Promise<TenantModule[]> {
  try {
    // Call the database function via REST API
    // Using fetch to bypass TypeScript type issues until types are regenerated
    const { data: sessionData } = await supabase.auth.getSession()
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_tenant_modules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${sessionData?.session?.access_token || supabaseKey}`,
      },
      body: JSON.stringify({ p_tenant_id: TENANT_ID }),
    })

    if (!response.ok) {
      console.warn('[useModules] API call failed, using defaults')
      return DEFAULT_MODULES
    }

    const data = await response.json()

    if (!data || data.length === 0) {
      return DEFAULT_MODULES
    }

    return data.map((m: Record<string, unknown>) => ({
      module_id: m.module_id as string,
      slug: m.slug as string,
      name: m.name as string,
      icon: m.icon as string | null,
      external_url: m.external_url as string | null,
      status: (m.status as ModuleStatus) || 'available',
      is_core: m.is_core as boolean,
      trial_ends_at: (m.trial_ends_at as string) || null,
    }))
  } catch (error) {
    console.error('[useModules] Error fetching modules:', error)
    return DEFAULT_MODULES
  }
}

export function useModules() {
  const {
    data: modules = DEFAULT_MODULES,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tenant-modules', TENANT_ID],
    queryFn: fetchModules,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Check of tenant de owner is (altijd volledige toegang)
  const isOwner = TENANT_ID === OWNER_TENANT_ID

  // Check of een specifieke module actief is
  function hasAccess(moduleSlug: string): boolean {
    const module = modules.find((m) => m.slug === moduleSlug)
    if (!module) return false

    // Owner tenant heeft altijd toegang tot alle modules
    if (isOwner) return true

    // Core modules zijn altijd beschikbaar
    if (module.is_core) return true

    // Check status
    if (module.status !== 'active' && module.status !== 'trial') return false

    // Check trial expiry
    if (module.status === 'trial' && module.trial_ends_at) {
      const trialEnd = new Date(module.trial_ends_at)
      if (trialEnd < new Date()) return false
    }

    return true
  }

  // Check of trial verlopen is (voor UI feedback)
  function isTrialExpired(moduleSlug: string): boolean {
    // Owner heeft nooit expired trials
    if (isOwner) return false

    const module = modules.find((m) => m.slug === moduleSlug)
    if (!module || module.status !== 'trial' || !module.trial_ends_at) return false

    const trialEnd = new Date(module.trial_ends_at)
    return trialEnd < new Date()
  }

  // Check of module zichtbaar moet zijn in sidebar (ook expired trials)
  function shouldShowInSidebar(moduleSlug: string): boolean {
    const module = modules.find((m) => m.slug === moduleSlug)
    if (!module) return false

    // Core modules altijd zichtbaar
    if (module.is_core) return true

    // Active en trial modules altijd zichtbaar
    if (module.status === 'active' || module.status === 'trial') return true

    return false
  }

  // Get trial info voor een module
  function getTrialInfo(moduleSlug: string): {
    isTrialing: boolean
    daysLeft: number | null
  } {
    const module = modules.find((m) => m.slug === moduleSlug)
    if (!module || module.status !== 'trial' || !module.trial_ends_at) {
      return { isTrialing: false, daysLeft: null }
    }

    const trialEnd = new Date(module.trial_ends_at)
    const now = new Date()
    const daysLeft = Math.ceil(
      (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    return {
      isTrialing: daysLeft > 0,
      daysLeft: daysLeft > 0 ? daysLeft : 0,
    }
  }

  // Get alle premium modules (voor upsell)
  function getPremiumModules(): TenantModule[] {
    return modules.filter((m) => !m.is_core)
  }

  // Get actieve modules voor sidebar
  function getActiveModules(): TenantModule[] {
    return modules.filter(
      (m) => m.is_core || m.status === 'active' || m.status === 'trial'
    )
  }

  // Get module by slug
  function getModule(slug: string): TenantModule | undefined {
    return modules.find((m) => m.slug === slug)
  }

  return {
    modules,
    loading,
    error,
    refetch,
    isOwner,
    hasAccess,
    isTrialExpired,
    shouldShowInSidebar,
    getTrialInfo,
    getPremiumModules,
    getActiveModules,
    getModule,
  }
}
