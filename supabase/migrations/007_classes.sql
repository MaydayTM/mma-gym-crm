-- 007_classes.sql
-- Classes tabel voor lesrooster

CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  discipline_id UUID NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES members(id) ON DELETE SET NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_capacity INTEGER,
  room VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_classes_day ON classes(day_of_week);
CREATE INDEX IF NOT EXISTS idx_classes_discipline ON classes(discipline_id);
CREATE INDEX IF NOT EXISTS idx_classes_coach ON classes(coach_id);
CREATE INDEX IF NOT EXISTS idx_classes_active ON classes(is_active);

-- Trigger voor updated_at
CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active classes"
  ON classes FOR SELECT
  USING (is_active = true);

CREATE POLICY "Staff can view all classes"
  ON classes FOR SELECT
  USING (get_my_role() IN ('admin', 'medewerker', 'coordinator', 'coach'));

CREATE POLICY "Admins can manage classes"
  ON classes FOR ALL
  USING (get_my_role() = 'admin');

CREATE POLICY "Coordinators can manage classes"
  ON classes FOR ALL
  USING (get_my_role() = 'coordinator');
