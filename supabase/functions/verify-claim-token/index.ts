/**
 * Verify Claim Token Edge Function
 *
 * Validates an account claim token and returns member preview data.
 * Public endpoint - no authentication required.
 *
 * POST /functions/v1/verify-claim-token
 * Body: { token: string }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerifyRequest {
  token: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request
    const { token }: VerifyRequest = await req.json()

    if (!token) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'Token is verplicht',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Verify token using database function
    const { data: result, error: verifyError } = await supabase.rpc('verify_claim_token', {
      p_token: token,
    })

    if (verifyError) {
      console.error('Token verification error:', verifyError)
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'Kon token niet verifiëren',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // Check if token is valid (result is an array from the table-returning function)
    if (!result || result.length === 0) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'Deze activatielink is ongeldig of verlopen. Vraag een nieuwe link aan.',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200, // Return 200 with valid: false for UX
        }
      )
    }

    const memberData = result[0]

    // Check for specific error reasons from the improved verify_claim_token function
    if (memberData.error_reason) {
      const errorMessages: Record<string, string> = {
        'TOKEN_NOT_FOUND': 'Deze activatielink is ongeldig. Controleer of je de volledige link hebt gekopieerd.',
        'TOKEN_ALREADY_CLAIMED': 'Deze activatielink is al gebruikt. Log in met je account of vraag een nieuwe link aan.',
        'TOKEN_EXPIRED': 'Deze activatielink is verlopen. Vraag een nieuwe link aan via "Account activeren".',
        'MEMBER_NOT_FOUND': 'Er is een probleem met je account. Neem contact op met de gym.',
        'MEMBER_ALREADY_ACTIVATED': 'Je account is al geactiveerd! Log in met je e-mailadres en wachtwoord, of gebruik "Wachtwoord vergeten" als je je wachtwoord kwijt bent.',
      }

      return new Response(
        JSON.stringify({
          valid: false,
          error: errorMessages[memberData.error_reason] || 'Deze activatielink is ongeldig of verlopen.',
          reason: memberData.error_reason,
          // Include name for MEMBER_ALREADY_ACTIVATED so we can show a friendly message
          member_name: memberData.error_reason === 'MEMBER_ALREADY_ACTIVATED' ? memberData.first_name : undefined,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Return member preview (limited data for security)
    return new Response(
      JSON.stringify({
        valid: true,
        member: {
          id: memberData.member_id,
          first_name: memberData.first_name,
          last_name: memberData.last_name,
          email: memberData.email,
          member_number: memberData.member_number,
          profile_picture_url: memberData.profile_picture_url,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in verify-claim-token:', error)
    return new Response(
      JSON.stringify({
        valid: false,
        error: 'Er is een fout opgetreden',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
