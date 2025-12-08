import { useQuery } from '@tanstack/react-query'
import { supabase, type DashboardStats } from '../lib/supabase'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats | null> => {
      console.log('[useDashboardStats] Starting query...')
      const startTime = Date.now()

      try {
        const { data, error } = await supabase
          .from('dashboard_stats')
          .select('*')
          .single()

        console.log('[useDashboardStats] Query completed in', Date.now() - startTime, 'ms')
        console.log('[useDashboardStats] Data:', data ? 'received' : 'null', 'Error:', error?.message)

        if (error) {
          console.error('[useDashboardStats] Query error:', error)
          throw error
        }
        return data
      } catch (err) {
        console.error('[useDashboardStats] Exception:', err)
        throw err
      }
    },
  })
}

export type RetentionStats = {
  healthy: number
  at_risk: number
  critical: number
  churned: number
  never_visited: number
}

export function useRetentionStats() {
  return useQuery({
    queryKey: ['retention-stats'],
    queryFn: async (): Promise<RetentionStats> => {
      const { data, error } = await supabase
        .from('member_retention_status')
        .select('retention_status')

      if (error) throw error

      // Count by status
      const stats: RetentionStats = {
        healthy: 0,
        at_risk: 0,
        critical: 0,
        churned: 0,
        never_visited: 0,
      }

      data?.forEach((row) => {
        const status = row.retention_status as keyof RetentionStats
        if (status && status in stats) {
          stats[status]++
        }
      })

      return stats
    },
  })
}
