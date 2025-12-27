-- Migration: Rooms (Zalen)
-- Split-kolom rooster ondersteuning voor meerdere trainingsruimtes

-- Rooms tabel
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  capacity INTEGER,
  color VARCHAR(7) DEFAULT '#6B7280',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vervang het bestaande room text veld met een foreign key
-- Eerst: voeg room_id kolom toe
ALTER TABLE classes ADD COLUMN room_id UUID REFERENCES rooms(id) ON DELETE SET NULL;

-- Index voor snelle lookups
CREATE INDEX idx_classes_room ON classes(room_id);
CREATE INDEX idx_rooms_active ON rooms(is_active);

-- RLS uitschakelen (development mode)
ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;

-- Seed data: Reconnect Academy zalen (MK themed!)
INSERT INTO rooms (name, description, capacity, color, sort_order) VALUES
  ('Goro''s Lair', 'Hoofdzaal - de grote trainingsruimte', 40, '#DC2626', 1),
  ('The Pit', 'Tweede zaal - compacte trainingsruimte', 20, '#7C3AED', 2);

-- Trigger voor updated_at
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
