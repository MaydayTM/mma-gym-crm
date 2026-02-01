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
  sort_order: number | null
  is_active: boolean | null
}

export interface PlanType {
  id: string
  slug: string
  name: string
  description: string | null
  features: unknown
  highlight_text: string | null
  sort_order: number | null
  is_active: boolean | null
}

export interface PricingMatrix {
  id: string
  age_group_id: string
  plan_type_id: string
  duration_months: number
  price: number
  price_per_month: number | null
  savings: number | null
  includes_insurance: boolean | null
  show_on_checkout?: boolean | null
  highlight_text?: string | null
  is_active: boolean | null
}

export interface OneTimeProduct {
  id: string
  slug: string
  name: string
  product_type: string
  price: number
  sessions: number | null
  validity_days: number
  description: string | null
  show_on_checkout?: boolean | null
  sort_order: number | null
  is_active: boolean | null
}

export interface Discount {
  id: string
  slug: string
  name: string
  description: string | null
  discount_type: string
  amount: number | null
  percentage: number | null
  is_exclusive: boolean | null
  requires_verification: boolean | null
  valid_from: string | null
  valid_until: string | null
  max_uses: number | null
  current_uses: number | null
  show_on_checkout: boolean | null
  checkout_code: string | null
  is_active: boolean | null
  sort_order: number | null
}

export interface PlanAddon {
  id: string
  slug: string
  name: string
  description: string | null
  price: number
  billing_type: string
  applicable_to: unknown
  is_required: boolean | null
  sort_order: number | null
  is_active: boolean | null
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
      return (data || []) as AgeGroup[]
    }
  })
}

export function useCreateAgeGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ageGroup: Partial<AgeGroup>) => {
      const { data, error } = await supabase
        .from('age_groups')
        .insert(ageGroup as never)
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
        .update(updates as never)
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
      // Check if there are pricing entries for this age group
      const { data: pricingCount } = await supabase
        .from('pricing_matrix')
        .select('id', { count: 'exact', head: true })
        .eq('age_group_id', id)

      const count = pricingCount?.length || 0

      // Delete will cascade, but warn user
      if (count > 0) {
        const confirmed = confirm(
          `Let op: Dit verwijdert ook ${count} gekoppelde prijzen. Weet je het zeker?`
        )
        if (!confirmed) {
          throw new Error('Verwijdering geannuleerd door gebruiker')
        }
      }

      const { error } = await supabase
        .from('age_groups')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['age-groups'] })
      queryClient.invalidateQueries({ queryKey: ['pricing-matrix'] })
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
      return (data || []) as PlanType[]
    }
  })
}

export function useCreatePlanType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (planType: Partial<PlanType>) => {
      const { data, error } = await supabase
        .from('plan_types')
        .insert(planType as never)
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
        .update(updates as never)
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

export function useDeletePlanType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // Check if there are pricing entries for this plan type
      const { data: pricingCount } = await supabase
        .from('pricing_matrix')
        .select('id', { count: 'exact', head: true })
        .eq('plan_type_id', id)

      const count = pricingCount?.length || 0

      // Delete will cascade, but warn user
      if (count > 0) {
        const confirmed = confirm(
          `Let op: Dit verwijdert ook ${count} gekoppelde prijzen. Weet je het zeker?`
        )
        if (!confirmed) {
          throw new Error('Verwijdering geannuleerd door gebruiker')
        }
      }

      const { error } = await supabase
        .from('plan_types')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-types'] })
      queryClient.invalidateQueries({ queryKey: ['pricing-matrix'] })
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
      return (data || []) as PricingMatrix[]
    }
  })
}

export function useCreatePricing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (pricing: Partial<PricingMatrix>) => {
      const { data, error } = await supabase
        .from('pricing_matrix')
        .insert(pricing as never)
        .select()
        .single()

      if (error) {
        // Check for unique constraint violation (duplicate pricing entry)
        if (error.code === '23505') {
          throw new Error('Deze combinatie van leeftijdsgroep, type en looptijd bestaat al.')
        }
        throw error
      }
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
        .update(updates as never)
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
      return (data || []) as OneTimeProduct[]
    }
  })
}

export function useCreateOneTimeProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (product: Partial<OneTimeProduct>) => {
      const { data, error } = await supabase
        .from('one_time_products')
        .insert(product as never)
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
        .update(updates as never)
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
      // Use raw SQL query since discounts table is new and not in generated types yet
      const { data, error } = await supabase
        .rpc('get_discounts' as never)

      if (error) {
        // Fallback: try direct query with type assertion
        const result = await (supabase as unknown as { from: (table: string) => { select: (cols: string) => { order: (col: string) => Promise<{ data: Discount[] | null; error: unknown }> } } })
          .from('discounts')
          .select('*')
          .order('sort_order')

        if (result.error) throw result.error
        return (result.data || []) as Discount[]
      }
      return (data || []) as Discount[]
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
      return (data || []) as FamilyDiscount[]
    }
  })
}

export function useCreateDiscount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (discount: Partial<Discount>) => {
      const result = await (supabase as unknown as { from: (table: string) => { insert: (data: unknown) => { select: () => { single: () => Promise<{ data: Discount | null; error: unknown }> } } } })
        .from('discounts')
        .insert(discount)
        .select()
        .single()

      if (result.error) throw result.error
      return result.data
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
      const result = await (supabase as unknown as { from: (table: string) => { update: (data: unknown) => { eq: (col: string, val: string) => { select: () => { single: () => Promise<{ data: Discount | null; error: unknown }> } } } } })
        .from('discounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (result.error) throw result.error
      return result.data
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
      const result = await (supabase as unknown as { from: (table: string) => { delete: () => { eq: (col: string, val: string) => Promise<{ error: unknown }> } } })
        .from('discounts')
        .delete()
        .eq('id', id)

      if (result.error) throw result.error
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
      return (data || []) as PlanAddon[]
    }
  })
}

export function useCreatePlanAddon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (addon: Partial<PlanAddon>) => {
      const { data, error } = await supabase
        .from('plan_addons')
        .insert(addon as never)
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
        .update(updates as never)
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
