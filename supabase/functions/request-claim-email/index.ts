/**
 * Request Claim Email Edge Function
 *
 * Public endpoint for members to request their account activation email.
 * Takes email OR member number, finds the member, and sends claim email.
 *
 * Security:
 * - Rate limited (via Supabase)
 * - Returns generic message to prevent email enumeration
 * - Only works for members without auth_user_id
 *
 * POST /functions/v1/request-claim-email
 * Body: { identifier: string } // email or member number
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Email template (same as send-claim-email)
const colors = {
  primary: '#FBBF24',
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
  <title>Activeer je Reconnect Account</title>
  <style>
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; }
    table { border-collapse: collapse; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    a { color: ${colors.text}; text-decoration: none; }
  </style>
</head>
<body style="background-color: ${colors.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px 16px;">
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${firstName}, activeer je account en krijg toegang tot je trainingshistorie!
  </div>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px; margin: 0 auto;">
    <tr>
      <td style="background-color: ${colors.white}; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="padding: 32px 40px; text-align: center; border-bottom: 1px solid ${colors.border};">
              <img src="https://crm.mmagym.be/images/freshYellowRCN%202.png" width="120" alt="Reconnect Academy" style="display: block; margin: 0 auto;">
            </td>
          </tr>
        </table>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="padding: 48px 40px;">
              <h1 style="color: ${colors.text}; font-size: 32px; font-weight: 700; margin: 0 0 16px; text-align: center;">
                Activeer je account
              </h1>
              <p style="color: ${colors.text}; font-size: 16px; line-height: 1.6; margin: 0 0 8px;">
                Hallo ${firstName}.
              </p>
              <p style="color: ${colors.text}; font-size: 16px; line-height: 1.6; margin: 0 0 32px;">
                Je account bij Reconnect staat klaar!
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 32px;">
                <tr>
                  <td style="background-color: ${colors.background}; border-radius: 12px; padding: 20px 24px;">
                    <p style="color: ${colors.textMuted}; font-size: 13px; font-weight: 600; margin: 0 0 8px;">
                      Jouw inloggegevens:
                    </p>
                    <p style="color: ${colors.text}; font-size: 18px; font-weight: 600; margin: 0;">
                      ${memberNumber ? `${memberNumber} of ` : ''}${email}
                    </p>
                  </td>
                </tr>
              </table>
              <p style="color: ${colors.text}; font-size: 16px; line-height: 1.6; margin: 0 0 32px;">
                Klik hieronder om je wachtwoord in te stellen.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 16px;">
                <tr>
                  <td style="background-color: ${colors.primary}; border-radius: 50px;">
                    <a href="${activationUrl}" style="display: inline-block; padding: 16px 48px; color: ${colors.text}; font-size: 16px; font-weight: 600; text-decoration: none;">
                      Account Activeren
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: ${colors.textMuted}; font-size: 14px; text-align: center; margin: 0;">
                Deze link is ${expiresInHours} uur geldig
              </p>
            </td>
          </tr>
        </table>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="padding: 24px 40px; text-align: center; border-top: 1px solid ${colors.border};">
              <p style="color: ${colors.textMuted}; font-size: 13px; margin: 0;">
                Reconnect Academy | Erembo&shy;degemstraat 31/16, 9300 Aalst
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

interface RequestClaimRequest {
  identifier: string // email or member number
}

// Generic success message (security: don't reveal if account exists)
const GENERIC_SUCCESS_MESSAGE = 'Als er een account bestaat met deze gegevens, ontvang je binnen enkele minuten een e-mail met activatielink.'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // DEBUG MODE - disable in production to prevent information leakage
  const DEBUG_MODE = Deno.env.get('DEBUG_MODE') === 'true'

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

    // Parse request
    const body = await req.text()
    const { identifier }: RequestClaimRequest = JSON.parse(body)

    if (!identifier || identifier.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Vul je e-mailadres of lidnummer in' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Find member using database function
    const { data: result, error: findError } = await supabase.rpc('find_member_for_claim', {
      p_identifier: identifier.trim(),
    })

    if (findError) {
      console.error('Error finding member:', findError)
      if (DEBUG_MODE) {
        return new Response(
          JSON.stringify({ success: false, error: 'find_member_for_claim failed', details: findError }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      return new Response(
        JSON.stringify({ success: true, message: GENERIC_SUCCESS_MESSAGE }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // No member found - return generic message (don't reveal non-existence)
    if (!result || result.length === 0) {
      console.log('No member found for identifier:', identifier)
      if (DEBUG_MODE) {
        return new Response(
          JSON.stringify({ success: false, error: 'No member found', identifier }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        )
      }
      return new Response(
        JSON.stringify({ success: true, message: GENERIC_SUCCESS_MESSAGE }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const memberInfo = result[0]

    console.log('Member found:', memberInfo)

    // Member can't claim (already has account)
    if (!memberInfo.can_claim) {
      console.log('Member cannot claim:', memberInfo.reason)
      if (DEBUG_MODE) {
        return new Response(
          JSON.stringify({ success: false, error: 'Member cannot claim', reason: memberInfo.reason }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      return new Response(
        JSON.stringify({
          success: true,
          message: GENERIC_SUCCESS_MESSAGE
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Get full member data for email
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, email, first_name, clubplanner_member_nr')
      .eq('id', memberInfo.member_id)
      .single()

    if (memberError || !member) {
      console.error('Error fetching member:', memberError)
      if (DEBUG_MODE) {
        return new Response(
          JSON.stringify({ success: false, error: 'Error fetching member details', details: memberError }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      return new Response(
        JSON.stringify({ success: true, message: GENERIC_SUCCESS_MESSAGE }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    console.log('Member details:', member)

    // Create claim token
    const { data: tokenResult, error: tokenError } = await supabase.rpc('create_claim_token', {
      p_member_id: member.id,
      p_email: member.email,
      p_expires_hours: 48,
    })

    if (tokenError || !tokenResult) {
      console.error('Token creation error:', tokenError)
      if (DEBUG_MODE) {
        return new Response(
          JSON.stringify({ success: false, error: 'Token creation failed', details: tokenError }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      return new Response(
        JSON.stringify({ success: true, message: GENERIC_SUCCESS_MESSAGE }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    console.log('Token created successfully')

    const plainToken = tokenResult as string

    // Build activation URL - use crm.mmagym.be for member activation
    const baseUrl = 'https://crm.mmagym.be'
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
      const responseText = await emailResponse.text()
      console.error('Resend error:', emailResponse.status, responseText)
      if (DEBUG_MODE) {
        return new Response(
          JSON.stringify({ success: false, error: 'Resend email failed', status: emailResponse.status, details: responseText }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      return new Response(
        JSON.stringify({
          success: true,
          message: GENERIC_SUCCESS_MESSAGE
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    console.log('Email sent successfully to:', member.email)

    // Always return generic success
    return new Response(
      JSON.stringify({ success: true, message: GENERIC_SUCCESS_MESSAGE }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error in request-claim-email:', error)
    if (DEBUG_MODE) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unexpected error', details: String(error) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    return new Response(
      JSON.stringify({ success: true, message: GENERIC_SUCCESS_MESSAGE }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  }
})
