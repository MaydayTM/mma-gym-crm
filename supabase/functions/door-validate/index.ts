// supabase/functions/door-validate/index.ts
// Called by ESP32 to validate QR code and grant/deny door access
// deno-lint-ignore-file no-explicit-any
/* eslint-disable @typescript-eslint/no-unused-vars */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { verify } from "https://deno.land/x/djwt@v2.8/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ValidateRequest {
  qr: string
  door_id?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
  const JWT_SECRET = Deno.env.get('DOOR_JWT_SECRET')

  // Require ANON_KEY in apikey header (prevents random internet scanners)
  const apiKey = req.headers.get('apikey')
  if (apiKey !== SUPABASE_ANON_KEY) {
    return jsonResponse({ allowed: false, reason: 'invalid_token' })
  }

  // Use service role to bypass RLS
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  let qrToken = ''
  let doorLocation = 'main'

  try {
    // TODO: Add rate limiting - max 10 attempts per minute per door_id
    // Can use Deno.KV or in-memory Map with timestamp cleanup
    // Example: const rateLimitKey = `door-validate:${doorLocation}:${clientIP}`

    const body = await req.json() as ValidateRequest
    qrToken = body.qr || ''
    doorLocation = body.door_id || 'main'

    if (!qrToken) {
      throw new Error('No QR token provided')
    }

    if (!JWT_SECRET) {
      throw new Error('DOOR_JWT_SECRET not configured')
    }

    // Verify JWT token
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    )

    let payload: { member_id: string; exp: number }
    try {
      payload = await verify(qrToken, key) as { member_id: string; exp: number }
    } catch (jwtError) {
      // Invalid or expired JWT
      await logAccess(supabase, null, qrToken, false, 'invalid_token', doorLocation)
      return jsonResponse({ allowed: false, reason: 'invalid_token' })
    }

    const memberId = payload.member_id

    // Hash the incoming token to compare with stored hash
    const tokenHash = await hashToken(qrToken)

    // Check if token matches stored hash
    const { data: member } = await supabase
      .from('members')
      .select('id, first_name, last_name, status, role, qr_token, door_access_enabled')
      .eq('id', memberId)
      .single()

    if (!member) {
      await logAccess(supabase, null, qrToken, false, 'member_not_found', doorLocation)
      return jsonResponse({ allowed: false, reason: 'member_not_found' })
    }

    // Check if QR token hash matches (prevents replay with old tokens)
    if (member.qr_token !== tokenHash) {
      await logAccess(supabase, memberId, qrToken, false, 'token_mismatch', doorLocation)
      return jsonResponse({ allowed: false, reason: 'token_expired' })
    }

    // Check if door access is enabled for this member
    if (!member.door_access_enabled) {
      await logAccess(supabase, memberId, qrToken, false, 'access_disabled', doorLocation)
      return jsonResponse({
        allowed: false,
        reason: 'access_disabled',
        member_name: `${member.first_name} ${member.last_name}`
      })
    }

    // Check member status
    if (member.status !== 'active') {
      await logAccess(supabase, memberId, qrToken, false, 'member_inactive', doorLocation)
      return jsonResponse({
        allowed: false,
        reason: 'member_inactive',
        member_name: `${member.first_name} ${member.last_name}`
      })
    }

    // Team roles (admin, medewerker, coordinator, coach) have unlimited access
    // They don't need an active subscription or reservation
    const TEAM_ROLES = ['admin', 'medewerker', 'coordinator', 'coach']
    const isTeamMember = TEAM_ROLES.includes(member.role)

    // Only check subscription for non-team members (fighters)
    if (!isTeamMember) {
      const { data: subscription } = await supabase
        .from('member_subscriptions')
        .select('id, end_date')
        .eq('member_id', memberId)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('end_date', { ascending: false })
        .limit(1)
        .single()

      if (!subscription) {
        await logAccess(supabase, memberId, qrToken, false, 'no_active_subscription', doorLocation)
        return jsonResponse({
          allowed: false,
          reason: 'no_active_subscription',
          member_name: `${member.first_name} ${member.last_name}`
        })
      }
    }

    // All checks passed - grant access!
    await logAccess(supabase, memberId, qrToken, true, null, doorLocation)

    // Update last check-in timestamp
    await supabase
      .from('members')
      .update({ last_checkin_at: new Date().toISOString() })
      .eq('id', memberId)

    return jsonResponse({
      allowed: true,
      member_name: `${member.first_name} ${member.last_name}`,
      member_id: memberId
    })

  } catch (error) {
    console.error('Door validate error:', error)

    // Log the failed attempt
    await logAccess(
      createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY),
      null,
      qrToken.substring(0, 50),
      false,
      'system_error',
      doorLocation
    )

    return jsonResponse({ allowed: false, reason: 'system_error' })
  }
})

// Helper to log access attempts
async function logAccess(
  supabase: ReturnType<typeof createClient>,
  memberId: string | null,
  qrToken: string,
  allowed: boolean,
  denialReason: string | null,
  doorLocation: string
) {
  try {
    // Hash the token for storage (don't store full JWT)
    const tokenHash = qrToken ? await hashToken(qrToken.substring(0, 20)) : null

    await supabase.from('door_access_logs').insert({
      member_id: memberId,
      qr_token_hash: tokenHash,
      allowed,
      denial_reason: denialReason,
      door_location: doorLocation
    })
  } catch (e) {
    console.error('Failed to log access:', e)
  }
}

// Hash token with SHA-256 (must match door-token hash implementation)
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Helper for JSON responses
function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}
