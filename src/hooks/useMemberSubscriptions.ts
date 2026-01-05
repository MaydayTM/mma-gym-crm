import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Tables } from '../types/database.types'

// Support both old and new subscription tables
export type MemberSubscription = Tables<'member_subscriptions'>
export type LegacySubscription = Tables<'subscriptions'>

export interface CombinedSubscription {
  id: string
  member_id: string
  start_date: string
  end_date: string | null
  status: string | null
  base_price: number
  final_price: number
  duration_months: number | null
  age_group_name?: string
  plan_type_name?: string
  payment_status?: string | null
  notes?: string | null
  source: 'new' | 'legacy'
}

export function useMemberSubscriptions(memberId: string | undefined) {
  return useQuery({
    queryKey: ['member-subscriptions', memberId],
    queryFn: async (): Promise<CombinedSubscription[]> => {
      if (!memberId) return []

      // Fetch from new member_subscriptions table with joins
      const { data: newSubs, error: newError } = await supabase
        .from('member_subscriptions')
        .select(`
          *,
          age_groups(name),
          plan_types(name)
        `)
        .eq('member_id', memberId)
        .order('start_date', { ascending: false })

      if (newError) {
        console.error('Error fetching member_subscriptions:', newError)
      }

      // Also fetch from legacy subscriptions table
      const { data: legacySubs, error: legacyError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('member_id', memberId)
        .order('start_date', { ascending: false })

      if (legacyError) {
        console.error('Error fetching legacy subscriptions:', legacyError)
      }

      // Combine and normalize results
      const combined: CombinedSubscription[] = []

      // Add new subscriptions
      if (newSubs) {
        for (const sub of newSubs) {
          combined.push({
            id: sub.id,
            member_id: sub.member_id,
            start_date: sub.start_date,
            end_date: sub.end_date,
            status: sub.status,
            base_price: Number(sub.base_price),
            final_price: Number(sub.final_price),
            duration_months: sub.duration_months,
            age_group_name: (sub.age_groups as { name: string } | null)?.name,
            plan_type_name: (sub.plan_types as { name: string } | null)?.name,
            payment_status: sub.payment_status,
            notes: sub.notes,
            source: 'new'
          })
        }
      }

      // Add legacy subscriptions (if not already in new table)
      if (legacySubs) {
        for (const sub of legacySubs) {
          // Check if this subscription is already in combined (by id)
          if (!combined.find(c => c.id === sub.id)) {
            combined.push({
              id: sub.id,
              member_id: sub.member_id,
              start_date: sub.start_date,
              end_date: sub.end_date,
              status: sub.status,
              base_price: Number(sub.price),
              final_price: Number(sub.price),
              duration_months: sub.billing_interval === 'monthly' ? 1 :
                              sub.billing_interval === 'quarterly' ? 3 :
                              sub.billing_interval === 'yearly' ? 12 : null,
              age_group_name: undefined,
              plan_type_name: sub.name,
              payment_status: null,
              notes: null,
              source: 'legacy'
            })
          }
        }
      }

      // Sort by start_date descending
      combined.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())

      return combined
    },
    enabled: !!memberId,
  })
}
