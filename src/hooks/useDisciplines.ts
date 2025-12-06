import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database.types'

type Discipline = Database['public']['Tables']['disciplines']['Row']

export function useDisciplines() {
  return useQuery({
    queryKey: ['disciplines'],
    queryFn: async (): Promise<Discipline[]> => {
      const { data, error } = await supabase
        .from('disciplines')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 60, // 1 hour - disciplines change rarely
  })
}

export function useDiscipline(id: string | undefined) {
  return useQuery({
    queryKey: ['disciplines', id],
    queryFn: async (): Promise<Discipline | null> => {
      if (!id) return null

      const { data, error } = await supabase
        .from('disciplines')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}
