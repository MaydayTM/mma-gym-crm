import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database.types'

type Room = Database['public']['Tables']['rooms']['Row']
type RoomInsert = Database['public']['Tables']['rooms']['Insert']
type RoomUpdate = Database['public']['Tables']['rooms']['Update']

export function useRooms(onlyActive = true) {
  return useQuery({
    queryKey: ['rooms', { onlyActive }],
    queryFn: async (): Promise<Room[]> => {
      let query = supabase
        .from('rooms')
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

export function useCreateRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (roomData: RoomInsert) => {
      const { data, error } = await supabase
        .from('rooms')
        .insert(roomData)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}

export function useUpdateRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: RoomUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('rooms')
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
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}

export function useDeleteRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete
      const { error } = await supabase
        .from('rooms')
        .update({ is_active: false })
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}
