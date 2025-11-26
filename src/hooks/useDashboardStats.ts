import { useQuery } from '@tanstack/react-query'
import { supabase, type DashboardStats } from '../lib/supabase'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats | null> => {
      const { data, error } = await supabase
        .from('dashboard_stats')
        .select('*')
        .single()

      if (error) throw error
      return data
    },
  })
}
