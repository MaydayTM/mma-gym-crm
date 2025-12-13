-- 018_discounts_and_pricing_visibility.sql
-- Uitbreiding voor admin flexibiliteit: kortingen en checkout visibility
-- Datum: 13 december 2025

-- ============================================
-- DISCOUNTS
-- Algemene kortingen (naast family_discounts)
-- ============================================
CREATE TABLE discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Korting waarde (een van beide invullen)
  discount_type VARCHAR(20) NOT NULL DEFAULT 'fixed', -- 'fixed' of 'percentage'
  amount DECIMAL(10,2), -- vast bedrag in EUR
  percentage DECIMAL(5,2), -- percentage (bijv. 10.00 = 10%)

  -- Regels
  is_exclusive BOOLEAN DEFAULT false, -- kan niet gestapeld worden
  requires_verification BOOLEAN DEFAULT false, -- moet admin goedkeuren (bijv. studentenkaart)

  -- Geldigheid
  valid_from DATE,
  valid_until DATE,
  max_uses INTEGER, -- NULL = onbeperkt
  current_uses INTEGER DEFAULT 0,

  -- Webshop
  show_on_checkout BOOLEAN DEFAULT true,
  checkout_code VARCHAR(50), -- optionele kortingscode die klant invult

  -- Status
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_discounts_slug ON discounts(slug);
CREATE INDEX idx_discounts_active ON discounts(is_active);
CREATE INDEX idx_discounts_code ON discounts(checkout_code) WHERE checkout_code IS NOT NULL;

-- ============================================
-- PRICING MATRIX DISCOUNTS (koppeltabel)
-- Welke kortingen zijn beschikbaar per pricing optie
-- ============================================
CREATE TABLE pricing_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pricing_matrix_id UUID NOT NULL REFERENCES pricing_matrix(id) ON DELETE CASCADE,
  discount_id UUID NOT NULL REFERENCES discounts(id) ON DELETE CASCADE,

  -- Override voor deze specifieke pricing
  override_amount DECIMAL(10,2), -- overschrijf het standaard bedrag
  override_percentage DECIMAL(5,2), -- overschrijf het standaard percentage

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(pricing_matrix_id, discount_id)
);

CREATE INDEX idx_pricing_discounts_pricing ON pricing_discounts(pricing_matrix_id);
CREATE INDEX idx_pricing_discounts_discount ON pricing_discounts(discount_id);

-- ============================================
-- PRICING MATRIX UITBREIDEN
-- Toevoegen van show_on_checkout kolom
-- ============================================
ALTER TABLE pricing_matrix
ADD COLUMN IF NOT EXISTS show_on_checkout BOOLEAN DEFAULT true;

ALTER TABLE pricing_matrix
ADD COLUMN IF NOT EXISTS highlight_text VARCHAR(100); -- bijv. "POPULAIR" of "BESTE DEAL"

-- ============================================
-- ONE_TIME_PRODUCTS UITBREIDEN
-- Toevoegen van show_on_checkout kolom
-- ============================================
ALTER TABLE one_time_products
ADD COLUMN IF NOT EXISTS show_on_checkout BOOLEAN DEFAULT true;

-- ============================================
-- MEMBER SUBSCRIPTION DISCOUNTS
-- Welke kortingen zijn toegepast op een lidmaatschap
-- ============================================
CREATE TABLE member_subscription_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES member_subscriptions(id) ON DELETE CASCADE,
  discount_id UUID REFERENCES discounts(id) ON DELETE SET NULL,
  family_discount_id UUID REFERENCES family_discounts(id) ON DELETE SET NULL,

  -- Snapshot van de korting op moment van aankoop
  discount_name VARCHAR(100) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Minimaal 1 van beide moet ingevuld zijn
  CONSTRAINT chk_discount_source CHECK (discount_id IS NOT NULL OR family_discount_id IS NOT NULL)
);

CREATE INDEX idx_member_subscription_discounts_sub ON member_subscription_discounts(subscription_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Updated_at trigger voor discounts
CREATE TRIGGER update_discounts_updated_at
  BEFORE UPDATE ON discounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS DISABLED (development)
-- ============================================
ALTER TABLE discounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_discounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE member_subscription_discounts DISABLE ROW LEVEL SECURITY;

-- Grant access
GRANT ALL ON discounts TO authenticated, anon;
GRANT ALL ON pricing_discounts TO authenticated, anon;
GRANT ALL ON member_subscription_discounts TO authenticated, anon;

-- ============================================
-- SEED DATA: Standaard kortingen
-- ============================================
INSERT INTO discounts (slug, name, description, discount_type, amount, percentage, requires_verification, show_on_checkout, sort_order) VALUES
('student', 'Studentenkorting', 'Voor studenten met geldige studentenkaart', 'percentage', NULL, 10.00, true, true, 1),
('senior', 'Seniorenkorting', 'Voor 65+ met bewijs', 'percentage', NULL, 15.00, true, false, 2),
('promo-2025', 'Nieuwjaarsactie 2025', 'Tijdelijke korting januari 2025', 'fixed', 50.00, NULL, false, false, 3);

-- Koppel studentenkorting aan alle jaarpassen (12 maanden)
INSERT INTO pricing_discounts (pricing_matrix_id, discount_id)
SELECT pm.id, d.id
FROM pricing_matrix pm
CROSS JOIN discounts d
WHERE pm.duration_months = 12
AND d.slug = 'student';
