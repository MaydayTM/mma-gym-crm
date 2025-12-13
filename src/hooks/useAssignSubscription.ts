import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface AssignSubscriptionData {
  memberId: string
  pricingId: string
  ageGroupId: string
  planTypeId: string
  durationMonths: number
  basePrice: number
  discountId: string | null
  discountAmount: number
  finalPrice: number
  startDate: string
  endDate: string
  paymentMethod: 'cash' | 'bank_transfer' | 'mollie' | 'free'
  notes?: string
}

export function useAssignSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: AssignSubscriptionData) => {
      // 1. Create member_subscription record
      const { data: subscription, error: subscriptionError } = await supabase
        .from('member_subscriptions')
        .insert({
          member_id: data.memberId,
          age_group_id: data.ageGroupId,
          plan_type_id: data.planTypeId,
          duration_months: data.durationMonths,
          base_price: data.basePrice,
          family_discount: 0,
          addon_total: 0,
          final_price: data.finalPrice,
          start_date: data.startDate,
          end_date: data.endDate,
          status: 'active',
          payment_provider: data.paymentMethod === 'mollie' ? 'mollie' : 'manual',
          payment_status: data.paymentMethod === 'free' ? 'free' :
                          data.paymentMethod === 'mollie' ? 'pending' : 'paid',
          notes: data.notes || null
        })
        .select()
        .single()

      if (subscriptionError) {
        throw new Error(`Fout bij aanmaken abonnement: ${subscriptionError.message}`)
      }

      // 2. If discount was applied, record it in member_subscription_discounts
      if (data.discountId && data.discountAmount > 0) {
        const { error: discountError } = await (supabase as unknown as {
          from: (table: string) => {
            insert: (data: Record<string, unknown>) => Promise<{ error: { message: string } | null }>
          }
        })
          .from('member_subscription_discounts')
          .insert({
            member_subscription_id: subscription.id,
            discount_id: data.discountId,
            applied_amount: data.discountAmount
          })

        if (discountError) {
          console.error('Error recording discount:', discountError)
          // Don't fail the whole operation for this
        }
      }

      // 3. Update member status to 'active' if they were a lead or cancelled
      const { error: memberError } = await supabase
        .from('members')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', data.memberId)
        .in('status', ['lead', 'cancelled'])

      if (memberError) {
        console.error('Error updating member status:', memberError)
        // Don't fail for this either
      }

      // 4. Create revenue record for tracking
      if (data.finalPrice > 0 && data.paymentMethod !== 'mollie') {
        const { error: revenueError } = await supabase
          .from('revenue')
          .insert({
            member_id: data.memberId,
            amount: data.finalPrice,
            currency: 'EUR',
            category: 'subscription',
            description: `Abonnement toegewezen (${data.paymentMethod})`,
            paid_at: new Date().toISOString(),
            period_start: data.startDate,
            period_end: data.endDate
          })

        if (revenueError) {
          console.error('Error creating revenue record:', revenueError)
        }
      }

      return subscription
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['member-subscriptions', variables.memberId] })
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['subscription-stats'] })
      queryClient.invalidateQueries({ queryKey: ['member', variables.memberId] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
      queryClient.invalidateQueries({ queryKey: ['revenue'] })
    }
  })
}
