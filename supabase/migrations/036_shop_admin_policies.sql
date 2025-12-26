-- ===========================================
-- Admin Policies for Shop Management
-- ===========================================
-- Migratie: 036_shop_admin_policies.sql
-- Doel: Authenticated users kunnen producten beheren
-- Reden: INSERT/UPDATE/DELETE gaf 403 Forbidden

-- ==========================================
-- PRODUCTS - Authenticated users kunnen beheren
-- ==========================================
DROP POLICY IF EXISTS "Authenticated can insert products" ON products;
CREATE POLICY "Authenticated can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can update products" ON products;
CREATE POLICY "Authenticated can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can delete products" ON products;
CREATE POLICY "Authenticated can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (true);

-- ==========================================
-- PRODUCT_VARIANTS - Authenticated users kunnen beheren
-- ==========================================
DROP POLICY IF EXISTS "Authenticated can insert variants" ON product_variants;
CREATE POLICY "Authenticated can insert variants"
  ON product_variants FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can update variants" ON product_variants;
CREATE POLICY "Authenticated can update variants"
  ON product_variants FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can delete variants" ON product_variants;
CREATE POLICY "Authenticated can delete variants"
  ON product_variants FOR DELETE
  TO authenticated
  USING (true);

-- ==========================================
-- SHOP_BANNERS - Authenticated users kunnen beheren
-- ==========================================
DROP POLICY IF EXISTS "Authenticated can insert banners" ON shop_banners;
CREATE POLICY "Authenticated can insert banners"
  ON shop_banners FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can update banners" ON shop_banners;
CREATE POLICY "Authenticated can update banners"
  ON shop_banners FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can delete banners" ON shop_banners;
CREATE POLICY "Authenticated can delete banners"
  ON shop_banners FOR DELETE
  TO authenticated
  USING (true);

-- ==========================================
-- SHOP_ORDERS - Authenticated users kunnen beheren
-- ==========================================
DROP POLICY IF EXISTS "Authenticated can view orders" ON shop_orders;
CREATE POLICY "Authenticated can view orders"
  ON shop_orders FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated can update orders" ON shop_orders;
CREATE POLICY "Authenticated can update orders"
  ON shop_orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- SHOP_ORDER_ITEMS - Authenticated users kunnen bekijken
-- ==========================================
DROP POLICY IF EXISTS "Authenticated can view order items" ON shop_order_items;
CREATE POLICY "Authenticated can view order items"
  ON shop_order_items FOR SELECT
  TO authenticated
  USING (true);

-- ==========================================
-- SHOP_DISCOUNT_CODES - Authenticated users kunnen beheren
-- ==========================================
DROP POLICY IF EXISTS "Authenticated can manage discount codes" ON shop_discount_codes;
CREATE POLICY "Authenticated can manage discount codes"
  ON shop_discount_codes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- SHIPPING_SETTINGS - Authenticated users kunnen beheren
-- ==========================================
DROP POLICY IF EXISTS "Authenticated can manage shipping settings" ON shipping_settings;
CREATE POLICY "Authenticated can manage shipping settings"
  ON shipping_settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
