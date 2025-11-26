-- RCN CRM Database Schema - ClubPlanner Import Compatibiliteit
-- Migration: 002_clubplanner_import_fields
-- 
-- DOEL: Velden toevoegen voor naadloze ClubPlanner CSV import
-- BEHOUDT: Alle bestaande velden (disciplines, belt_color, belt_stripes, etc.)

-- ============================================
-- NIEUWE VELDEN TOEVOEGEN AAN MEMBERS
-- ============================================

-- ClubPlanner referentie velden (voor import tracking)
ALTER TABLE members ADD COLUMN IF NOT EXISTS clubplanner_member_nr INTEGER;
ALTER TABLE members ADD COLUMN IF NOT EXISTS clubplanner_id VARCHAR(50);

-- Telefoon splitsen (ClubPlanner heeft beide apart)
-- We hernoemen 'phone' NIET, we voegen extra velden toe
ALTER TABLE members ADD COLUMN IF NOT EXISTS phone_mobile VARCHAR(50);
ALTER TABLE members ADD COLUMN IF NOT EXISTS phone_landline VARCHAR(50);

-- Lidmaatschap tracking
ALTER TABLE members ADD COLUMN IF NOT EXISTS member_since DATE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS retention_status VARCHAR(50);

-- Financieel (ClubPlanner specifiek)
ALTER TABLE members ADD COLUMN IF NOT EXISTS club_balance DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE members ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0;

-- Bank gegevens (voor domiciliëring/SEPA)
ALTER TABLE members ADD COLUMN IF NOT EXISTS bank_account_iban VARCHAR(34);
ALTER TABLE members ADD COLUMN IF NOT EXISTS bank_bic VARCHAR(11);

-- Belgische administratie
ALTER TABLE members ADD COLUMN IF NOT EXISTS vat_number VARCHAR(20);        -- BTW nummer (bedrijven)
ALTER TABLE members ADD COLUMN IF NOT EXISTS national_id VARCHAR(20);       -- Rijksregisternummer

-- Statistieken (kan ook berekend worden, maar handig voor import)
ALTER TABLE members ADD COLUMN IF NOT EXISTS total_checkins INTEGER DEFAULT 0;

-- ============================================
-- INDEXES VOOR NIEUWE VELDEN
-- ============================================

CREATE INDEX IF NOT EXISTS idx_members_clubplanner_nr ON members(clubplanner_member_nr);
CREATE INDEX IF NOT EXISTS idx_members_clubplanner_id ON members(clubplanner_id);
CREATE INDEX IF NOT EXISTS idx_members_member_since ON members(member_since);
CREATE INDEX IF NOT EXISTS idx_members_retention ON members(retention_status);

-- ============================================
-- RETENTION STATUS CHECK CONSTRAINT
-- ============================================

-- ClubPlanner statussen: 'Laag risico', 'Medium risico', 'Hoog risico', 'Slapend'
-- We voegen ook onze eigen statussen toe
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_retention_status_check;
ALTER TABLE members ADD CONSTRAINT members_retention_status_check 
  CHECK (retention_status IS NULL OR retention_status IN (
    -- ClubPlanner origineel (Nederlands)
    'Laag risico', 'Medium risico', 'Hoog risico', 'Slapend',
    -- Onze Engelse versie
    'healthy', 'at_risk', 'critical', 'churned', 'never_visited'
  ));

-- ============================================
-- COMMENT VOOR DOCUMENTATIE
-- ============================================

COMMENT ON COLUMN members.clubplanner_member_nr IS 'Origineel ClubPlanner "Lid Nr." - voor import referentie';
COMMENT ON COLUMN members.clubplanner_id IS 'Origineel ClubPlanner "ID" veld - hex string';
COMMENT ON COLUMN members.phone_mobile IS 'Mobiel nummer (ClubPlanner: "Mobiel Nr.")';
COMMENT ON COLUMN members.phone_landline IS 'Vast telefoonnummer (ClubPlanner: "Telefoonnr.")';
COMMENT ON COLUMN members.member_since IS 'Datum lid geworden (ClubPlanner: "Lid sinds")';
COMMENT ON COLUMN members.retention_status IS 'Retentie status - imported of berekend';
COMMENT ON COLUMN members.club_balance IS 'Clubsaldo/tegoed in EUR';
COMMENT ON COLUMN members.loyalty_points IS 'Spaarpunten systeem';
COMMENT ON COLUMN members.bank_account_iban IS 'IBAN voor domiciliëring (ClubPlanner: "Rekening Nr.")';
COMMENT ON COLUMN members.bank_bic IS 'BIC/SWIFT code (ClubPlanner: "Bankinstelling")';
COMMENT ON COLUMN members.vat_number IS 'BTW nummer voor bedrijven';
COMMENT ON COLUMN members.national_id IS 'Belgisch rijksregisternummer';
COMMENT ON COLUMN members.total_checkins IS 'Totaal aantal bezoeken (kan ook berekend worden)';

-- ============================================
-- VELDEN DIE WIJ HEBBEN, CLUBPLANNER NIET
-- (ter referentie - deze bestaan al)
-- ============================================

-- disciplines TEXT[]          → Gevechtsporten array (bjj, mma, kickboxing, etc.)
-- belt_color VARCHAR(50)      → Gordel kleur (white, blue, purple, brown, black)
-- belt_stripes INTEGER        → Aantal stripes (0-4)
-- belt_updated_at TIMESTAMP   → Wanneer gordel laatst geüpdatet
-- insurance_active BOOLEAN    → Verzekering actief
-- insurance_expires_at DATE   → Verzekering vervaldatum
-- access_enabled BOOLEAN      → Toegang geactiveerd
-- access_card_id VARCHAR      → Toegangskaart ID
-- profile_picture_url TEXT    → Profielfoto URL
-- latitude/longitude DECIMAL  → GPS voor kaart
-- stripe_customer_id VARCHAR  → Stripe koppeling
-- auth_user_id UUID          → Supabase Auth koppeling
-- role VARCHAR               → Rollen systeem (admin, coach, fighter, etc.)

-- ============================================
-- MAPPING TABEL VOOR IMPORT
-- Documentatie van ClubPlanner → RCN CRM mapping
-- ============================================

CREATE TABLE IF NOT EXISTS import_field_mapping (
  id SERIAL PRIMARY KEY,
  source_system VARCHAR(50) NOT NULL,
  source_field VARCHAR(100) NOT NULL,
  target_field VARCHAR(100) NOT NULL,
  transform_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert ClubPlanner mapping
INSERT INTO import_field_mapping (source_system, source_field, target_field, transform_notes) VALUES
  ('clubplanner', 'Lid Nr.', 'clubplanner_member_nr', 'Direct integer'),
  ('clubplanner', 'Voornaam', 'first_name', 'Direct text'),
  ('clubplanner', 'Naam', 'last_name', 'Direct text'),
  ('clubplanner', 'Retentiestatus', 'retention_status', 'Direct text, ClubPlanner Nederlands'),
  ('clubplanner', 'E-Mail', 'email', 'Direct text, lowercase'),
  ('clubplanner', 'Mobiel Nr.', 'phone_mobile', 'Direct text'),
  ('clubplanner', 'Telefoonnr.', 'phone_landline', 'Direct text'),
  ('clubplanner', 'Adres', 'street', 'Direct text'),
  ('clubplanner', 'Postcode', 'zip_code', 'Direct text'),
  ('clubplanner', 'Stad', 'city', 'Direct text'),
  ('clubplanner', 'Geboortedatum', 'birth_date', 'Parse DD/MM/YYYY to DATE'),
  ('clubplanner', 'Geslacht', 'gender', 'Map: Man→man, Vrouw→vrouw, Onbekend→onbekend'),
  ('clubplanner', 'ID', 'clubplanner_id', 'Direct text (hex string)'),
  ('clubplanner', 'Lid sinds', 'member_since', 'Parse DD/MM/YYYY to DATE'),
  ('clubplanner', 'Status', 'status', 'Map: Abonnee→active, etc.'),
  ('clubplanner', 'Laatste bezoek', 'last_checkin_at', 'Parse DD/MM/YYYY to TIMESTAMP'),
  ('clubplanner', 'Memo', 'notes', 'Direct text'),
  ('clubplanner', 'Clubsaldo', 'club_balance', 'Direct decimal'),
  ('clubplanner', 'Punten', 'loyalty_points', 'Direct integer'),
  ('clubplanner', 'Rekening Nr.', 'bank_account_iban', 'Direct text'),
  ('clubplanner', 'Bankinstelling', 'bank_bic', 'Direct text'),
  ('clubplanner', 'BTW', 'vat_number', 'Direct text'),
  ('clubplanner', 'Rijksregister Nr.', 'national_id', 'Direct text'),
  ('clubplanner', 'Aantal bezoeken', 'total_checkins', 'Direct integer')
ON CONFLICT DO NOTHING;
