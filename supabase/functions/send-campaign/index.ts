import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Brand colors for email templates
const emailColors = {
  primary: '#F59E0B',
  dark: '#171717',
  darkGray: '#262626',
  gray: '#525252',
  lightGray: '#A3A3A3',
  white: '#FAFAFA',
}

interface CampaignRequest {
  campaign_id: string
  test_mode?: boolean  // Send only to first recipient as test
}

/**
 * Generate HTML email with Reconnect Academy branding
 */
function generateEmailHtml(options: {
  recipientName?: string
  subject: string
  body: string
  previewText?: string
  ctaText?: string
  ctaUrl?: string
}): string {
  const { recipientName, subject, body, previewText, ctaText, ctaUrl } = options

  // CTA button HTML if provided
  const ctaHtml = ctaText && ctaUrl ? `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px auto;">
      <tr>
        <td style="background-color: ${emailColors.primary}; border-radius: 8px;">
          <a href="${ctaUrl}" style="display: inline-block; padding: 12px 24px; color: ${emailColors.dark}; font-size: 14px; font-weight: 600; text-decoration: none;">${ctaText}</a>
        </td>
      </tr>
    </table>
  ` : ''

  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${subject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    a { color: ${emailColors.primary}; text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; padding: 0 16px !important; }
      .content { padding: 24px !important; }
    }
  </style>
</head>
<body style="background-color: ${emailColors.dark}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; margin: 0; padding: 40px 0;">

  <!-- Preview Text -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${previewText || subject}
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <!-- Email Container -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px; margin: 0 auto;">
    <tr>
      <td class="container" style="background-color: ${emailColors.darkGray}; border-radius: 16px; overflow: hidden;">

        <!-- Header -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="background-color: ${emailColors.dark}; padding: 32px 40px; text-align: center;">
              <img src="https://mmagym.be/images/logo-reconnect.png" width="180" alt="Reconnect Academy" style="display: block; margin: 0 auto;">
            </td>
          </tr>
        </table>

        <!-- Content -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td class="content" style="padding: 40px;">

              ${recipientName ? `
              <!-- Greeting -->
              <p style="color: ${emailColors.white}; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
                Hoi ${recipientName},
              </p>
              ` : ''}

              <!-- Body -->
              <div style="color: ${emailColors.lightGray}; font-size: 15px; line-height: 26px;">
                ${body}
              </div>

              <!-- CTA Button -->
              ${ctaHtml}

              <!-- Signature -->
              <p style="color: ${emailColors.lightGray}; font-size: 15px; line-height: 24px; margin-top: 32px;">
                Met sportieve groet,<br>
                <strong style="color: ${emailColors.white};">Team Reconnect Academy</strong>
              </p>

            </td>
          </tr>
        </table>

        <!-- Divider -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="border-top: 1px solid #404040;"></td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="padding: 32px 40px; text-align: center;">

              <!-- Company Info -->
              <p style="color: ${emailColors.gray}; font-size: 13px; line-height: 20px; margin: 0 0 16px;">
                Reconnect Academy | MMA & BJJ Gym<br>
                Aalst, België
              </p>

              <!-- Social Links -->
              <p style="margin: 0 0 16px;">
                <a href="https://instagram.com/reconnect.academy" style="color: ${emailColors.primary}; font-size: 13px;">Instagram</a>
                <span style="color: ${emailColors.gray}; margin: 0 8px;">•</span>
                <a href="https://facebook.com/reconnectacademy" style="color: ${emailColors.primary}; font-size: 13px;">Facebook</a>
                <span style="color: ${emailColors.gray}; margin: 0 8px;">•</span>
                <a href="https://mmagym.be" style="color: ${emailColors.primary}; font-size: 13px;">Website</a>
              </p>

              <!-- Legal -->
              <p style="color: ${emailColors.gray}; font-size: 11px; line-height: 18px; margin: 0;">
                Je ontvangt deze email omdat je lid bent van Reconnect Academy.<br>
                <a href="https://mmagym.be/uitschrijven" style="color: ${emailColors.gray}; text-decoration: underline;">Uitschrijven</a>
              </p>

            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>`.trim()
}

/**
 * Replace template variables in content
 */
function replaceVariables(
  content: string,
  variables: Record<string, string | undefined>
): string {
  return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] || match
  })
}

/**
 * Send email via Resend API
 */
async function sendEmail(
  apiKey: string,
  to: string,
  subject: string,
  htmlContent: string,
  textContent: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'Reconnect Academy <noreply@mmagym.be>',
        to: [to],
        subject: subject,
        html: htmlContent,
        text: textContent,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.message || 'Verzenden mislukt' }
    }

    const result = await response.json()
    return { success: true, messageId: result.id }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

/**
 * Strip HTML tags for plain text version
 */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables not configured')
    }
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user is staff
    const { data: userMember } = await supabase
      .from('members')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!['admin', 'medewerker'].includes(userMember?.role || '')) {
      throw new Error('Alleen admin/medewerker kan campaigns versturen')
    }

    // Parse request
    const { campaign_id, test_mode }: CampaignRequest = await req.json()

    if (!campaign_id) {
      throw new Error('campaign_id is required')
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .select(`
        *,
        template:template_id (
          subject,
          body_html,
          body_text,
          preview_text,
          available_variables
        )
      `)
      .eq('id', campaign_id)
      .single()

    if (campaignError || !campaign) {
      throw new Error('Campaign niet gevonden')
    }

    if (campaign.status === 'sent') {
      throw new Error('Campaign is al verzonden')
    }

    // Get subject and body from campaign or template
    const subject = campaign.subject || campaign.template?.subject
    const bodyHtml = campaign.body_html || campaign.template?.body_html
    const bodyText = campaign.body_text || campaign.template?.body_text
    const previewText = campaign.template?.preview_text

    if (!subject || !bodyHtml) {
      throw new Error('Campaign heeft geen subject of body')
    }

    // Get audience - check for custom recipients first
    let audience: any[] = []

    if (campaign.custom_recipients && campaign.custom_recipients.length > 0) {
      // Use custom recipients
      const { data: customAudience, error: customError } = await supabase.rpc(
        'get_campaign_audience',
        {
          filter_json: {},
          custom_member_ids: campaign.custom_recipients,
        }
      )

      if (customError) {
        console.error('Custom audience error:', customError)
        throw new Error('Kon custom ontvangers niet ophalen')
      }

      audience = customAudience || []
    } else {
      // Use filter-based audience
      const { data: filterAudience, error: filterError } = await supabase.rpc(
        'get_campaign_audience',
        { filter_json: campaign.audience_filter || {} }
      )

      if (filterError) {
        console.error('Filter audience error:', filterError)
        throw new Error('Kon audience niet ophalen')
      }

      audience = filterAudience || []
    }

    if (audience.length === 0) {
      throw new Error('Geen ontvangers gevonden voor deze campaign')
    }

    // Update campaign status
    await supabase
      .from('email_campaigns')
      .update({
        status: 'sending',
        started_at: new Date().toISOString(),
        total_recipients: audience.length,
      })
      .eq('id', campaign_id)

    // In test mode, only send to first recipient
    const recipients = test_mode ? [audience[0]] : audience

    // Create email_sends records
    const sendRecords = recipients.map((r: any) => ({
      campaign_id,
      member_id: r.member_id,
      recipient_email: r.email,
      recipient_name: `${r.first_name} ${r.last_name}`.trim(),
      status: 'pending',
      provider: 'resend',
    }))

    const { data: sends, error: sendsError } = await supabase
      .from('email_sends')
      .insert(sendRecords)
      .select()

    if (sendsError) {
      console.error('Error creating sends:', sendsError)
      throw new Error('Kon email records niet aanmaken')
    }

    // Send emails (batch processing)
    let successCount = 0
    let failCount = 0

    for (const send of sends || []) {
      const variables: Record<string, string> = {
        first_name: send.recipient_name?.split(' ')[0] || '',
        last_name: send.recipient_name?.split(' ').slice(1).join(' ') || '',
        email: send.recipient_email,
      }

      // Replace variables in subject and body
      const personalizedSubject = replaceVariables(subject, variables)
      const personalizedBody = replaceVariables(bodyHtml, variables)
      const personalizedText = stripHtml(replaceVariables(bodyText || bodyHtml, variables))

      // Generate full HTML email
      const htmlContent = generateEmailHtml({
        recipientName: variables.first_name,
        subject: personalizedSubject,
        body: personalizedBody,
        previewText: previewText ? replaceVariables(previewText, variables) : undefined,
      })

      // Send via Resend
      const result = await sendEmail(
        resendApiKey,
        send.recipient_email,
        personalizedSubject,
        htmlContent,
        personalizedText
      )

      // Update send record
      if (result.success) {
        successCount++
        await supabase
          .from('email_sends')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            provider_message_id: result.messageId,
          })
          .eq('id', send.id)

        // Log event
        await supabase.from('email_events').insert({
          send_id: send.id,
          event_type: 'sent',
        })
      } else {
        failCount++
        await supabase
          .from('email_sends')
          .update({
            status: 'failed',
            error_message: result.error,
          })
          .eq('id', send.id)

        // Log event
        await supabase.from('email_events').insert({
          send_id: send.id,
          event_type: 'failed',
          raw_payload: { error: result.error },
        })
      }

      // Small delay to avoid rate limiting (Resend allows 10/sec on free tier)
      await new Promise(resolve => setTimeout(resolve, 120))
    }

    // Update campaign stats
    await supabase.rpc('update_campaign_stats', { p_campaign_id: campaign_id })

    // Mark campaign as sent (or back to draft in test mode)
    await supabase
      .from('email_campaigns')
      .update({
        status: test_mode ? 'draft' : 'sent',
        completed_at: test_mode ? null : new Date().toISOString(),
        total_sent: successCount,
      })
      .eq('id', campaign_id)

    return new Response(
      JSON.stringify({
        success: true,
        test_mode,
        total_recipients: recipients.length,
        sent: successCount,
        failed: failCount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in send-campaign:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: (error as Error).message === 'Unauthorized' ? 401 : 400,
      }
    )
  }
})
