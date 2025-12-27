-- Migration: Class Tracks
-- Flexibele tracks voor lessen (Core/Competitive, Groep I/II, etc.)

-- Class tracks tabel
CREATE TABLE class_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6B7280',  -- Default gray
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Track toevoegen aan classes tabel
ALTER TABLE classes ADD COLUMN track_id UUID REFERENCES class_tracks(id) ON DELETE SET NULL;

-- Index voor snelle lookups
CREATE INDEX idx_classes_track ON classes(track_id);
CREATE INDEX idx_class_tracks_active ON class_tracks(is_active);

-- RLS uitschakelen (development mode)
ALTER TABLE class_tracks DISABLE ROW LEVEL SECURITY;

-- Seed data: standaard tracks
INSERT INTO class_tracks (name, description, color, sort_order) VALUES
  ('Core', 'Basis training voor alle niveaus', '#3B82F6', 1),
  ('Competitive', 'Intensieve training voor wedstrijdvechters', '#EF4444', 2);

-- Trigger voor updated_at
CREATE TRIGGER update_class_tracks_updated_at
  BEFORE UPDATE ON class_tracks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
