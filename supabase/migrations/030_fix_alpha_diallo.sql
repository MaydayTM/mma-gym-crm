-- ===========================================
-- Fix Alpha Diallo account
-- ===========================================
-- Migratie: 030_fix_alpha_diallo.sql
-- Doel: Zorg dat Alpha Diallo met ousi675@gmail.com correct is ingevoerd
--       Dit is het account met 115 check-ins uit ClubPlanner

-- Stap 1: Zoek alle Alpha Diallo accounts in de database
-- (dit is informatief, de echte fix gebeurt hieronder)

-- Stap 2: Update of insert het correcte account
-- We kijken eerst of ousi675@gmail.com al bestaat

DO $$
DECLARE
  v_existing_id UUID;
  v_existing_checkins INTEGER;
  v_target_email TEXT := 'ousi675@gmail.com';
  v_first_name TEXT := 'Alpha';
  v_last_name TEXT := 'Diallo';
  v_phone TEXT := '0486551526';
  v_birth_date DATE := '2007-12-10';
  v_street TEXT := 'Diepestraat';
  v_city TEXT := 'Aalst';
  v_zip TEXT := '9300';
  v_legacy_checkins INTEGER := 115;
BEGIN
  -- Check of dit email al bestaat
  SELECT id, COALESCE(total_checkins, 0) INTO v_existing_id, v_existing_checkins
  FROM members
  WHERE LOWER(email) = LOWER(v_target_email);

  IF v_existing_id IS NOT NULL THEN
    -- Account bestaat al, update de legacy checkins als die hoger zijn
    RAISE NOTICE 'Account met email % bestaat al (ID: %), checkins: %', v_target_email, v_existing_id, v_existing_checkins;

    IF v_legacy_checkins > COALESCE(v_existing_checkins, 0) THEN
      UPDATE members SET
        total_checkins = v_legacy_checkins,
        legacy_checkin_count = v_legacy_checkins,
        phone = COALESCE(phone, v_phone),
        birth_date = COALESCE(birth_date, v_birth_date),
        street = COALESCE(street, v_street),
        city = COALESCE(city, v_city),
        zip_code = COALESCE(zip_code, v_zip),
        updated_at = NOW()
      WHERE id = v_existing_id;

      RAISE NOTICE 'Account geüpdatet met % legacy checkins', v_legacy_checkins;
    END IF;
  ELSE
    -- Account bestaat nog niet, maak aan
    INSERT INTO members (
      first_name,
      last_name,
      email,
      phone,
      birth_date,
      street,
      city,
      zip_code,
      country,
      gender,
      status,
      role,
      total_checkins,
      legacy_checkin_count,
      created_at,
      updated_at
    ) VALUES (
      v_first_name,
      v_last_name,
      v_target_email,
      v_phone,
      v_birth_date,
      v_street,
      v_city,
      v_zip,
      'Belgium',
      'man',
      'active',
      'fighter',
      v_legacy_checkins,
      v_legacy_checkins,
      NOW(),
      NOW()
    );

    RAISE NOTICE 'Nieuw account aangemaakt voor % % met email %', v_first_name, v_last_name, v_target_email;
  END IF;
END $$;

-- Stap 3: Toon resultaat
SELECT
  id,
  first_name,
  last_name,
  email,
  phone,
  total_checkins,
  legacy_checkin_count,
  status
FROM members
WHERE LOWER(first_name) = 'alpha'
  AND LOWER(last_name) = 'diallo'
ORDER BY total_checkins DESC NULLS LAST;
