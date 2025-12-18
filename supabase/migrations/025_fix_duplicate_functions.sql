-- ===========================================
-- Fix Duplicate Detection Functions v2
-- ===========================================
-- Migratie: 025_fix_duplicate_functions.sql
-- Doel: Fix type mismatches en ambiguous column references

-- Drop oude functies
DROP FUNCTION IF EXISTS check_import_duplicates(TEXT[], TEXT[], TEXT[]);
DROP FUNCTION IF EXISTS find_duplicate_members();

-- Simpele check_import_duplicates functie
CREATE OR REPLACE FUNCTION check_import_duplicates(
  p_emails TEXT[],
  p_phones TEXT[],
  p_names TEXT[]
)
RETURNS TABLE (
  input_index INTEGER,
  existing_member_id UUID,
  match_type TEXT,
  confidence INTEGER,
  existing_first_name VARCHAR(255),
  existing_last_name VARCHAR(255),
  existing_email VARCHAR(255)
) AS $$
BEGIN
  -- Check email matches
  RETURN QUERY
  SELECT
    (SELECT i FROM generate_subscripts(p_emails, 1) i WHERE LOWER(p_emails[i]) = LOWER(m.email) LIMIT 1)::INTEGER as input_index,
    m.id as existing_member_id,
    'email'::TEXT as match_type,
    100 as confidence,
    m.first_name as existing_first_name,
    m.last_name as existing_last_name,
    m.email as existing_email
  FROM members m
  WHERE LOWER(m.email) = ANY(SELECT LOWER(e) FROM unnest(p_emails) e WHERE e IS NOT NULL AND e != '');
END;
$$ LANGUAGE plpgsql;

-- Simpele find_duplicate_members functie
CREATE OR REPLACE FUNCTION find_duplicate_members()
RETURNS TABLE (
  group_id INTEGER,
  member_id UUID,
  match_type TEXT,
  confidence INTEGER,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  has_subscription BOOLEAN,
  total_checkins INTEGER,
  profile_completeness INTEGER,
  created_at TIMESTAMPTZ,
  is_recommended_master BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH duplicate_emails AS (
    SELECT LOWER(m.email) as email_lower
    FROM members m
    WHERE m.email IS NOT NULL AND m.email != ''
    GROUP BY LOWER(m.email)
    HAVING COUNT(*) > 1
  ),
  email_groups AS (
    SELECT
      de.email_lower,
      dense_rank() OVER (ORDER BY de.email_lower) as grp
    FROM duplicate_emails de
  )
  SELECT
    eg.grp::INTEGER as group_id,
    m.id as member_id,
    'email'::TEXT as match_type,
    100 as confidence,
    m.first_name,
    m.last_name,
    m.email,
    m.phone,
    EXISTS(SELECT 1 FROM subscriptions s WHERE s.member_id = m.id AND s.status = 'active') as has_subscription,
    COALESCE(m.total_checkins, 0)::INTEGER as total_checkins,
    (
      CASE WHEN m.first_name IS NOT NULL THEN 10 ELSE 0 END +
      CASE WHEN m.last_name IS NOT NULL THEN 10 ELSE 0 END +
      CASE WHEN m.email IS NOT NULL THEN 15 ELSE 0 END +
      CASE WHEN m.phone IS NOT NULL THEN 15 ELSE 0 END +
      CASE WHEN m.birth_date IS NOT NULL THEN 10 ELSE 0 END +
      CASE WHEN m.street IS NOT NULL THEN 10 ELSE 0 END +
      CASE WHEN m.city IS NOT NULL THEN 10 ELSE 0 END
    )::INTEGER as profile_completeness,
    m.created_at,
    false as is_recommended_master
  FROM members m
  JOIN email_groups eg ON LOWER(m.email) = eg.email_lower
  ORDER BY eg.grp, m.created_at;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION find_duplicate_members() TO authenticated;
GRANT EXECUTE ON FUNCTION check_import_duplicates(TEXT[], TEXT[], TEXT[]) TO authenticated;
