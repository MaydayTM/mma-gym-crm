// supabase/functions/shop-payment-webhook/index.ts
// Webhook handler for Stripe payment status updates (shop orders)
// Note: Shop uses Stripe (BV), Memberships use Mollie (VZW)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!
    const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get the raw body for signature verification
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    let event: Stripe.Event

    // Verify webhook signature if secret is configured
    if (STRIPE_WEBHOOK_SECRET && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message)
        return new Response(`Webhook Error: ${err.message}`, { status: 400 })
      }
    } else {
      // For testing without signature verification
      event = JSON.parse(body)
      console.warn('Webhook signature verification skipped - STRIPE_WEBHOOK_SECRET not configured')
    }

    console.log('Processing Stripe event:', event.type)

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      // Get order info from metadata
      const orderId = session.metadata?.order_id
      const orderNumber = session.metadata?.order_number

      if (!orderId) {
        console.error('No order_id in session metadata')
        return new Response('OK', { status: 200 })
      }

      console.log(`Payment completed for order: ${orderNumber} (${orderId})`)

      // Update order status to paid
      const { error: updateError } = await supabase
        .from('shop_orders')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: session.payment_intent as string,
        })
        .eq('id', orderId)

      if (updateError) {
        console.error('Failed to update order:', updateError)
      } else {
        console.log(`Order ${orderNumber} marked as paid`)
      }

      // Update stock for non-preorder items
      const { data: items } = await supabase
        .from('shop_order_items')
        .select('product_variant_id, quantity, is_preorder')
        .eq('order_id', orderId)

      if (items) {
        for (const item of items) {
          // Only decrease stock for non-preorder items with valid variant ID
          if (!item.is_preorder && item.product_variant_id) {
            // Direct stock update since products might be external
            const { data: variant } = await supabase
              .from('product_variants')
              .select('stock_quantity')
              .eq('id', item.product_variant_id)
              .single()

            if (variant) {
              await supabase
                .from('product_variants')
                .update({ stock_quantity: Math.max(0, variant.stock_quantity - item.quantity) })
                .eq('id', item.product_variant_id)
            }
          }
        }
      }

      // TODO: Send order confirmation email
      // await sendOrderConfirmationEmail(order, items)
    }

    // Handle checkout.session.expired event
    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session
      const orderId = session.metadata?.order_id
      const orderNumber = session.metadata?.order_number

      if (orderId) {
        console.log(`Checkout expired for order: ${orderNumber}`)

        await supabase
          .from('shop_orders')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
          })
          .eq('id', orderId)
      }
    }

    // Handle payment_intent.payment_failed event
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.log('Payment failed:', paymentIntent.id, paymentIntent.last_payment_error?.message)

      // Find order by payment intent and mark as cancelled
      const { data: order } = await supabase
        .from('shop_orders')
        .select('id, order_number')
        .eq('stripe_payment_intent_id', paymentIntent.id)
        .single()

      if (order) {
        await supabase
          .from('shop_orders')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
          })
          .eq('id', order.id)

        console.log(`Order ${order.order_number} marked as cancelled due to payment failure`)
      }
    }

    return new Response('OK', { status: 200 })

  } catch (error) {
    console.error('Webhook error:', error)
    // Return 200 to prevent Stripe from retrying indefinitely
    return new Response('OK', { status: 200 })
  }
})
