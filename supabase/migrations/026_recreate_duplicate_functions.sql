-- ===========================================
-- Recreate Duplicate Detection Functions v3
-- ===========================================
-- Migratie: 026_recreate_duplicate_functions.sql
-- Doel: Clean recreate van functies met correcte types

-- Drop alle versies van de functies
DROP FUNCTION IF EXISTS check_import_duplicates(TEXT[], TEXT[], TEXT[]);
DROP FUNCTION IF EXISTS find_duplicate_members();

-- ===========================================
-- Functie 1: check_import_duplicates
-- ===========================================
-- Check of emails uit de import al bestaan in de database
CREATE OR REPLACE FUNCTION check_import_duplicates(
  p_emails TEXT[]
)
RETURNS TABLE (
  input_index INTEGER,
  existing_member_id UUID,
  match_type TEXT,
  confidence INTEGER,
  existing_first_name TEXT,
  existing_last_name TEXT,
  existing_email TEXT
) AS $$
DECLARE
  i INTEGER;
  email_val TEXT;
BEGIN
  -- Loop door alle input emails
  FOR i IN 1..array_length(p_emails, 1) LOOP
    email_val := LOWER(p_emails[i]);

    -- Skip empty emails
    IF email_val IS NULL OR email_val = '' THEN
      CONTINUE;
    END IF;

    -- Check of email bestaat
    RETURN QUERY
    SELECT
      i AS input_index,
      m.id AS existing_member_id,
      'email'::TEXT AS match_type,
      100 AS confidence,
      m.first_name::TEXT AS existing_first_name,
      m.last_name::TEXT AS existing_last_name,
      m.email::TEXT AS existing_email
    FROM members m
    WHERE LOWER(m.email) = email_val
    LIMIT 1;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- Functie 2: find_duplicate_members
-- ===========================================
-- Vind bestaande leden met dezelfde email
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
  WITH duplicate_email_list AS (
    -- Vind emails die meerdere keren voorkomen
    SELECT LOWER(m.email) AS email_lower
    FROM members m
    WHERE m.email IS NOT NULL AND m.email != ''
    GROUP BY LOWER(m.email)
    HAVING COUNT(*) > 1
  ),
  email_to_group AS (
    -- Wijs een group nummer toe aan elke duplicate email
    SELECT
      del.email_lower,
      ROW_NUMBER() OVER (ORDER BY del.email_lower)::INTEGER AS grp_num
    FROM duplicate_email_list del
  )
  SELECT
    etg.grp_num AS group_id,
    m.id AS member_id,
    'email'::TEXT AS match_type,
    100 AS confidence,
    m.first_name::TEXT AS first_name,
    m.last_name::TEXT AS last_name,
    m.email::TEXT AS email,
    m.phone::TEXT AS phone,
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
    m.created_at AS created_at,
    false AS is_recommended_master
  FROM members m
  INNER JOIN email_to_group etg ON LOWER(m.email) = etg.email_lower
  ORDER BY etg.grp_num, m.created_at;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION find_duplicate_members() TO authenticated;
GRANT EXECUTE ON FUNCTION find_duplicate_members() TO anon;
GRANT EXECUTE ON FUNCTION check_import_duplicates(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION check_import_duplicates(TEXT[]) TO anon;
