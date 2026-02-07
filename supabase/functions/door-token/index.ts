// supabase/functions/door-token/index.ts
// Generates a short-lived numeric token for door QR access
// Uses short codes instead of JWT for Wiegand scanner compatibility

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TokenRequest {
  member_id: string
}

const TEAM_ROLES = ['admin', 'medewerker', 'coordinator', 'coach']
const TOKEN_EXPIRY_MINUTES = 5

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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

    // Return specific errors so users know what's wrong
    if (member.status !== 'active') {
      return jsonResponse({
        error: 'Member account is not active'
      }, 403)
    }

    if (member.door_access_enabled === false) {
      return jsonResponse({
        error: 'Door access is disabled for this member'
      }, 403)
    }

    // Team roles always have access - skip subscription check
    const isTeamMember = TEAM_ROLES.includes(member.role)

    // Only check subscription for non-team members
    if (!isTeamMember) {
      const { data: subscription } = await supabase
        .from('member_subscriptions')
        .select('id, end_date, status')
        .eq('member_id', member_id)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('end_date', { ascending: false })
        .limit(1)
        .single()

      if (!subscription) {
        return jsonResponse({
          error: 'No active subscription found'
        }, 403)
      }
    }

    // Generate a unique short numeric code
    const tokenCode = await generateUniqueCode(supabase)

    // Don't delete old tokens - let them expire naturally (5 min)
    // Deleting causes issues when multiple devices show the QR simultaneously
    // Expired tokens are cleaned up by cleanup_expired_door_tokens()

    // Store new token with expiry
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000)

    const { error: insertError } = await supabase
      .from('door_tokens')
      .insert({
        member_id: member.id,
        token_code: tokenCode,
        expires_at: expiresAt.toISOString(),
      })

    if (insertError) {
      console.error('Failed to store token:', insertError)
      throw new Error('Failed to store token')
    }

    return jsonResponse({
      qr_token: tokenCode,
      expires_in: TOKEN_EXPIRY_MINUTES * 60, // seconds
      member_name: `${member.first_name} ${member.last_name}`
    })

  } catch (error) {
    console.error('Door token error:', error)
    return jsonResponse({ error: (error as Error).message || 'Internal server error' }, 500)
  }
})

// Generate a unique numeric code that fits in 24-bit Wiegand data
// Range: 1000000-16777215 (7-8 digits, max 24 bits for 26-bit Wiegand)
async function generateUniqueCode(
  supabase: ReturnType<typeof createClient>
): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    // Max 24-bit value = 16777215, min 7 digits = 1000000
    const code = String(Math.floor(1000000 + Math.random() * 15777215))

    // Check if code already exists (unlikely but safe)
    const { data } = await supabase
      .from('door_tokens')
      .select('id')
      .eq('token_code', code)
      .single()

    if (!data) {
      return code // Code is unique
    }
  }

  // Extremely unlikely fallback
  throw new Error('Could not generate unique code')
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
