/**
 * Send Claim Email Edge Function
 *
 * Sends an account activation email to an existing member (imported from ClubPlanner).
 * Requires admin/medewerker authentication.
 *
 * POST /functions/v1/send-claim-email
 * Body: { member_id: string, resend?: boolean }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Import email template (inline to avoid module issues in Deno)
const colors = {
  primary: '#FBBF24',
  primaryHover: '#F59E0B',
  white: '#FFFFFF',
  background: '#F9FAFB',
  text: '#111827',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
}

function generateClaimAccountEmail(options: {
  firstName: string
  email: string
  memberNumber?: number | string
  activationUrl: string
  expiresInHours?: number
}): string {
  const { firstName, email, memberNumber, activationUrl, expiresInHours = 48 } = options

  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Activeer je Reconnect Account</title>
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
    a { color: ${colors.text}; text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; }
      .content { padding: 32px 24px !important; }
      .header { padding: 24px !important; }
    }
  </style>
</head>
<body style="background-color: ${colors.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; margin: 0; padding: 40px 16px;">

  <!-- Preview Text (hidden) -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${firstName}, activeer je account en krijg toegang tot je trainingshistorie, reserveringen en meer!
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <!-- Email Container -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px; margin: 0 auto;">
    <tr>
      <td class="container" style="background-color: ${colors.white}; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

        <!-- Header with Logo -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td class="header" style="padding: 32px 40px; text-align: center; border-bottom: 1px solid ${colors.border};">
              <img src="https://mmagym.be/images/logo-reconnect-dark.png" width="120" alt="Reconnect Academy" style="display: block; margin: 0 auto;">
              <p style="color: ${colors.textLight}; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin: 12px 0 0;">RECONNECT</p>
            </td>
          </tr>
        </table>

        <!-- Main Content -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td class="content" style="padding: 48px 40px;">

              <!-- Welcome Heading -->
              <h1 style="color: ${colors.text}; font-size: 32px; font-weight: 700; line-height: 1.2; margin: 0 0 16px; text-align: center;">
                Activeer je account
              </h1>

              <p style="color: ${colors.text}; font-size: 16px; line-height: 1.6; margin: 0 0 8px;">
                Hallo ${firstName}.
              </p>
              <p style="color: ${colors.text}; font-size: 16px; line-height: 1.6; margin: 0 0 32px;">
                Je account bij Reconnect staat klaar!
              </p>

              <!-- Info Box: Login Details -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 32px;">
                <tr>
                  <td style="background-color: ${colors.background}; border-radius: 12px; padding: 20px 24px;">
                    <p style="color: ${colors.textMuted}; font-size: 13px; font-weight: 600; margin: 0 0 8px;">
                      Jouw inloggegevens:
                    </p>
                    <p style="color: ${colors.text}; font-size: 18px; font-weight: 600; margin: 0;">
                      ${memberNumber ? `${memberNumber} of ` : ''}<span style="color: ${colors.text};">${email}</span>
                    </p>
                  </td>
                </tr>
              </table>

              <p style="color: ${colors.text}; font-size: 16px; line-height: 1.6; margin: 0 0 32px;">
                Klik hieronder om je wachtwoord in te stellen en toegang te krijgen tot je trainingshistorie, reserveringen en QR-code.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 16px;">
                <tr>
                  <td style="background-color: ${colors.primary}; border-radius: 50px;">
                    <a href="${activationUrl}" style="display: inline-block; padding: 16px 48px; color: ${colors.text}; font-size: 16px; font-weight: 600; text-decoration: none;">
                      Account Activeren
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiry Notice -->
              <p style="color: ${colors.textMuted}; font-size: 14px; text-align: center; margin: 0 0 48px;">
                Deze link is ${expiresInHours} uur geldig
              </p>

              <!-- Divider -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="border-top: 1px solid ${colors.border}; padding-top: 32px;"></td>
                </tr>
              </table>

              <!-- What You Get Section -->
              <h2 style="color: ${colors.text}; font-size: 20px; font-weight: 600; margin: 0 0 24px;">
                Dit krijg je met je account
              </h2>

              <!-- Feature 1 -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
                <tr>
                  <td width="40" valign="top">
                    <div style="background-color: ${colors.primary}; border-radius: 50%; width: 28px; height: 28px; line-height: 28px; text-align: center; color: ${colors.text}; font-size: 14px; font-weight: 700;">1</div>
                  </td>
                  <td style="padding-left: 12px;">
                    <p style="color: ${colors.text}; font-size: 15px; font-weight: 600; margin: 0 0 4px;">
                      Je trainingshistorie
                    </p>
                    <p style="color: ${colors.textMuted}; font-size: 14px; line-height: 1.5; margin: 0;">
                      Bekijk je check-ins, gordel voortgang en statistieken
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Feature 2 -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
                <tr>
                  <td width="40" valign="top">
                    <div style="background-color: ${colors.primary}; border-radius: 50%; width: 28px; height: 28px; line-height: 28px; text-align: center; color: ${colors.text}; font-size: 14px; font-weight: 700;">2</div>
                  </td>
                  <td style="padding-left: 12px;">
                    <p style="color: ${colors.text}; font-size: 15px; font-weight: 600; margin: 0 0 4px;">
                      Reserveer voor lessen
                    </p>
                    <p style="color: ${colors.textMuted}; font-size: 14px; line-height: 1.5; margin: 0;">
                      Schrijf je in voor je favoriete trainingen
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Feature 3 -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 32px;">
                <tr>
                  <td width="40" valign="top">
                    <div style="background-color: ${colors.primary}; border-radius: 50%; width: 28px; height: 28px; line-height: 28px; text-align: center; color: ${colors.text}; font-size: 14px; font-weight: 700;">3</div>
                  </td>
                  <td style="padding-left: 12px;">
                    <p style="color: ${colors.text}; font-size: 15px; font-weight: 600; margin: 0 0 4px;">
                      QR-code toegang
                    </p>
                    <p style="color: ${colors.textMuted}; font-size: 14px; line-height: 1.5; margin: 0;">
                      Check-in bij de gym met je persoonlijke QR-code
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="padding: 24px 40px 32px; text-align: center; border-top: 1px solid ${colors.border};">

              <!-- Company Info -->
              <p style="color: ${colors.textMuted}; font-size: 13px; line-height: 1.6; margin: 0 0 12px;">
                Reconnect Academy | Erembodegem\u00ADstraat 31/16, 9300 Aalst
              </p>

              <!-- Social Links -->
              <p style="margin: 0 0 12px;">
                <a href="https://instagram.com/reconnect.academy" style="color: ${colors.textMuted}; font-size: 13px; text-decoration: underline;">Instagram</a>
                <span style="color: ${colors.textLight}; margin: 0 8px;">•</span>
                <a href="https://facebook.com/reconnectacademy" style="color: ${colors.textMuted}; font-size: 13px; text-decoration: underline;">Facebook</a>
                <span style="color: ${colors.textLight}; margin: 0 8px;">•</span>
                <a href="https://mmagym.be" style="color: ${colors.textMuted}; font-size: 13px; text-decoration: underline;">Website</a>
              </p>

              <!-- Legal -->
              <p style="color: ${colors.textLight}; font-size: 12px; line-height: 1.6; margin: 0;">
                Je ontvangt deze email omdat je lid bent van Reconnect Academy.
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

interface SendClaimRequest {
  member_id: string
  resend?: boolean
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

    // Verify auth - requires admin/medewerker
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
      throw new Error('Alleen admin/medewerker kan claim emails versturen')
    }

    // Parse request
    const { member_id, resend }: SendClaimRequest = await req.json()

    if (!member_id) {
      throw new Error('member_id is required')
    }

    // Get member data
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, email, first_name, last_name, clubplanner_member_nr, auth_user_id, status')
      .eq('id', member_id)
      .single()

    if (memberError || !member) {
      throw new Error('Lid niet gevonden')
    }

    // Check if already has auth account
    if (member.auth_user_id) {
      throw new Error('Dit lid heeft al een actief account')
    }

    // Check member status
    if (!['active', 'frozen'].includes(member.status || '')) {
      throw new Error('Alleen actieve of bevroren leden kunnen een account claimen')
    }

    // Check if email exists
    if (!member.email) {
      throw new Error('Dit lid heeft geen e-mailadres')
    }

    // Check for existing pending token (unless resend is true)
    if (!resend) {
      const { data: existingToken } = await supabase
        .from('account_claim_tokens')
        .select('id, expires_at')
        .eq('member_id', member_id)
        .is('claimed_at', null)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (existingToken) {
        throw new Error('Er is al een actieve activatielink verstuurd. Gebruik resend=true om opnieuw te versturen.')
      }
    }

    // Create claim token
    const { data: tokenResult, error: tokenError } = await supabase.rpc('create_claim_token', {
      p_member_id: member_id,
      p_email: member.email,
      p_expires_hours: 48,
    })

    if (tokenError || !tokenResult) {
      console.error('Token creation error:', tokenError)
      throw new Error('Kon activatietoken niet aanmaken')
    }

    const plainToken = tokenResult as string

    // Build activation URL - use creative.mmagym.be for member activation
    const baseUrl = 'https://creative.mmagym.be'
    const activationUrl = `${baseUrl}/activate?token=${encodeURIComponent(plainToken)}`

    // Generate email HTML
    const emailHtml = generateClaimAccountEmail({
      firstName: member.first_name || 'Lid',
      email: member.email,
      memberNumber: member.clubplanner_member_nr,
      activationUrl,
      expiresInHours: 48,
    })

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Reconnect Academy <noreply@reconnect.academy>',
        to: [member.email],
        subject: 'Activeer je Reconnect Account',
        html: emailHtml,
      }),
    })

    if (!emailResponse.ok) {
      const emailError = await emailResponse.json()
      console.error('Resend error:', emailError)
      throw new Error(`Email verzenden mislukt: ${emailError.message || 'Unknown error'}`)
    }

    const emailResult = await emailResponse.json()

    // Calculate expiry
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 48)

    return new Response(
      JSON.stringify({
        success: true,
        email_sent_to: member.email,
        member_name: `${member.first_name} ${member.last_name}`,
        expires_at: expiresAt.toISOString(),
        resend_message_id: emailResult.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in send-claim-email:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: (error as Error).message === 'Unauthorized' ? 401 : 400,
      }
    )
  }
})
