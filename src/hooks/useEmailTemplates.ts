import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Tables } from '../types/database.types'

export type EmailTemplate = Tables<'email_templates'>

interface CreateTemplateData {
  name: string
  description?: string
  subject: string
  body_html: string
  body_text?: string
  preview_text?: string
  category?: string
  available_variables?: string[]
}

interface UpdateTemplateData extends Partial<CreateTemplateData> {
  is_active?: boolean
}

export function useEmailTemplates(category?: string) {
  return useQuery({
    queryKey: ['email-templates', category],
    queryFn: async (): Promise<EmailTemplate[]> => {
      let query = supabase
        .from('email_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    },
  })
}

export function useEmailTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ['email-template', id],
    queryFn: async (): Promise<EmailTemplate | null> => {
      if (!id) return null

      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    enabled: !!id,
  })
}

export function useCreateEmailTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTemplateData): Promise<EmailTemplate> => {
      const { data: template, error } = await supabase
        .from('email_templates')
        .insert(data)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return template
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
    },
  })
}

export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: UpdateTemplateData
    }): Promise<EmailTemplate> => {
      const { data: template, error } = await supabase
        .from('email_templates')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return template
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
      queryClient.invalidateQueries({ queryKey: ['email-template', id] })
    },
  })
}

export function useDeleteEmailTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      // Soft delete - just mark as inactive
      const { error } = await supabase
        .from('email_templates')
        .update({ is_active: false })
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
    },
  })
}
