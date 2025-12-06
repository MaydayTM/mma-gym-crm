-- 006_disciplines.sql
-- Disciplines tabel met seed data

CREATE TABLE IF NOT EXISTS disciplines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  has_belt_system BOOLEAN DEFAULT true,
  color VARCHAR(7) DEFAULT '#3B82F6',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disciplines_slug ON disciplines(slug);
CREATE INDEX IF NOT EXISTS idx_disciplines_active ON disciplines(is_active);

-- Trigger voor updated_at
CREATE TRIGGER update_disciplines_updated_at
  BEFORE UPDATE ON disciplines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed data
INSERT INTO disciplines (name, slug, has_belt_system, color, sort_order) VALUES
  ('BJJ', 'bjj', true, '#1E40AF', 1),
  ('Judo', 'judo', true, '#DC2626', 2),
  ('Karate', 'karate', true, '#7C3AED', 3),
  ('Luta Livre', 'luta-livre', true, '#059669', 4),
  ('MMA', 'mma', false, '#EA580C', 5),
  ('Kickboxing', 'kickboxing', false, '#CA8A04', 6),
  ('Wrestling', 'wrestling', false, '#0891B2', 7),
  ('Kids BJJ', 'kids-bjj', true, '#EC4899', 8);

-- RLS
ALTER TABLE disciplines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view disciplines"
  ON disciplines FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage disciplines"
  ON disciplines FOR ALL
  USING (get_my_role() = 'admin');
