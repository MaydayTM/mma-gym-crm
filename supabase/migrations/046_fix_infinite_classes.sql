-- 046_fix_infinite_classes.sql
-- Fix classes die nog steeds oneindig doorlopen door ontbrekende recurrence_end_date
-- Dit is een follow-up op 044 die mogelijk niet correct was uitgevoerd

-- 1. Voor actieve classes met NULL recurrence_end_date:
-- Zet een einddatum 6 maanden in de toekomst
UPDATE classes
SET
  is_recurring = true,
  recurrence_end_date = (CURRENT_DATE + INTERVAL '6 months')::DATE
WHERE recurrence_end_date IS NULL
  AND is_active = true;

-- 2. Voor actieve classes met extreem verre einddatum (>2 jaar):
-- Dit zijn waarschijnlijk per ongeluk "oneindig" gezet
-- Pas aan naar 6 maanden vanaf nu
UPDATE classes
SET recurrence_end_date = (CURRENT_DATE + INTERVAL '6 months')::DATE
WHERE recurrence_end_date > (CURRENT_DATE + INTERVAL '2 years')::DATE
  AND is_active = true;

-- 3. Zorg dat alle actieve classes een start_date hebben
UPDATE classes
SET start_date = COALESCE(start_date, DATE(created_at), CURRENT_DATE)
WHERE start_date IS NULL
  AND is_active = true;
