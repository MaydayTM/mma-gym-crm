import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Tables, TablesInsert } from '../types/database.types'

type Reservation = Tables<'reservations'>
type ReservationInsert = TablesInsert<'reservations'>

type ReservationWithClass = Reservation & {
  classes: {
    name: string
    start_time: string
    end_time: string
    room: string | null
    disciplines: { name: string; color: string } | null
    coach: { first_name: string; last_name: string } | null
  } | null
}

type ReservationWithMember = Reservation & {
  member: {
    first_name: string
    last_name: string
    profile_picture_url: string | null
  } | null
}

export function useReservations(memberId?: string, date?: string) {
  return useQuery({
    queryKey: ['reservations', { memberId, date }],
    queryFn: async (): Promise<ReservationWithClass[]> => {
      let query = supabase
        .from('reservations')
        .select(`
          *,
          classes:class_id (
            name,
            start_time,
            end_time,
            room,
            disciplines:discipline_id (name, color),
            coach:coach_id (first_name, last_name)
          )
        `)
        .order('reservation_date', { ascending: true })

      if (memberId) {
        query = query.eq('member_id', memberId)
      }

      if (date) {
        query = query.eq('reservation_date', date)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      return (data || []) as ReservationWithClass[]
    },
    enabled: !!memberId || !!date,
  })
}

export function useCreateReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (reservation: ReservationInsert) => {
      const { data, error } = await supabase
        .from('reservations')
        .insert(reservation)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
    },
  })
}

export function useCancelReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reservations')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
    },
  })
}

export function useCheckInReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('reservations')
        .update({
          status: 'checked_in',
          checked_in_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
    },
  })
}

// Get reservations for a specific class on a specific date (for capacity check)
export function useClassReservations(classId: string, date: string) {
  return useQuery({
    queryKey: ['reservations', 'class', classId, date],
    queryFn: async (): Promise<ReservationWithMember[]> => {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          member:member_id (first_name, last_name, profile_picture_url)
        `)
        .eq('class_id', classId)
        .eq('reservation_date', date)
        .neq('status', 'cancelled')

      if (error) {
        throw new Error(error.message)
      }

      return (data || []) as ReservationWithMember[]
    },
    enabled: !!classId && !!date,
  })
}
