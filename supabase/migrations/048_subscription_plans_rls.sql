-- ===========================================
-- RLS Policies for Subscription Plans Tables
-- ===========================================
-- Migratie: 048_subscription_plans_rls.sql
-- Probleem: RLS was enabled maar policies ontbraken
-- Oplossing: Add full CRUD policies voor authenticated users

-- ===========================================
-- AGE_GROUPS
-- ===========================================
ALTER TABLE age_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view age groups" ON age_groups;
CREATE POLICY "Anyone can view age groups"
  ON age_groups FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated can manage age groups" ON age_groups;
CREATE POLICY "Authenticated can manage age groups"
  ON age_groups FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ===========================================
-- PLAN_TYPES
-- ===========================================
ALTER TABLE plan_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view plan types" ON plan_types;
CREATE POLICY "Anyone can view plan types"
  ON plan_types FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated can manage plan types" ON plan_types;
CREATE POLICY "Authenticated can manage plan types"
  ON plan_types FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ===========================================
-- PRICING_MATRIX
-- ===========================================
ALTER TABLE pricing_matrix ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view pricing matrix" ON pricing_matrix;
CREATE POLICY "Anyone can view pricing matrix"
  ON pricing_matrix FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated can manage pricing matrix" ON pricing_matrix;
CREATE POLICY "Authenticated can manage pricing matrix"
  ON pricing_matrix FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ===========================================
-- PLAN_ADDONS
-- ===========================================
ALTER TABLE plan_addons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view plan addons" ON plan_addons;
CREATE POLICY "Anyone can view plan addons"
  ON plan_addons FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated can manage plan addons" ON plan_addons;
CREATE POLICY "Authenticated can manage plan addons"
  ON plan_addons FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ===========================================
-- FAMILY_DISCOUNTS
-- ===========================================
ALTER TABLE family_discounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view family discounts" ON family_discounts;
CREATE POLICY "Anyone can view family discounts"
  ON family_discounts FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated can manage family discounts" ON family_discounts;
CREATE POLICY "Authenticated can manage family discounts"
  ON family_discounts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ===========================================
-- ONE_TIME_PRODUCTS
-- ===========================================
ALTER TABLE one_time_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view one time products" ON one_time_products;
CREATE POLICY "Anyone can view one time products"
  ON one_time_products FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated can manage one time products" ON one_time_products;
CREATE POLICY "Authenticated can manage one time products"
  ON one_time_products FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ===========================================
-- FAMILY_GROUPS
-- ===========================================
ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view family groups" ON family_groups;
CREATE POLICY "Authenticated can view family groups"
  ON family_groups FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated can manage family groups" ON family_groups;
CREATE POLICY "Authenticated can manage family groups"
  ON family_groups FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ===========================================
-- FAMILY_MEMBERS
-- ===========================================
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view family members" ON family_members;
CREATE POLICY "Authenticated can view family members"
  ON family_members FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated can manage family members" ON family_members;
CREATE POLICY "Authenticated can manage family members"
  ON family_members FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ===========================================
-- MEMBER_SUBSCRIPTIONS
-- ===========================================
ALTER TABLE member_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view member subscriptions" ON member_subscriptions;
CREATE POLICY "Authenticated can view member subscriptions"
  ON member_subscriptions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated can manage member subscriptions" ON member_subscriptions;
CREATE POLICY "Authenticated can manage member subscriptions"
  ON member_subscriptions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Anon can create subscriptions (checkout)
DROP POLICY IF EXISTS "Anon can create subscriptions" ON member_subscriptions;
CREATE POLICY "Anon can create subscriptions"
  ON member_subscriptions FOR INSERT
  TO anon
  WITH CHECK (true);

-- ===========================================
-- SUBSCRIPTION_ADDONS
-- ===========================================
ALTER TABLE subscription_addons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view subscription addons" ON subscription_addons;
CREATE POLICY "Authenticated can view subscription addons"
  ON subscription_addons FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated can manage subscription addons" ON subscription_addons;
CREATE POLICY "Authenticated can manage subscription addons"
  ON subscription_addons FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ===========================================
-- CHECKOUT_SESSIONS
-- ===========================================
ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create checkout sessions" ON checkout_sessions;
CREATE POLICY "Anyone can create checkout sessions"
  ON checkout_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view own checkout sessions" ON checkout_sessions;
CREATE POLICY "Anyone can view own checkout sessions"
  ON checkout_sessions FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated can manage checkout sessions" ON checkout_sessions;
CREATE POLICY "Authenticated can manage checkout sessions"
  ON checkout_sessions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ===========================================
-- DOCUMENTATIE
-- ===========================================
COMMENT ON POLICY "Authenticated can manage age groups" ON age_groups IS
  'CRM Staff: beheer van leeftijdsgroepen (Kinderen, Studenten, Volwassenen)';

COMMENT ON POLICY "Authenticated can manage plan types" ON plan_types IS
  'CRM Staff: beheer van plan types (Basic, All-In)';

COMMENT ON POLICY "Authenticated can manage pricing matrix" ON pricing_matrix IS
  'CRM Staff: beheer van prijsmatrix per leeftijdsgroep/plan/duur';
