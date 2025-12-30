-- 044_fix_class_dates.sql
-- Fix bestaande classes die geen start_date of recurrence_end_date hebben
-- Dit voorkomt dat oude classes op elke week verschijnen

-- 1. Update classes zonder start_date: zet start_date op created_at datum
UPDATE classes
SET start_date = DATE(created_at)
WHERE start_date IS NULL;

-- 2. Voor bestaande actieve classes zonder recurrence_end_date:
-- Deze zijn waarschijnlijk het permanente wekelijkse rooster.
-- Zet recurrence_end_date op 6 maanden vanaf nu zodat ze niet oneindig doorlopen.
-- Coaches kunnen dit later aanpassen via de UI.
UPDATE classes
SET
  is_recurring = true,
  recurrence_end_date = (CURRENT_DATE + INTERVAL '6 months')::DATE
WHERE recurrence_end_date IS NULL
  AND is_active = true;

-- 3. Voor niet-actieve classes zonder recurrence_end_date:
-- Zet einddatum gelijk aan startdatum (afgelopen éénmalige les)
UPDATE classes
SET recurrence_end_date = start_date
WHERE recurrence_end_date IS NULL
  AND is_active = false;

-- Commentaar voor documentatie
COMMENT ON COLUMN classes.start_date IS 'Startdatum van de class - VERPLICHT voor weergave in rooster';
COMMENT ON COLUMN classes.recurrence_end_date IS 'Einddatum - voor éénmalige lessen gelijk aan start_date, voor recurring het einde van de reeks';
