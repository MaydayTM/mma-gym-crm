/**
 * Complete Claim Edge Function
 *
 * Completes the account claim process:
 * 1. Validates the token
 * 2. Creates a Supabase Auth user
 * 3. Links the auth user to the member record
 * 4. Marks the token as claimed
 * 5. Returns a session for auto-login
 *
 * Public endpoint - no authentication required.
 *
 * POST /functions/v1/complete-claim
 * Body: { token: string, password: string }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CompleteClaimRequest {
  token: string
  password: string
}

// Password requirements
const MIN_PASSWORD_LENGTH = 8

function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: 'Wachtwoord is verplicht' }
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, error: `Wachtwoord moet minimaal ${MIN_PASSWORD_LENGTH} karakters zijn` }
  }
  // Optional: Add more requirements (uppercase, number, special char)
  return { valid: true }
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

    // Use service role client for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Parse request
    const { token, password }: CompleteClaimRequest = await req.json()

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token is verplicht' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validate password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: passwordValidation.error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Step 1: Verify token and get member data
    const { data: tokenResult, error: tokenError } = await supabaseAdmin.rpc('verify_claim_token', {
      p_token: token,
    })

    if (tokenError) {
      console.error('Token verification error:', tokenError)
      return new Response(
        JSON.stringify({ success: false, error: 'Kon token niet verifiëren' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (!tokenResult || tokenResult.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Deze activatielink is ongeldig of verlopen. Vraag een nieuwe link aan.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const memberData = tokenResult[0]
    const memberId = memberData.member_id
    const memberEmail = memberData.email

    // Check for specific error reasons from verify_claim_token (migration 061)
    if (memberData.error_reason) {
      const errorMessages: Record<string, string> = {
        'TOKEN_NOT_FOUND': 'Deze activatielink is ongeldig.',
        'TOKEN_ALREADY_CLAIMED': 'Deze activatielink is al gebruikt. Log in met je account.',
        'TOKEN_EXPIRED': 'Deze activatielink is verlopen. Vraag een nieuwe link aan.',
        'MEMBER_NOT_FOUND': 'Er is een probleem met je account. Neem contact op met de gym.',
        'MEMBER_ALREADY_ACTIVATED': 'Je account is al geactiveerd! Log in met je e-mailadres en wachtwoord.',
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessages[memberData.error_reason] || 'Deze activatielink is ongeldig.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Step 2: Try to create the auth user directly (handles duplicate email atomically)
    // This is more efficient than listUsers() and avoids race conditions
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: memberEmail,
      password: password,
      email_confirm: true, // Auto-confirm since they clicked the email link
      user_metadata: {
        first_name: memberData.first_name,
        last_name: memberData.last_name,
        member_id: memberId,
      },
    })

    // Handle duplicate email error
    if (authError && authError.message?.toLowerCase().includes('user already registered')) {
      console.error('User already exists for email:', memberEmail)

      // Mark token as claimed to prevent reuse
      await supabaseAdmin.rpc('mark_token_claimed', { p_token: token })

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Er bestaat al een account met dit e-mailadres. Probeer in te loggen of gebruik "Wachtwoord vergeten".',
          redirect: '/login',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (authError) {
      console.error('Error creating auth user:', authError)
      return new Response(
        JSON.stringify({
          success: false,
          error: `Kon account niet aanmaken: ${authError.message}`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Kon account niet aanmaken' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Step 4: Link auth user to member record
    const { error: updateError } = await supabaseAdmin
      .from('members')
      .update({ auth_user_id: authData.user.id })
      .eq('id', memberId)

    if (updateError) {
      console.error('Error linking auth user to member:', updateError)
      // Try to clean up the created auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return new Response(
        JSON.stringify({ success: false, error: 'Kon account niet koppelen aan lidmaatschap' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Step 5: Mark token as claimed
    const { error: claimError } = await supabaseAdmin.rpc('mark_token_claimed', {
      p_token: token,
    })

    if (claimError) {
      console.error('Error marking token claimed:', claimError)
      // Non-fatal - continue anyway
    }

    // Step 6: Sign in the user to get a session
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: memberEmail,
      password: password,
    })

    if (signInError) {
      console.error('Error signing in after claim:', signInError)
      // Non-fatal - user can log in manually
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Account succesvol geactiveerd! Je kunt nu inloggen.',
          redirect: '/login',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Return success with session for auto-login
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account succesvol geactiveerd!',
        session: signInData.session,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          member_id: memberId,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error in complete-claim:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Er is een fout opgetreden' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
