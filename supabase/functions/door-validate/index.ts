// supabase/functions/door-validate/index.ts
// Called by ESP32 to validate door access tokens
// Supports short numeric codes (Wiegand compatible) and access modes
// deno-lint-ignore-file no-explicit-any

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Rate limiting: max 10 attempts per minute per door_id
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(doorId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(doorId)

  if (rateLimitMap.size > 100) {
    for (const [key, val] of rateLimitMap) {
      if (val.resetAt < now) rateLimitMap.delete(key)
    }
  }

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(doorId, { count: 1, resetAt: now + 60_000 })
    return true
  }

  entry.count++
  if (entry.count > 10) return false
  return true
}

interface ValidateRequest {
  qr: string
  door_id?: string
}

interface AccessSettings {
  access_mode: 'subscription_only' | 'reservation_required' | 'open_gym'
  minutes_before_class: number
  grace_period_minutes: number
  open_gym_hours: { day: number; open: string; close: string }[]
}

const TEAM_ROLES = ['admin', 'medewerker', 'coordinator', 'coach']

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

  // Require ANON_KEY in apikey header (prevents random internet scanners)
  const apiKey = req.headers.get('apikey')
  if (apiKey !== SUPABASE_ANON_KEY) {
    return jsonResponse({ allowed: false, reason: 'invalid_token' })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  let tokenCode = ''
  let doorLocation = 'main'

  try {
    const body = await req.json() as ValidateRequest
    tokenCode = (body.qr || '').trim()
    doorLocation = body.door_id || 'main'

    // Rate limit
    if (!checkRateLimit(doorLocation)) {
      await logAccess(supabase, null, tokenCode, false, 'rate_limited', doorLocation)
      return jsonResponse({ allowed: false, reason: 'rate_limited' }, 429)
    }

    if (!tokenCode) {
      await logAccess(supabase, null, '', false, 'empty_token', doorLocation)
      return jsonResponse({ allowed: false, reason: 'invalid_token' })
    }

    // Strip Wiegand 26-bit parity encoding if present
    // ESP32 Wiegand scanners wrap QR numeric content in 26-bit format:
    // P1 (1 bit) + Data (24 bits) + P2 (1 bit)
    // To recover original: (cardCode >> 1) & 0xFFFFFF
    const rawCode = tokenCode
    const numericCode = parseInt(tokenCode)
    let lookupCode = tokenCode

    if (!isNaN(numericCode) && numericCode > 0) {
      const decodedCode = String((numericCode >>> 1) & 0xFFFFFF)
      // Use decoded code for lookup (ESP32 sends Wiegand-encoded)
      lookupCode = decodedCode
    }

    // Try decoded code first (ESP32 Wiegand), then raw code (web CRM fallback)
    let doorToken = null
    const { data: decodedMatch } = await supabase
      .from('door_tokens')
      .select('id, member_id, token_code, expires_at, used_at')
      .eq('token_code', lookupCode)
      .single()

    if (decodedMatch) {
      doorToken = decodedMatch
    } else if (lookupCode !== rawCode) {
      // Fallback: try the raw code as-is (in case it's from web CRM or direct API)
      const { data: rawMatch } = await supabase
        .from('door_tokens')
        .select('id, member_id, token_code, expires_at, used_at')
        .eq('token_code', rawCode)
        .single()
      doorToken = rawMatch
    }

    if (!doorToken) {
      await logAccess(supabase, null, tokenCode, false, 'token_not_found', doorLocation)
      return jsonResponse({ allowed: false, reason: 'invalid_token' })
    }

    // Check if token is expired
    if (new Date(doorToken.expires_at) < new Date()) {
      await logAccess(supabase, doorToken.member_id, tokenCode, false, 'token_expired', doorLocation)
      return jsonResponse({ allowed: false, reason: 'token_expired' })
    }

    const memberId = doorToken.member_id

    // Get member details
    const { data: member } = await supabase
      .from('members')
      .select('id, first_name, last_name, status, role, door_access_enabled')
      .eq('id', memberId)
      .single()

    if (!member) {
      await logAccess(supabase, memberId, tokenCode, false, 'member_not_found', doorLocation)
      return jsonResponse({ allowed: false, reason: 'member_not_found' })
    }

    // Check door access enabled
    if (!member.door_access_enabled) {
      await logAccess(supabase, memberId, tokenCode, false, 'access_disabled', doorLocation)
      return jsonResponse({
        allowed: false,
        reason: 'access_disabled',
        member_name: `${member.first_name} ${member.last_name}`
      })
    }

    // Check member status
    if (member.status !== 'active') {
      await logAccess(supabase, memberId, tokenCode, false, 'member_inactive', doorLocation)
      return jsonResponse({
        allowed: false,
        reason: 'member_inactive',
        member_name: `${member.first_name} ${member.last_name}`
      })
    }

    // Team roles always have access
    const isTeamMember = TEAM_ROLES.includes(member.role)
    if (isTeamMember) {
      await markTokenUsed(supabase, doorToken.id)
      await logAccess(supabase, memberId, tokenCode, true, null, doorLocation)
      await updateLastCheckin(supabase, memberId)
      return jsonResponse({
        allowed: true,
        member_name: `${member.first_name} ${member.last_name}`,
        member_id: memberId
      })
    }

    // Non-team: check subscription
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
      await logAccess(supabase, memberId, tokenCode, false, 'no_active_subscription', doorLocation)
      return jsonResponse({
        allowed: false,
        reason: 'no_active_subscription',
        member_name: `${member.first_name} ${member.last_name}`
      })
    }

    // Load access settings and apply mode rules
    const accessSettings = await getAccessSettings(supabase)

    if (accessSettings.access_mode === 'subscription_only') {
      await markTokenUsed(supabase, doorToken.id)
      await logAccess(supabase, memberId, tokenCode, true, null, doorLocation)
      await updateLastCheckin(supabase, memberId)
      return jsonResponse({
        allowed: true,
        member_name: `${member.first_name} ${member.last_name}`,
        member_id: memberId
      })
    }

    if (accessSettings.access_mode === 'reservation_required') {
      const hasReservation = await checkReservationAccess(
        supabase, memberId,
        accessSettings.minutes_before_class,
        accessSettings.grace_period_minutes
      )

      if (!hasReservation) {
        await logAccess(supabase, memberId, tokenCode, false, 'no_reservation', doorLocation)
        return jsonResponse({
          allowed: false,
          reason: 'no_reservation',
          member_name: `${member.first_name} ${member.last_name}`
        })
      }

      await markTokenUsed(supabase, doorToken.id)
      await logAccess(supabase, memberId, tokenCode, true, null, doorLocation)
      await updateLastCheckin(supabase, memberId)
      return jsonResponse({
        allowed: true,
        member_name: `${member.first_name} ${member.last_name}`,
        member_id: memberId
      })
    }

    if (accessSettings.access_mode === 'open_gym') {
      const isWithinHours = checkOpenGymHours(accessSettings.open_gym_hours)

      if (!isWithinHours) {
        await logAccess(supabase, memberId, tokenCode, false, 'outside_hours', doorLocation)
        return jsonResponse({
          allowed: false,
          reason: 'outside_hours',
          member_name: `${member.first_name} ${member.last_name}`
        })
      }

      await markTokenUsed(supabase, doorToken.id)
      await logAccess(supabase, memberId, tokenCode, true, null, doorLocation)
      await updateLastCheckin(supabase, memberId)
      return jsonResponse({
        allowed: true,
        member_name: `${member.first_name} ${member.last_name}`,
        member_id: memberId
      })
    }

    // Unknown mode fallback
    await logAccess(supabase, memberId, tokenCode, false, 'unknown_mode', doorLocation)
    return jsonResponse({ allowed: false, reason: 'system_error' })

  } catch (error) {
    console.error('Door validate error:', error)

    await logAccess(
      createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY),
      null, tokenCode.substring(0, 50), false, 'system_error', doorLocation
    )

    return jsonResponse({ allowed: false, reason: 'system_error' })
  }
})

// Mark token as used
async function markTokenUsed(
  supabase: ReturnType<typeof createClient>,
  tokenId: string
) {
  await supabase
    .from('door_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', tokenId)
}

// Load access settings from DB
async function getAccessSettings(
  supabase: ReturnType<typeof createClient>
): Promise<AccessSettings> {
  const { data } = await supabase
    .from('gym_access_settings')
    .select('access_mode, minutes_before_class, grace_period_minutes, open_gym_hours')
    .eq('tenant_id', 'reconnect-academy')
    .single()

  if (!data) {
    return {
      access_mode: 'subscription_only',
      minutes_before_class: 30,
      grace_period_minutes: 10,
      open_gym_hours: [],
    }
  }

  return {
    access_mode: data.access_mode as AccessSettings['access_mode'],
    minutes_before_class: data.minutes_before_class,
    grace_period_minutes: data.grace_period_minutes,
    open_gym_hours: (data.open_gym_hours || []) as AccessSettings['open_gym_hours'],
  }
}

// Check if member has a reservation within the time window
async function checkReservationAccess(
  supabase: ReturnType<typeof createClient>,
  memberId: string,
  minutesBefore: number,
  gracePeriodMinutes: number
): Promise<boolean> {
  const now = new Date()
  const today = now.toISOString().split('T')[0]

  const { data: reservations } = await supabase
    .from('reservations')
    .select(`id, class_id, status, classes!inner (start_time, end_time, day_of_week)`)
    .eq('member_id', memberId)
    .eq('reservation_date', today)
    .in('status', ['reserved', 'checked_in'])

  if (!reservations || reservations.length === 0) return false

  const currentTime = now.getHours() * 60 + now.getMinutes()

  for (const res of reservations) {
    const classData = res.classes as any
    if (!classData?.start_time) continue

    const [startH, startM] = classData.start_time.split(':').map(Number)
    const classStartMin = startH * 60 + startM

    const windowOpen = classStartMin - minutesBefore
    const windowClose = classStartMin + gracePeriodMinutes

    if (currentTime >= windowOpen && currentTime <= windowClose) {
      return true
    }
  }

  return false
}

// Check if current time is within open gym hours
function checkOpenGymHours(
  hours: { day: number; open: string; close: string }[]
): boolean {
  const now = new Date()
  const brusselsTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Brussels' }))
  const currentDay = brusselsTime.getDay()
  const currentMinutes = brusselsTime.getHours() * 60 + brusselsTime.getMinutes()

  const todayHours = hours.find(h => h.day === currentDay)
  if (!todayHours) return false

  const [openH, openM] = todayHours.open.split(':').map(Number)
  const [closeH, closeM] = todayHours.close.split(':').map(Number)

  return currentMinutes >= (openH * 60 + openM) && currentMinutes <= (closeH * 60 + closeM)
}

// Update last check-in timestamp
async function updateLastCheckin(
  supabase: ReturnType<typeof createClient>,
  memberId: string
) {
  await supabase
    .from('members')
    .update({ last_checkin_at: new Date().toISOString() })
    .eq('id', memberId)
}

// Log access attempts
async function logAccess(
  supabase: ReturnType<typeof createClient>,
  memberId: string | null,
  tokenCode: string,
  allowed: boolean,
  denialReason: string | null,
  doorLocation: string
) {
  try {
    await supabase.from('door_access_logs').insert({
      member_id: memberId,
      qr_token_hash: tokenCode ? tokenCode.substring(0, 20) : null,
      allowed,
      denial_reason: denialReason,
      door_location: doorLocation
    })
  } catch (e) {
    console.error('Failed to log access:', e)
  }
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
