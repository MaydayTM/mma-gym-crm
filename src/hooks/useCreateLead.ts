import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Lead } from './useLeads'

type CreateLeadData = {
  first_name: string
  last_name?: string | null
  email?: string | null
  phone?: string | null
  source?: string | null
  source_detail?: string | null
  interested_in?: string[] | null
  notes?: string | null
  trial_date?: string | null
  follow_up_date?: string | null
  assigned_to?: string | null
}

export function useCreateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateLeadData): Promise<Lead> => {
      const { data: lead, error } = await supabase
        .from('leads')
        .insert({
          ...data,
          status: 'new',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return lead
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })
}
