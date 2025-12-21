-- 031_gymscreen_module.sql
-- GymScreen Module - Slideshow, Verjaardagen & Settings
-- Datum: 21 december 2025
--
-- Core module (gratis) met:
-- - Community slideshow/carousel
-- - Verjaardagen display (automatisch uit CRM)
-- - Instellingen voor display configuratie
--
-- Workouts feature komt later als premium upgrade

-- ============================================
-- GYMSCREEN SLIDES (Community foto's)
-- ============================================
CREATE TABLE IF NOT EXISTS gymscreen_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content
  image_url TEXT NOT NULL,
  title VARCHAR(255),
  caption TEXT,
  category VARCHAR(50) DEFAULT 'community'
    CHECK (category IN ('event', 'training', 'community', 'achievement', 'promo', 'announcement')),

  -- Weergave
  display_duration INTEGER DEFAULT 5, -- seconden per slide
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  -- Periode (optioneel voor tijdelijke content)
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,

  -- Metadata
  uploaded_by UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_gymscreen_slides_active ON gymscreen_slides(is_active);
CREATE INDEX idx_gymscreen_slides_order ON gymscreen_slides(sort_order);
CREATE INDEX idx_gymscreen_slides_dates ON gymscreen_slides(start_date, end_date);

-- ============================================
-- GYMSCREEN SETTINGS (per tenant)
-- ============================================
CREATE TABLE IF NOT EXISTS gymscreen_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(100) DEFAULT 'reconnect' UNIQUE,

  -- Secties on/off
  show_belt_wall BOOLEAN DEFAULT true,
  show_slideshow BOOLEAN DEFAULT true,
  show_birthdays BOOLEAN DEFAULT true,
  show_shop_banners BOOLEAN DEFAULT true,
  show_announcements BOOLEAN DEFAULT true,

  -- Timing
  slideshow_interval INTEGER DEFAULT 5, -- seconden per slide
  section_rotation_interval INTEGER DEFAULT 30, -- seconden tussen secties
  birthday_display_days INTEGER DEFAULT 0, -- 0 = alleen vandaag, 7 = week vooruit

  -- Volgorde secties (array van section names)
  section_order TEXT[] DEFAULT ARRAY['belt_wall', 'slideshow', 'birthdays', 'shop_banners'],

  -- Styling
  theme VARCHAR(50) DEFAULT 'dark', -- 'dark', 'light', 'brand'
  show_clock BOOLEAN DEFAULT true,
  show_logo BOOLEAN DEFAULT true,
  logo_url TEXT,

  -- API Access
  api_key VARCHAR(255),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- VIEW: Vandaag jarig
-- ============================================
CREATE OR REPLACE VIEW gymscreen_birthdays_today AS
SELECT
  id,
  first_name,
  last_name,
  birth_date,
  profile_picture_url,
  DATE_PART('year', AGE(birth_date))::INTEGER as age
FROM members
WHERE
  status = 'active'
  AND birth_date IS NOT NULL
  AND EXTRACT(MONTH FROM birth_date) = EXTRACT(MONTH FROM CURRENT_DATE)
  AND EXTRACT(DAY FROM birth_date) = EXTRACT(DAY FROM CURRENT_DATE);

-- ============================================
-- VIEW: Komende verjaardagen (configureerbaar)
-- ============================================
CREATE OR REPLACE VIEW gymscreen_birthdays_upcoming AS
SELECT
  id,
  first_name,
  last_name,
  birth_date,
  profile_picture_url,
  DATE_PART('year', AGE(birth_date))::INTEGER as age,
  TO_CHAR(birth_date, 'DD/MM') as birthday_display,
  -- Bereken dagen tot verjaardag
  CASE
    WHEN MAKE_DATE(
      EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
      EXTRACT(MONTH FROM birth_date)::INTEGER,
      EXTRACT(DAY FROM birth_date)::INTEGER
    ) >= CURRENT_DATE THEN
      MAKE_DATE(
        EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
        EXTRACT(MONTH FROM birth_date)::INTEGER,
        EXTRACT(DAY FROM birth_date)::INTEGER
      ) - CURRENT_DATE
    ELSE
      MAKE_DATE(
        EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER + 1,
        EXTRACT(MONTH FROM birth_date)::INTEGER,
        EXTRACT(DAY FROM birth_date)::INTEGER
      ) - CURRENT_DATE
  END as days_until_birthday
FROM members
WHERE
  status = 'active'
  AND birth_date IS NOT NULL
ORDER BY days_until_birthday ASC;

-- ============================================
-- FUNCTION: Get active slides
-- ============================================
CREATE OR REPLACE FUNCTION get_active_slides()
RETURNS TABLE (
  id UUID,
  image_url TEXT,
  title VARCHAR(255),
  caption TEXT,
  category VARCHAR(50),
  display_duration INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.image_url,
    s.title,
    s.caption,
    s.category,
    s.display_duration
  FROM gymscreen_slides s
  WHERE
    s.is_active = true
    AND (s.start_date IS NULL OR s.start_date <= NOW())
    AND (s.end_date IS NULL OR s.end_date >= NOW())
  ORDER BY s.sort_order ASC, s.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Get birthdays for display
-- ============================================
CREATE OR REPLACE FUNCTION get_gymscreen_birthdays(p_days_ahead INTEGER DEFAULT 0)
RETURNS TABLE (
  id UUID,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  profile_picture_url TEXT,
  age INTEGER,
  birthday_display TEXT,
  is_today BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.first_name,
    m.last_name,
    m.profile_picture_url,
    DATE_PART('year', AGE(m.birth_date))::INTEGER as age,
    TO_CHAR(m.birth_date, 'DD/MM') as birthday_display,
    (EXTRACT(MONTH FROM m.birth_date) = EXTRACT(MONTH FROM CURRENT_DATE)
     AND EXTRACT(DAY FROM m.birth_date) = EXTRACT(DAY FROM CURRENT_DATE)) as is_today
  FROM members m
  WHERE
    m.status = 'active'
    AND m.birth_date IS NOT NULL
    AND (
      -- Vandaag jarig
      (EXTRACT(MONTH FROM m.birth_date) = EXTRACT(MONTH FROM CURRENT_DATE)
       AND EXTRACT(DAY FROM m.birth_date) = EXTRACT(DAY FROM CURRENT_DATE))
      OR
      -- Komende dagen (als p_days_ahead > 0)
      (p_days_ahead > 0 AND
       MAKE_DATE(
         EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
         EXTRACT(MONTH FROM m.birth_date)::INTEGER,
         EXTRACT(DAY FROM m.birth_date)::INTEGER
       ) BETWEEN CURRENT_DATE + 1 AND CURRENT_DATE + p_days_ahead)
    )
  ORDER BY is_today DESC, birthday_display ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_gymscreen_slides_updated_at
  BEFORE UPDATE ON gymscreen_slides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gymscreen_settings_updated_at
  BEFORE UPDATE ON gymscreen_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS (disabled for development)
-- ============================================
ALTER TABLE gymscreen_slides DISABLE ROW LEVEL SECURITY;
ALTER TABLE gymscreen_settings DISABLE ROW LEVEL SECURITY;

GRANT ALL ON gymscreen_slides TO authenticated, anon;
GRANT ALL ON gymscreen_settings TO authenticated, anon;
GRANT SELECT ON gymscreen_birthdays_today TO authenticated, anon;
GRANT SELECT ON gymscreen_birthdays_upcoming TO authenticated, anon;

-- ============================================
-- STORAGE BUCKET voor slides
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gymscreen',
  'gymscreen',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "GymScreen images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'gymscreen');

CREATE POLICY "Authenticated users can upload gymscreen images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'gymscreen' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update gymscreen images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'gymscreen' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete gymscreen images"
ON storage.objects FOR DELETE
USING (bucket_id = 'gymscreen' AND auth.role() = 'authenticated');

-- ============================================
-- ADD MODULE TO MODULES TABLE
-- ============================================
INSERT INTO modules (slug, name, description, icon, price_monthly, is_core)
VALUES (
  'gymscreen',
  'GymScreen',
  'Beheer content voor je gym TV-displays',
  'Monitor',
  0,
  true -- Core module (gratis)
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_core = EXCLUDED.is_core;

-- ============================================
-- SEED: Default settings voor Reconnect
-- ============================================
INSERT INTO gymscreen_settings (tenant_id, api_key)
VALUES ('reconnect', gen_random_uuid()::text)
ON CONFLICT (tenant_id) DO NOTHING;
