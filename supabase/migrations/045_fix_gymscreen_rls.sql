-- 045_fix_gymscreen_rls.sql
-- Fix RLS policies voor gymscreen_slides en gymscreen_settings
-- Probleem: INSERT mislukt met "violates row-level security policy"

-- ============================================
-- GYMSCREEN SLIDES - RLS Policies
-- ============================================

-- Eerst RLS disablen om clean te beginnen
ALTER TABLE gymscreen_slides DISABLE ROW LEVEL SECURITY;

-- Drop bestaande policies als ze bestaan
DROP POLICY IF EXISTS "Anyone can view active slides" ON gymscreen_slides;
DROP POLICY IF EXISTS "Staff can manage slides" ON gymscreen_slides;
DROP POLICY IF EXISTS "Authenticated can insert slides" ON gymscreen_slides;
DROP POLICY IF EXISTS "Authenticated can update slides" ON gymscreen_slides;
DROP POLICY IF EXISTS "Authenticated can delete slides" ON gymscreen_slides;

-- Enable RLS
ALTER TABLE gymscreen_slides ENABLE ROW LEVEL SECURITY;

-- Policy: Iedereen kan actieve slides bekijken (voor de TV display)
CREATE POLICY "Anyone can view active slides"
ON gymscreen_slides FOR SELECT
USING (is_active = true);

-- Policy: Geauthenticeerde gebruikers kunnen slides beheren
CREATE POLICY "Authenticated can insert slides"
ON gymscreen_slides FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update slides"
ON gymscreen_slides FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated can delete slides"
ON gymscreen_slides FOR DELETE
TO authenticated
USING (true);

-- Staff kan ook inactieve slides zien
CREATE POLICY "Staff can view all slides"
ON gymscreen_slides FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- GYMSCREEN SETTINGS - RLS Policies
-- ============================================

ALTER TABLE gymscreen_settings DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view settings" ON gymscreen_settings;
DROP POLICY IF EXISTS "Staff can manage settings" ON gymscreen_settings;

ALTER TABLE gymscreen_settings ENABLE ROW LEVEL SECURITY;

-- Iedereen kan settings lezen (voor TV display)
CREATE POLICY "Anyone can view settings"
ON gymscreen_settings FOR SELECT
USING (true);

-- Alleen authenticated users kunnen settings wijzigen
CREATE POLICY "Authenticated can manage settings"
ON gymscreen_settings FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- GRANTS (voor zekerheid)
-- ============================================
GRANT SELECT ON gymscreen_slides TO anon;
GRANT ALL ON gymscreen_slides TO authenticated;

GRANT SELECT ON gymscreen_settings TO anon;
GRANT ALL ON gymscreen_settings TO authenticated;
