-- 008_reservations.sql
-- Reservations tabel voor les inschrijvingen

CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  reservation_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'reserved'
    CHECK (status IN ('reserved', 'checked_in', 'no_show', 'cancelled')),
  checked_in_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(member_id, class_id, reservation_date)
);

CREATE INDEX IF NOT EXISTS idx_reservations_member ON reservations(member_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_class_date ON reservations(class_id, reservation_date);

-- RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reservations"
  ON reservations FOR SELECT
  USING (member_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can create own reservations"
  ON reservations FOR INSERT
  WITH CHECK (member_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can cancel own reservations"
  ON reservations FOR UPDATE
  USING (member_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid()))
  WITH CHECK (status = 'cancelled');

CREATE POLICY "Staff can manage all reservations"
  ON reservations FOR ALL
  USING (get_my_role() IN ('admin', 'medewerker', 'coordinator', 'coach'));
