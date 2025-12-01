import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

interface CheckinParams {
  memberId: string
  method?: 'manual' | 'qr_code' | 'card'
  location?: string
}

export function useCheckin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ memberId, method = 'manual', location }: CheckinParams) => {
      // Create check-in record
      const { data: checkin, error: checkinError } = await supabase
        .from('checkins')
        .insert({
          member_id: memberId,
          method,
          location,
          checkin_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (checkinError) {
        throw new Error(`Check-in mislukt: ${checkinError.message}`)
      }

      // Update member's last_checkin_at
      const { error: memberError } = await supabase
        .from('members')
        .update({
          last_checkin_at: new Date().toISOString(),
        })
        .eq('id', memberId)

      // If member update fails, log it but don't fail the check-in
      if (memberError) {
        console.error('Failed to update member last_checkin_at:', memberError)
      }

      // Note: total_checkins increment would be handled by a database trigger or RPC
      // For now, we rely on the checkins table as the source of truth

      return checkin
    },
    onSuccess: (_data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['member', variables.memberId] })
      queryClient.invalidateQueries({ queryKey: ['member-checkins', variables.memberId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useCheckout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (checkinId: string) => {
      const { data, error } = await supabase
        .from('checkins')
        .update({
          checkout_at: new Date().toISOString(),
        })
        .eq('id', checkinId)
        .select()
        .single()

      if (error) {
        throw new Error(`Check-out mislukt: ${error.message}`)
      }

      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['member', data.member_id] })
      queryClient.invalidateQueries({ queryKey: ['member-checkins', data.member_id] })
    },
  })
}
