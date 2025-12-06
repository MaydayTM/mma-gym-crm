-- 009_member_belts.sql
-- Member belts (gordel per discipline) en belt history

-- Member belts - huidige gordel per discipline
CREATE TABLE IF NOT EXISTS member_belts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  discipline_id UUID NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  belt_color VARCHAR(20) NOT NULL
    CHECK (belt_color IN ('white', 'yellow', 'green', 'blue', 'purple', 'brown', 'black')),
  stripes INTEGER DEFAULT 0 CHECK (stripes BETWEEN 0 AND 4),
  dan_grade INTEGER CHECK (dan_grade >= 1),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(member_id, discipline_id)
);

CREATE INDEX IF NOT EXISTS idx_member_belts_member ON member_belts(member_id);
CREATE INDEX IF NOT EXISTS idx_member_belts_discipline ON member_belts(discipline_id);

-- Belt history - promotie historie
CREATE TABLE IF NOT EXISTS belt_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  discipline_id UUID NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  from_belt VARCHAR(20),
  from_stripes INTEGER,
  to_belt VARCHAR(20) NOT NULL,
  to_stripes INTEGER DEFAULT 0,
  to_dan INTEGER,
  promoted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  promoted_by UUID REFERENCES members(id) ON DELETE SET NULL,
  trainings_at_promotion INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_belt_history_member ON belt_history(member_id);
CREATE INDEX IF NOT EXISTS idx_belt_history_discipline ON belt_history(discipline_id);
CREATE INDEX IF NOT EXISTS idx_belt_history_date ON belt_history(promoted_at);

-- Trigger voor member_belts updated_at
CREATE TRIGGER update_member_belts_updated_at
  BEFORE UPDATE ON member_belts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS voor member_belts
ALTER TABLE member_belts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view member belts"
  ON member_belts FOR SELECT
  USING (true);

CREATE POLICY "Staff can manage member belts"
  ON member_belts FOR ALL
  USING (get_my_role() IN ('admin', 'medewerker', 'coordinator', 'coach'));

-- RLS voor belt_history
ALTER TABLE belt_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view belt history"
  ON belt_history FOR SELECT
  USING (true);

CREATE POLICY "Staff can create belt history"
  ON belt_history FOR INSERT
  WITH CHECK (get_my_role() IN ('admin', 'medewerker', 'coordinator', 'coach'));
