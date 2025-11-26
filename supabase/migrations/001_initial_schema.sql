-- RCN CRM Database Schema
-- Migration: 001_initial_schema
-- Run this in Supabase SQL Editor or via `supabase db push`

-- ============================================
-- ENABLE EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basis info
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  
  -- Adres (voor kaart visualisatie)
  street VARCHAR(255),
  city VARCHAR(255),
  zip_code VARCHAR(10),
  country VARCHAR(100) DEFAULT 'Belgium',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Persoonlijke info
  birth_date DATE,
  gender VARCHAR(20) CHECK (gender IN ('man', 'vrouw', 'anders', 'onbekend')),
  profile_picture_url TEXT,
  
  -- Gym specifiek
  role VARCHAR(50) NOT NULL DEFAULT 'fighter' 
    CHECK (role IN ('admin', 'medewerker', 'coordinator', 'coach', 'fighter', 'fan')),
  disciplines TEXT[] DEFAULT '{}',
  
  -- Gordel tracking (BJJ/Judo/Karate)
  belt_color VARCHAR(50) CHECK (belt_color IN ('white', 'grey', 'yellow', 'orange', 'green', 'blue', 'purple', 'brown', 'black', 'red')),
  belt_stripes INTEGER DEFAULT 0 CHECK (belt_stripes >= 0 AND belt_stripes <= 4),
  belt_updated_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'cancelled', 'lead')),
  insurance_active BOOLEAN DEFAULT false,
  insurance_expires_at DATE,
  
  -- Toegangscontrole
  access_enabled BOOLEAN DEFAULT false,
  access_card_id VARCHAR(100),
  last_checkin_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Stripe koppeling
  stripe_customer_id VARCHAR(255),
  
  -- Auth koppeling
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_role ON members(role);
CREATE INDEX IF NOT EXISTS idx_members_last_checkin ON members(last_checkin_at);
CREATE INDEX IF NOT EXISTS idx_members_auth_user ON members(auth_user_id);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  
  -- Abonnement details
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('subscription', 'punch_card', 'trial', 'day_pass')),
  
  -- Periode
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Punch card specifiek
  total_sessions INTEGER,
  remaining_sessions INTEGER,
  
  -- Financieel
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  billing_interval VARCHAR(20) CHECK (billing_interval IN ('monthly', 'quarterly', 'yearly', 'once')),
  
  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'frozen', 'pending')),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancel_reason TEXT,
  frozen_until DATE,
  
  -- Stripe
  stripe_subscription_id VARCHAR(255),
  stripe_price_id VARCHAR(255),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_member ON subscriptions(member_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);

-- ============================================
-- CHECKINS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  
  checkin_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  checkout_at TIMESTAMP WITH TIME ZONE,
  
  -- Context
  method VARCHAR(50) CHECK (method IN ('qr_code', 'card', 'manual', 'app')),
  location VARCHAR(100) DEFAULT 'main',
  
  -- Sessie info
  class_name VARCHAR(255),
  coach_id UUID REFERENCES members(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_checkins_member ON checkins(member_id);
CREATE INDEX IF NOT EXISTS idx_checkins_date ON checkins(checkin_at);
CREATE INDEX IF NOT EXISTS idx_checkins_member_date ON checkins(member_id, checkin_at DESC);

-- ============================================
-- LEADS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contact info
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  
  -- Lead tracking
  source VARCHAR(100) CHECK (source IN ('facebook', 'instagram', 'google', 'website', 'walk_in', 'referral', 'flyer', 'event', 'other')),
  source_detail TEXT,
  status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'trial_scheduled', 'trial_completed', 'follow_up', 'converted', 'lost')),
  lost_reason TEXT,
  
  -- Pipeline
  assigned_to UUID REFERENCES members(id) ON DELETE SET NULL,
  trial_date TIMESTAMP WITH TIME ZONE,
  follow_up_date DATE,
  
  -- Interest
  interested_in TEXT[] DEFAULT '{}',
  notes TEXT,
  
  -- Conversie tracking
  converted_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  converted_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up ON leads(follow_up_date);

-- ============================================
-- REVENUE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  
  -- Transactie
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  category VARCHAR(100) NOT NULL CHECK (category IN ('subscription', 'bar', 'merchandise', 'pt_session', 'insurance', 'seminar', 'other')),
  description TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
  
  -- Stripe
  stripe_payment_intent_id VARCHAR(255),
  stripe_invoice_id VARCHAR(255),
  
  -- Timing
  paid_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  period_start DATE,
  period_end DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_revenue_member ON revenue(member_id);
CREATE INDEX IF NOT EXISTS idx_revenue_category ON revenue(category);
CREATE INDEX IF NOT EXISTS idx_revenue_paid_at ON revenue(paid_at);
CREATE INDEX IF NOT EXISTS idx_revenue_status ON revenue(status);

-- ============================================
-- RETENTION SCORES VIEW
-- Voor dashboard KPIs
-- ============================================
CREATE OR REPLACE VIEW member_retention_status AS
SELECT 
  id,
  first_name,
  last_name,
  email,
  status,
  last_checkin_at,
  CASE 
    WHEN last_checkin_at > NOW() - INTERVAL '7 days' THEN 'healthy'
    WHEN last_checkin_at > NOW() - INTERVAL '14 days' THEN 'at_risk'
    WHEN last_checkin_at > NOW() - INTERVAL '30 days' THEN 'critical'
    WHEN last_checkin_at IS NULL THEN 'never_visited'
    ELSE 'churned'
  END as retention_status,
  EXTRACT(days FROM NOW() - last_checkin_at)::integer as days_since_visit
FROM members
WHERE status = 'active';

-- ============================================
-- DASHBOARD STATS VIEW
-- ============================================
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM members WHERE status = 'active') as active_members,
  (SELECT COUNT(*) FROM members WHERE created_at > NOW() - INTERVAL '30 days') as new_members_30d,
  (SELECT COUNT(*) FROM members WHERE status = 'cancelled' AND updated_at > NOW() - INTERVAL '30 days') as cancellations_30d,
  (SELECT COUNT(*) FROM checkins WHERE checkin_at > NOW() - INTERVAL '7 days') as checkins_7d,
  (SELECT COUNT(*) FROM leads WHERE status = 'new') as open_leads,
  (SELECT COALESCE(SUM(amount), 0) FROM revenue WHERE paid_at > NOW() - INTERVAL '30 days' AND status = 'completed') as revenue_30d;

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM members WHERE auth_user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- MEMBERS policies
CREATE POLICY "Admins can do everything with members"
  ON members FOR ALL
  USING (get_my_role() = 'admin');

CREATE POLICY "Staff can view all members"
  ON members FOR SELECT
  USING (get_my_role() IN ('medewerker', 'coordinator', 'coach'));

CREATE POLICY "Staff can update members"
  ON members FOR UPDATE
  USING (get_my_role() IN ('medewerker', 'coordinator'));

CREATE POLICY "Users can view own profile"
  ON members FOR SELECT
  USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON members FOR UPDATE
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- SUBSCRIPTIONS policies
CREATE POLICY "Admins can do everything with subscriptions"
  ON subscriptions FOR ALL
  USING (get_my_role() = 'admin');

CREATE POLICY "Staff can view subscriptions"
  ON subscriptions FOR SELECT
  USING (get_my_role() IN ('medewerker', 'coordinator', 'coach'));

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (member_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid()));

-- CHECKINS policies
CREATE POLICY "Admins can do everything with checkins"
  ON checkins FOR ALL
  USING (get_my_role() = 'admin');

CREATE POLICY "Staff can manage checkins"
  ON checkins FOR ALL
  USING (get_my_role() IN ('medewerker', 'coordinator', 'coach'));

CREATE POLICY "Users can view own checkins"
  ON checkins FOR SELECT
  USING (member_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can create own checkins"
  ON checkins FOR INSERT
  WITH CHECK (member_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid()));

-- LEADS policies
CREATE POLICY "Admins can do everything with leads"
  ON leads FOR ALL
  USING (get_my_role() = 'admin');

CREATE POLICY "Staff can manage leads"
  ON leads FOR ALL
  USING (get_my_role() IN ('medewerker', 'coordinator'));

CREATE POLICY "Coaches can view assigned leads"
  ON leads FOR SELECT
  USING (
    get_my_role() = 'coach' AND 
    assigned_to IN (SELECT id FROM members WHERE auth_user_id = auth.uid())
  );

-- REVENUE policies (sensitive - admin only by default)
CREATE POLICY "Admins can do everything with revenue"
  ON revenue FOR ALL
  USING (get_my_role() = 'admin');

CREATE POLICY "Staff can view revenue"
  ON revenue FOR SELECT
  USING (get_my_role() IN ('medewerker'));

-- ============================================
-- SAMPLE DATA (for testing)
-- Comment out in production
-- ============================================

-- Uncomment to insert test admin
/*
INSERT INTO members (first_name, last_name, email, role, status, disciplines, belt_color, belt_stripes)
VALUES 
  ('Mehdi', 'Admin', 'mehdi@reconnect.academy', 'admin', 'active', ARRAY['bjj', 'mma'], 'black', 0),
  ('Test', 'Coach', 'coach@reconnect.academy', 'coach', 'active', ARRAY['bjj'], 'purple', 2),
  ('Test', 'Fighter', 'fighter@reconnect.academy', 'fighter', 'active', ARRAY['bjj', 'kickboxing'], 'blue', 3);
*/
