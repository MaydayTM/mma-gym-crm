import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Tables } from '../types/database.types'

export type AIConversation = Tables<'ai_conversations'>
export type AIMessage = Tables<'ai_messages'>

interface SendMessageResponse {
  response: string
  conversation_id: string
  query_type: string
}

interface UseAIChatOptions {
  conversationId?: string
}

export function useAIChat(options?: UseAIChatOptions) {
  const queryClient = useQueryClient()
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    options?.conversationId || null
  )

  // Fetch all conversations for the current user
  const conversationsQuery = useQuery({
    queryKey: ['ai-conversations'],
    queryFn: async (): Promise<AIConversation[]> => {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(20)

      if (error) throw new Error(error.message)
      return data || []
    },
  })

  // Fetch messages for the active conversation
  const messagesQuery = useQuery({
    queryKey: ['ai-messages', activeConversationId],
    queryFn: async (): Promise<AIMessage[]> => {
      if (!activeConversationId) return []

      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', activeConversationId)
        .order('created_at', { ascending: true })

      if (error) throw new Error(error.message)
      return data || []
    },
    enabled: !!activeConversationId,
  })

  // Send a message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (question: string): Promise<SendMessageResponse> => {
      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      // Call the Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            question,
            conversation_id: activeConversationId,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to send message')
      }

      return response.json()
    },
    onSuccess: (data) => {
      // Update the active conversation ID if a new one was created
      if (data.conversation_id && data.conversation_id !== activeConversationId) {
        setActiveConversationId(data.conversation_id)
      }

      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] })
      queryClient.invalidateQueries({ queryKey: ['ai-messages', data.conversation_id] })
    },
  })

  // Start a new conversation
  const startNewConversation = useCallback(() => {
    setActiveConversationId(null)
  }, [])

  // Select a conversation
  const selectConversation = useCallback((conversationId: string) => {
    setActiveConversationId(conversationId)
  }, [])

  // Delete a conversation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', conversationId)

      if (error) throw new Error(error.message)
    },
    onSuccess: (_, deletedId) => {
      // If we deleted the active conversation, clear it
      if (deletedId === activeConversationId) {
        setActiveConversationId(null)
      }
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] })
    },
  })

  return {
    // State
    activeConversationId,

    // Conversations
    conversations: conversationsQuery.data || [],
    isLoadingConversations: conversationsQuery.isLoading,

    // Messages
    messages: messagesQuery.data || [],
    isLoadingMessages: messagesQuery.isLoading,

    // Send message
    sendMessage: sendMessageMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,
    sendError: sendMessageMutation.error,

    // Actions
    startNewConversation,
    selectConversation,
    deleteConversation: deleteConversationMutation.mutateAsync,
    isDeletingConversation: deleteConversationMutation.isPending,
  }
}

// Export suggested questions for new users
export const SUGGESTED_QUESTIONS = [
  {
    label: 'Churn risico',
    question: 'Welke leden dreigen af te haken?',
    icon: '⚠️',
  },
  {
    label: 'Top trainers',
    question: 'Wie heeft het meest getraind deze maand?',
    icon: '🏆',
  },
  {
    label: 'Lead follow-up',
    question: 'Welke leads moeten opgevolgd worden?',
    icon: '📞',
  },
  {
    label: 'Lesrooster',
    question: 'Welke lessen hebben we deze week?',
    icon: '📅',
  },
]
