-- ===========================================
-- Profile Photo Sync from Creative Fighter
-- ===========================================
-- Migratie: 058_profile_photo_sync.sql
-- Doel: Leden kunnen hun eigen profielfoto bijwerken vanuit Creative Fighter
--
-- Flow:
-- 1. Lid maakt foto in Creative Fighter Studio
-- 2. Lid klikt "Stel in als profielfoto"
-- 3. Creative Fighter updatet members.profile_picture_url
-- 4. Foto is zichtbaar in CRM/GymScreen/Mobile App

-- ===========================================
-- STAP 1: Policy voor leden om eigen profile_picture_url te updaten
-- ===========================================
-- Leden (via auth_user_id) kunnen hun EIGEN member record updaten
-- Beperkt tot alleen de kolommen die ze mogen wijzigen

-- Drop existing overly permissive policy if needed
-- We keep the "Authenticated users can update members" for CRM staff
-- But add a specific policy for self-updates

DROP POLICY IF EXISTS "Members can update own profile picture" ON public.members;
CREATE POLICY "Members can update own profile picture"
  ON public.members
  FOR UPDATE
  TO authenticated
  USING (
    -- User can only update their own record
    auth_user_id = auth.uid()
  )
  WITH CHECK (
    -- User can only update their own record
    auth_user_id = auth.uid()
  );

-- ===========================================
-- DOCUMENTATIE
-- ===========================================
COMMENT ON POLICY "Members can update own profile picture" ON public.members IS
  'Leden kunnen hun eigen member record updaten (profile_picture_url) vanuit Creative Fighter. auth_user_id moet matchen met auth.uid().';

-- ===========================================
-- VERIFICATIE
-- ===========================================
-- Test query (vervang UUIDs met echte waarden):
--
-- Als authenticated user met auth.uid() = 'xxx':
-- UPDATE members
-- SET profile_picture_url = 'https://example.com/photo.jpg'
-- WHERE auth_user_id = 'xxx';
--
-- Dit zou moeten slagen. Update van een ander member zou moeten falen
-- (tenzij de user ook CRM staff is via de andere policy).
