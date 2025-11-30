import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Tables } from '../types/database.types'

export type Checkin = Tables<'checkins'>

export function useMemberCheckins(memberId: string | undefined, limit = 20) {
  return useQuery({
    queryKey: ['member-checkins', memberId, limit],
    queryFn: async (): Promise<Checkin[]> => {
      if (!memberId) return []

      const { data, error } = await supabase
        .from('checkins')
        .select('*')
        .eq('member_id', memberId)
        .order('checkin_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    },
    enabled: !!memberId,
  })
}
