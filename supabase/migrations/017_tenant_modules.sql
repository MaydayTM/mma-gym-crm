-- 017_tenant_modules.sql
-- Tenant Module Subscriptions - Voor betaalde CRM modules zoals Shop
-- Datum: 9 december 2025

-- ============================================
-- AVAILABLE MODULES
-- Alle beschikbare modules die tenants kunnen activeren
-- ============================================
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  is_core BOOLEAN DEFAULT false, -- Core modules zijn altijd beschikbaar
  external_url TEXT, -- URL naar externe module (bijv. shop.mmagym.be)
  requires_setup BOOLEAN DEFAULT false,
  features JSONB DEFAULT '[]',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_modules_slug ON modules(slug);
CREATE INDEX idx_modules_active ON modules(is_active);

-- ============================================
-- TENANT MODULE SUBSCRIPTIONS
-- Welke modules een tenant heeft geactiveerd
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_module_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant identificatie (voor nu gebruiken we een config tabel, later multi-tenant)
  tenant_id VARCHAR(100) NOT NULL DEFAULT 'reconnect',

  -- Module koppeling
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,

  -- Subscription details
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'trial', 'cancelled', 'expired', 'pending')),

  -- Trial
  trial_ends_at TIMESTAMP WITH TIME ZONE,

  -- Periode
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  auto_renew BOOLEAN DEFAULT true,

  -- Pricing snapshot (op moment van aankoop)
  billing_interval VARCHAR(20) CHECK (billing_interval IN ('monthly', 'yearly', 'lifetime')),
  price_paid DECIMAL(10,2),

  -- Payment provider
  stripe_subscription_id VARCHAR(255),
  stripe_price_id VARCHAR(255),

  -- Metadata
  activated_by UUID REFERENCES members(id),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancel_reason TEXT,
  settings JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(tenant_id, module_id)
);

CREATE INDEX idx_tenant_modules_tenant ON tenant_module_subscriptions(tenant_id);
CREATE INDEX idx_tenant_modules_status ON tenant_module_subscriptions(status);
CREATE INDEX idx_tenant_modules_module ON tenant_module_subscriptions(module_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Updated_at trigger
CREATE TRIGGER update_tenant_module_subscriptions_updated_at
  BEFORE UPDATE ON tenant_module_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS DISABLED (development)
-- ============================================
ALTER TABLE modules DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_module_subscriptions DISABLE ROW LEVEL SECURITY;

-- Grant access
GRANT ALL ON modules TO authenticated, anon;
GRANT ALL ON tenant_module_subscriptions TO authenticated, anon;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check of tenant een module heeft geactiveerd
CREATE OR REPLACE FUNCTION has_module_access(
  p_tenant_id VARCHAR(100),
  p_module_slug VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_access BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM tenant_module_subscriptions tms
    JOIN modules m ON m.id = tms.module_id
    WHERE tms.tenant_id = p_tenant_id
      AND m.slug = p_module_slug
      AND tms.status IN ('active', 'trial')
      AND (tms.end_date IS NULL OR tms.end_date >= CURRENT_DATE)
      AND (tms.trial_ends_at IS NULL OR tms.trial_ends_at >= NOW())
  ) INTO v_has_access;

  -- Check ook of het een core module is
  IF NOT v_has_access THEN
    SELECT EXISTS (
      SELECT 1 FROM modules WHERE slug = p_module_slug AND is_core = true
    ) INTO v_has_access;
  END IF;

  RETURN v_has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get alle actieve modules voor een tenant
CREATE OR REPLACE FUNCTION get_tenant_modules(p_tenant_id VARCHAR(100))
RETURNS TABLE (
  module_id UUID,
  slug VARCHAR(50),
  name VARCHAR(100),
  icon VARCHAR(50),
  external_url TEXT,
  status VARCHAR(20),
  is_core BOOLEAN,
  trial_ends_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id as module_id,
    m.slug,
    m.name,
    m.icon,
    m.external_url,
    COALESCE(tms.status, 'available'::VARCHAR(20)) as status,
    m.is_core,
    tms.trial_ends_at
  FROM modules m
  LEFT JOIN tenant_module_subscriptions tms
    ON tms.module_id = m.id
    AND tms.tenant_id = p_tenant_id
    AND tms.status IN ('active', 'trial')
  WHERE m.is_active = true
  ORDER BY m.is_core DESC, m.sort_order ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SEED DATA - Available Modules
-- ============================================

-- Core modules (altijd beschikbaar)
INSERT INTO modules (slug, name, description, icon, is_core, sort_order) VALUES
  ('dashboard', 'Dashboard', 'Overzicht van je gym statistieken', 'LayoutDashboard', true, 0),
  ('members', 'Leden', 'Beheer je leden en hun gegevens', 'Users', true, 1),
  ('leads', 'Leads', 'Lead management en conversie tracking', 'UserPlus', true, 2),
  ('subscriptions', 'Abonnementen', 'Abonnementen en betalingen', 'CreditCard', true, 3),
  ('schedule', 'Rooster', 'Lesrooster en planning', 'Calendar', true, 4),
  ('reservations', 'Reservaties', 'Reserveringssysteem voor lessen', 'CalendarCheck', true, 5),
  ('checkin', 'Check-in', 'Toegangscontrole en check-ins', 'ScanLine', true, 6),
  ('reports', 'Rapportages', 'Analytics en rapportages', 'BarChart3', true, 7),
  ('tasks', 'Taken', 'Taakbeheer voor je team', 'CheckSquare', true, 8),
  ('team', 'Team', 'Teambeheer en rechten', 'Shield', true, 9),
  ('settings', 'Instellingen', 'Systeeminstellingen', 'Settings', true, 10)
ON CONFLICT (slug) DO NOTHING;

-- Premium modules (betaald)
INSERT INTO modules (slug, name, description, icon, price_monthly, price_yearly, external_url, is_core, sort_order, features) VALUES
  ('shop', 'Shop', 'Verkoop merchandise en producten', 'ShoppingBag', 29.00, 290.00, NULL, false, 20, '["Product management", "Inventory tracking", "Stripe checkout", "Order management", "Pre-orders", "Multi-variant products"]'),
  ('marketing', 'Marketing', 'Email campagnes en automations', 'Mail', 19.00, 190.00, NULL, false, 21, '["Email templates", "Automated campaigns", "Birthday emails", "Win-back campaigns", "Newsletter"]'),
  ('contracts', 'Contracten', 'Digitale contracten en handtekeningen', 'FileSignature', 15.00, 150.00, NULL, false, 22, '["Digital signatures", "Contract templates", "Auto-renewal reminders", "GDPR compliant"]'),
  ('events', 'Evenementen', 'Seminars, camps en wedstrijden', 'Trophy', 25.00, 250.00, NULL, false, 23, '["Event registration", "Ticket sales", "Weight categories", "Bracket management"]')
ON CONFLICT (slug) DO NOTHING;

-- Activate shop module for Reconnect (trial)
INSERT INTO tenant_module_subscriptions (tenant_id, module_id, status, trial_ends_at)
SELECT
  'reconnect',
  id,
  'trial',
  NOW() + INTERVAL '30 days'
FROM modules
WHERE slug = 'shop'
ON CONFLICT (tenant_id, module_id) DO NOTHING;
