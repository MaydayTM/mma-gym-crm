import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Tables } from '../types/database.types'

export type Member = Tables<'members'>

interface MemberFilters {
  role?: string
  status?: string
}

export function useMembers(filters?: MemberFilters) {
  return useQuery({
    queryKey: ['members', filters],
    queryFn: async (): Promise<Member[]> => {
      let query = supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters?.role) {
        query = query.eq('role', filters.role)
      }

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    },
  })
}
