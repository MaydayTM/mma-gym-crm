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

// Check if a member's subscription covers a class's discipline
export async function checkDisciplineAccess(
  memberId: string,
  classId: string
): Promise<{ allowed: boolean; reason?: string }> {
  // 1. Get class discipline
  const { data: cls } = await supabase
    .from('classes')
    .select('discipline_id, disciplines:discipline_id (name)')
    .eq('id', classId)
    .single()

  if (!cls?.discipline_id) {
    return { allowed: true } // No discipline = open access
  }

  // 2. Get member's active subscription
  const today = new Date().toISOString().split('T')[0]
  const { data: subscription } = await supabase
    .from('member_subscriptions')
    .select('plan_type_id, selected_discipline_id')
    .eq('member_id', memberId)
    .eq('status', 'active')
    .gte('end_date', today)
    .order('end_date', { ascending: false })
    .limit(1)
    .single()

  if (!subscription) {
    return { allowed: false, reason: 'Geen actief abonnement' }
  }

  // 3. If member has a selected discipline (Basic plan), check direct match
  if (subscription.selected_discipline_id) {
    if (subscription.selected_discipline_id === cls.discipline_id) {
      return { allowed: true }
    }
    const disciplineName = (cls.disciplines as { name: string } | null)?.name || 'deze discipline'
    return {
      allowed: false,
      reason: `Je abonnement geeft geen toegang tot ${disciplineName}`
    }
  }

  // 4. Check plan_type_disciplines table
  if (subscription.plan_type_id) {
    const { data: link } = await supabase
      .from('plan_type_disciplines')
      .select('id')
      .eq('plan_type_id', subscription.plan_type_id)
      .eq('discipline_id', cls.discipline_id)
      .limit(1)
      .single()

    if (link) {
      return { allowed: true }
    }

    // Check if plan has ANY disciplines linked (if none, it's a "choose your own" plan)
    const { count } = await supabase
      .from('plan_type_disciplines')
      .select('id', { count: 'exact', head: true })
      .eq('plan_type_id', subscription.plan_type_id)

    if (count === 0) {
      // No disciplines linked to plan = open access (or member needs to pick one)
      return { allowed: true }
    }

    const disciplineName = (cls.disciplines as { name: string } | null)?.name || 'deze discipline'
    return {
      allowed: false,
      reason: `Je abonnement geeft geen toegang tot ${disciplineName}`
    }
  }

  // No plan type = legacy subscription, allow
  return { allowed: true }
}

export function useCreateReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (reservation: ReservationInsert) => {
      // Validate discipline access before inserting
      const access = await checkDisciplineAccess(
        reservation.member_id!,
        reservation.class_id!
      )

      if (!access.allowed) {
        throw new Error(access.reason || 'Geen toegang tot deze les')
      }

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
