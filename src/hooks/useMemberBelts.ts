import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Tables, InsertTables } from '../lib/supabase'

type MemberBelt = Tables<'member_belts'>
type MemberBeltInsert = InsertTables<'member_belts'>
type BeltHistoryInsert = InsertTables<'belt_history'>

type MemberBeltWithDetails = MemberBelt & {
  disciplines: {
    name: string
    color: string | null
    slug: string
    has_belt_system: boolean | null
  } | null
  training_count?: number
  trainings_since_promotion?: number
}

type BeltHistoryWithDetails = Tables<'belt_history'> & {
  disciplines: {
    name: string
    color: string | null
  } | null
  promoter: {
    first_name: string
    last_name: string
  } | null
}

export function useMemberBelts(memberId: string | undefined) {
  return useQuery({
    queryKey: ['member-belts', memberId],
    queryFn: async (): Promise<MemberBeltWithDetails[]> => {
      if (!memberId) return []

      // Get belts with discipline info
      const { data: belts, error: beltsError } = await supabase
        .from('member_belts')
        .select(`
          *,
          disciplines:discipline_id (name, color, slug, has_belt_system)
        `)
        .eq('member_id', memberId)

      if (beltsError) {
        throw new Error(beltsError.message)
      }

      // Get training counts using RPC
      const beltsWithCounts = await Promise.all(
        (belts || []).map(async (belt) => {
          const { data: trainingCount } = await supabase
            .rpc('get_training_count', {
              p_member_id: memberId,
              p_discipline_id: belt.discipline_id
            })

          const { data: trainingsSincePromo } = await supabase
            .rpc('get_trainings_since_promotion', {
              p_member_id: memberId,
              p_discipline_id: belt.discipline_id
            })

          return {
            ...belt,
            training_count: trainingCount || 0,
            trainings_since_promotion: trainingsSincePromo || 0,
          }
        })
      )

      return beltsWithCounts as MemberBeltWithDetails[]
    },
    enabled: !!memberId,
  })
}

export function useBeltHistory(memberId: string | undefined, disciplineId?: string) {
  return useQuery({
    queryKey: ['belt-history', memberId, disciplineId],
    queryFn: async (): Promise<BeltHistoryWithDetails[]> => {
      if (!memberId) return []

      let query = supabase
        .from('belt_history')
        .select(`
          *,
          disciplines:discipline_id (name, color),
          promoter:promoted_by (first_name, last_name)
        `)
        .eq('member_id', memberId)
        .order('promoted_at', { ascending: false })

      if (disciplineId) {
        query = query.eq('discipline_id', disciplineId)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      return (data || []) as unknown as BeltHistoryWithDetails[]
    },
    enabled: !!memberId,
  })
}

export function usePromoteMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      memberId,
      disciplineId,
      fromBelt,
      fromStripes,
      toBelt,
      toStripes,
      toDan,
      promotedBy,
      trainingsAtPromotion,
      notes,
    }: {
      memberId: string
      disciplineId: string
      fromBelt?: string
      fromStripes?: number
      toBelt: string
      toStripes: number
      toDan?: number
      promotedBy?: string
      trainingsAtPromotion: number
      notes?: string
    }) => {
      // 1. Create belt history record
      const historyInsert: BeltHistoryInsert = {
        member_id: memberId,
        discipline_id: disciplineId,
        from_belt: fromBelt || null,
        from_stripes: fromStripes || null,
        to_belt: toBelt,
        to_stripes: toStripes || null,
        to_dan: toDan || null,
        promoted_by: promotedBy || null,
        trainings_at_promotion: trainingsAtPromotion,
        notes: notes || null,
      }

      const { error: historyError } = await supabase
        .from('belt_history')
        .insert(historyInsert)

      if (historyError) {
        throw new Error(`Fout bij aanmaken belt history: ${historyError.message}`)
      }

      // 2. Upsert member belt (update or create)
      const beltUpsert: MemberBeltInsert = {
        member_id: memberId,
        discipline_id: disciplineId,
        belt_color: toBelt,
        stripes: toStripes || null,
        dan_grade: toDan || null,
      }

      const { error: beltError } = await supabase
        .from('member_belts')
        .upsert(beltUpsert, { onConflict: 'member_id,discipline_id' })

      if (beltError) {
        throw new Error(`Fout bij updaten member belt: ${beltError.message}`)
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['member-belts', variables.memberId] })
      queryClient.invalidateQueries({ queryKey: ['belt-history', variables.memberId] })
    },
  })
}

export function useAddMemberBelt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (belt: MemberBeltInsert) => {
      const { data, error } = await supabase
        .from('member_belts')
        .insert(belt)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['member-belts', variables.member_id] })
    },
  })
}
