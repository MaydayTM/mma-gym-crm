import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface DuplicateMember {
  group_id: number
  member_id: string
  match_type: 'email' | 'phone_lastname' | 'name_birthdate' | 'fuzzy_name'
  confidence: number
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  has_subscription: boolean
  total_checkins: number
  profile_completeness: number
  created_at: string
  is_recommended_master: boolean
}

export interface DuplicateGroup {
  group_id: number
  match_type: string
  confidence: number
  members: DuplicateMember[]
  recommended_master_id: string
}

export interface MergeResult {
  success: boolean
  error?: string
  merged_count?: number
  checkins_moved?: number
  subscriptions_moved?: number
  belts_moved?: number
}

// Hook om duplicaten te vinden in de database
export function useFindDuplicates() {
  return useQuery({
    queryKey: ['duplicates'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('find_duplicate_members')

      if (error) {
        console.error('Error finding duplicates:', error)
        throw error
      }

      // Groepeer resultaten per group_id
      const groups = new Map<number, DuplicateGroup>()

      for (const row of (data as DuplicateMember[]) || []) {
        if (!groups.has(row.group_id)) {
          groups.set(row.group_id, {
            group_id: row.group_id,
            match_type: row.match_type,
            confidence: row.confidence,
            members: [],
            recommended_master_id: '',
          })
        }

        const group = groups.get(row.group_id)!
        group.members.push(row)

        if (row.is_recommended_master) {
          group.recommended_master_id = row.member_id
        }
      }

      return Array.from(groups.values())
    },
    staleTime: 0, // Altijd ophalen, duplicaten kunnen veranderen
  })
}

// Hook om duplicaten samen te voegen
export function useMergeDuplicates() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      masterId,
      duplicateIds,
    }: {
      masterId: string
      duplicateIds: string[]
    }): Promise<MergeResult> => {
      const { data, error } = await supabase.rpc('merge_duplicate_members', {
        p_master_id: masterId,
        p_duplicate_ids: duplicateIds,
      })

      if (error) {
        console.error('Error merging duplicates:', error)
        throw error
      }

      return data as unknown as MergeResult
    },
    onSuccess: () => {
      // Invalidate alle relevante queries
      queryClient.invalidateQueries({ queryKey: ['duplicates'] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
    },
  })
}

// Hook om alle aanbevolen merges in één keer uit te voeren
export function useMergeAllRecommended() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (groups: DuplicateGroup[]): Promise<{
      totalMerged: number
      totalDeleted: number
      errors: string[]
    }> => {
      let totalMerged = 0
      let totalDeleted = 0
      const errors: string[] = []

      for (const group of groups) {
        const duplicateIds = group.members
          .filter((m) => m.member_id !== group.recommended_master_id)
          .map((m) => m.member_id)

        if (duplicateIds.length === 0) continue

        try {
          const { data, error } = await supabase.rpc('merge_duplicate_members', {
            p_master_id: group.recommended_master_id,
            p_duplicate_ids: duplicateIds,
          })

          if (error) throw error

          const result = data as unknown as MergeResult
          if (result.success) {
            totalMerged++
            totalDeleted += result.merged_count || 0
          } else {
            errors.push(result.error || 'Unknown error')
          }
        } catch (err) {
          errors.push(`Group ${group.group_id}: ${err}`)
        }
      }

      return { totalMerged, totalDeleted, errors }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duplicates'] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
    },
  })
}

// Hook om CSV import data te checken tegen bestaande leden
export function useCheckImportDuplicates() {
  return useMutation({
    mutationFn: async ({
      emails,
      phones,
    }: {
      emails: string[]
      phones: string[]
    }) => {
      const { data, error } = await supabase.rpc('check_import_duplicates', {
        p_emails: emails,
        p_phones: phones,
        p_names: [], // Nog niet geïmplementeerd
      })

      if (error) {
        console.error('Error checking import duplicates:', error)
        throw error
      }

      return data as Array<{
        input_index: number
        existing_member_id: string
        match_type: string
        confidence: number
        existing_first_name: string
        existing_last_name: string
        existing_email: string
      }>
    },
  })
}

// Hulpfunctie om match type te vertalen
export function getMatchTypeLabel(matchType: string): string {
  const labels: Record<string, string> = {
    email: 'Zelfde email',
    phone_lastname: 'Zelfde telefoon + achternaam',
    name_birthdate: 'Zelfde naam + geboortedatum',
    fuzzy_name: 'Vergelijkbare naam',
    phone: 'Zelfde telefoon',
  }
  return labels[matchType] || matchType
}

// Hulpfunctie om confidence kleur te bepalen
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 95) return 'text-red-400'
  if (confidence >= 80) return 'text-orange-400'
  return 'text-yellow-400'
}
