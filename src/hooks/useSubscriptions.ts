// src/hooks/useSubscriptions.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface MemberSubscription {
  id: string
  member_id: string
  age_group_id: string | null
  plan_type_id: string | null
  duration_months: number | null
  base_price: number
  family_discount: number | null
  addon_total: number | null
  final_price: number
  start_date: string
  end_date: string | null
  status: string | null
  payment_provider: string | null
  created_at: string | null
  members: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    profile_picture_url: string | null
  } | null
  age_groups: {
    name: string
  } | null
  plan_types: {
    name: string
  } | null
}

export function useSubscriptions(status?: string) {
  return useQuery({
    queryKey: ['subscriptions', status],
    queryFn: async (): Promise<MemberSubscription[]> => {
      let query = supabase
        .from('member_subscriptions')
        .select(`
          *,
          members (
            id,
            first_name,
            last_name,
            email,
            profile_picture_url
          ),
          age_groups (name),
          plan_types (name)
        `)
        .order('created_at', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
  })
}

export function useSubscriptionStats() {
  return useQuery({
    queryKey: ['subscription-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_subscriptions')
        .select('status, final_price')

      if (error) throw error

      const stats = {
        active: 0,
        cancelled: 0,
        expired: 0,
        frozen: 0,
        total_mrr: 0,
      }

      data?.forEach((sub) => {
        if (sub.status === 'active') {
          stats.active++
          stats.total_mrr += sub.final_price || 0
        } else if (sub.status === 'cancelled') {
          stats.cancelled++
        } else if (sub.status === 'expired') {
          stats.expired++
        } else if (sub.status === 'frozen') {
          stats.frozen++
        }
      })

      return stats
    },
  })
}
