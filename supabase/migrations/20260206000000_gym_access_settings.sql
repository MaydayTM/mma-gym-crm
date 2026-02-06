-- Gym access settings: configurable door access rules
-- Access modes:
--   subscription_only: any active subscription grants access (current behavior)
--   reservation_required: must have a reservation for a class within the time window
--   open_gym: access during configured open gym hours (+ subscription required)

CREATE TABLE IF NOT EXISTS gym_access_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'reconnect-academy',

  -- Access mode
  access_mode TEXT NOT NULL DEFAULT 'subscription_only'
    CHECK (access_mode IN ('subscription_only', 'reservation_required', 'open_gym')),

  -- Time windows for reservation_required mode
  minutes_before_class INTEGER NOT NULL DEFAULT 30,
  grace_period_minutes INTEGER NOT NULL DEFAULT 10,

  -- Open gym hours (for open_gym mode)
  -- Stored as JSONB array of { day: 0-6 (Sun-Sat), open: "HH:MM", close: "HH:MM" }
  open_gym_hours JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Team roles always have access (informational, enforced in code)
  team_roles_bypass BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One settings row per tenant
  UNIQUE(tenant_id)
);

-- Insert default settings for Reconnect Academy
INSERT INTO gym_access_settings (tenant_id, access_mode, minutes_before_class, grace_period_minutes, open_gym_hours)
VALUES (
  'reconnect-academy',
  'subscription_only',
  30,
  10,
  '[
    {"day": 1, "open": "08:00", "close": "22:00"},
    {"day": 2, "open": "08:00", "close": "22:00"},
    {"day": 3, "open": "08:00", "close": "22:00"},
    {"day": 4, "open": "08:00", "close": "22:00"},
    {"day": 5, "open": "08:00", "close": "22:00"},
    {"day": 6, "open": "09:00", "close": "18:00"},
    {"day": 0, "open": "09:00", "close": "14:00"}
  ]'::jsonb
)
ON CONFLICT (tenant_id) DO NOTHING;

-- RLS: use USING(true) pattern (app-layer role checks avoid recursion)
ALTER TABLE gym_access_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gym_access_settings_read" ON gym_access_settings
  FOR SELECT USING (true);

CREATE POLICY "gym_access_settings_write" ON gym_access_settings
  FOR ALL USING (true);
