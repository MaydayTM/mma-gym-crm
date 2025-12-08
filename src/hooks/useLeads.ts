import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Tables } from '../types/database.types'

export type Lead = Tables<'leads'>

export type LeadStatus = 'new' | 'contacted' | 'trial_scheduled' | 'trial_done' | 'converted' | 'lost'

export const LEAD_STATUSES: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'new', label: 'Nieuw', color: 'emerald' },
  { value: 'contacted', label: 'Gecontacteerd', color: 'sky' },
  { value: 'trial_scheduled', label: 'Proefles Gepland', color: 'amber' },
  { value: 'trial_done', label: 'Proefles Gedaan', color: 'purple' },
  { value: 'converted', label: 'Geconverteerd', color: 'green' },
  { value: 'lost', label: 'Verloren', color: 'rose' },
]

export const LEAD_SOURCES = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'website', label: 'Website' },
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'referral', label: 'Referral' },
  { value: 'google', label: 'Google' },
  { value: 'other', label: 'Anders' },
]

export function useLeads() {
  return useQuery({
    queryKey: ['leads'],
    queryFn: async (): Promise<Lead[]> => {
      console.log('[useLeads] Starting query...')
      const startTime = Date.now()

      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false })

        console.log('[useLeads] Query completed in', Date.now() - startTime, 'ms')
        console.log('[useLeads] Data count:', data?.length ?? 0, 'Error:', error?.message)

        if (error) {
          console.error('[useLeads] Query error:', error)
          throw new Error(error.message)
        }

        return data || []
      } catch (err) {
        console.error('[useLeads] Exception:', err)
        throw err
      }
    },
  })
}

// Group leads by status for kanban view
export function useLeadsByStatus() {
  const { data: leads, ...rest } = useLeads()

  const groupedLeads = LEAD_STATUSES.reduce((acc, status) => {
    acc[status.value] = leads?.filter((lead) => lead.status === status.value) || []
    return acc
  }, {} as Record<LeadStatus, Lead[]>)

  return { data: groupedLeads, leads, ...rest }
}
