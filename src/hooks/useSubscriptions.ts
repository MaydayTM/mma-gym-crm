// src/hooks/useSubscriptions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  frozen_until: string | null
  cancelled_at: string | null
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
        .select('status, final_price, duration_months')

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
          // Calculate monthly rate: final_price / duration_months
          const monthlyRate = sub.duration_months && sub.duration_months > 0
            ? (sub.final_price || 0) / sub.duration_months
            : 0
          stats.total_mrr += monthlyRate
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

export function useCancelSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      // Get subscription details first
      const { data: subscription, error: fetchError } = await supabase
        .from('member_subscriptions')
        .select('member_id')
        .eq('id', subscriptionId)
        .single()

      if (fetchError) throw fetchError

      // Update subscription status to cancelled
      const { error: updateError } = await supabase
        .from('member_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)

      if (updateError) throw updateError

      // Check if member has any other active subscriptions
      const { data: otherActiveSubs, error: checkError } = await supabase
        .from('member_subscriptions')
        .select('id')
        .eq('member_id', subscription.member_id)
        .eq('status', 'active')

      if (checkError) throw checkError

      // If no other active subscriptions, update member status to cancelled
      if (!otherActiveSubs || otherActiveSubs.length === 0) {
        const { error: memberError } = await supabase
          .from('members')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.member_id)

        if (memberError) {
          console.error('Error updating member status:', memberError)
        }
      }

      return subscription.member_id
    },
    onSuccess: (memberId) => {
      queryClient.invalidateQueries({ queryKey: ['member-subscriptions', memberId] })
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['subscription-stats'] })
      queryClient.invalidateQueries({ queryKey: ['member', memberId] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
    }
  })
}

export function useFreezeSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ subscriptionId, frozenUntil }: { subscriptionId: string; frozenUntil: string }) => {
      // Get subscription details first
      const { data: subscription, error: fetchError } = await supabase
        .from('member_subscriptions')
        .select('member_id')
        .eq('id', subscriptionId)
        .single()

      if (fetchError) throw fetchError

      // Update subscription status to frozen
      const { error: updateError } = await supabase
        .from('member_subscriptions')
        .update({
          status: 'frozen',
          frozen_until: frozenUntil
        })
        .eq('id', subscriptionId)

      if (updateError) throw updateError

      return subscription.member_id
    },
    onSuccess: (memberId) => {
      queryClient.invalidateQueries({ queryKey: ['member-subscriptions', memberId] })
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['subscription-stats'] })
      queryClient.invalidateQueries({ queryKey: ['member', memberId] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
    }
  })
}

export function useUnfreezeSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      // Get subscription details first
      const { data: subscription, error: fetchError } = await supabase
        .from('member_subscriptions')
        .select('member_id, frozen_until, end_date, status')
        .eq('id', subscriptionId)
        .single()

      if (fetchError) throw fetchError

      // Calculate extension period based on how long it was frozen
      let newEndDate = subscription.end_date
      if (subscription.frozen_until && subscription.end_date && subscription.status === 'frozen') {
        const frozenUntilDate = new Date(subscription.frozen_until)
        const now = new Date()

        // If frozen_until is in the future, extend by the frozen duration
        if (frozenUntilDate > now) {
          const frozenDays = Math.floor((frozenUntilDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

          // Extend end_date by the remaining frozen period
          const currentEndDate = new Date(subscription.end_date)
          currentEndDate.setDate(currentEndDate.getDate() + frozenDays)
          newEndDate = currentEndDate.toISOString().split('T')[0]
        }
      }

      // Update subscription status back to active
      const { error: updateError } = await supabase
        .from('member_subscriptions')
        .update({
          status: 'active',
          frozen_until: null,
          end_date: newEndDate
        })
        .eq('id', subscriptionId)

      if (updateError) throw updateError

      // Update member status to active if they were frozen
      const { error: memberError } = await supabase
        .from('members')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.member_id)
        .eq('status', 'frozen')

      if (memberError) {
        console.error('Error updating member status:', memberError)
      }

      return subscription.member_id
    },
    onSuccess: (memberId) => {
      queryClient.invalidateQueries({ queryKey: ['member-subscriptions', memberId] })
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['subscription-stats'] })
      queryClient.invalidateQueries({ queryKey: ['member', memberId] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
    }
  })
}
