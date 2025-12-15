-- ===========================================
-- Duplicate Member Detection System
-- ===========================================
-- Migratie: 024_duplicate_detection.sql
-- Doel: Functies om duplicaat leden te detecteren en samen te voegen

-- Type voor duplicaat resultaten
CREATE TYPE duplicate_match AS (
  member_id UUID,
  match_type TEXT,           -- 'email', 'phone_lastname', 'name_birthdate', 'fuzzy_name'
  confidence INTEGER,        -- 100 = exact match, lager = minder zeker
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  has_subscription BOOLEAN,
  total_checkins INTEGER,
  created_at TIMESTAMPTZ
);

-- Functie om alle duplicaten te vinden
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
DECLARE
  group_counter INTEGER := 0;
BEGIN
  -- Tijdelijke tabel voor resultaten
  CREATE TEMP TABLE IF NOT EXISTS temp_duplicates (
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
    is_recommended_master BOOLEAN DEFAULT false
  ) ON COMMIT DROP;

  -- 1. Exacte email duplicaten (100% confidence)
  FOR group_counter IN
    SELECT row_number() OVER () as rn
    FROM (
      SELECT LOWER(m.email) as email_lower
      FROM members m
      WHERE m.email IS NOT NULL AND m.email != ''
      GROUP BY LOWER(m.email)
      HAVING COUNT(*) > 1
    ) dups
  LOOP
    INSERT INTO temp_duplicates (group_id, member_id, match_type, confidence, first_name, last_name, email, phone, has_subscription, total_checkins, profile_completeness, created_at)
    SELECT
      group_counter,
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
        CASE WHEN m.profile_picture_url IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN m.emergency_contact_name IS NOT NULL THEN 5 ELSE 0 END +
        CASE WHEN m.emergency_contact_phone IS NOT NULL THEN 5 ELSE 0 END
      ),
      m.created_at
    FROM members m
    WHERE LOWER(m.email) IN (
      SELECT LOWER(email)
      FROM members
      WHERE email IS NOT NULL AND email != ''
      GROUP BY LOWER(email)
      HAVING COUNT(*) > 1
    );
  END LOOP;

  -- 2. Zelfde telefoon + achternaam (90% confidence)
  INSERT INTO temp_duplicates (group_id, member_id, match_type, confidence, first_name, last_name, email, phone, has_subscription, total_checkins, profile_completeness, created_at)
  SELECT
    (SELECT COALESCE(MAX(group_id), 0) FROM temp_duplicates) + row_number() OVER (PARTITION BY LOWER(m.last_name), regexp_replace(m.phone, '[^0-9]', '', 'g')),
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
      CASE WHEN m.profile_picture_url IS NOT NULL THEN 10 ELSE 0 END +
      CASE WHEN m.emergency_contact_name IS NOT NULL THEN 5 ELSE 0 END +
      CASE WHEN m.emergency_contact_phone IS NOT NULL THEN 5 ELSE 0 END
    ),
    m.created_at
  FROM members m
  WHERE m.phone IS NOT NULL AND m.phone != ''
    AND m.last_name IS NOT NULL AND m.last_name != ''
    AND m.id NOT IN (SELECT member_id FROM temp_duplicates)
    AND EXISTS (
      SELECT 1 FROM members m2
      WHERE m2.id != m.id
        AND LOWER(m2.last_name) = LOWER(m.last_name)
        AND regexp_replace(m2.phone, '[^0-9]', '', 'g') = regexp_replace(m.phone, '[^0-9]', '', 'g')
    );

  -- 3. Zelfde voornaam + achternaam + geboortedatum (95% confidence)
  INSERT INTO temp_duplicates (group_id, member_id, match_type, confidence, first_name, last_name, email, phone, has_subscription, total_checkins, profile_completeness, created_at)
  SELECT
    (SELECT COALESCE(MAX(group_id), 0) FROM temp_duplicates) + row_number() OVER (PARTITION BY LOWER(m.first_name), LOWER(m.last_name), m.birth_date),
    m.id,
    'name_birthdate',
    95,
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
      CASE WHEN m.profile_picture_url IS NOT NULL THEN 10 ELSE 0 END +
      CASE WHEN m.emergency_contact_name IS NOT NULL THEN 5 ELSE 0 END +
      CASE WHEN m.emergency_contact_phone IS NOT NULL THEN 5 ELSE 0 END
    ),
    m.created_at
  FROM members m
  WHERE m.birth_date IS NOT NULL
    AND m.first_name IS NOT NULL AND m.first_name != ''
    AND m.last_name IS NOT NULL AND m.last_name != ''
    AND m.id NOT IN (SELECT member_id FROM temp_duplicates)
    AND EXISTS (
      SELECT 1 FROM members m2
      WHERE m2.id != m.id
        AND LOWER(m2.first_name) = LOWER(m.first_name)
        AND LOWER(m2.last_name) = LOWER(m.last_name)
        AND m2.birth_date = m.birth_date
    );

  -- Markeer aanbevolen master per groep
  -- Prioriteit: has_subscription > total_checkins > profile_completeness > oldest
  UPDATE temp_duplicates t
  SET is_recommended_master = true
  WHERE t.member_id = (
    SELECT member_id
    FROM temp_duplicates t2
    WHERE t2.group_id = t.group_id
    ORDER BY
      has_subscription DESC,
      total_checkins DESC,
      profile_completeness DESC,
      created_at ASC
    LIMIT 1
  );

  -- Return resultaten
  RETURN QUERY
  SELECT * FROM temp_duplicates
  ORDER BY group_id, is_recommended_master DESC, created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Functie om duplicaten samen te voegen
CREATE OR REPLACE FUNCTION merge_duplicate_members(
  p_master_id UUID,
  p_duplicate_ids UUID[]
)
RETURNS JSONB AS $$
DECLARE
  v_duplicate_id UUID;
  v_merged_count INTEGER := 0;
  v_checkins_moved INTEGER := 0;
  v_subscriptions_moved INTEGER := 0;
  v_belts_moved INTEGER := 0;
  v_row_count INTEGER;
BEGIN
  -- Valideer dat master bestaat
  IF NOT EXISTS (SELECT 1 FROM members WHERE id = p_master_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Master member not found');
  END IF;

  -- Loop door alle duplicaten
  FOREACH v_duplicate_id IN ARRAY p_duplicate_ids
  LOOP
    -- Skip als het de master is
    IF v_duplicate_id = p_master_id THEN
      CONTINUE;
    END IF;

    -- Verplaats check-ins naar master
    UPDATE checkins SET member_id = p_master_id WHERE member_id = v_duplicate_id;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_checkins_moved := v_checkins_moved + v_row_count;

    -- Verplaats subscriptions naar master (alleen als master die niet heeft)
    UPDATE subscriptions SET member_id = p_master_id
    WHERE member_id = v_duplicate_id
      AND NOT EXISTS (
        SELECT 1 FROM subscriptions s2
        WHERE s2.member_id = p_master_id
          AND s2.name = subscriptions.name
      );
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_subscriptions_moved := v_subscriptions_moved + v_row_count;

    -- Verplaats gordels naar master (alleen als master die discipline niet heeft)
    UPDATE member_belts SET member_id = p_master_id
    WHERE member_id = v_duplicate_id
      AND NOT EXISTS (
        SELECT 1 FROM member_belts mb2
        WHERE mb2.member_id = p_master_id
          AND mb2.discipline_id = member_belts.discipline_id
      );
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_belts_moved := v_belts_moved + v_row_count;

    -- Verplaats reservations naar master
    UPDATE reservations SET member_id = p_master_id WHERE member_id = v_duplicate_id;

    -- Verplaats belt_history naar master
    UPDATE belt_history SET member_id = p_master_id WHERE member_id = v_duplicate_id;

    -- Verwijder het duplicaat
    DELETE FROM members WHERE id = v_duplicate_id;
    v_merged_count := v_merged_count + 1;
  END LOOP;

  -- Update totaal check-ins op master
  UPDATE members m
  SET total_checkins = (SELECT COUNT(*) FROM checkins WHERE member_id = m.id)
  WHERE m.id = p_master_id;

  RETURN jsonb_build_object(
    'success', true,
    'merged_count', v_merged_count,
    'checkins_moved', v_checkins_moved,
    'subscriptions_moved', v_subscriptions_moved,
    'belts_moved', v_belts_moved
  );
END;
$$ LANGUAGE plpgsql;

-- Functie om duplicaten te checken voor een nieuwe CSV import
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
  existing_first_name TEXT,
  existing_last_name TEXT,
  existing_email TEXT
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

  -- Check phone matches
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
    );
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION find_duplicate_members() TO authenticated;
GRANT EXECUTE ON FUNCTION merge_duplicate_members(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION check_import_duplicates(TEXT[], TEXT[], TEXT[]) TO authenticated;

COMMENT ON FUNCTION find_duplicate_members() IS 'Vindt alle duplicaat leden in de database';
COMMENT ON FUNCTION merge_duplicate_members(UUID, UUID[]) IS 'Voegt duplicaat leden samen naar een master record';
COMMENT ON FUNCTION check_import_duplicates(TEXT[], TEXT[], TEXT[]) IS 'Checkt CSV import data tegen bestaande leden';
