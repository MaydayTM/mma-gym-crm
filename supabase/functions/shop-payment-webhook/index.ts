// supabase/functions/shop-payment-webhook/index.ts
// Webhook handler for Mollie payment status updates (shop orders)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Mollie sends payment ID in the body
    const formData = await req.formData()
    const paymentId = formData.get('id') as string

    if (!paymentId) {
      throw new Error('No payment ID provided')
    }

    console.log('Processing webhook for payment:', paymentId)

    // Find the order with this Mollie payment ID
    const { data: order, error: orderError } = await supabase
      .from('shop_orders')
      .select('*, tenant_id')
      .eq('mollie_payment_id', paymentId)
      .single()

    if (orderError || !order) {
      console.error('Order not found for payment:', paymentId)
      // Return 200 to acknowledge receipt (Mollie will retry otherwise)
      return new Response('OK', { status: 200 })
    }

    // Get tenant's Mollie API key
    const { data: paymentConfig } = await supabase
      .from('tenant_payment_configs')
      .select('mollie_api_key')
      .eq('tenant_id', order.tenant_id)
      .eq('provider', 'mollie')
      .single()

    if (!paymentConfig?.mollie_api_key) {
      console.error('Mollie config not found for tenant:', order.tenant_id)
      return new Response('OK', { status: 200 })
    }

    // Fetch payment status from Mollie
    const mollieResponse = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${paymentConfig.mollie_api_key}`,
      },
    })

    if (!mollieResponse.ok) {
      console.error('Failed to fetch payment from Mollie')
      return new Response('OK', { status: 200 })
    }

    const payment = await mollieResponse.json()
    console.log('Mollie payment status:', payment.status)

    // Map Mollie status to our order status
    let orderStatus = order.status
    let paidAt = order.paid_at
    let cancelledAt = order.cancelled_at

    switch (payment.status) {
      case 'paid':
        orderStatus = 'paid'
        paidAt = new Date().toISOString()
        break
      case 'canceled':
      case 'expired':
      case 'failed':
        orderStatus = 'cancelled'
        cancelledAt = new Date().toISOString()
        break
      case 'pending':
      case 'open':
        // Still waiting, don't update
        return new Response('OK', { status: 200 })
      default:
        console.log('Unknown payment status:', payment.status)
        return new Response('OK', { status: 200 })
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('shop_orders')
      .update({
        status: orderStatus,
        paid_at: paidAt,
        cancelled_at: cancelledAt,
      })
      .eq('id', order.id)

    if (updateError) {
      console.error('Failed to update order:', updateError)
    } else {
      console.log(`Order ${order.order_number} updated to status: ${orderStatus}`)
    }

    // If payment successful, update stock for non-preorder items
    if (orderStatus === 'paid') {
      // Get order items
      const { data: items } = await supabase
        .from('order_items')
        .select('product_variant_id, quantity, is_preorder')
        .eq('order_id', order.id)

      if (items) {
        for (const item of items) {
          // Only decrease stock for non-preorder items
          if (!item.is_preorder && item.product_variant_id) {
            const { error: stockError } = await supabase.rpc('decrease_variant_stock', {
              p_variant_id: item.product_variant_id,
              p_quantity: item.quantity,
            })

            if (stockError) {
              console.error('Failed to update stock for variant:', item.product_variant_id, stockError)
            }
          }
        }
      }

      // TODO: Send order confirmation email
      // await sendOrderConfirmationEmail(order, items)
    }

    return new Response('OK', { status: 200 })

  } catch (error) {
    console.error('Webhook error:', error)
    // Return 200 to prevent Mollie from retrying
    return new Response('OK', { status: 200 })
  }
})
