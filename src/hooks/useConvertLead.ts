import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Lead } from './useLeads'
import type { InsertTables } from '../lib/supabase'

type MemberInsert = InsertTables<'members'>

interface ConvertLeadParams {
  lead: Lead
  additionalData?: Partial<MemberInsert>
}

interface ConvertLeadResult {
  memberId: string
  leadId: string
}

export function useConvertLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ lead, additionalData }: ConvertLeadParams): Promise<ConvertLeadResult> => {
      // Create member from lead data
      const memberData: MemberInsert = {
        first_name: lead.first_name || 'Onbekend',
        last_name: lead.last_name || '',
        email: lead.email || `lead-${lead.id}@placeholder.local`,
        phone: lead.phone,
        disciplines: lead.interested_in || [],
        status: 'active',
        role: 'fighter',
        notes: lead.notes ? `Geconverteerd van lead. Originele notities: ${lead.notes}` : 'Geconverteerd van lead',
        ...additionalData,
      }

      // Insert new member
      const { data: member, error: memberError } = await supabase
        .from('members')
        .insert(memberData)
        .select('id')
        .single()

      if (memberError) {
        throw new Error(`Fout bij aanmaken lid: ${memberError.message}`)
      }

      // Update lead status to converted and link to member
      const { error: leadError } = await supabase
        .from('leads')
        .update({
          status: 'converted',
          converted_member_id: member.id,
          converted_at: new Date().toISOString(),
        })
        .eq('id', lead.id)

      if (leadError) {
        // Rollback: delete the created member
        await supabase.from('members').delete().eq('id', member.id)
        throw new Error(`Fout bij updaten lead: ${leadError.message}`)
      }

      return {
        memberId: member.id,
        leadId: lead.id,
      }
    },
    onSuccess: () => {
      // Invalidate both leads and members queries
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
    },
  })
}
