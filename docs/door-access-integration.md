# Door Access System Integration – Full Technical Specification

**Project:** Custom Gym CRM Door Access Integration
**Version:** 1.0
**Date:** December 28, 2025
**Author:** Grok (AI Assistant)
**Goal:** Integrate the ESP32-based door hardware with the custom Next.js + Supabase CRM so that door access is controlled by real-time membership status.
**Scope:** Hardware description, communication flow, database schema, API endpoints, suggested code, security, testing, and deployment.

---

## 1. Hardware Overview (What We Have)

### Installed Hardware
- **QR Scanner** (Chinese multi-protocol reader – Wiegand 26/34 output)
- **TTGO T-Display V1.1 ESP32** (brain – listens for Wiegand signals, has WiFi + small screen for debug)
- **4-Channel 12V Relay Module** (Channel 1 used to open the door lock)
- **Dupont jumper cables** (connections)
- **Existing grey Club Planner box** (reused as enclosure + 12V power source)

### Current Wiring (Parallel Test on Second Scanner)
| Scanner Wire | Typical Color | Connected to TTGO Pin |
|--------------|---------------|-----------------------|
| +12V         | Red           | VIN                   |
| GND          | Black         | GND (next to VIN)     |
| D0           | Green         | GPIO 18               |
| D1           | White         | GPIO 19               |
| Relay control| -             | GPIO 21 → IN1 on relay|

Relay output (COM + NO) → door lock wires (or buzzer/LED for testing).

### ESP32 Firmware Behaviour
- Listens on GPIO 18/19 for Wiegand data
- Extracts QR code string (e.g., a JWT or UUID)
- Sends HTTP POST to CRM API endpoint `/api/door/validate`
- Payload: `{ "qr": "abc123xyz" }`
- If API returns `{ "allowed": true }` → pulls GPIO 21 LOW for 800ms → relay clicks → door opens
- On screen: shows WiFi status, last QR, result

---

## 2. Communication Flow

```
Member scans QR on phone
        ↓
QR Scanner → Wiegand signal → TTGO ESP32
        ↓
ESP32 → HTTP POST → CRM API /api/door/validate
        ↓
CRM checks Supabase: is member active + paid?
        ↓
API returns { allowed: true/false }
        ↓
ESP32 triggers relay → door opens/denied
        ↓
CRM logs access attempt (success/failure, timestamp, member_id)
```

---

## 3. Database Schema (Supabase PostgreSQL)

Add these tables/columns to existing schema.

```sql
-- Members table (extend existing)
ALTER TABLE members ADD COLUMN IF NOT EXISTS qr_token TEXT UNIQUE;  -- JWT or UUID, regenerated periodically
ALTER TABLE members ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';  -- 'active', 'paused', 'expired', 'cancelled'
ALTER TABLE members ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Access logs
CREATE TABLE IF NOT EXISTS door_access_logs (
  id BIGSERIAL PRIMARY KEY,
  member_id BIGINT REFERENCES members(id),
  qr_token TEXT,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  allowed BOOLEAN NOT NULL,
  door_location TEXT DEFAULT 'main'  -- for future multi-door
);

-- Optional: Door hardware table (for multi-location gyms)
CREATE TABLE IF NOT EXISTS doors (
  id SERIAL PRIMARY KEY,
  name TEXT,
  esp32_ip TEXT,  -- if needed for push instead of poll
  last_seen TIMESTAMPTZ
);
```

### QR Token Strategy
- Use short-lived JWT (e.g., 5-15 minutes expiry) or UUID regenerated daily.
- Store in `qr_token` column.
- In member PWA/app: fetch fresh token on load.

---

## 4. CRM API Endpoints (Supabase Edge Functions)

> **Note:** This CRM uses Vite + React (not Next.js), so we use Supabase Edge Functions instead of Next.js API routes.

### 4.1 Generate QR Token (called by member app/PWA)

File: `supabase/functions/door-token/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { create, verify } from "https://deno.land/x/djwt@v2.8/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const JWT_SECRET = Deno.env.get('DOOR_JWT_SECRET')!

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { member_id } = await req.json()

    // Check member has active subscription
    const { data: member } = await supabase
      .from('members')
      .select('id, status')
      .eq('id', member_id)
      .single()

    if (!member || member.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Inactive subscription' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check for active subscription
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
      return new Response(
        JSON.stringify({ error: 'No active subscription' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate JWT token (15 min expiry)
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    )

    const token = await create(
      { alg: "HS256", typ: "JWT" },
      {
        member_id: member.id,
        exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
      },
      key
    )

    // Store token in members table
    await supabase
      .from('members')
      .update({ qr_token: token })
      .eq('id', member_id)

    return new Response(
      JSON.stringify({ qr_token: token }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### 4.2 Validate QR (called by ESP32)

File: `supabase/functions/door-validate/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { verify } from "https://deno.land/x/djwt@v2.8/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const JWT_SECRET = Deno.env.get('DOOR_JWT_SECRET')!

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    const { qr } = await req.json()

    // Verify JWT
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    )

    const payload = await verify(qr, key)
    const member_id = payload.member_id as string

    // Check member exists and token matches
    const { data: member } = await supabase
      .from('members')
      .select('id, status, qr_token, first_name, last_name')
      .eq('id', member_id)
      .single()

    // Validate
    const isValid = member &&
      member.qr_token === qr &&
      member.status === 'active'

    // Check active subscription
    let hasActiveSubscription = false
    if (isValid) {
      const { data: subscription } = await supabase
        .from('member_subscriptions')
        .select('id')
        .eq('member_id', member_id)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString().split('T')[0])
        .limit(1)
        .single()

      hasActiveSubscription = !!subscription
    }

    const allowed = isValid && hasActiveSubscription

    // Log access attempt
    await supabase.from('door_access_logs').insert({
      member_id: allowed ? member.id : null,
      qr_token: qr.substring(0, 50), // truncate for storage
      allowed,
      door_location: 'main'
    })

    // Update last check-in if allowed
    if (allowed) {
      await supabase
        .from('members')
        .update({ last_checkin_at: new Date().toISOString() })
        .eq('id', member_id)
    }

    return new Response(
      JSON.stringify({
        allowed,
        member_name: allowed ? `${member.first_name} ${member.last_name}` : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    // Log failed attempt
    const { qr } = await req.json().catch(() => ({ qr: 'unknown' }))

    await supabase.from('door_access_logs').insert({
      qr_token: typeof qr === 'string' ? qr.substring(0, 50) : 'invalid',
      allowed: false,
      door_location: 'main'
    })

    return new Response(
      JSON.stringify({ allowed: false }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

---

## 5. Member PWA / App Integration

In the member dashboard or home screen:

```tsx
import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

export function DoorAccessQR({ memberId }: { memberId: string }) {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchQR = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/door-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ member_id: memberId })
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to generate QR')
        }

        const { qr_token } = await res.json()
        setQrCode(qr_token)
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchQR()
    const interval = setInterval(fetchQR, 10 * 60 * 1000) // refresh every 10 min
    return () => clearInterval(interval)
  }, [memberId])

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-500">{error}</div>
  if (!qrCode) return null

  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-2xl">
      <QRCodeSVG value={qrCode} size={256} />
      <p className="mt-4 text-sm text-gray-500">
        Scan bij de ingang om binnen te komen
      </p>
    </div>
  )
}
```

---

## 6. ESP32 Firmware Update (When Ready for Production)

Replace test server URL with production:

```cpp
const String apiUrl = "https://wiuzjpoizxeycrshsuqn.supabase.co/functions/v1/door-validate";
```

Add HTTPS fingerprint or certificate verification for security.

---

## 7. Security Best Practices

1. **Use HTTPS everywhere** (Vercel/Supabase provide it).
2. **Rate-limit** `/functions/v1/door-validate` (e.g., Supabase edge functions or middleware).
3. **Short token expiry** (5-15 min).
4. **Log all attempts** (already in schema).
5. **Row Level Security** in Supabase for all tables.
6. **API key or IP whitelist** for ESP32 if paranoid.

---

## 8. Testing Plan

1. **Local test** – use `node server.js` dummy server (already done).
2. **CRM test** – implement `/functions/v1/door-validate` → test with Postman + real member.
3. **Full flow** – member app generates QR → scan → door opens.
4. **Edge cases** – expired subscription, wrong QR, offline ESP32.

---

## 9. Admin Dashboard Features

### Access Logs Page
- View all door access attempts
- Filter by date, member, success/failure
- Export to CSV

### Real-time Monitor
- Live feed of door access events
- Supabase Realtime subscription

### Member Access Status
- Show on MemberDetail page: last access, access enabled/disabled
- Manual override to block/allow specific members

---

## 10. Future Enhancements

- **Multiple doors** → add `door_id` in payload.
- **Push notifications** (Supabase Realtime) when access denied.
- **BLE fallback** (phone opens door via Bluetooth).
- **Integration with social platform** (same `member_id`).
- **Offline mode** – ESP32 caches last 100 valid member IDs for network outage.

---

## 11. Implementation Checklist

- [ ] Database migration: add `qr_token` column to members
- [ ] Database migration: create `door_access_logs` table
- [ ] Deploy `door-token` Edge Function
- [ ] Deploy `door-validate` Edge Function
- [ ] Set `DOOR_JWT_SECRET` in Supabase secrets
- [ ] Create Member QR component for PWA/app
- [ ] Update ESP32 firmware with production URL
- [ ] Test full flow with real hardware
- [ ] Add Access Logs page to admin dashboard
- [ ] Add access status to MemberDetail page

---

*End of Specification*

This document can be used by any AI agent or developer to implement the full software side with confidence.
