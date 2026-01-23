// supabase/functions/mollie-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

serve(async (req) => {
  try {
    const MOLLIE_API_KEY = Deno.env.get('MOLLIE_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!MOLLIE_API_KEY) {
      throw new Error('MOLLIE_API_KEY not configured')
    }

    // Mollie sends payment ID in form data
    const formData = await req.formData()
    const paymentId = formData.get('id') as string

    if (!paymentId) {
      throw new Error('No payment ID received')
    }

    console.log('Received webhook for payment:', paymentId)

    // Fetch payment details from Mollie
    const mollieResponse = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${MOLLIE_API_KEY}`,
      },
    })

    if (!mollieResponse.ok) {
      throw new Error('Failed to fetch payment from Mollie')
    }

    const payment = await mollieResponse.json()
    console.log('Payment status:', payment.status)

    // Use service role key to bypass RLS
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get checkout session ID from metadata
    const checkoutSessionId = payment.metadata?.checkout_session_id
    if (!checkoutSessionId) {
      throw new Error('No checkout_session_id in payment metadata')
    }

    // Fetch checkout session
    const { data: session, error: sessionError } = await supabase
      .from('checkout_sessions')
      .select('*')
      .eq('id', checkoutSessionId)
      .single()

    if (sessionError || !session) {
      throw new Error('Checkout session not found')
    }

    // Handle payment status
    if (payment.status === 'paid') {
      console.log('Payment successful, creating member and subscription...')

      // Check if member already exists
      const { data: existingMember } = await supabase
        .from('members')
        .select('id')
        .eq('email', session.email)
        .single()

      let memberId: string

      if (existingMember) {
        memberId = existingMember.id
        console.log('Using existing member:', memberId)
      } else {
        // Create new member
        const { data: newMember, error: memberError } = await supabase
          .from('members')
          .insert({
            first_name: session.first_name,
            last_name: session.last_name,
            email: session.email,
            phone: session.phone,
            birth_date: session.birth_date,
            role: 'fighter',
            status: 'active',
          })
          .select()
          .single()

        if (memberError) {
          console.error('Failed to create member:', memberError)
          throw new Error('Failed to create member')
        }

        memberId = newMember.id
        console.log('Created new member:', memberId)
      }

      // Calculate subscription dates
      const startDate = new Date()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + (session.duration_months || 1))

      // Create subscription
      const { data: subscription, error: subError } = await supabase
        .from('member_subscriptions')
        .insert({
          member_id: memberId,
          age_group_id: session.age_group_id,
          plan_type_id: session.plan_type_id,
          duration_months: session.duration_months,
          selected_discipline_id: session.selected_discipline_id,
          base_price: session.subtotal,
          family_discount: session.family_discount || 0,
          addon_total: session.addon_total || 0,
          final_price: session.final_total,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          status: 'active',
          payment_provider: 'mollie',
          external_subscription_id: paymentId,
        })
        .select()
        .single()

      if (subError) {
        console.error('Failed to create subscription:', subError)
        throw new Error('Failed to create subscription')
      }

      console.log('Created subscription:', subscription.id)

      // Handle insurance addon if selected
      if (session.selected_addons?.includes('insurance') && session.addon_total > 0) {
        // Fetch insurance addon ID
        const { data: insuranceAddon } = await supabase
          .from('plan_addons')
          .select('id')
          .eq('slug', 'insurance')
          .single()

        if (insuranceAddon) {
          const insuranceEndDate = new Date()
          insuranceEndDate.setFullYear(insuranceEndDate.getFullYear() + 1)

          await supabase
            .from('subscription_addons')
            .insert({
              subscription_id: subscription.id,
              addon_id: insuranceAddon.id,
              price_paid: session.addon_total,
              start_date: startDate.toISOString().split('T')[0],
              end_date: insuranceEndDate.toISOString().split('T')[0],
            })
        }
      }

      // Update checkout session as completed
      await supabase
        .from('checkout_sessions')
        .update({
          payment_status: 'completed',
          completed_at: new Date().toISOString(),
          created_member_id: memberId,
          created_subscription_id: subscription.id,
        })
        .eq('id', checkoutSessionId)

      console.log('Checkout completed successfully!')

    } else if (payment.status === 'failed' || payment.status === 'canceled' || payment.status === 'expired') {
      // Update checkout session as failed
      await supabase
        .from('checkout_sessions')
        .update({
          payment_status: 'failed',
        })
        .eq('id', checkoutSessionId)

      console.log('Payment failed/canceled/expired')
    }
    // For 'open' or 'pending' status, we don't do anything yet

    return new Response('OK', { status: 200 })

  } catch (error) {
    console.error('Webhook error:', error)
    // Return 200 to prevent Mollie from retrying (we logged the error)
    return new Response('OK', { status: 200 })
  }
})
