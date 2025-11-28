import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { TablesInsert } from '../types/database.types'

type NewMember = TablesInsert<'members'>

export function useCreateMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (member: NewMember) => {
      const { data, error } = await supabase
        .from('members')
        .insert(member)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['members'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
