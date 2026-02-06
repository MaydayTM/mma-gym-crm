import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Tables } from '../types/database.types'

const TENANT_ID = 'reconnect-academy'

export type AccessMode = 'subscription_only' | 'reservation_required' | 'open_gym'

export interface OpenGymHour {
  day: number // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  open: string // "HH:MM"
  close: string // "HH:MM"
}

export type AccessSettings = Tables<'gym_access_settings'> & {
  open_gym_hours: OpenGymHour[]
}

export interface AccessSettingsFormData {
  access_mode: AccessMode
  minutes_before_class: number
  grace_period_minutes: number
  open_gym_hours: OpenGymHour[]
}

export function useAccessSettings() {
  const queryClient = useQueryClient()

  const {
    data: settings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['access-settings', TENANT_ID],
    queryFn: async (): Promise<AccessSettings | null> => {
      const { data, error } = await supabase
        .from('gym_access_settings')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data as unknown as AccessSettings | null
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (formData: AccessSettingsFormData): Promise<void> => {
      const updateData = {
        tenant_id: TENANT_ID,
        access_mode: formData.access_mode,
        minutes_before_class: formData.minutes_before_class,
        grace_period_minutes: formData.grace_period_minutes,
        open_gym_hours: JSON.parse(JSON.stringify(formData.open_gym_hours)),
        updated_at: new Date().toISOString(),
      }

      if (settings?.id) {
        const { error } = await supabase
          .from('gym_access_settings')
          .update(updateData)
          .eq('id', settings.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('gym_access_settings')
          .insert(updateData)

        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-settings'] })
    },
  })

  return {
    settings,
    isLoading,
    error: error as Error | null,
    saveSettings: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error as Error | null,
  }
}
