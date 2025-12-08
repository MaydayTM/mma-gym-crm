-- 015_subscription_plans.sql
-- Subscription Plans Module - Complete schema
-- Datum: 8 december 2025

-- ============================================
-- AGE GROUPS
-- De 3 hoofdcategorieën: Kids, Students, Adults
-- ============================================
CREATE TABLE age_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(50) NOT NULL,
  subtitle VARCHAR(100),
  min_age INTEGER,
  max_age INTEGER,
  starting_price DECIMAL(10,2),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_age_groups_slug ON age_groups(slug);
CREATE INDEX idx_age_groups_active ON age_groups(is_active);

-- ============================================
-- PLAN TYPES
-- Basic (1 sport) vs All-In (alle sporten)
-- ============================================
CREATE TABLE plan_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  features JSONB DEFAULT '[]',
  highlight_text VARCHAR(100),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_plan_types_slug ON plan_types(slug);

-- ============================================
-- PRICING MATRIX
-- Prijzen per age_group + plan_type + duration
-- ============================================
CREATE TABLE pricing_matrix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  age_group_id UUID NOT NULL REFERENCES age_groups(id) ON DELETE CASCADE,
  plan_type_id UUID NOT NULL REFERENCES plan_types(id) ON DELETE CASCADE,
  duration_months INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  price_per_month DECIMAL(10,2),
  savings DECIMAL(10,2) DEFAULT 0,
  includes_insurance BOOLEAN DEFAULT false,
  stripe_price_id VARCHAR(255),
  mollie_plan_id VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(age_group_id, plan_type_id, duration_months)
);

CREATE INDEX idx_pricing_matrix_lookup ON pricing_matrix(age_group_id, plan_type_id, duration_months);
CREATE INDEX idx_pricing_matrix_active ON pricing_matrix(is_active);

-- ============================================
-- PLAN ADDONS
-- Verzekering, materiaalhuur, etc.
-- ============================================
CREATE TABLE plan_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  billing_type VARCHAR(20) NOT NULL,
  applicable_to JSONB,
  is_required BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_plan_addons_slug ON plan_addons(slug);

-- ============================================
-- FAMILY DISCOUNTS
-- Kortingsregels per gezinspositie
-- ============================================
CREATE TABLE family_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position INTEGER UNIQUE NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  description VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ONE-TIME PRODUCTS
-- Dagpas, beurtenkaarten
-- ============================================
CREATE TABLE one_time_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  product_type VARCHAR(20) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  sessions INTEGER,
  validity_days INTEGER NOT NULL,
  description TEXT,
  stripe_price_id VARCHAR(255),
  mollie_payment_id VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_one_time_products_slug ON one_time_products(slug);
CREATE INDEX idx_one_time_products_type ON one_time_products(product_type);

-- ============================================
-- FAMILY GROUPS
-- Gezinnen voor korting
-- ============================================
CREATE TABLE family_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(family_group_id, member_id),
  UNIQUE(member_id)
);

CREATE INDEX idx_family_members_family ON family_members(family_group_id);
CREATE INDEX idx_family_members_member ON family_members(member_id);

-- ============================================
-- MEMBER SUBSCRIPTIONS
-- Actieve lidmaatschappen
-- ============================================
CREATE TABLE member_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  -- Subscription details
  age_group_id UUID REFERENCES age_groups(id),
  plan_type_id UUID REFERENCES plan_types(id),
  duration_months INTEGER,

  -- Discipline keuze (voor Basic)
  selected_discipline_id UUID REFERENCES disciplines(id),

  -- Of een beurtenkaart/dagpas
  one_time_product_id UUID REFERENCES one_time_products(id),
  sessions_remaining INTEGER,

  -- Pricing snapshot
  base_price DECIMAL(10,2) NOT NULL,
  family_discount DECIMAL(10,2) DEFAULT 0,
  addon_total DECIMAL(10,2) DEFAULT 0,
  final_price DECIMAL(10,2) NOT NULL,

  -- Periode
  start_date DATE NOT NULL,
  end_date DATE,

  -- Status
  status VARCHAR(20) DEFAULT 'active',
  auto_renew BOOLEAN DEFAULT true,
  frozen_until DATE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancel_reason TEXT,

  -- Payment provider
  payment_provider VARCHAR(20),
  external_subscription_id VARCHAR(255),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_member_subscriptions_member ON member_subscriptions(member_id);
CREATE INDEX idx_member_subscriptions_status ON member_subscriptions(status);
CREATE INDEX idx_member_subscriptions_end_date ON member_subscriptions(end_date);

-- ============================================
-- SUBSCRIPTION ADDONS
-- Add-ons gekoppeld aan subscription
-- ============================================
CREATE TABLE subscription_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES member_subscriptions(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES plan_addons(id),
  price_paid DECIMAL(10,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscription_addons_subscription ON subscription_addons(subscription_id);

-- ============================================
-- CHECKOUT SESSIONS
-- Lopende checkout processen
-- ============================================
CREATE TABLE checkout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Wat wordt er gekocht?
  checkout_type VARCHAR(20) NOT NULL,
  age_group_id UUID REFERENCES age_groups(id),
  plan_type_id UUID REFERENCES plan_types(id),
  duration_months INTEGER,
  one_time_product_id UUID REFERENCES one_time_products(id),

  -- Discipline keuze (voor Basic)
  selected_discipline_id UUID REFERENCES disciplines(id),

  -- Klantgegevens (guest checkout)
  email VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),
  birth_date DATE,

  -- Opties
  selected_addons JSONB DEFAULT '[]',
  family_group_id UUID REFERENCES family_groups(id),
  family_position INTEGER,
  family_discount DECIMAL(10,2) DEFAULT 0,

  -- Pricing
  subtotal DECIMAL(10,2),
  discount_total DECIMAL(10,2) DEFAULT 0,
  addon_total DECIMAL(10,2) DEFAULT 0,
  final_total DECIMAL(10,2),

  -- Payment
  payment_provider VARCHAR(20),
  external_checkout_id VARCHAR(255),
  payment_status VARCHAR(20) DEFAULT 'pending',

  -- Resultaat
  created_member_id UUID REFERENCES members(id),
  created_subscription_id UUID REFERENCES member_subscriptions(id),

  -- Marketing tracking
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  referrer_url TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX idx_checkout_sessions_status ON checkout_sessions(payment_status);
CREATE INDEX idx_checkout_sessions_email ON checkout_sessions(email);
CREATE INDEX idx_checkout_sessions_expires ON checkout_sessions(expires_at);
CREATE INDEX idx_checkout_sessions_external ON checkout_sessions(external_checkout_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Updated_at trigger voor family_groups
CREATE TRIGGER update_family_groups_updated_at
  BEFORE UPDATE ON family_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Updated_at trigger voor member_subscriptions
CREATE TRIGGER update_member_subscriptions_updated_at
  BEFORE UPDATE ON member_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS DISABLED (development)
-- ============================================
ALTER TABLE age_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE plan_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_matrix DISABLE ROW LEVEL SECURITY;
ALTER TABLE plan_addons DISABLE ROW LEVEL SECURITY;
ALTER TABLE family_discounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE one_time_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE family_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE family_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE member_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_addons DISABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_sessions DISABLE ROW LEVEL SECURITY;

-- Grant access
GRANT ALL ON age_groups TO authenticated, anon;
GRANT ALL ON plan_types TO authenticated, anon;
GRANT ALL ON pricing_matrix TO authenticated, anon;
GRANT ALL ON plan_addons TO authenticated, anon;
GRANT ALL ON family_discounts TO authenticated, anon;
GRANT ALL ON one_time_products TO authenticated, anon;
GRANT ALL ON family_groups TO authenticated, anon;
GRANT ALL ON family_members TO authenticated, anon;
GRANT ALL ON member_subscriptions TO authenticated, anon;
GRANT ALL ON subscription_addons TO authenticated, anon;
GRANT ALL ON checkout_sessions TO authenticated, anon;
