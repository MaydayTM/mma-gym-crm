import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { TablesInsert } from '../types/database.types'

type NewMember = TablesInsert<'members'>

export function useImportMembers() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (members: NewMember[]) => {
      // Insert in batches of 50 to avoid hitting limits
      const batchSize = 50
      const results = []

      for (let i = 0; i < members.length; i += batchSize) {
        const batch = members.slice(i, i + batchSize)

        const { data, error } = await supabase
          .from('members')
          .insert(batch)
          .select()

        if (error) {
          throw new Error(`Batch ${Math.floor(i / batchSize) + 1} failed: ${error.message}`)
        }

        results.push(...(data || []))
      }

      return results
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['members'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
