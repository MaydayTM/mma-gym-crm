import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Tables, Json } from '../types/database.types'
import type { EmailTemplate } from './useEmailTemplates'

export type EmailCampaign = Tables<'email_campaigns'>

export interface EmailCampaignWithTemplate extends EmailCampaign {
  template: EmailTemplate | null
}

export interface AudienceFilter {
  status?: string[]
  role?: string[]
  disciplines?: string[]
  [key: string]: string[] | undefined  // Index signature for Json compatibility
}

interface CreateCampaignData {
  name: string
  description?: string
  template_id?: string
  subject?: string
  body_html?: string
  body_text?: string
  audience_filter?: AudienceFilter
  scheduled_at?: string
}

interface UpdateCampaignData extends Partial<CreateCampaignData> {
  status?: 'draft' | 'scheduled' | 'cancelled'
}

export function useEmailCampaigns(status?: string) {
  return useQuery({
    queryKey: ['email-campaigns', status],
    queryFn: async (): Promise<EmailCampaignWithTemplate[]> => {
      let query = supabase
        .from('email_campaigns')
        .select(`
          *,
          template:template_id (*)
        `)
        .order('created_at', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      return (data || []) as EmailCampaignWithTemplate[]
    },
  })
}

export function useEmailCampaign(id: string | undefined) {
  return useQuery({
    queryKey: ['email-campaign', id],
    queryFn: async (): Promise<EmailCampaignWithTemplate | null> => {
      if (!id) return null

      const { data, error } = await supabase
        .from('email_campaigns')
        .select(`
          *,
          template:template_id (*)
        `)
        .eq('id', id)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data as EmailCampaignWithTemplate
    },
    enabled: !!id,
  })
}

export function useCreateEmailCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCampaignData): Promise<EmailCampaign> => {
      const insertData = {
        name: data.name,
        description: data.description,
        template_id: data.template_id,
        subject: data.subject,
        body_html: data.body_html,
        body_text: data.body_text,
        audience_filter: data.audience_filter as Json,
        scheduled_at: data.scheduled_at,
        status: 'draft' as const,
      }

      const { data: campaign, error } = await supabase
        .from('email_campaigns')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return campaign
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] })
    },
  })
}

export function useUpdateEmailCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: UpdateCampaignData
    }): Promise<EmailCampaign> => {
      const updateData: Record<string, unknown> = { ...data }
      if (data.audience_filter) {
        updateData.audience_filter = data.audience_filter as Json
      }

      const { data: campaign, error } = await supabase
        .from('email_campaigns')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return campaign
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['email-campaign', id] })
    },
  })
}

export function useDeleteEmailCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('email_campaigns')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] })
    },
  })
}

export function useCampaignAudienceCount() {
  return useMutation({
    mutationFn: async (filter: AudienceFilter): Promise<number> => {
      const { data, error } = await supabase.rpc('get_campaign_audience', {
        filter_json: filter as Json,
      })

      if (error) {
        throw new Error(error.message)
      }

      return data?.length || 0
    },
  })
}

export function useSendCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      campaignId,
      testMode = false,
    }: {
      campaignId: string
      testMode?: boolean
    }): Promise<{
      success: boolean
      total_recipients: number
      sent: number
      failed: number
    }> => {
      const { data: session } = await supabase.auth.getSession()

      if (!session.session) {
        throw new Error('Niet ingelogd')
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-campaign`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.session.access_token}`,
          },
          body: JSON.stringify({
            campaign_id: campaignId,
            test_mode: testMode,
          }),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Verzenden mislukt')
      }

      return result
    },
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['email-campaign', campaignId] })
    },
  })
}

export function useCampaignSends(campaignId: string | undefined) {
  return useQuery({
    queryKey: ['campaign-sends', campaignId],
    queryFn: async () => {
      if (!campaignId) return []

      const { data, error } = await supabase
        .from('email_sends')
        .select(`
          *,
          member:member_id (first_name, last_name)
        `)
        .eq('campaign_id', campaignId)
        .order('sent_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    },
    enabled: !!campaignId,
  })
}
