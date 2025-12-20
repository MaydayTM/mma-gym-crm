-- ===========================================
-- Sync Legacy Checkin Count to Total Checkins
-- ===========================================
-- Migratie: 029_sync_legacy_checkins.sql
-- Doel: Kopieer legacy_checkin_count naar total_checkins voor alle leden

-- Update total_checkins met de legacy waarde waar die nog 0 of NULL is
-- maar legacy_checkin_count wel een waarde heeft
UPDATE members
SET total_checkins = legacy_checkin_count
WHERE (total_checkins IS NULL OR total_checkins = 0)
  AND legacy_checkin_count IS NOT NULL
  AND legacy_checkin_count > 0;

-- Log hoeveel rijen zijn bijgewerkt
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM members
  WHERE total_checkins = legacy_checkin_count
    AND legacy_checkin_count > 0;

  RAISE NOTICE 'Updated % members with legacy checkin counts', updated_count;
END $$;

-- Commentaar
COMMENT ON COLUMN members.total_checkins IS 'Totaal aantal check-ins. Bevat nu ook geïmporteerde legacy data van ClubPlanner.';
COMMENT ON COLUMN members.legacy_checkin_count IS 'Originele check-in count uit ClubPlanner import (backup/referentie).';
