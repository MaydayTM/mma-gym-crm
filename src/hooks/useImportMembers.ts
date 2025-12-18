import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database.types'

type MemberInsert = Database['public']['Tables']['members']['Insert']

export function useImportMembers() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (members: MemberInsert[]) => {
      // Insert in batches of 50 to avoid hitting limits
      // Use upsert with onConflict to handle duplicate emails gracefully
      const batchSize = 50
      const results = []

      for (let i = 0; i < members.length; i += batchSize) {
        const batch = members.slice(i, i + batchSize)

        // Use upsert - if email already exists, skip (ignoreDuplicates)
        // This prevents 409 Conflict errors from duplicate emails
        const { data, error } = await supabase
          .from('members')
          .upsert(batch, {
            onConflict: 'email',
            ignoreDuplicates: true, // Skip rows that would cause conflicts
          })
          .select('id, first_name, last_name, email')

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
