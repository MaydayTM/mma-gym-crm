// supabase/functions/door-token/index.ts
// Generates a short-lived JWT QR token for a member to use at the door

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { member_id } = await req.json() as TokenRequest

    if (!member_id) {
      return jsonResponse({ error: 'member_id is required' }, 400)
    }

    // Check member exists and is active
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, first_name, last_name, status, door_access_enabled')
      .eq('id', member_id)
      .single()

    if (memberError || !member) {
      return jsonResponse({ error: 'Member not found' }, 404)
    }

    if (member.status !== 'active') {
      return jsonResponse({ error: 'Member account is not active' }, 403)
    }

    if (!member.door_access_enabled) {
      return jsonResponse({ error: 'Door access is disabled for this member' }, 403)
    }

    // Check for active subscription
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
      return jsonResponse({ error: 'No active subscription found' }, 403)
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

    // Store token in members table (for validation check)
    const { error: updateError } = await supabase
      .from('members')
      .update({ qr_token: token })
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
