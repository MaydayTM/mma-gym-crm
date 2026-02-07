-- Link plan types to disciplines
-- Determines which disciplines are accessible with each plan type

CREATE TABLE plan_type_disciplines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type_id UUID NOT NULL REFERENCES plan_types(id) ON DELETE CASCADE,
  discipline_id UUID NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(plan_type_id, discipline_id)
);

CREATE INDEX idx_ptd_plan_type ON plan_type_disciplines(plan_type_id);
CREATE INDEX idx_ptd_discipline ON plan_type_disciplines(discipline_id);

-- RLS: readable by all authenticated, writable by admins (app-layer enforced)
ALTER TABLE plan_type_disciplines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plan_type_disciplines_select" ON plan_type_disciplines
  FOR SELECT USING (true);

CREATE POLICY "plan_type_disciplines_insert" ON plan_type_disciplines
  FOR INSERT WITH CHECK (true);

CREATE POLICY "plan_type_disciplines_update" ON plan_type_disciplines
  FOR UPDATE USING (true);

CREATE POLICY "plan_type_disciplines_delete" ON plan_type_disciplines
  FOR DELETE USING (true);

-- Seed: All-In gets ALL active disciplines
INSERT INTO plan_type_disciplines (plan_type_id, discipline_id)
SELECT pt.id, d.id
FROM plan_types pt
CROSS JOIN disciplines d
WHERE pt.slug = 'allin'
  AND d.is_active = true;

-- Basic (1 Sport) gets NO pre-linked disciplines
-- Member chooses one at subscription time via selected_discipline_id
