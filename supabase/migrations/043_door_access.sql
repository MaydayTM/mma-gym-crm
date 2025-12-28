-- Door Access System
-- Adds QR token support and access logging for ESP32-based door control

-- Add qr_token column to members (for door access)
ALTER TABLE members ADD COLUMN IF NOT EXISTS qr_token TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS door_access_enabled BOOLEAN DEFAULT true;

-- Create unique index on qr_token (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_members_qr_token ON members(qr_token) WHERE qr_token IS NOT NULL;

-- Door access logs table
CREATE TABLE IF NOT EXISTS door_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  qr_token_hash TEXT, -- Store hash, not full token for security
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  allowed BOOLEAN NOT NULL,
  denial_reason TEXT, -- 'expired_token', 'no_subscription', 'access_disabled', 'invalid_token'
  door_location TEXT DEFAULT 'main',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_door_access_logs_member ON door_access_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_door_access_logs_scanned_at ON door_access_logs(scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_door_access_logs_allowed ON door_access_logs(allowed);

-- Doors table (for future multi-door support)
CREATE TABLE IF NOT EXISTS doors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  esp32_device_id TEXT UNIQUE, -- Identifier for the ESP32 device
  is_active BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default main door
INSERT INTO doors (name, location, esp32_device_id)
VALUES ('Hoofdingang', 'Voordeur gym', 'esp32-main-door')
ON CONFLICT (esp32_device_id) DO NOTHING;

-- Disable RLS for development (consistent with other tables)
ALTER TABLE door_access_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE doors DISABLE ROW LEVEL SECURITY;

-- Helper function to check if member has door access
CREATE OR REPLACE FUNCTION check_member_door_access(p_member_id UUID)
RETURNS TABLE (
  allowed BOOLEAN,
  member_name TEXT,
  denial_reason TEXT
) AS $$
DECLARE
  v_member RECORD;
  v_subscription RECORD;
BEGIN
  -- Get member
  SELECT id, first_name, last_name, status, door_access_enabled
  INTO v_member
  FROM members
  WHERE id = p_member_id;

  -- Member not found
  IF v_member IS NULL THEN
    RETURN QUERY SELECT false, NULL::TEXT, 'member_not_found'::TEXT;
    RETURN;
  END IF;

  -- Door access disabled for this member
  IF NOT v_member.door_access_enabled THEN
    RETURN QUERY SELECT false, (v_member.first_name || ' ' || v_member.last_name)::TEXT, 'access_disabled'::TEXT;
    RETURN;
  END IF;

  -- Member not active
  IF v_member.status != 'active' THEN
    RETURN QUERY SELECT false, (v_member.first_name || ' ' || v_member.last_name)::TEXT, 'member_inactive'::TEXT;
    RETURN;
  END IF;

  -- Check for active subscription
  SELECT id INTO v_subscription
  FROM member_subscriptions
  WHERE member_id = p_member_id
    AND status = 'active'
    AND end_date >= CURRENT_DATE
  ORDER BY end_date DESC
  LIMIT 1;

  IF v_subscription IS NULL THEN
    RETURN QUERY SELECT false, (v_member.first_name || ' ' || v_member.last_name)::TEXT, 'no_active_subscription'::TEXT;
    RETURN;
  END IF;

  -- All checks passed
  RETURN QUERY SELECT true, (v_member.first_name || ' ' || v_member.last_name)::TEXT, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent access logs for a member
CREATE OR REPLACE FUNCTION get_member_access_logs(p_member_id UUID, p_limit INT DEFAULT 10)
RETURNS TABLE (
  id UUID,
  scanned_at TIMESTAMPTZ,
  allowed BOOLEAN,
  denial_reason TEXT,
  door_location TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dal.id,
    dal.scanned_at,
    dal.allowed,
    dal.denial_reason,
    dal.door_location
  FROM door_access_logs dal
  WHERE dal.member_id = p_member_id
  ORDER BY dal.scanned_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get access statistics
CREATE OR REPLACE FUNCTION get_door_access_stats(p_days INT DEFAULT 7)
RETURNS TABLE (
  total_scans BIGINT,
  successful_scans BIGINT,
  denied_scans BIGINT,
  unique_members BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_scans,
    COUNT(*) FILTER (WHERE allowed = true)::BIGINT as successful_scans,
    COUNT(*) FILTER (WHERE allowed = false)::BIGINT as denied_scans,
    COUNT(DISTINCT member_id) FILTER (WHERE allowed = true)::BIGINT as unique_members
  FROM door_access_logs
  WHERE scanned_at >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
