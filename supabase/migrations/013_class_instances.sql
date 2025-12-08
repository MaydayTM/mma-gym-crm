-- 013_class_instances.sql
-- Class instances voor recurring classes
-- Classes worden templates, instances zijn de daadwerkelijke lessen per datum

CREATE TABLE IF NOT EXISTS class_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  coach_id UUID REFERENCES members(id) ON DELETE SET NULL,
  is_cancelled BOOLEAN DEFAULT false,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: één instance per class per dag
  UNIQUE(class_id, date)
);

-- Indexes voor snelle queries
CREATE INDEX IF NOT EXISTS idx_class_instances_class ON class_instances(class_id);
CREATE INDEX IF NOT EXISTS idx_class_instances_date ON class_instances(date);
CREATE INDEX IF NOT EXISTS idx_class_instances_coach ON class_instances(coach_id);

-- RLS (disabled in development, maar klaar voor productie)
ALTER TABLE class_instances ENABLE ROW LEVEL SECURITY;

-- Iedereen kan actieve instances zien
CREATE POLICY "Everyone can view class instances"
  ON class_instances FOR SELECT
  USING (true);

-- Staff kan instances beheren
CREATE POLICY "Staff can manage class instances"
  ON class_instances FOR ALL
  USING (true);

-- Disable RLS for development (consistent met andere tabellen)
ALTER TABLE class_instances DISABLE ROW LEVEL SECURITY;

-- Voeg recurrence velden toe aan classes tabel
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;

-- Commentaar voor documentatie
COMMENT ON TABLE class_instances IS 'Individuele les instances voor recurring classes. Elke instance is een specifieke les op een datum.';
COMMENT ON COLUMN class_instances.class_id IS 'Referentie naar de class template';
COMMENT ON COLUMN class_instances.date IS 'Datum van deze specifieke les';
COMMENT ON COLUMN class_instances.is_cancelled IS 'Of deze specifieke les is geannuleerd';
COMMENT ON COLUMN classes.is_recurring IS 'Of dit een wekelijks herhalende les is';
COMMENT ON COLUMN classes.recurrence_end_date IS 'Einddatum voor recurring classes';
