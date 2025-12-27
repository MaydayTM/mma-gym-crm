import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database.types'

type ClassTrack = Database['public']['Tables']['class_tracks']['Row']
type ClassTrackInsert = Database['public']['Tables']['class_tracks']['Insert']
type ClassTrackUpdate = Database['public']['Tables']['class_tracks']['Update']

export function useClassTracks(onlyActive = true) {
  return useQuery({
    queryKey: ['class-tracks', { onlyActive }],
    queryFn: async (): Promise<ClassTrack[]> => {
      let query = supabase
        .from('class_tracks')
        .select('*')
        .order('sort_order')
        .order('name')

      if (onlyActive) {
        query = query.eq('is_active', true)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
  })
}

export function useCreateClassTrack() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (trackData: ClassTrackInsert) => {
      const { data, error } = await supabase
        .from('class_tracks')
        .insert(trackData)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-tracks'] })
    },
  })
}

export function useUpdateClassTrack() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: ClassTrackUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('class_tracks')
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
      queryClient.invalidateQueries({ queryKey: ['class-tracks'] })
    },
  })
}

export function useDeleteClassTrack() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete door is_active op false te zetten
      const { error } = await supabase
        .from('class_tracks')
        .update({ is_active: false })
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-tracks'] })
    },
  })
}
