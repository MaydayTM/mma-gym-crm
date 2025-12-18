import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

// Flexible type for import - only requires essential fields
type ImportMember = {
  first_name: string
  last_name: string
  email: string
  status: string
  role: string
  [key: string]: unknown // Allow any additional fields
}

export function useImportMembers() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (members: ImportMember[]) => {
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
