import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { PaymentConfig, PaymentConfigFormData } from '../types/shop'

// Default tenant ID for single-tenant setup
const TENANT_ID = 'reconnect-academy'

export function usePaymentSettings() {
  const queryClient = useQueryClient()

  // Fetch current payment config
  const {
    data: config,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['payment-settings', TENANT_ID],
    queryFn: async (): Promise<PaymentConfig | null> => {
      const { data, error } = await supabase
        .from('tenant_payment_configs')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .single()

      // PGRST116 = no rows returned, which is fine for new tenants
      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data || null
    },
  })

  // Save payment config mutation
  const saveMutation = useMutation({
    mutationFn: async (formData: PaymentConfigFormData): Promise<void> => {
      const configData = {
        tenant_id: TENANT_ID,
        provider: formData.provider,
        stripe_publishable_key: formData.provider === 'stripe' ? formData.stripe_publishable_key || null : null,
        stripe_secret_key: formData.provider === 'stripe' ? formData.stripe_secret_key || null : null,
        stripe_webhook_secret: formData.provider === 'stripe' ? formData.stripe_webhook_secret || null : null,
        mollie_api_key: formData.provider === 'mollie' ? formData.mollie_api_key || null : null,
        mollie_profile_id: formData.provider === 'mollie' ? formData.mollie_profile_id || null : null,
        currency: formData.currency,
        is_active: true,
        is_test_mode: formData.is_test_mode,
      }

      if (config?.id) {
        // Update existing config
        const { error } = await supabase
          .from('tenant_payment_configs')
          .update(configData)
          .eq('id', config.id)

        if (error) throw error
      } else {
        // Insert new config
        const { error } = await supabase
          .from('tenant_payment_configs')
          .insert(configData)

        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-settings'] })
    },
  })

  // Helper to check if payment is configured
  const isPaymentConfigured = (): boolean => {
    if (!config) return false

    if (config.provider === 'stripe') {
      return !!(config.stripe_publishable_key && config.stripe_secret_key)
    }

    if (config.provider === 'mollie') {
      return !!config.mollie_api_key
    }

    return false
  }

  // Get webhook URL for Stripe
  const getWebhookUrl = (): string => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    return `${supabaseUrl}/functions/v1/shop-webhook`
  }

  return {
    config,
    isLoading,
    error: error as Error | null,
    refetch,
    saveConfig: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error as Error | null,
    isPaymentConfigured,
    getWebhookUrl,
  }
}
