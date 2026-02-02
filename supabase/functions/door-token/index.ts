// supabase/functions/door-token/index.ts
// Generates a short-lived JWT QR token for a member to use at the door

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { create } from "https://deno.land/x/djwt@v2.8/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TokenRequest {
  member_id: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const JWT_SECRET = Deno.env.get('DOOR_JWT_SECRET')

    if (!JWT_SECRET) {
      throw new Error('DOOR_JWT_SECRET not configured')
    }

    // Authentication required - extract Bearer token from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Access denied' }, 401)
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Validate user session and get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return jsonResponse({ error: 'Access denied' }, 401)
    }

    const { member_id } = await req.json() as TokenRequest

    // Validate member_id is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!member_id || !uuidRegex.test(member_id)) {
      return jsonResponse({ error: 'Access denied' }, 400)
    }

    // Check member exists and get their auth_user_id for permission check
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, first_name, last_name, status, role, door_access_enabled, auth_user_id')
      .eq('id', member_id)
      .single()

    if (memberError || !member) {
      return jsonResponse({ error: 'Access denied' }, 403)
    }

    // Get the authenticated user's member record to check their role
    const { data: authUserMember } = await supabase
      .from('members')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    const isStaff = authUserMember && ['admin', 'medewerker'].includes(authUserMember.role)
    const isSelf = member.auth_user_id === user.id

    // Only allow staff or the member themselves to generate tokens
    if (!isStaff && !isSelf) {
      return jsonResponse({ error: 'Access denied' }, 403)
    }

    // Return generic error for unauthorized users, specific errors for staff
    if (member.status !== 'active') {
      return jsonResponse({
        error: isStaff ? 'Member account is not active' : 'Access denied'
      }, 403)
    }

    if (!member.door_access_enabled) {
      return jsonResponse({
        error: isStaff ? 'Door access is disabled for this member' : 'Access denied'
      }, 403)
    }

    // Team roles (admin, medewerker, coordinator, coach) always have access
    const TEAM_ROLES = ['admin', 'medewerker', 'coordinator', 'coach']
    const isTeamMember = TEAM_ROLES.includes(member.role)

    // Only check subscription for non-team members
    if (!isTeamMember) {
      const { data: subscription, error: subError } = await supabase
        .from('member_subscriptions')
        .select('id, end_date, status')
        .eq('member_id', member_id)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('end_date', { ascending: false })
        .limit(1)
        .single()

      if (subError || !subscription) {
        return jsonResponse({
          error: isStaff ? 'No active subscription found' : 'Access denied'
        }, 403)
      }
    }

    // Generate JWT token (15 minutes expiry)
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    )

    const expiryMinutes = 15
    const token = await create(
      { alg: "HS256", typ: "JWT" },
      {
        member_id: member.id,
        name: `${member.first_name} ${member.last_name}`,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (expiryMinutes * 60)
      },
      key
    )

    // Hash the token with SHA-256 before storing (security best practice)
    const tokenHash = await hashToken(token)

    // Store only the hash in members table (prevents token theft from DB)
    const { error: updateError } = await supabase
      .from('members')
      .update({ qr_token: tokenHash })
      .eq('id', member_id)

    if (updateError) {
      console.error('Failed to store token:', updateError)
      throw new Error('Failed to store token')
    }

    return jsonResponse({
      qr_token: token,
      expires_in: expiryMinutes * 60, // seconds
      member_name: `${member.first_name} ${member.last_name}`
    })

  } catch (error) {
    console.error('Door token error:', error)
    return jsonResponse({ error: error.message || 'Internal server error' }, 500)
  }
})

// Helper to hash tokens for secure storage
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
