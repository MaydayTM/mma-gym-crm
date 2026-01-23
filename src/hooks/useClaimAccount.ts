import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

/**
 * Hook for managing member account claim/onboarding in the CRM
 */

interface ClaimAccountStats {
  unclaimed_members: number
  pending_tokens: number
  expired_tokens: number
  claimed_accounts: number
  total_active_accounts: number
}

interface UnclaimedMember {
  id: string
  first_name: string
  last_name: string
  email: string | null
  clubplanner_member_nr: number | null
  status: string | null
  created_at: string | null
  has_pending_token: boolean
  token_expires_at: string | null
}

/**
 * Get claim account statistics
 * Note: Uses raw SQL query since claim_account_stats view is created by migration 057
 */
export function useClaimAccountStats() {
  return useQuery({
    queryKey: ['claim-account-stats'],
    queryFn: async (): Promise<ClaimAccountStats> => {
      // Use raw query since the view might not exist in types yet
      const { data, error } = await supabase.rpc('get_claim_stats' as never)

      if (error) {
        // Fallback: calculate stats manually if RPC doesn't exist
        console.warn('Claim stats RPC not available, calculating manually')

        const { count: unclaimed } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .is('auth_user_id', null)
          .eq('status', 'active')

        const { count: withAuth } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .not('auth_user_id', 'is', null)

        return {
          unclaimed_members: unclaimed || 0,
          pending_tokens: 0, // Can't know without the table
          expired_tokens: 0,
          claimed_accounts: 0,
          total_active_accounts: withAuth || 0,
        }
      }

      return data as ClaimAccountStats
    },
  })
}

/**
 * Get list of members who haven't claimed their account yet
 */
export function useUnclaimedMembers(filter: 'all' | 'no_invite' | 'pending' = 'all') {
  return useQuery({
    queryKey: ['unclaimed-members', filter],
    queryFn: async (): Promise<UnclaimedMember[]> => {
      // Get members without auth_user_id
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select(`
          id,
          first_name,
          last_name,
          email,
          clubplanner_member_nr,
          status,
          created_at
        `)
        .is('auth_user_id', null)
        .in('status', ['active', 'frozen'])
        .order('last_name', { ascending: true })

      if (membersError) {
        console.error('Error fetching unclaimed members:', membersError)
        throw membersError
      }

      if (!members || members.length === 0) {
        return []
      }

      // For now, just return members without token info
      // Token info will be available after migration 057 is applied
      const result: UnclaimedMember[] = members.map(member => ({
        id: member.id,
        first_name: member.first_name,
        last_name: member.last_name,
        email: member.email,
        clubplanner_member_nr: member.clubplanner_member_nr,
        status: member.status,
        created_at: member.created_at,
        has_pending_token: false, // Will be populated after migration
        token_expires_at: null,
      }))

      // Apply filter (no_invite and pending will work the same until migration is applied)
      if (filter === 'no_invite') {
        return result.filter(m => !m.has_pending_token)
      }
      if (filter === 'pending') {
        return result.filter(m => m.has_pending_token)
      }

      return result
    },
  })
}

/**
 * Send claim email to a single member
 */
export function useSendClaimEmail() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ memberId, resend = false }: { memberId: string; resend?: boolean }) => {
      const { data, error } = await supabase.functions.invoke('send-claim-email', {
        body: { member_id: memberId, resend },
      })

      if (error) {
        throw error
      }

      if (data.error) {
        throw new Error(data.error)
      }

      return data
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['claim-account-stats'] })
      queryClient.invalidateQueries({ queryKey: ['unclaimed-members'] })
    },
  })
}

/**
 * Send claim emails to multiple members (bulk)
 */
export function useSendBulkClaimEmails() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (memberIds: string[]) => {
      const results = await Promise.allSettled(
        memberIds.map(memberId =>
          supabase.functions.invoke('send-claim-email', {
            body: { member_id: memberId },
          })
        )
      )

      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      return { successful, failed, total: memberIds.length }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claim-account-stats'] })
      queryClient.invalidateQueries({ queryKey: ['unclaimed-members'] })
    },
  })
}
