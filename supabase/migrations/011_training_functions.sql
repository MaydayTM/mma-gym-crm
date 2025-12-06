-- 011_training_functions.sql
-- SQL functies voor training counts

-- Functie: tel trainingen voor een lid in een discipline
CREATE OR REPLACE FUNCTION get_training_count(
  p_member_id UUID,
  p_discipline_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  legacy_count INTEGER;
  checkin_count INTEGER;
BEGIN
  -- Legacy count van member
  SELECT COALESCE(legacy_checkin_count, 0) INTO legacy_count
  FROM members WHERE id = p_member_id;

  -- Als geen specifieke discipline, tel alle check-ins
  IF p_discipline_id IS NULL THEN
    SELECT COUNT(*) INTO checkin_count
    FROM reservations
    WHERE member_id = p_member_id
      AND status = 'checked_in';
  ELSE
    -- Tel check-ins voor specifieke discipline
    SELECT COUNT(*) INTO checkin_count
    FROM reservations r
    JOIN classes c ON r.class_id = c.id
    WHERE r.member_id = p_member_id
      AND r.status = 'checked_in'
      AND c.discipline_id = p_discipline_id;
  END IF;

  -- Voor legacy data: als geen discipline filter, tel legacy mee
  -- Anders alleen nieuwe check-ins (legacy is niet discipline-specifiek)
  IF p_discipline_id IS NULL THEN
    RETURN legacy_count + checkin_count;
  ELSE
    RETURN checkin_count;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Functie: trainingen sinds laatste promotie
CREATE OR REPLACE FUNCTION get_trainings_since_promotion(
  p_member_id UUID,
  p_discipline_id UUID
) RETURNS INTEGER AS $$
DECLARE
  current_count INTEGER;
  last_promotion_count INTEGER;
BEGIN
  current_count := get_training_count(p_member_id, p_discipline_id);

  SELECT trainings_at_promotion INTO last_promotion_count
  FROM belt_history
  WHERE member_id = p_member_id AND discipline_id = p_discipline_id
  ORDER BY promoted_at DESC
  LIMIT 1;

  RETURN current_count - COALESCE(last_promotion_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View voor member belt summary (handig voor queries)
CREATE OR REPLACE VIEW member_belt_summary AS
SELECT
  mb.member_id,
  mb.discipline_id,
  d.name as discipline_name,
  d.slug as discipline_slug,
  d.color as discipline_color,
  d.has_belt_system,
  mb.belt_color,
  mb.stripes,
  mb.dan_grade,
  mb.updated_at as belt_updated_at,
  get_training_count(mb.member_id, mb.discipline_id) as training_count,
  get_trainings_since_promotion(mb.member_id, mb.discipline_id) as trainings_since_promotion
FROM member_belts mb
JOIN disciplines d ON mb.discipline_id = d.id
WHERE d.is_active = true;
