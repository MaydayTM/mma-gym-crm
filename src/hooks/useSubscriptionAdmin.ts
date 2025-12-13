import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

// ============================================
// Types
// ============================================

export interface AgeGroup {
  id: string
  slug: string
  name: string
  subtitle: string | null
  min_age: number | null
  max_age: number | null
  starting_price: number | null
  sort_order: number
  is_active: boolean
}

export interface PlanType {
  id: string
  slug: string
  name: string
  description: string | null
  features: string[]
  highlight_text: string | null
  sort_order: number
  is_active: boolean
}

export interface PricingMatrix {
  id: string
  age_group_id: string
  plan_type_id: string
  duration_months: number
  price: number
  price_per_month: number | null
  savings: number
  includes_insurance: boolean
  show_on_checkout: boolean
  highlight_text: string | null
  is_active: boolean
}

export interface OneTimeProduct {
  id: string
  slug: string
  name: string
  product_type: 'daypass' | 'punch_card'
  price: number
  sessions: number | null
  validity_days: number
  description: string | null
  show_on_checkout: boolean
  sort_order: number
  is_active: boolean
}

export interface Discount {
  id: string
  slug: string
  name: string
  description: string | null
  discount_type: 'fixed' | 'percentage'
  amount: number | null
  percentage: number | null
  is_exclusive: boolean
  requires_verification: boolean
  valid_from: string | null
  valid_until: string | null
  max_uses: number | null
  current_uses: number
  show_on_checkout: boolean
  checkout_code: string | null
  is_active: boolean
  sort_order: number
}

export interface PlanAddon {
  id: string
  slug: string
  name: string
  description: string | null
  price: number
  billing_type: 'yearly' | 'once' | 'monthly'
  applicable_to: string[] | null
  is_required: boolean
  sort_order: number
  is_active: boolean
}

export interface FamilyDiscount {
  id: string
  position: number
  discount_amount: number
  description: string | null
}

// ============================================
// Age Groups
// ============================================

export function useAgeGroups() {
  return useQuery({
    queryKey: ['age-groups'],
    queryFn: async (): Promise<AgeGroup[]> => {
      const { data, error } = await supabase
        .from('age_groups')
        .select('*')
        .order('sort_order')

      if (error) throw error
      return data || []
    }
  })
}

export function useCreateAgeGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ageGroup: Omit<AgeGroup, 'id'>) => {
      const { data, error } = await supabase
        .from('age_groups')
        .insert(ageGroup)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['age-groups'] })
    }
  })
}

export function useUpdateAgeGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AgeGroup> & { id: string }) => {
      const { data, error } = await supabase
        .from('age_groups')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['age-groups'] })
    }
  })
}

export function useDeleteAgeGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('age_groups')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['age-groups'] })
    }
  })
}

// ============================================
// Plan Types
// ============================================

export function usePlanTypes() {
  return useQuery({
    queryKey: ['plan-types'],
    queryFn: async (): Promise<PlanType[]> => {
      const { data, error } = await supabase
        .from('plan_types')
        .select('*')
        .order('sort_order')

      if (error) throw error
      return data || []
    }
  })
}

export function useCreatePlanType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (planType: Omit<PlanType, 'id'>) => {
      const { data, error } = await supabase
        .from('plan_types')
        .insert(planType)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-types'] })
    }
  })
}

export function useUpdatePlanType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PlanType> & { id: string }) => {
      const { data, error } = await supabase
        .from('plan_types')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-types'] })
    }
  })
}

// ============================================
// Pricing Matrix
// ============================================

export function usePricingMatrix() {
  return useQuery({
    queryKey: ['pricing-matrix'],
    queryFn: async (): Promise<PricingMatrix[]> => {
      const { data, error } = await supabase
        .from('pricing_matrix')
        .select('*')
        .order('age_group_id')

      if (error) throw error
      return data || []
    }
  })
}

export function useCreatePricing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (pricing: Omit<PricingMatrix, 'id' | 'is_active'>) => {
      const { data, error } = await supabase
        .from('pricing_matrix')
        .insert(pricing)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-matrix'] })
    }
  })
}

export function useUpdatePricing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PricingMatrix> & { id: string }) => {
      const { data, error } = await supabase
        .from('pricing_matrix')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-matrix'] })
    }
  })
}

export function useDeletePricing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pricing_matrix')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-matrix'] })
    }
  })
}

// ============================================
// One-Time Products
// ============================================

export function useOneTimeProducts() {
  return useQuery({
    queryKey: ['one-time-products'],
    queryFn: async (): Promise<OneTimeProduct[]> => {
      const { data, error } = await supabase
        .from('one_time_products')
        .select('*')
        .order('sort_order')

      if (error) throw error
      return data || []
    }
  })
}

export function useCreateOneTimeProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (product: Omit<OneTimeProduct, 'id' | 'is_active'>) => {
      const { data, error } = await supabase
        .from('one_time_products')
        .insert(product)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['one-time-products'] })
    }
  })
}

export function useUpdateOneTimeProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<OneTimeProduct> & { id: string }) => {
      const { data, error } = await supabase
        .from('one_time_products')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['one-time-products'] })
    }
  })
}

export function useDeleteOneTimeProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('one_time_products')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['one-time-products'] })
    }
  })
}

// ============================================
// Discounts
// ============================================

export function useDiscounts() {
  return useQuery({
    queryKey: ['discounts'],
    queryFn: async (): Promise<Discount[]> => {
      const { data, error } = await supabase
        .from('discounts')
        .select('*')
        .order('sort_order')

      if (error) throw error
      return data || []
    }
  })
}

export function useFamilyDiscounts() {
  return useQuery({
    queryKey: ['family-discounts'],
    queryFn: async (): Promise<FamilyDiscount[]> => {
      const { data, error } = await supabase
        .from('family_discounts')
        .select('*')
        .order('position')

      if (error) throw error
      return data || []
    }
  })
}

export function useCreateDiscount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (discount: Omit<Discount, 'id' | 'current_uses'>) => {
      const { data, error } = await supabase
        .from('discounts')
        .insert(discount)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] })
    }
  })
}

export function useUpdateDiscount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Discount> & { id: string }) => {
      const { data, error } = await supabase
        .from('discounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] })
    }
  })
}

export function useDeleteDiscount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('discounts')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] })
    }
  })
}

// ============================================
// Plan Add-ons
// ============================================

export function usePlanAddons() {
  return useQuery({
    queryKey: ['plan-addons'],
    queryFn: async (): Promise<PlanAddon[]> => {
      const { data, error } = await supabase
        .from('plan_addons')
        .select('*')
        .order('sort_order')

      if (error) throw error
      return data || []
    }
  })
}

export function useCreatePlanAddon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (addon: Omit<PlanAddon, 'id' | 'is_active'>) => {
      const { data, error } = await supabase
        .from('plan_addons')
        .insert(addon)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-addons'] })
    }
  })
}

export function useUpdatePlanAddon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PlanAddon> & { id: string }) => {
      const { data, error } = await supabase
        .from('plan_addons')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-addons'] })
    }
  })
}

export function useDeletePlanAddon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('plan_addons')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-addons'] })
    }
  })
}
