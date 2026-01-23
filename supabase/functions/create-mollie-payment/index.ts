// supabase/functions/create-mollie-payment/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreatePaymentRequest {
  checkout_session_id: string
  redirect_url: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const MOLLIE_API_KEY = Deno.env.get('MOLLIE_API_KEY')
    if (!MOLLIE_API_KEY) {
      throw new Error('MOLLIE_API_KEY not configured')
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    const { checkout_session_id, redirect_url } = await req.json() as CreatePaymentRequest

    // Fetch checkout session from database
    const { data: session, error: sessionError } = await supabase
      .from('checkout_sessions')
      .select(`
        *,
        age_groups (name),
        plan_types (name)
      `)
      .eq('id', checkout_session_id)
      .single()

    if (sessionError || !session) {
      throw new Error('Checkout session not found')
    }

    if (session.payment_status !== 'pending') {
      throw new Error('Checkout session already processed')
    }

    // Build payment description
    const planName = session.plan_types?.name || 'Abonnement'
    const ageName = session.age_groups?.name || ''
    const duration = session.duration_months === 1 ? '1 maand' :
                     session.duration_months === 3 ? '3 maanden' : '12 maanden'
    const description = `${planName} ${ageName} - ${duration}`

    // Webhook URL for Mollie to call after payment
    const webhookUrl = `${SUPABASE_URL}/functions/v1/mollie-webhook`

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
          value: session.final_total.toFixed(2),
        },
        description,
        redirectUrl: `${redirect_url}?session_id=${checkout_session_id}`,
        webhookUrl,
        metadata: {
          checkout_session_id,
        },
      }),
    })

    if (!mollieResponse.ok) {
      const errorData = await mollieResponse.json()
      console.error('Mollie API error:', errorData)
      throw new Error(`Mollie API error: ${errorData.detail || 'Unknown error'}`)
    }

    const molliePayment = await mollieResponse.json()

    // Update checkout session with Mollie payment ID
    const { error: updateError } = await supabase
      .from('checkout_sessions')
      .update({
        payment_provider: 'mollie',
        external_checkout_id: molliePayment.id,
      })
      .eq('id', checkout_session_id)

    if (updateError) {
      console.error('Failed to update checkout session:', updateError)
    }

    // Return checkout URL for redirect
    return new Response(
      JSON.stringify({
        checkout_url: molliePayment._links.checkout.href,
        payment_id: molliePayment.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error creating payment:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
