-- 010_extend_members_checkins.sql
-- Uitbreiden members met legacy velden, checkins met class/discipline referenties

-- Members uitbreiden voor ClubPlanner import
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS clubplanner_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS legacy_checkin_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_members_clubplanner ON members(clubplanner_id);

-- Checkins uitbreiden met class en discipline referenties
ALTER TABLE checkins
  ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS discipline_id UUID REFERENCES disciplines(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_checkins_class ON checkins(class_id);
CREATE INDEX IF NOT EXISTS idx_checkins_discipline ON checkins(discipline_id);
CREATE INDEX IF NOT EXISTS idx_checkins_reservation ON checkins(reservation_id);
