import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Tables } from '../types/database.types'

export type Subscription = Tables<'subscriptions'>

export function useMemberSubscriptions(memberId: string | undefined) {
  return useQuery({
    queryKey: ['member-subscriptions', memberId],
    queryFn: async (): Promise<Subscription[]> => {
      if (!memberId) return []

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('member_id', memberId)
        .order('start_date', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    },
    enabled: !!memberId,
  })
}
