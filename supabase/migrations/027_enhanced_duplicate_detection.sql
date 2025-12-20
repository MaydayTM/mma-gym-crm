-- ===========================================
-- Enhanced Duplicate Detection v4
-- ===========================================
-- Migratie: 027_enhanced_duplicate_detection.sql
-- Doel: Detecteer duplicaten op basis van naam EN telefoon, niet alleen email

-- Drop de oude functie
DROP FUNCTION IF EXISTS find_duplicate_members();

-- ===========================================
-- Nieuwe functie: find_duplicate_members
-- ===========================================
-- Detecteert duplicaten op basis van:
-- 1. Exacte naam (first_name + last_name) - 90% confidence
-- 2. Telefoon + achternaam - 95% confidence
-- 3. Exacte email (bestaande logica) - 100% confidence

CREATE OR REPLACE FUNCTION find_duplicate_members()
RETURNS TABLE (
  group_id INTEGER,
  member_id UUID,
  match_type TEXT,
  confidence INTEGER,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  has_subscription BOOLEAN,
  total_checkins INTEGER,
  profile_completeness INTEGER,
  created_at TIMESTAMPTZ,
  is_recommended_master BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH
  -- ===========================================
  -- STAP 1: Duplicaten op exacte naam (voornaam + achternaam)
  -- ===========================================
  duplicate_names AS (
    SELECT
      LOWER(TRIM(m.first_name)) AS fn_lower,
      LOWER(TRIM(m.last_name)) AS ln_lower
    FROM members m
    WHERE m.first_name IS NOT NULL
      AND m.last_name IS NOT NULL
      AND TRIM(m.first_name) != ''
      AND TRIM(m.last_name) != ''
    GROUP BY LOWER(TRIM(m.first_name)), LOWER(TRIM(m.last_name))
    HAVING COUNT(*) > 1
  ),
  name_groups AS (
    SELECT
      dn.fn_lower,
      dn.ln_lower,
      ROW_NUMBER() OVER (ORDER BY dn.ln_lower, dn.fn_lower)::INTEGER AS grp_num
    FROM duplicate_names dn
  ),
  name_duplicates AS (
    SELECT
      ng.grp_num AS group_id,
      m.id AS member_id,
      'exact_name'::TEXT AS match_type,
      90 AS confidence,
      m.first_name::TEXT,
      m.last_name::TEXT,
      m.email::TEXT,
      m.phone::TEXT,
      EXISTS(SELECT 1 FROM subscriptions s WHERE s.member_id = m.id AND s.status = 'active') AS has_subscription,
      COALESCE(m.total_checkins, 0)::INTEGER AS total_checkins,
      (
        CASE WHEN m.first_name IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN m.last_name IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN m.email IS NOT NULL THEN 15 ELSE 0 END +
        CASE WHEN m.phone IS NOT NULL THEN 15 ELSE 0 END +
        CASE WHEN m.birth_date IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN m.street IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN m.city IS NOT NULL THEN 10 ELSE 0 END
      )::INTEGER AS profile_completeness,
      m.created_at
    FROM members m
    INNER JOIN name_groups ng
      ON LOWER(TRIM(m.first_name)) = ng.fn_lower
      AND LOWER(TRIM(m.last_name)) = ng.ln_lower
  ),

  -- ===========================================
  -- STAP 2: Duplicaten op telefoon + achternaam
  -- ===========================================
  duplicate_phone_lastname AS (
    SELECT
      REGEXP_REPLACE(m.phone, '[^0-9]', '', 'g') AS phone_clean,
      LOWER(TRIM(m.last_name)) AS ln_lower
    FROM members m
    WHERE m.phone IS NOT NULL
      AND m.last_name IS NOT NULL
      AND TRIM(m.phone) != ''
      AND TRIM(m.last_name) != ''
      AND LENGTH(REGEXP_REPLACE(m.phone, '[^0-9]', '', 'g')) >= 8
    GROUP BY REGEXP_REPLACE(m.phone, '[^0-9]', '', 'g'), LOWER(TRIM(m.last_name))
    HAVING COUNT(*) > 1
  ),
  phone_groups AS (
    SELECT
      dpl.phone_clean,
      dpl.ln_lower,
      ROW_NUMBER() OVER (ORDER BY dpl.phone_clean, dpl.ln_lower)::INTEGER + 10000 AS grp_num
    FROM duplicate_phone_lastname dpl
  ),
  phone_duplicates AS (
    SELECT
      pg.grp_num AS group_id,
      m.id AS member_id,
      'phone_lastname'::TEXT AS match_type,
      95 AS confidence,
      m.first_name::TEXT,
      m.last_name::TEXT,
      m.email::TEXT,
      m.phone::TEXT,
      EXISTS(SELECT 1 FROM subscriptions s WHERE s.member_id = m.id AND s.status = 'active') AS has_subscription,
      COALESCE(m.total_checkins, 0)::INTEGER AS total_checkins,
      (
        CASE WHEN m.first_name IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN m.last_name IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN m.email IS NOT NULL THEN 15 ELSE 0 END +
        CASE WHEN m.phone IS NOT NULL THEN 15 ELSE 0 END +
        CASE WHEN m.birth_date IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN m.street IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN m.city IS NOT NULL THEN 10 ELSE 0 END
      )::INTEGER AS profile_completeness,
      m.created_at
    FROM members m
    INNER JOIN phone_groups pg
      ON REGEXP_REPLACE(m.phone, '[^0-9]', '', 'g') = pg.phone_clean
      AND LOWER(TRIM(m.last_name)) = pg.ln_lower
  ),

  -- ===========================================
  -- STAP 3: Duplicaten op exacte email (bestaande logica)
  -- ===========================================
  duplicate_emails AS (
    SELECT LOWER(m.email) AS email_lower
    FROM members m
    WHERE m.email IS NOT NULL AND m.email != ''
    GROUP BY LOWER(m.email)
    HAVING COUNT(*) > 1
  ),
  email_groups AS (
    SELECT
      de.email_lower,
      ROW_NUMBER() OVER (ORDER BY de.email_lower)::INTEGER + 20000 AS grp_num
    FROM duplicate_emails de
  ),
  email_duplicates AS (
    SELECT
      eg.grp_num AS group_id,
      m.id AS member_id,
      'email'::TEXT AS match_type,
      100 AS confidence,
      m.first_name::TEXT,
      m.last_name::TEXT,
      m.email::TEXT,
      m.phone::TEXT,
      EXISTS(SELECT 1 FROM subscriptions s WHERE s.member_id = m.id AND s.status = 'active') AS has_subscription,
      COALESCE(m.total_checkins, 0)::INTEGER AS total_checkins,
      (
        CASE WHEN m.first_name IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN m.last_name IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN m.email IS NOT NULL THEN 15 ELSE 0 END +
        CASE WHEN m.phone IS NOT NULL THEN 15 ELSE 0 END +
        CASE WHEN m.birth_date IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN m.street IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN m.city IS NOT NULL THEN 10 ELSE 0 END
      )::INTEGER AS profile_completeness,
      m.created_at
    FROM members m
    INNER JOIN email_groups eg ON LOWER(m.email) = eg.email_lower
  ),

  -- ===========================================
  -- COMBINEER alle duplicaten
  -- ===========================================
  all_duplicates AS (
    SELECT * FROM name_duplicates
    UNION ALL
    SELECT * FROM phone_duplicates
    UNION ALL
    SELECT * FROM email_duplicates
  ),

  -- ===========================================
  -- BEPAAL aanbevolen master per groep
  -- (degene met meeste check-ins, daarna oudste account)
  -- ===========================================
  ranked_members AS (
    SELECT
      ad.*,
      ROW_NUMBER() OVER (
        PARTITION BY ad.group_id
        ORDER BY ad.total_checkins DESC, ad.created_at ASC
      ) AS rank_in_group
    FROM all_duplicates ad
  )

  -- ===========================================
  -- FINAL OUTPUT
  -- ===========================================
  SELECT
    rm.group_id,
    rm.member_id,
    rm.match_type,
    rm.confidence,
    rm.first_name,
    rm.last_name,
    rm.email,
    rm.phone,
    rm.has_subscription,
    rm.total_checkins,
    rm.profile_completeness,
    rm.created_at,
    (rm.rank_in_group = 1) AS is_recommended_master
  FROM ranked_members rm
  ORDER BY rm.confidence DESC, rm.group_id, rm.rank_in_group;

END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION find_duplicate_members() TO authenticated;
GRANT EXECUTE ON FUNCTION find_duplicate_members() TO anon;

-- ===========================================
-- Commentaar
-- ===========================================
-- Deze functie detecteert nu 3 soorten duplicaten:
--
-- 1. exact_name (90% confidence): Zelfde voornaam + achternaam
--    Bijv: "Mehdi Haddad" met verschillende emails
--
-- 2. phone_lastname (95% confidence): Zelfde telefoon + achternaam
--    Bijv: Personen met zelfde telefoon en achternaam maar verschillende voornaam spelling
--
-- 3. email (100% confidence): Exacte email match
--    Bijv: Zelfde email geïmporteerd uit verschillende bronnen
--
-- De "aanbevolen master" is het account met de meeste check-ins.
-- Bij gelijke check-ins wordt het oudste account gekozen.
