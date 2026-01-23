-- ============================================
-- Migration 057: Account Claim Tokens
-- ============================================
-- Allows imported ClubPlanner members to claim their accounts
-- by receiving an email with a secure activation link.
-- ============================================

-- Drop existing objects if they exist (for re-runs)
DROP TABLE IF EXISTS account_claim_tokens CASCADE;
DROP FUNCTION IF EXISTS create_claim_token CASCADE;
DROP FUNCTION IF EXISTS verify_claim_token CASCADE;
DROP FUNCTION IF EXISTS mark_token_claimed CASCADE;

-- ============================================
-- ACCOUNT CLAIM TOKENS TABLE
-- ============================================

CREATE TABLE account_claim_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Member reference
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  -- Token security (we store hash, send plaintext once)
  token_hash TEXT NOT NULL,

  -- Email the token was sent to (for audit)
  email TEXT NOT NULL,

  -- Expiration (48 hours from creation)
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Claim tracking
  claimed_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Indexes for performance
CREATE INDEX idx_claim_tokens_member ON account_claim_tokens(member_id);
CREATE INDEX idx_claim_tokens_hash ON account_claim_tokens(token_hash);
CREATE INDEX idx_claim_tokens_expires ON account_claim_tokens(expires_at)
  WHERE claimed_at IS NULL;

-- Comments
COMMENT ON TABLE account_claim_tokens IS 'Secure tokens for ClubPlanner members to claim their accounts';
COMMENT ON COLUMN account_claim_tokens.token_hash IS 'SHA256 hash of the token - plaintext is sent via email once';
COMMENT ON COLUMN account_claim_tokens.expires_at IS 'Token expires 48 hours after creation';

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE account_claim_tokens ENABLE ROW LEVEL SECURITY;

-- No user-facing policies - only Edge Functions with service_role can access
-- This prevents users from enumerating or manipulating tokens

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

/**
 * Create a new claim token for a member
 * Returns the plaintext token (only time it's available)
 * Automatically invalidates any existing tokens for this member
 */
CREATE OR REPLACE FUNCTION create_claim_token(
  p_member_id UUID,
  p_email TEXT,
  p_expires_hours INTEGER DEFAULT 48
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token TEXT;
  v_hash TEXT;
BEGIN
  -- Generate a secure random token (32 bytes = 256 bits, base64 encoded)
  v_token := encode(gen_random_bytes(32), 'base64');

  -- Remove characters that might cause URL issues
  v_token := replace(replace(v_token, '+', '-'), '/', '_');

  -- Hash the token for storage
  v_hash := encode(sha256(v_token::bytea), 'hex');

  -- Invalidate any existing unclaimed tokens for this member
  DELETE FROM account_claim_tokens
  WHERE member_id = p_member_id
    AND claimed_at IS NULL;

  -- Insert the new token
  INSERT INTO account_claim_tokens (
    member_id,
    token_hash,
    email,
    expires_at
  ) VALUES (
    p_member_id,
    v_hash,
    p_email,
    NOW() + (p_expires_hours || ' hours')::interval
  );

  -- Return the plaintext token (only time it's available)
  RETURN v_token;
END;
$$;

/**
 * Verify a claim token and return member data
 * Returns NULL if invalid/expired/claimed
 */
CREATE OR REPLACE FUNCTION verify_claim_token(p_token TEXT)
RETURNS TABLE (
  token_id UUID,
  member_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  member_number INTEGER,
  profile_picture_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash TEXT;
BEGIN
  -- Hash the provided token
  v_hash := encode(sha256(p_token::bytea), 'hex');

  -- Find matching valid token and return member data
  RETURN QUERY
  SELECT
    ct.id as token_id,
    m.id as member_id,
    m.first_name::TEXT,
    m.last_name::TEXT,
    m.email::TEXT,
    m.clubplanner_member_nr as member_number,
    m.profile_picture_url::TEXT
  FROM account_claim_tokens ct
  JOIN members m ON m.id = ct.member_id
  WHERE ct.token_hash = v_hash
    AND ct.expires_at > NOW()
    AND ct.claimed_at IS NULL
    AND m.auth_user_id IS NULL;  -- Member hasn't claimed yet
END;
$$;

/**
 * Mark a token as claimed after successful account activation
 */
CREATE OR REPLACE FUNCTION mark_token_claimed(p_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash TEXT;
  v_updated INTEGER;
BEGIN
  -- Hash the provided token
  v_hash := encode(sha256(p_token::bytea), 'hex');

  -- Mark as claimed
  UPDATE account_claim_tokens
  SET claimed_at = NOW()
  WHERE token_hash = v_hash
    AND claimed_at IS NULL;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  RETURN v_updated > 0;
END;
$$;

/**
 * Find member by email or member number (for public claim request)
 * Returns limited data to prevent enumeration
 */
CREATE OR REPLACE FUNCTION find_member_for_claim(p_identifier TEXT)
RETURNS TABLE (
  member_id UUID,
  email TEXT,
  first_name TEXT,
  can_claim BOOLEAN,
  reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member RECORD;
  v_member_nr INTEGER;
BEGIN
  -- Try to parse as member number first
  BEGIN
    v_member_nr := p_identifier::INTEGER;
  EXCEPTION WHEN OTHERS THEN
    v_member_nr := NULL;
  END;

  -- Find member by email or member number
  SELECT m.id, m.email, m.first_name, m.auth_user_id
  INTO v_member
  FROM members m
  WHERE (
    LOWER(m.email) = LOWER(p_identifier)
    OR m.clubplanner_member_nr = v_member_nr
  )
  AND m.status IN ('active', 'frozen')  -- Only active/frozen members can claim
  LIMIT 1;

  -- No member found
  IF v_member IS NULL THEN
    RETURN;  -- Return empty - don't reveal if member exists
  END IF;

  -- Check if already claimed
  IF v_member.auth_user_id IS NOT NULL THEN
    member_id := v_member.id;
    email := v_member.email;
    first_name := v_member.first_name;
    can_claim := FALSE;
    reason := 'Account is al geactiveerd. Probeer in te loggen of gebruik wachtwoord vergeten.';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Can claim
  member_id := v_member.id;
  email := v_member.email;
  first_name := v_member.first_name;
  can_claim := TRUE;
  reason := NULL;
  RETURN NEXT;
END;
$$;

-- ============================================
-- CLEANUP FUNCTION (for cron job)
-- ============================================

/**
 * Remove expired unclaimed tokens (older than 7 days)
 * Run via pg_cron weekly
 */
CREATE OR REPLACE FUNCTION cleanup_expired_claim_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM account_claim_tokens
  WHERE expires_at < NOW() - INTERVAL '7 days'
    AND claimed_at IS NULL;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- ============================================
-- STATISTICS VIEW
-- ============================================

CREATE OR REPLACE VIEW claim_account_stats AS
SELECT
  -- Total imported members without auth
  (SELECT COUNT(*) FROM members WHERE auth_user_id IS NULL AND status = 'active') as unclaimed_members,

  -- Pending tokens (sent but not claimed)
  (SELECT COUNT(*) FROM account_claim_tokens WHERE claimed_at IS NULL AND expires_at > NOW()) as pending_tokens,

  -- Expired tokens (sent but never claimed)
  (SELECT COUNT(*) FROM account_claim_tokens WHERE claimed_at IS NULL AND expires_at <= NOW()) as expired_tokens,

  -- Claimed accounts (via this system)
  (SELECT COUNT(*) FROM account_claim_tokens WHERE claimed_at IS NOT NULL) as claimed_accounts,

  -- Members with auth (all - includes manual creates)
  (SELECT COUNT(*) FROM members WHERE auth_user_id IS NOT NULL) as total_active_accounts;

COMMENT ON VIEW claim_account_stats IS 'Statistics for member onboarding/claim flow';

-- Grant access to the view for authenticated users (staff will filter via RLS on underlying data)
GRANT SELECT ON claim_account_stats TO authenticated;
