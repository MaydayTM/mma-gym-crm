import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database.types'

type Class = Database['public']['Tables']['classes']['Row']
type ClassInsert = Database['public']['Tables']['classes']['Insert']
type ClassUpdate = Database['public']['Tables']['classes']['Update']

type ClassWithRelations = Class & {
  disciplines: { name: string; color: string; slug: string } | null
  coach: { first_name: string; last_name: string } | null
}

export function useClasses(dayOfWeek?: number) {
  return useQuery({
    queryKey: ['classes', { dayOfWeek }],
    queryFn: async (): Promise<ClassWithRelations[]> => {
      let query = supabase
        .from('classes')
        .select(`
          *,
          disciplines:discipline_id (name, color, slug),
          coach:coach_id (first_name, last_name)
        `)
        .eq('is_active', true)
        .order('start_time')

      if (dayOfWeek !== undefined) {
        query = query.eq('day_of_week', dayOfWeek)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      return data as ClassWithRelations[]
    },
  })
}

export function useCreateClass() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (classData: ClassInsert) => {
      const { data, error } = await supabase
        .from('classes')
        .insert(classData)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
    },
  })
}

export function useUpdateClass() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: ClassUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('classes')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
    },
  })
}

export function useDeleteClass() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('classes')
        .update({ is_active: false })
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
    },
  })
}
