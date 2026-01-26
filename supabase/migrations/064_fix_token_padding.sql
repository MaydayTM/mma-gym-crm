-- =============================================
-- Migration 064: Fix Token Base64 Padding
-- =============================================
-- Probleem: Base64 tokens bevatten '=' padding karakters
-- die problemen veroorzaken met URL encoding/decoding.
--
-- Oplossing: Verwijder '=' uit tokens voor consistentie.
-- Update zowel create als verify functies.
-- =============================================

-- Update create_claim_token to remove '=' padding
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

  -- Remove characters that might cause URL issues (including '=' padding)
  v_token := replace(replace(replace(v_token, '+', '-'), '/', '_'), '=', '');

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

-- Update verify_claim_token to also strip '=' before hashing
-- (for backwards compatibility with tokens that might have '=' in URL)
CREATE OR REPLACE FUNCTION verify_claim_token(p_token TEXT)
RETURNS TABLE (
  token_id UUID,
  member_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  member_number INTEGER,
  profile_picture_url TEXT,
  error_reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash TEXT;
  v_clean_token TEXT;
  v_token_record RECORD;
  v_member_record RECORD;
BEGIN
  -- Clean the token: remove any '=' padding that might have been added
  v_clean_token := replace(p_token, '=', '');

  -- Hash the cleaned token
  v_hash := encode(sha256(v_clean_token::bytea), 'hex');

  -- Find the token first
  SELECT ct.id, ct.member_id, ct.expires_at, ct.claimed_at
  INTO v_token_record
  FROM account_claim_tokens ct
  WHERE ct.token_hash = v_hash;

  -- Token not found at all
  IF v_token_record IS NULL THEN
    token_id := NULL;
    member_id := NULL;
    first_name := NULL;
    last_name := NULL;
    email := NULL;
    member_number := NULL;
    profile_picture_url := NULL;
    error_reason := 'TOKEN_NOT_FOUND';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Token already claimed
  IF v_token_record.claimed_at IS NOT NULL THEN
    token_id := v_token_record.id;
    member_id := v_token_record.member_id;
    first_name := NULL;
    last_name := NULL;
    email := NULL;
    member_number := NULL;
    profile_picture_url := NULL;
    error_reason := 'TOKEN_ALREADY_CLAIMED';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Token expired
  IF v_token_record.expires_at <= NOW() THEN
    token_id := v_token_record.id;
    member_id := v_token_record.member_id;
    first_name := NULL;
    last_name := NULL;
    email := NULL;
    member_number := NULL;
    profile_picture_url := NULL;
    error_reason := 'TOKEN_EXPIRED';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Get member data
  SELECT m.id, m.first_name, m.last_name, m.email, m.clubplanner_member_nr, m.profile_picture_url, m.auth_user_id
  INTO v_member_record
  FROM members m
  WHERE m.id = v_token_record.member_id;

  -- Member not found (shouldn't happen due to FK, but safety check)
  IF v_member_record IS NULL THEN
    token_id := v_token_record.id;
    member_id := v_token_record.member_id;
    first_name := NULL;
    last_name := NULL;
    email := NULL;
    member_number := NULL;
    profile_picture_url := NULL;
    error_reason := 'MEMBER_NOT_FOUND';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Member already has an account
  IF v_member_record.auth_user_id IS NOT NULL THEN
    token_id := v_token_record.id;
    member_id := v_member_record.id;
    first_name := v_member_record.first_name;
    last_name := v_member_record.last_name;
    email := v_member_record.email;
    member_number := v_member_record.clubplanner_member_nr;
    profile_picture_url := v_member_record.profile_picture_url;
    error_reason := 'MEMBER_ALREADY_ACTIVATED';
    RETURN NEXT;
    RETURN;
  END IF;

  -- SUCCESS - valid token for unclaimed member
  token_id := v_token_record.id;
  member_id := v_member_record.id;
  first_name := v_member_record.first_name;
  last_name := v_member_record.last_name;
  email := v_member_record.email;
  member_number := v_member_record.clubplanner_member_nr;
  profile_picture_url := v_member_record.profile_picture_url;
  error_reason := NULL;  -- NULL means success
  RETURN NEXT;
END;
$$;

-- Also update mark_token_claimed for consistency
CREATE OR REPLACE FUNCTION mark_token_claimed(p_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash TEXT;
  v_clean_token TEXT;
  v_updated INTEGER;
BEGIN
  -- Clean the token: remove any '=' padding
  v_clean_token := replace(p_token, '=', '');

  -- Hash the cleaned token
  v_hash := encode(sha256(v_clean_token::bytea), 'hex');

  -- Mark as claimed
  UPDATE account_claim_tokens
  SET claimed_at = NOW()
  WHERE token_hash = v_hash
    AND claimed_at IS NULL;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  RETURN v_updated > 0;
END;
$$;

COMMENT ON FUNCTION create_claim_token(UUID, TEXT, INTEGER) IS
  'Creates claim token with URL-safe base64 (no +, /, or = characters)';

COMMENT ON FUNCTION verify_claim_token(TEXT) IS
  'Verifies claim token, strips = padding before hashing for consistency';
