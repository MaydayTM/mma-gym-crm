-- ===========================================
-- Fix Duplicate Detection Functions
-- ===========================================
-- Migratie: 025_fix_duplicate_functions.sql
-- Doel: Fix type mismatches en ambiguous column references

-- Drop en recreate check_import_duplicates met correcte types
DROP FUNCTION IF EXISTS check_import_duplicates(TEXT[], TEXT[], TEXT[]);

CREATE OR REPLACE FUNCTION check_import_duplicates(
  p_emails TEXT[],
  p_phones TEXT[],
  p_names TEXT[]  -- Format: 'firstname|lastname|birthdate'
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
    array_position(p_emails, LOWER(m.email))::INTEGER as input_index,
    m.id as existing_member_id,
    'email'::TEXT as match_type,
    100 as confidence,
    m.first_name as existing_first_name,
    m.last_name as existing_last_name,
    m.email as existing_email
  FROM members m
  WHERE LOWER(m.email) = ANY(SELECT LOWER(unnest) FROM unnest(p_emails));

  -- Check phone matches (alleen als email niet al matched)
  RETURN QUERY
  SELECT
    array_position(p_phones, regexp_replace(m.phone, '[^0-9]', '', 'g'))::INTEGER as input_index,
    m.id as existing_member_id,
    'phone'::TEXT as match_type,
    80 as confidence,
    m.first_name as existing_first_name,
    m.last_name as existing_last_name,
    m.email as existing_email
  FROM members m
  WHERE m.phone IS NOT NULL
    AND regexp_replace(m.phone, '[^0-9]', '', 'g') = ANY(
      SELECT regexp_replace(unnest, '[^0-9]', '', 'g') FROM unnest(p_phones)
    )
    AND LOWER(m.email) NOT IN (SELECT LOWER(unnest) FROM unnest(p_emails) WHERE unnest IS NOT NULL);
END;
$$ LANGUAGE plpgsql;

-- Drop en recreate find_duplicate_members met gefixte variable namen
DROP FUNCTION IF EXISTS find_duplicate_members();

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
DECLARE
  v_group_counter INTEGER := 0;
  v_max_group INTEGER := 0;
BEGIN
  -- Tijdelijke tabel voor resultaten
  DROP TABLE IF EXISTS temp_duplicates;
  CREATE TEMP TABLE temp_duplicates (
    grp_id INTEGER,
    mbr_id UUID,
    mtype TEXT,
    conf INTEGER,
    fname VARCHAR(255),
    lname VARCHAR(255),
    eml VARCHAR(255),
    phn VARCHAR(50),
    has_sub BOOLEAN,
    tot_checkins INTEGER,
    prof_complete INTEGER,
    crt_at TIMESTAMPTZ,
    is_master BOOLEAN DEFAULT false
  );

  -- 1. Exacte email duplicaten (100% confidence)
  WITH email_groups AS (
    SELECT LOWER(m.email) as email_lower, MIN(m.id) as first_id
    FROM members m
    WHERE m.email IS NOT NULL AND m.email != ''
    GROUP BY LOWER(m.email)
    HAVING COUNT(*) > 1
  ),
  numbered_groups AS (
    SELECT email_lower, row_number() OVER () as grp_num
    FROM email_groups
  )
  INSERT INTO temp_duplicates (grp_id, mbr_id, mtype, conf, fname, lname, eml, phn, has_sub, tot_checkins, prof_complete, crt_at)
  SELECT
    ng.grp_num::INTEGER,
    m.id,
    'email',
    100,
    m.first_name,
    m.last_name,
    m.email,
    m.phone,
    EXISTS(SELECT 1 FROM subscriptions s WHERE s.member_id = m.id AND s.status = 'active'),
    COALESCE(m.total_checkins, 0),
    (
      CASE WHEN m.first_name IS NOT NULL AND m.first_name != '' THEN 10 ELSE 0 END +
      CASE WHEN m.last_name IS NOT NULL AND m.last_name != '' THEN 10 ELSE 0 END +
      CASE WHEN m.email IS NOT NULL AND m.email != '' THEN 15 ELSE 0 END +
      CASE WHEN m.phone IS NOT NULL AND m.phone != '' THEN 15 ELSE 0 END +
      CASE WHEN m.birth_date IS NOT NULL THEN 10 ELSE 0 END +
      CASE WHEN m.street IS NOT NULL AND m.street != '' THEN 10 ELSE 0 END +
      CASE WHEN m.city IS NOT NULL AND m.city != '' THEN 10 ELSE 0 END +
      CASE WHEN m.profile_picture_url IS NOT NULL THEN 10 ELSE 0 END
    ),
    m.created_at
  FROM members m
  JOIN numbered_groups ng ON LOWER(m.email) = ng.email_lower;

  -- Get max group for next batch
  SELECT COALESCE(MAX(grp_id), 0) INTO v_max_group FROM temp_duplicates;

  -- 2. Zelfde telefoon + achternaam (90% confidence)
  WITH phone_groups AS (
    SELECT LOWER(m.last_name) as lname, regexp_replace(m.phone, '[^0-9]', '', 'g') as phone_clean
    FROM members m
    WHERE m.phone IS NOT NULL AND m.phone != ''
      AND m.last_name IS NOT NULL AND m.last_name != ''
      AND m.id NOT IN (SELECT mbr_id FROM temp_duplicates)
    GROUP BY LOWER(m.last_name), regexp_replace(m.phone, '[^0-9]', '', 'g')
    HAVING COUNT(*) > 1
  ),
  numbered_phone AS (
    SELECT lname, phone_clean, v_max_group + row_number() OVER () as grp_num
    FROM phone_groups
  )
  INSERT INTO temp_duplicates (grp_id, mbr_id, mtype, conf, fname, lname, eml, phn, has_sub, tot_checkins, prof_complete, crt_at)
  SELECT
    np.grp_num::INTEGER,
    m.id,
    'phone_lastname',
    90,
    m.first_name,
    m.last_name,
    m.email,
    m.phone,
    EXISTS(SELECT 1 FROM subscriptions s WHERE s.member_id = m.id AND s.status = 'active'),
    COALESCE(m.total_checkins, 0),
    (
      CASE WHEN m.first_name IS NOT NULL AND m.first_name != '' THEN 10 ELSE 0 END +
      CASE WHEN m.last_name IS NOT NULL AND m.last_name != '' THEN 10 ELSE 0 END +
      CASE WHEN m.email IS NOT NULL AND m.email != '' THEN 15 ELSE 0 END +
      CASE WHEN m.phone IS NOT NULL AND m.phone != '' THEN 15 ELSE 0 END +
      CASE WHEN m.birth_date IS NOT NULL THEN 10 ELSE 0 END +
      CASE WHEN m.street IS NOT NULL AND m.street != '' THEN 10 ELSE 0 END +
      CASE WHEN m.city IS NOT NULL AND m.city != '' THEN 10 ELSE 0 END +
      CASE WHEN m.profile_picture_url IS NOT NULL THEN 10 ELSE 0 END
    ),
    m.created_at
  FROM members m
  JOIN numbered_phone np ON LOWER(m.last_name) = np.lname
    AND regexp_replace(m.phone, '[^0-9]', '', 'g') = np.phone_clean
  WHERE m.id NOT IN (SELECT mbr_id FROM temp_duplicates);

  -- Markeer aanbevolen master per groep
  UPDATE temp_duplicates t1
  SET is_master = true
  WHERE t1.mbr_id = (
    SELECT t2.mbr_id
    FROM temp_duplicates t2
    WHERE t2.grp_id = t1.grp_id
    ORDER BY
      t2.has_sub DESC,
      t2.tot_checkins DESC,
      t2.prof_complete DESC,
      t2.crt_at ASC
    LIMIT 1
  );

  -- Return resultaten met originele kolomnamen
  RETURN QUERY
  SELECT
    grp_id as group_id,
    mbr_id as member_id,
    mtype as match_type,
    conf as confidence,
    fname as first_name,
    lname as last_name,
    eml as email,
    phn as phone,
    has_sub as has_subscription,
    tot_checkins as total_checkins,
    prof_complete as profile_completeness,
    crt_at as created_at,
    is_master as is_recommended_master
  FROM temp_duplicates
  ORDER BY grp_id, is_master DESC, crt_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION find_duplicate_members() TO authenticated;
GRANT EXECUTE ON FUNCTION check_import_duplicates(TEXT[], TEXT[], TEXT[]) TO authenticated;
