-- =============================================
-- Migration: Fix create_claim_token to use SHA256
-- =============================================
-- Problem: Migration 20260123205941 changed create_claim_token to use bcrypt
-- (extensions.crypt), but verify_claim_token still uses SHA256.
-- This mismatch causes "Kon activatietoken niet aanmaken" errors.
--
-- Fix: Restore create_claim_token to use SHA256 (consistent with verify_claim_token
-- from migration 064_fix_token_padding.sql).
-- =============================================

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

  -- Hash the token for storage using SHA256 (must match verify_claim_token)
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

COMMENT ON FUNCTION create_claim_token(UUID, TEXT, INTEGER) IS
  'Creates claim token with URL-safe base64 (no +, /, or = characters). Uses SHA256 hashing consistent with verify_claim_token.';
