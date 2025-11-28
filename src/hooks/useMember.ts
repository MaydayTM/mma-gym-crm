import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Member } from './useMembers'

export function useMember(id: string | undefined) {
  return useQuery({
    queryKey: ['member', id],
    queryFn: async (): Promise<Member | null> => {
      if (!id) return null

      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    enabled: !!id,
  })
}
