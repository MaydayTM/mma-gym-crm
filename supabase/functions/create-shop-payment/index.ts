// supabase/functions/create-shop-payment/index.ts
// Edge function to create Mollie payment for shop orders

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CartItem {
  product_id: string
  product_name: string
  variant_id: string
  variant_name: string
  price: number
  original_price: number
  quantity: number
  is_preorder: boolean
  preorder_note: string | null
}

interface CreateShopPaymentRequest {
  tenant_id: string
  items: CartItem[]
  customer_name: string
  customer_email: string
  customer_phone?: string
  delivery_method: 'pickup' | 'shipping'
  shipping_address?: {
    street: string
    city: string
    postal_code: string
    country: string
  }
  notes?: string
  redirect_url: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Use service role to bypass RLS for order creation
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const body: CreateShopPaymentRequest = await req.json()
    const {
      tenant_id,
      items,
      customer_name,
      customer_email,
      customer_phone,
      delivery_method,
      shipping_address,
      notes,
      redirect_url,
    } = body

    // Validate required fields
    if (!tenant_id || !items?.length || !customer_name || !customer_email) {
      throw new Error('Missing required fields')
    }

    // Get tenant's Mollie API key from payment config
    const { data: paymentConfig, error: configError } = await supabase
      .from('tenant_payment_configs')
      .select('mollie_api_key, is_test_mode')
      .eq('tenant_id', tenant_id)
      .eq('provider', 'mollie')
      .eq('is_active', true)
      .single()

    if (configError || !paymentConfig?.mollie_api_key) {
      throw new Error('Mollie payment not configured for this tenant')
    }

    const MOLLIE_API_KEY = paymentConfig.mollie_api_key

    // Get shipping settings for this tenant
    const { data: shippingSettings } = await supabase
      .from('shipping_settings')
      .select('*')
      .eq('tenant_id', tenant_id)
      .single()

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    // Calculate shipping cost
    let shippingCost = 0
    if (delivery_method === 'shipping') {
      const threshold = shippingSettings?.free_shipping_threshold || 200
      const baseCost = shippingSettings?.shipping_cost || 6.95
      shippingCost = subtotal >= threshold ? 0 : baseCost
    }

    const totalAmount = subtotal + shippingCost

    // Generate order number
    const orderNumber = `RCN-${Date.now().toString(36).toUpperCase()}`

    // Create the order in database
    const { data: order, error: orderError } = await supabase
      .from('shop_orders')
      .insert({
        tenant_id,
        order_number: orderNumber,
        customer_email,
        customer_name,
        customer_phone: customer_phone || null,
        delivery_method,
        shipping_address: delivery_method === 'shipping' ? shipping_address : null,
        subtotal_amount: subtotal,
        shipping_amount: shippingCost,
        discount_amount: 0,
        total_amount: totalAmount,
        status: 'pending',
        notes: notes || null,
      })
      .select()
      .single()

    if (orderError) {
      console.error('Failed to create order:', orderError)
      throw new Error('Failed to create order')
    }

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      tenant_id,
      product_variant_id: item.variant_id,
      product_name: item.product_name,
      variant_name: item.variant_name,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      is_preorder: item.is_preorder,
      preorder_note: item.preorder_note,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Failed to create order items:', itemsError)
      // Rollback order
      await supabase.from('shop_orders').delete().eq('id', order.id)
      throw new Error('Failed to create order items')
    }

    // Build payment description
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
    const description = `Reconnect Shop - ${orderNumber} (${itemCount} ${itemCount === 1 ? 'item' : 'items'})`

    // Webhook URL for Mollie to call after payment
    const webhookUrl = `${SUPABASE_URL}/functions/v1/shop-payment-webhook`

    // Create Mollie payment
    const mollieResponse = await fetch('https://api.mollie.com/v2/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MOLLIE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: {
          currency: 'EUR',
          value: totalAmount.toFixed(2),
        },
        description,
        redirectUrl: `${redirect_url}?order=${orderNumber}`,
        webhookUrl,
        metadata: {
          order_id: order.id,
          order_number: orderNumber,
          tenant_id,
        },
      }),
    })

    if (!mollieResponse.ok) {
      const errorData = await mollieResponse.json()
      console.error('Mollie API error:', errorData)
      // Rollback order
      await supabase.from('order_items').delete().eq('order_id', order.id)
      await supabase.from('shop_orders').delete().eq('id', order.id)
      throw new Error(`Mollie API error: ${errorData.detail || 'Unknown error'}`)
    }

    const molliePayment = await mollieResponse.json()

    // Update order with Mollie payment ID
    await supabase
      .from('shop_orders')
      .update({
        mollie_payment_id: molliePayment.id,
      })
      .eq('id', order.id)

    // Return checkout URL for redirect
    return new Response(
      JSON.stringify({
        checkout_url: molliePayment._links.checkout.href,
        payment_id: molliePayment.id,
        order_number: orderNumber,
        order_id: order.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error creating shop payment:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
