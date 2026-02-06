-- Short-lived numeric door tokens for Wiegand QR scanner compatibility
-- Replaces JWT-based QR tokens (Wiegand scanners truncate JWTs to 26-bit card codes)

CREATE TABLE IF NOT EXISTS door_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  token_code VARCHAR(20) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(token_code)
);

CREATE INDEX idx_door_tokens_code ON door_tokens(token_code);
CREATE INDEX idx_door_tokens_member ON door_tokens(member_id);
CREATE INDEX idx_door_tokens_expires ON door_tokens(expires_at);

-- RLS: USING(true) pattern (Edge Functions use SERVICE_ROLE_KEY)
ALTER TABLE door_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "door_tokens_all" ON door_tokens
  FOR ALL USING (true);

-- Cleanup function: remove expired tokens (called periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_door_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM door_tokens WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
