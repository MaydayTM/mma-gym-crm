import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Tables } from '../types/database.types'

export type AgeGroup = Tables<'age_groups'>
export type PlanType = Tables<'plan_types'>
export type PricingMatrix = Tables<'pricing_matrix'>
export type PlanAddon = Tables<'plan_addons'>
export type FamilyDiscount = Tables<'family_discounts'>
export type OneTimeProduct = Tables<'one_time_products'>

// Fetch all age groups
export function useAgeGroups() {
  return useQuery({
    queryKey: ['age-groups'],
    queryFn: async (): Promise<AgeGroup[]> => {
      const { data, error } = await supabase
        .from('age_groups')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (error) throw new Error(error.message)
      return data || []
    },
  })
}

// Fetch all plan types
export function usePlanTypes() {
  return useQuery({
    queryKey: ['plan-types'],
    queryFn: async (): Promise<PlanType[]> => {
      const { data, error } = await supabase
        .from('plan_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (error) throw new Error(error.message)
      return data || []
    },
  })
}

// Fetch pricing for a specific age group
export function usePricingByAgeGroup(ageGroupId: string | undefined) {
  return useQuery({
    queryKey: ['pricing', ageGroupId],
    queryFn: async (): Promise<(PricingMatrix & { plan_type: PlanType })[]> => {
      if (!ageGroupId) return []

      const { data, error } = await supabase
        .from('pricing_matrix')
        .select(`
          *,
          plan_type:plan_types(*)
        `)
        .eq('age_group_id', ageGroupId)
        .eq('is_active', true)
        .order('duration_months')

      if (error) throw new Error(error.message)
      return (data || []) as (PricingMatrix & { plan_type: PlanType })[]
    },
    enabled: !!ageGroupId,
  })
}

// Fetch all pricing (for admin)
export function useAllPricing() {
  return useQuery({
    queryKey: ['pricing-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_matrix')
        .select(`
          *,
          age_group:age_groups(*),
          plan_type:plan_types(*)
        `)
        .eq('is_active', true)
        .order('age_group_id')
        .order('plan_type_id')
        .order('duration_months')

      if (error) throw new Error(error.message)
      return data || []
    },
  })
}

// Fetch plan addons
export function usePlanAddons() {
  return useQuery({
    queryKey: ['plan-addons'],
    queryFn: async (): Promise<PlanAddon[]> => {
      const { data, error } = await supabase
        .from('plan_addons')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (error) throw new Error(error.message)
      return data || []
    },
  })
}

// Fetch family discounts
export function useFamilyDiscounts() {
  return useQuery({
    queryKey: ['family-discounts'],
    queryFn: async (): Promise<FamilyDiscount[]> => {
      const { data, error } = await supabase
        .from('family_discounts')
        .select('*')
        .order('position')

      if (error) throw new Error(error.message)
      return data || []
    },
  })
}

// Fetch one-time products (dagpas, beurtenkaarten)
export function useOneTimeProducts() {
  return useQuery({
    queryKey: ['one-time-products'],
    queryFn: async (): Promise<OneTimeProduct[]> => {
      const { data, error } = await supabase
        .from('one_time_products')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (error) throw new Error(error.message)
      return data || []
    },
  })
}

// Combined hook for checkout page - fetches everything needed
export function useCheckoutData(ageGroupSlug?: string) {
  const { data: ageGroups, isLoading: loadingAgeGroups } = useAgeGroups()
  const { data: planTypes, isLoading: loadingPlanTypes } = usePlanTypes()
  const { data: addons, isLoading: loadingAddons } = usePlanAddons()
  const { data: familyDiscounts, isLoading: loadingDiscounts } = useFamilyDiscounts()

  const selectedAgeGroup = ageGroups?.find(ag => ag.slug === ageGroupSlug)

  const { data: pricing, isLoading: loadingPricing } = usePricingByAgeGroup(selectedAgeGroup?.id)

  return {
    ageGroups,
    planTypes,
    addons,
    familyDiscounts,
    selectedAgeGroup,
    pricing,
    isLoading: loadingAgeGroups || loadingPlanTypes || loadingAddons || loadingDiscounts || loadingPricing,
  }
}
