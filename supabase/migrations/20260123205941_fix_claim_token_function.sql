-- Fix create_claim_token to use extensions schema for gen_random_bytes
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
  v_token := encode(extensions.gen_random_bytes(32), 'base64');

  -- Remove characters that might cause URL issues
  v_token := replace(replace(v_token, '+', '-'), '/', '_');

  -- Hash the token for storage
  v_hash := extensions.crypt(v_token, extensions.gen_salt('bf'));

  -- Invalidate any existing tokens for this member
  DELETE FROM account_claim_tokens
  WHERE member_id = p_member_id
    AND claimed_at IS NULL;

  -- Insert new token
  INSERT INTO account_claim_tokens (member_id, email, token_hash, expires_at)
  VALUES (
    p_member_id,
    p_email,
    v_hash,
    NOW() + (p_expires_hours || ' hours')::INTERVAL
  );

  -- Return plaintext token (only time it's available)
  RETURN v_token;
END;
$$;
