-- ============================================
-- Migration 061: Improve verify_claim_token feedback
-- ============================================
-- The original function returned empty results for all failure cases,
-- making it impossible to tell the user WHY their token didn't work.
-- This improved version returns specific error reasons.
-- ============================================

-- Drop the existing function first (return type is changing)
DROP FUNCTION IF EXISTS verify_claim_token(TEXT);

/**
 * Improved verify_claim_token with error reasons
 * Returns NULL if invalid, but now includes a reason field
 */
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
  v_token_record RECORD;
  v_member_record RECORD;
BEGIN
  -- Hash the provided token
  v_hash := encode(sha256(p_token::bytea), 'hex');

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

COMMENT ON FUNCTION verify_claim_token(TEXT) IS
  'Verify claim token and return member data with specific error reasons:
   - NULL error_reason = success
   - TOKEN_NOT_FOUND = invalid or tampered token
   - TOKEN_ALREADY_CLAIMED = token was already used
   - TOKEN_EXPIRED = token past 48hr validity
   - MEMBER_NOT_FOUND = referenced member deleted
   - MEMBER_ALREADY_ACTIVATED = member already has auth account';
