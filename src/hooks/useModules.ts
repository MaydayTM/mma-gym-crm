import { useState, useEffect, useCallback } from 'react'

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

// Default modules until database migration is run
// Tenant ID will be 'reconnect' - configurable later per gym
const DEFAULT_MODULES: TenantModule[] = [
  {
    module_id: 'shop',
    slug: 'shop',
    name: 'Shop',
    icon: 'ShoppingBag',
    external_url: null,
    status: 'trial',
    is_core: false,
    trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export function useModules() {
  // For now, use default modules until the migration is run
  // Once the database tables exist, we'll fetch from Supabase
  const [modules, setModules] = useState<TenantModule[]>(DEFAULT_MODULES)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchModules = useCallback(async () => {
    // TODO: Enable database fetch once migration 017_tenant_modules.sql is run
    // For now, use default modules
    setModules(DEFAULT_MODULES)
    setLoading(false)
    setError(null)
  }, [])

  useEffect(() => {
    fetchModules()
  }, [fetchModules])

  // Check of een specifieke module actief is
  function hasAccess(moduleSlug: string): boolean {
    const module = modules.find((m) => m.slug === moduleSlug)
    if (!module) return false

    // Core modules zijn altijd beschikbaar
    if (module.is_core) return true

    // Check status
    if (module.status !== 'active' && module.status !== 'trial') return false

    // Check trial expiration
    if (module.trial_ends_at && new Date(module.trial_ends_at) < new Date()) {
      return false
    }

    return true
  }

  // Get alle premium modules (niet-core)
  function getPremiumModules(): TenantModule[] {
    return modules.filter((m) => !m.is_core)
  }

  // Get actieve modules voor sidebar
  function getActiveModules(): TenantModule[] {
    return modules.filter(
      (m) => m.is_core || m.status === 'active' || m.status === 'trial'
    )
  }

  // Get trial info voor een module
  function getTrialInfo(moduleSlug: string): { isTrialing: boolean; daysLeft: number | null } {
    const module = modules.find((m) => m.slug === moduleSlug)

    if (!module || module.status !== 'trial' || !module.trial_ends_at) {
      return { isTrialing: false, daysLeft: null }
    }

    const trialEnd = new Date(module.trial_ends_at)
    const now = new Date()
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    return {
      isTrialing: daysLeft > 0,
      daysLeft: Math.max(0, daysLeft),
    }
  }

  return {
    modules,
    loading,
    error,
    hasAccess,
    getPremiumModules,
    getActiveModules,
    getTrialInfo,
    refetch: fetchModules,
  }
}
