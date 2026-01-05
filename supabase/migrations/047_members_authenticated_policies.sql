-- ===========================================
-- RLS Policies for Members Table - Authenticated Users
-- ===========================================
-- Migratie: 047_members_authenticated_policies.sql
-- Doel: Authenticated users kunnen members lezen en updaten
-- Probleem: RLS was enabled (041) maar alleen anon SELECT policy bestond

-- ===========================================
-- STAP 1: SELECT Policy voor authenticated users
-- ===========================================
-- Alle authenticated users kunnen alle members zien
DROP POLICY IF EXISTS "Authenticated users can view all members" ON public.members;
CREATE POLICY "Authenticated users can view all members"
  ON public.members
  FOR SELECT
  TO authenticated
  USING (true);

-- ===========================================
-- STAP 2: INSERT Policy voor authenticated users
-- ===========================================
-- Authenticated users kunnen nieuwe members aanmaken
DROP POLICY IF EXISTS "Authenticated users can insert members" ON public.members;
CREATE POLICY "Authenticated users can insert members"
  ON public.members
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ===========================================
-- STAP 3: UPDATE Policy voor authenticated users
-- ===========================================
-- Authenticated users kunnen members updaten
DROP POLICY IF EXISTS "Authenticated users can update members" ON public.members;
CREATE POLICY "Authenticated users can update members"
  ON public.members
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ===========================================
-- STAP 4: DELETE Policy voor authenticated users (restrictief)
-- ===========================================
-- Alleen admins kunnen members verwijderen (via app logica)
-- Voor nu: authenticated users kunnen geen members verwijderen
-- Dit voorkomt accidentele deletes

-- ===========================================
-- DOCUMENTATIE
-- ===========================================
COMMENT ON POLICY "Authenticated users can view all members" ON public.members IS
  'CRM Staff: alle ingelogde gebruikers kunnen alle members zien';

COMMENT ON POLICY "Authenticated users can insert members" ON public.members IS
  'CRM Staff: ingelogde gebruikers kunnen nieuwe members aanmaken';

COMMENT ON POLICY "Authenticated users can update members" ON public.members IS
  'CRM Staff: ingelogde gebruikers kunnen members updaten (rol wijzigingen etc)';
