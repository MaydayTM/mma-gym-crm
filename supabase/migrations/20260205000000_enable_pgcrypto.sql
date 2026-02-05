-- =============================================
-- Migration: Fix create_claim_token to use extensions.gen_random_bytes
-- =============================================
-- Problem: gen_random_bytes() function exists in 'extensions' schema but
-- create_claim_token has search_path = public, so it can't find it
-- Solution: Update create_claim_token to explicitly use extensions.gen_random_bytes()
-- =============================================

-- Recreate create_claim_token with explicit schema reference
CREATE OR REPLACE FUNCTION create_claim_token(
  p_member_id UUID,
  p_email TEXT,
  p_expires_hours INTEGER DEFAULT 48
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_token TEXT;
  v_hash TEXT;
BEGIN
  -- Generate a secure random token (32 bytes = 256 bits, base64 encoded)
  -- Use extensions.gen_random_bytes explicitly
  v_token := encode(extensions.gen_random_bytes(32), 'base64');

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
  'Creates claim token with URL-safe base64. Uses extensions.gen_random_bytes for random generation and SHA256 for hashing.';
