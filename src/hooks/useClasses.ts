import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database.types'

type Class = Database['public']['Tables']['classes']['Row']
type ClassInsert = Database['public']['Tables']['classes']['Insert']
type ClassUpdate = Database['public']['Tables']['classes']['Update']

type ClassWithRelations = Class & {
  disciplines: { name: string; color: string; slug: string } | null
  coach: { first_name: string; last_name: string } | null
  track: { id: string; name: string; color: string } | null
  room_rel: { id: string; name: string; color: string } | null
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
          coach:coach_id (first_name, last_name),
          track:track_id (id, name, color),
          room_rel:room_id (id, name, color)
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

export function useBulkDeleteClasses() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('classes')
        .update({ is_active: false })
        .in('id', ids)

      if (error) {
        throw new Error(error.message)
      }

      return ids.length
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
    },
  })
}

// Helper: genereer datums voor recurring classes
function generateRecurringDates(
  startDate: Date,
  endDate: Date,
  dayOfWeek: number
): Date[] {
  const dates: Date[] = []
  const current = new Date(startDate)

  // Vind eerste dag die overeenkomt met dayOfWeek
  while (current.getDay() !== dayOfWeek) {
    current.setDate(current.getDate() + 1)
  }

  // Genereer alle datums tot en met endDate
  while (current <= endDate) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 7) // Volgende week
  }

  return dates
}

export function useCreateRecurringClass() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      classData,
      recurrenceEndDate,
    }: {
      classData: ClassInsert
      recurrenceEndDate: string
    }) => {
      // 1. Maak de class template aan met recurrence info
      const { data: newClass, error: classError } = await supabase
        .from('classes')
        .insert({
          ...classData,
          is_recurring: true,
          recurrence_end_date: recurrenceEndDate,
        })
        .select()
        .single()

      if (classError) {
        throw new Error(classError.message)
      }

      // 2. Genereer alle instances
      const startDate = new Date()
      const endDate = new Date(recurrenceEndDate)
      const dates = generateRecurringDates(
        startDate,
        endDate,
        classData.day_of_week
      )

      if (dates.length > 0) {
        const instances = dates.map((date) => ({
          class_id: newClass.id,
          date: date.toISOString().split('T')[0],
          start_time: classData.start_time,
          end_time: classData.end_time,
          coach_id: classData.coach_id,
        }))

        const { error: instancesError } = await supabase
          .from('class_instances')
          .insert(instances)

        if (instancesError) {
          // Rollback: verwijder de class als instances falen
          await supabase.from('classes').delete().eq('id', newClass.id)
          throw new Error(instancesError.message)
        }
      }

      return { class: newClass, instanceCount: dates.length }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      queryClient.invalidateQueries({ queryKey: ['class-instances'] })
    },
  })
}

// Hook voor class instances (voor een specifieke week of periode)
export function useClassInstances(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['class-instances', { startDate, endDate }],
    queryFn: async () => {
      let query = supabase
        .from('class_instances')
        .select(`
          *,
          classes:class_id (
            id,
            name,
            discipline_id,
            max_capacity,
            room,
            disciplines:discipline_id (name, color, slug)
          ),
          coach:coach_id (first_name, last_name)
        `)
        .eq('is_cancelled', false)
        .order('date')
        .order('start_time')

      if (startDate) {
        query = query.gte('date', startDate)
      }

      if (endDate) {
        query = query.lte('date', endDate)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    enabled: !!startDate || !!endDate,
  })
}

// Hook om een specifieke instance te annuleren
export function useCancelClassInstance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      instanceId,
      reason,
    }: {
      instanceId: string
      reason?: string
    }) => {
      const { error } = await supabase
        .from('class_instances')
        .update({
          is_cancelled: true,
          cancellation_reason: reason,
        })
        .eq('id', instanceId)

      if (error) {
        throw new Error(error.message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-instances'] })
    },
  })
}
