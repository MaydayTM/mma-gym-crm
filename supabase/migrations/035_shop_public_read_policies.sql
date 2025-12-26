-- ===========================================
-- Public Read Policies for Shop Tables
-- ===========================================
-- Migratie: 035_shop_public_read_policies.sql
-- Doel: Publieke leestoegang voor shop producten (webshop frontend)
-- Reden: RLS is enabled door security migratie, maar policies ontbraken

-- ==========================================
-- PRODUCTS - Publiek leesbaar (actieve producten)
-- ==========================================
DROP POLICY IF EXISTS "Public can view active products" ON products;
CREATE POLICY "Public can view active products"
  ON products
  FOR SELECT
  USING (is_active = true);

-- Admins kunnen alles met products
DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products"
  ON products
  FOR ALL
  USING (
    auth.role() = 'authenticated' AND (
      auth.jwt() ->> 'role' IN ('admin', 'medewerker')
      OR auth.jwt() -> 'user_metadata' ->> 'role' IN ('admin', 'medewerker')
    )
  );

-- Service role kan alles (voor edge functions)
DROP POLICY IF EXISTS "Service role full access products" ON products;
CREATE POLICY "Service role full access products"
  ON products
  FOR ALL
  USING (auth.role() = 'service_role');

-- ==========================================
-- PRODUCT_VARIANTS - Publiek leesbaar (actieve varianten)
-- ==========================================
DROP POLICY IF EXISTS "Public can view active variants" ON product_variants;
CREATE POLICY "Public can view active variants"
  ON product_variants
  FOR SELECT
  USING (is_active = true);

-- Admins kunnen alles met variants
DROP POLICY IF EXISTS "Admins can manage variants" ON product_variants;
CREATE POLICY "Admins can manage variants"
  ON product_variants
  FOR ALL
  USING (
    auth.role() = 'authenticated' AND (
      auth.jwt() ->> 'role' IN ('admin', 'medewerker')
      OR auth.jwt() -> 'user_metadata' ->> 'role' IN ('admin', 'medewerker')
    )
  );

-- Service role kan alles (voor edge functions)
DROP POLICY IF EXISTS "Service role full access variants" ON product_variants;
CREATE POLICY "Service role full access variants"
  ON product_variants
  FOR ALL
  USING (auth.role() = 'service_role');

-- ==========================================
-- SHOP_BANNERS - Publiek leesbaar (actieve banners)
-- ==========================================
DROP POLICY IF EXISTS "Public can view active banners" ON shop_banners;
CREATE POLICY "Public can view active banners"
  ON shop_banners
  FOR SELECT
  USING (is_active = true);

-- Admins kunnen alles met banners
DROP POLICY IF EXISTS "Admins can manage banners" ON shop_banners;
CREATE POLICY "Admins can manage banners"
  ON shop_banners
  FOR ALL
  USING (
    auth.role() = 'authenticated' AND (
      auth.jwt() ->> 'role' IN ('admin', 'medewerker')
      OR auth.jwt() -> 'user_metadata' ->> 'role' IN ('admin', 'medewerker')
    )
  );

-- Service role kan alles
DROP POLICY IF EXISTS "Service role full access banners" ON shop_banners;
CREATE POLICY "Service role full access banners"
  ON shop_banners
  FOR ALL
  USING (auth.role() = 'service_role');

-- ==========================================
-- SHOP_ORDERS - Alleen eigen orders of admin
-- ==========================================
DROP POLICY IF EXISTS "Users can view own orders" ON shop_orders;
CREATE POLICY "Users can view own orders"
  ON shop_orders
  FOR SELECT
  USING (
    customer_email = auth.jwt() ->> 'email'
    OR auth.role() = 'service_role'
    OR (
      auth.role() = 'authenticated' AND (
        auth.jwt() ->> 'role' IN ('admin', 'medewerker')
        OR auth.jwt() -> 'user_metadata' ->> 'role' IN ('admin', 'medewerker')
      )
    )
  );

-- Service role kan alles (voor webhooks)
DROP POLICY IF EXISTS "Service role full access orders" ON shop_orders;
CREATE POLICY "Service role full access orders"
  ON shop_orders
  FOR ALL
  USING (auth.role() = 'service_role');

-- Admins kunnen alles met orders
DROP POLICY IF EXISTS "Admins can manage orders" ON shop_orders;
CREATE POLICY "Admins can manage orders"
  ON shop_orders
  FOR ALL
  USING (
    auth.role() = 'authenticated' AND (
      auth.jwt() ->> 'role' IN ('admin', 'medewerker')
      OR auth.jwt() -> 'user_metadata' ->> 'role' IN ('admin', 'medewerker')
    )
  );

-- ==========================================
-- SHOP_ORDER_ITEMS - Zelfde als orders
-- ==========================================
DROP POLICY IF EXISTS "Service role full access order items" ON shop_order_items;
CREATE POLICY "Service role full access order items"
  ON shop_order_items
  FOR ALL
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins can manage order items" ON shop_order_items;
CREATE POLICY "Admins can manage order items"
  ON shop_order_items
  FOR ALL
  USING (
    auth.role() = 'authenticated' AND (
      auth.jwt() ->> 'role' IN ('admin', 'medewerker')
      OR auth.jwt() -> 'user_metadata' ->> 'role' IN ('admin', 'medewerker')
    )
  );

-- ==========================================
-- SHIPPING_SETTINGS - Publiek leesbaar
-- ==========================================
DROP POLICY IF EXISTS "Public can view shipping settings" ON shipping_settings;
CREATE POLICY "Public can view shipping settings"
  ON shipping_settings
  FOR SELECT
  USING (true);

-- Service role kan alles
DROP POLICY IF EXISTS "Service role full access shipping" ON shipping_settings;
CREATE POLICY "Service role full access shipping"
  ON shipping_settings
  FOR ALL
  USING (auth.role() = 'service_role');

-- ==========================================
-- SHOP_DISCOUNT_CODES - Alleen admin
-- ==========================================
DROP POLICY IF EXISTS "Admins can manage discount codes" ON shop_discount_codes;
CREATE POLICY "Admins can manage discount codes"
  ON shop_discount_codes
  FOR ALL
  USING (
    auth.role() = 'service_role'
    OR (
      auth.role() = 'authenticated' AND (
        auth.jwt() ->> 'role' IN ('admin', 'medewerker')
        OR auth.jwt() -> 'user_metadata' ->> 'role' IN ('admin', 'medewerker')
      )
    )
  );

-- ==========================================
-- Enable RLS (indien nog niet enabled)
-- ==========================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_discount_codes ENABLE ROW LEVEL SECURITY;

COMMENT ON POLICY "Public can view active products" ON products IS 'Webshop kan actieve producten lezen';
COMMENT ON POLICY "Public can view active variants" ON product_variants IS 'Webshop kan actieve varianten lezen';
