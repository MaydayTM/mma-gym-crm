-- ===========================================
-- SECURITY FIXES - Critical Vulnerabilities
-- ===========================================
-- Migratie: 056_security_fixes.sql
-- Datum: 23 januari 2026
--
-- FIXES:
-- 1. Members role escalation vulnerability (users kunnen zichzelf tot admin promoveren)
-- 2. Shop policies te breed (alle authenticated users kunnen producten beheren)
-- 3. QR tokens niet gehasht (plaintext opgeslagen)
-- ===========================================

-- ===========================================
-- FIX 1: MEMBERS ROLE ESCALATION
-- ===========================================
-- Probleem: "Authenticated users can update members" policy laat IEDEREEN
-- alle velden wijzigen, inclusief 'role'. Een fighter kan zichzelf admin maken.
--
-- Oplossing: Aparte policies voor:
-- A) Eigen profiel wijzigen (beperkte velden, geen role)
-- B) Admin/medewerker kunnen alles wijzigen
-- ===========================================

-- Drop de te brede policy
DROP POLICY IF EXISTS "Authenticated users can update members" ON public.members;

-- Policy A: Users kunnen hun EIGEN profiel updaten (beperkte velden)
-- Note: We gebruiken een trigger om role wijzigingen te blokkeren voor non-admins
DROP POLICY IF EXISTS "Users can update own profile" ON public.members;
CREATE POLICY "Users can update own profile"
  ON public.members
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Policy B: Staff (admin/medewerker) kunnen ALLE members updaten
DROP POLICY IF EXISTS "Staff can update any member" ON public.members;
CREATE POLICY "Staff can update any member"
  ON public.members
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid()
      AND m.role IN ('admin', 'medewerker')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid()
      AND m.role IN ('admin', 'medewerker')
    )
  );

-- Trigger functie om role escalation te voorkomen
-- Alleen admin kan roles wijzigen
CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS TRIGGER AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Als role niet wijzigt, sta de update toe
  IF OLD.role = NEW.role THEN
    RETURN NEW;
  END IF;

  -- Haal de role op van de huidige gebruiker
  SELECT role INTO current_user_role
  FROM members
  WHERE id = auth.uid();

  -- Alleen admin mag roles wijzigen
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can change member roles. Your role: %', current_user_role;
  END IF;

  -- Admin probeert zichzelf te degraderen? Waarschuwing maar sta toe
  IF OLD.id = auth.uid() AND NEW.role != 'admin' THEN
    RAISE NOTICE 'Warning: Admin is demoting themselves from admin to %', NEW.role;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop bestaande trigger als die bestaat
DROP TRIGGER IF EXISTS check_role_escalation ON members;

-- Maak de trigger aan
CREATE TRIGGER check_role_escalation
  BEFORE UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_escalation();

-- ===========================================
-- FIX 2: SHOP POLICIES TE BREED
-- ===========================================
-- Probleem: Migration 036 maakte "Authenticated can X products" policies
-- die ALLE ingelogde users (ook fighters) toestaan producten te beheren.
--
-- Oplossing: Vervang door role-based policies (alleen admin/medewerker)
-- ===========================================

-- Drop de te brede policies op products
DROP POLICY IF EXISTS "Authenticated can insert products" ON products;
DROP POLICY IF EXISTS "Authenticated can update products" ON products;
DROP POLICY IF EXISTS "Authenticated can delete products" ON products;

-- Nieuwe restrictieve policies voor products
CREATE POLICY "Staff can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid()
      AND m.role IN ('admin', 'medewerker')
    )
  );

CREATE POLICY "Staff can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid()
      AND m.role IN ('admin', 'medewerker')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid()
      AND m.role IN ('admin', 'medewerker')
    )
  );

CREATE POLICY "Staff can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid()
      AND m.role IN ('admin', 'medewerker')
    )
  );

-- Drop de te brede policies op product_variants
DROP POLICY IF EXISTS "Authenticated can insert product_variants" ON product_variants;
DROP POLICY IF EXISTS "Authenticated can update product_variants" ON product_variants;
DROP POLICY IF EXISTS "Authenticated can delete product_variants" ON product_variants;

-- Nieuwe restrictieve policies voor product_variants
CREATE POLICY "Staff can insert product_variants"
  ON product_variants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid()
      AND m.role IN ('admin', 'medewerker')
    )
  );

CREATE POLICY "Staff can update product_variants"
  ON product_variants FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid()
      AND m.role IN ('admin', 'medewerker')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid()
      AND m.role IN ('admin', 'medewerker')
    )
  );

CREATE POLICY "Staff can delete product_variants"
  ON product_variants FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid()
      AND m.role IN ('admin', 'medewerker')
    )
  );

-- ===========================================
-- FIX 3: QR TOKENS HASHEN
-- ===========================================
-- Probleem: qr_token is plaintext opgeslagen in members tabel.
-- Bij een database breach zijn alle tokens gecompromitteerd.
--
-- Oplossing:
-- A) Voeg qr_token_hash kolom toe
-- B) Maak functie om tokens te hashen bij opslaan
-- C) Maak functie om tokens te valideren
-- D) Hash bestaande tokens
-- ===========================================

-- A) Voeg hash kolom toe (als die nog niet bestaat)
ALTER TABLE members ADD COLUMN IF NOT EXISTS qr_token_hash TEXT;

-- Index voor snelle lookup op hash
CREATE INDEX IF NOT EXISTS idx_members_qr_token_hash
  ON members(qr_token_hash)
  WHERE qr_token_hash IS NOT NULL;

-- B) Functie om QR token te genereren en hashen
-- Geeft plaintext token terug voor display, slaat alleen hash op
CREATE OR REPLACE FUNCTION generate_member_qr_token(p_member_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
  v_hash TEXT;
BEGIN
  -- Genereer random token (URL-safe base64, 32 chars)
  v_token := encode(gen_random_bytes(24), 'base64');
  -- Vervang problematische characters voor URL-safety
  v_token := replace(replace(replace(v_token, '+', '-'), '/', '_'), '=', '');

  -- Hash de token met SHA256
  v_hash := encode(sha256(v_token::bytea), 'hex');

  -- Update member met hash (niet de plaintext token!)
  UPDATE members
  SET qr_token_hash = v_hash,
      qr_token = NULL -- Wis oude plaintext token
  WHERE id = p_member_id;

  -- Return plaintext token EENMALIG voor display aan user
  -- Deze wordt NIET opgeslagen!
  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C) Functie om QR token te valideren
CREATE OR REPLACE FUNCTION validate_qr_token(p_token TEXT)
RETURNS TABLE (
  member_id UUID,
  member_name TEXT,
  is_valid BOOLEAN,
  denial_reason TEXT
) AS $$
DECLARE
  v_hash TEXT;
  v_member RECORD;
BEGIN
  -- Hash de input token
  v_hash := encode(sha256(p_token::bytea), 'hex');

  -- Zoek member met deze hash
  SELECT m.id, m.first_name, m.last_name, m.status, m.door_access_enabled
  INTO v_member
  FROM members m
  WHERE m.qr_token_hash = v_hash;

  -- Geen match gevonden
  IF v_member IS NULL THEN
    RETURN QUERY SELECT
      NULL::UUID,
      NULL::TEXT,
      false,
      'invalid_token'::TEXT;
    RETURN;
  END IF;

  -- Check door access enabled
  IF NOT v_member.door_access_enabled THEN
    RETURN QUERY SELECT
      v_member.id,
      (v_member.first_name || ' ' || v_member.last_name)::TEXT,
      false,
      'access_disabled'::TEXT;
    RETURN;
  END IF;

  -- Check member status
  IF v_member.status != 'active' THEN
    RETURN QUERY SELECT
      v_member.id,
      (v_member.first_name || ' ' || v_member.last_name)::TEXT,
      false,
      'member_inactive'::TEXT;
    RETURN;
  END IF;

  -- Check active subscription
  IF NOT EXISTS (
    SELECT 1 FROM member_subscriptions ms
    WHERE ms.member_id = v_member.id
      AND ms.status = 'active'
      AND ms.end_date >= CURRENT_DATE
  ) THEN
    RETURN QUERY SELECT
      v_member.id,
      (v_member.first_name || ' ' || v_member.last_name)::TEXT,
      false,
      'no_active_subscription'::TEXT;
    RETURN;
  END IF;

  -- Alles OK!
  RETURN QUERY SELECT
    v_member.id,
    (v_member.first_name || ' ' || v_member.last_name)::TEXT,
    true,
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- D) Migreer bestaande plaintext tokens naar hashes
-- Dit verwijdert de plaintext en slaat alleen de hash op
DO $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  UPDATE members
  SET
    qr_token_hash = encode(sha256(qr_token::bytea), 'hex'),
    qr_token = NULL
  WHERE qr_token IS NOT NULL
    AND qr_token_hash IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Migrated % existing QR tokens to hashed format', v_count;
END $$;

-- ===========================================
-- AUDIT LOG: Track security-sensitive changes
-- ===========================================
-- Log role changes for audit trail
CREATE OR REPLACE FUNCTION log_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO activity_log (
      action,
      description,
      member_id,
      performed_by,
      metadata
    ) VALUES (
      'role_change',
      format('Role changed from %s to %s', OLD.role, NEW.role),
      NEW.id,
      auth.uid(),
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role,
        'changed_at', NOW()
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS log_member_role_change ON members;
CREATE TRIGGER log_member_role_change
  AFTER UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION log_role_change();

-- ===========================================
-- DOCUMENTATION
-- ===========================================
COMMENT ON FUNCTION prevent_role_escalation() IS
  'Security: Prevents non-admin users from changing member roles (privilege escalation attack)';

COMMENT ON FUNCTION generate_member_qr_token(UUID) IS
  'Security: Generates QR token, stores ONLY the hash, returns plaintext once for display';

COMMENT ON FUNCTION validate_qr_token(TEXT) IS
  'Security: Validates QR token by comparing hash, never stores plaintext';

COMMENT ON POLICY "Users can update own profile" ON members IS
  'Users can only update their own profile';

COMMENT ON POLICY "Staff can update any member" ON members IS
  'Admin and medewerker can update any member record';

COMMENT ON POLICY "Staff can insert products" ON products IS
  'Only admin and medewerker can add products';

COMMENT ON POLICY "Staff can update products" ON products IS
  'Only admin and medewerker can modify products';

COMMENT ON POLICY "Staff can delete products" ON products IS
  'Only admin and medewerker can delete products';
