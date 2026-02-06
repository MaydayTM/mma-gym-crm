// supabase/functions/door-validate/index.ts
// Called by ESP32 to validate QR code and grant/deny door access
// Supports 3 access modes: subscription_only, reservation_required, open_gym
// deno-lint-ignore-file no-explicit-any

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { verify } from "https://deno.land/x/djwt@v2.8/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Rate limiting: max 10 attempts per minute per door_id
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(doorId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(doorId)

  // Clean up expired entries periodically
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
    const body = await req.json() as ValidateRequest
    qrToken = body.qr || ''
    doorLocation = body.door_id || 'main'

    // Rate limit: max 10 attempts per minute per door_id
    if (!checkRateLimit(doorLocation)) {
      await logAccess(supabase, null, qrToken.substring(0, 20), false, 'rate_limited', doorLocation)
      return jsonResponse({ allowed: false, reason: 'rate_limited' }, 429)
    }

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
    } catch (_jwtError) {
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

    // Team roles always have access - skip all further checks
    const isTeamMember = TEAM_ROLES.includes(member.role)
    if (isTeamMember) {
      await logAccess(supabase, memberId, qrToken, true, null, doorLocation)
      await updateLastCheckin(supabase, memberId)
      return jsonResponse({
        allowed: true,
        member_name: `${member.first_name} ${member.last_name}`,
        member_id: memberId
      })
    }

    // Non-team member: check active subscription first (required for all modes)
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

    // Load access settings
    const accessSettings = await getAccessSettings(supabase)

    // Apply access mode rules
    if (accessSettings.access_mode === 'subscription_only') {
      // Active subscription is enough - already verified above
      await logAccess(supabase, memberId, qrToken, true, null, doorLocation)
      await updateLastCheckin(supabase, memberId)
      return jsonResponse({
        allowed: true,
        member_name: `${member.first_name} ${member.last_name}`,
        member_id: memberId
      })
    }

    if (accessSettings.access_mode === 'reservation_required') {
      // Check if member has a reservation for a class within the time window
      const hasReservation = await checkReservationAccess(
        supabase,
        memberId,
        accessSettings.minutes_before_class,
        accessSettings.grace_period_minutes
      )

      if (!hasReservation) {
        await logAccess(supabase, memberId, qrToken, false, 'no_reservation', doorLocation)
        return jsonResponse({
          allowed: false,
          reason: 'no_reservation',
          member_name: `${member.first_name} ${member.last_name}`
        })
      }

      await logAccess(supabase, memberId, qrToken, true, null, doorLocation)
      await updateLastCheckin(supabase, memberId)
      return jsonResponse({
        allowed: true,
        member_name: `${member.first_name} ${member.last_name}`,
        member_id: memberId
      })
    }

    if (accessSettings.access_mode === 'open_gym') {
      // Check if current time is within open gym hours
      const isWithinHours = checkOpenGymHours(accessSettings.open_gym_hours)

      if (!isWithinHours) {
        await logAccess(supabase, memberId, qrToken, false, 'outside_hours', doorLocation)
        return jsonResponse({
          allowed: false,
          reason: 'outside_hours',
          member_name: `${member.first_name} ${member.last_name}`
        })
      }

      await logAccess(supabase, memberId, qrToken, true, null, doorLocation)
      await updateLastCheckin(supabase, memberId)
      return jsonResponse({
        allowed: true,
        member_name: `${member.first_name} ${member.last_name}`,
        member_id: memberId
      })
    }

    // Fallback: unknown mode, deny
    await logAccess(supabase, memberId, qrToken, false, 'unknown_mode', doorLocation)
    return jsonResponse({ allowed: false, reason: 'system_error' })

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

// Load access settings from DB (with sensible defaults)
async function getAccessSettings(
  supabase: ReturnType<typeof createClient>
): Promise<AccessSettings> {
  const { data } = await supabase
    .from('gym_access_settings')
    .select('access_mode, minutes_before_class, grace_period_minutes, open_gym_hours')
    .eq('tenant_id', 'reconnect-academy')
    .single()

  if (!data) {
    // Fallback defaults if no settings configured
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

// Check if member has a reservation for a class happening now (within time window)
async function checkReservationAccess(
  supabase: ReturnType<typeof createClient>,
  memberId: string,
  minutesBefore: number,
  gracePeriodMinutes: number
): Promise<boolean> {
  const now = new Date()
  const today = now.toISOString().split('T')[0] // YYYY-MM-DD
  const currentDayOfWeek = now.getDay() // 0=Sun, 1=Mon, ..., 6=Sat

  // Get all reservations for today that are not cancelled
  const { data: reservations } = await supabase
    .from('reservations')
    .select(`
      id,
      class_id,
      status,
      classes!inner (
        start_time,
        end_time,
        day_of_week
      )
    `)
    .eq('member_id', memberId)
    .eq('reservation_date', today)
    .in('status', ['reserved', 'checked_in'])

  if (!reservations || reservations.length === 0) {
    return false
  }

  // Check if any reservation's class is within the time window
  const currentTime = now.getHours() * 60 + now.getMinutes() // minutes since midnight

  for (const res of reservations) {
    const classData = res.classes as any
    if (!classData?.start_time) continue

    // Parse class start_time (HH:MM:SS or HH:MM format)
    const [startH, startM] = classData.start_time.split(':').map(Number)
    const classStartMin = startH * 60 + startM

    // Time window: (class start - minutesBefore) to (class start + gracePeriod)
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
  // Use Europe/Brussels timezone for Belgian gym
  const now = new Date()
  const brusselsTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Brussels' }))
  const currentDay = brusselsTime.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const currentMinutes = brusselsTime.getHours() * 60 + brusselsTime.getMinutes()

  const todayHours = hours.find(h => h.day === currentDay)
  if (!todayHours) return false

  const [openH, openM] = todayHours.open.split(':').map(Number)
  const [closeH, closeM] = todayHours.close.split(':').map(Number)
  const openMin = openH * 60 + openM
  const closeMin = closeH * 60 + closeM

  return currentMinutes >= openMin && currentMinutes <= closeMin
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
