-- 042_class_date_range.sql
-- Voeg start_date toe aan classes voor betere datum filtering

-- Start date: vanaf wanneer de class actief is
ALTER TABLE classes ADD COLUMN IF NOT EXISTS start_date DATE;

-- Update bestaande classes: zet start_date op created_at datum
UPDATE classes
SET start_date = DATE(created_at)
WHERE start_date IS NULL;

-- Maak start_date NOT NULL met default van vandaag voor nieuwe classes
ALTER TABLE classes ALTER COLUMN start_date SET DEFAULT CURRENT_DATE;

-- Index voor efficiënte date range queries
CREATE INDEX IF NOT EXISTS idx_classes_date_range
ON classes(start_date, recurrence_end_date);

-- Comment voor documentatie
COMMENT ON COLUMN classes.start_date IS 'Startdatum van de class (eerste dag dat deze les gegeven wordt)';
