// deno-lint-ignore-file no-explicit-any
/* eslint-disable @typescript-eslint/no-unused-vars, no-case-declarations */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { Webhook } from 'https://esm.sh/svix@1.15.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature',
}

/**
 * Resend Webhook Event Types:
 * - email.sent
 * - email.delivered
 * - email.delivery_delayed
 * - email.complained
 * - email.bounced
 * - email.opened
 * - email.clicked
 */
interface ResendWebhookEvent {
  type: string
  created_at: string
  data: {
    email_id: string
    from: string
    to: string[]
    subject: string
    created_at: string
    // For click events
    click?: {
      link: string
      timestamp: string
      user_agent: string
      ip_address: string
    }
    // For open events
    open?: {
      timestamp: string
      user_agent: string
      ip_address: string
    }
    // For bounce/complaint events
    bounce?: {
      message: string
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const webhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables not configured')
    }

    // Read raw body as text for signature verification
    const body = await req.text()

    // Verify webhook signature using svix (if secret is configured)
    if (webhookSecret) {
      const svixId = req.headers.get('svix-id')
      const svixTimestamp = req.headers.get('svix-timestamp')
      const svixSignature = req.headers.get('svix-signature')

      if (!svixId || !svixTimestamp || !svixSignature) {
        console.error('Missing svix headers')
        return new Response(
          JSON.stringify({ error: 'Missing signature headers' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
          }
        )
      }

      try {
        const wh = new Webhook(webhookSecret)
        wh.verify(body, {
          'svix-id': svixId,
          'svix-timestamp': svixTimestamp,
          'svix-signature': svixSignature,
        })
      } catch (err) {
        console.error('Webhook signature verification failed:', err)
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
          }
        )
      }
    } else {
      console.warn('RESEND_WEBHOOK_SECRET not configured - accepting webhook without verification (dev mode)')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse verified body
    const event: ResendWebhookEvent = JSON.parse(body)
    console.log('Received webhook event:', event.type, event.data.email_id)

    // Find the email send record by provider_message_id
    const { data: send, error: sendError } = await supabase
      .from('email_sends')
      .select('id, campaign_id, status, open_count, click_count')
      .eq('provider_message_id', event.data.email_id)
      .single()

    if (sendError || !send) {
      console.log('Email send not found for message:', event.data.email_id)
      // Return 200 anyway to prevent retries
      return new Response(JSON.stringify({ received: true, found: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Map Resend event type to our event type
    const eventTypeMap: Record<string, string> = {
      'email.sent': 'sent',
      'email.delivered': 'delivered',
      'email.delivery_delayed': 'delayed',
      'email.bounced': 'bounced',
      'email.complained': 'complained',
      'email.opened': 'opened',
      'email.clicked': 'clicked',
    }

    const mappedEventType = eventTypeMap[event.type] || event.type

    // Record the event
    await supabase.from('email_events').insert({
      send_id: send.id,
      event_type: mappedEventType,
      clicked_url: event.data.click?.link,
      user_agent: event.data.open?.user_agent || event.data.click?.user_agent,
      ip_address: event.data.open?.ip_address || event.data.click?.ip_address,
      raw_payload: event,
    })

    // Update the send record based on event type
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    switch (mappedEventType) {
      case 'delivered':
        updateData.status = 'delivered'
        updateData.delivered_at = event.created_at
        break

      case 'opened':
        if (!send.first_opened_at) {
          updateData.first_opened_at = event.created_at
        }
        updateData.last_opened_at = event.created_at
        updateData.open_count = (send.open_count || 0) + 1
        // Only upgrade status if not already at a higher level
        if (['sent', 'delivered'].includes(send.status)) {
          updateData.status = 'opened'
        }
        break

      case 'clicked':
        if (!send.first_clicked_at) {
          updateData.first_clicked_at = event.created_at
        }
        updateData.click_count = (send.click_count || 0) + 1
        // Click implies opened, upgrade status
        if (['sent', 'delivered', 'opened'].includes(send.status)) {
          updateData.status = 'clicked'
        }
        break

      case 'bounced':
        updateData.status = 'bounced'
        updateData.error_message = event.data.bounce?.message || 'Email bounced'
        break

      case 'complained':
        updateData.status = 'complained'
        // Add to unsubscribe list
        const recipientEmail = event.data.to[0]
        if (recipientEmail) {
          await supabase.from('email_unsubscribes').upsert({
            email: recipientEmail.toLowerCase(),
            reason: 'spam_complaint',
            unsubscribed_from_campaign_id: send.campaign_id,
          }, { onConflict: 'email' })
        }
        break
    }

    // Update send record
    await supabase
      .from('email_sends')
      .update(updateData)
      .eq('id', send.id)

    // Update campaign stats
    if (send.campaign_id) {
      await supabase.rpc('update_campaign_stats', { p_campaign_id: send.campaign_id })
    }

    return new Response(
      JSON.stringify({ received: true, event_type: mappedEventType }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    // Return 200 to prevent retries even on error
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  }
})
