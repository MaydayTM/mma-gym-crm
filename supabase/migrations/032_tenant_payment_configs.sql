-- ===========================================
-- Shipping Settings (fix for existing table)
-- ===========================================
-- Migratie: 032_tenant_payment_configs.sql
-- Doel: Ensure shipping_settings table exists with correct data

-- Table already exists, just ensure RLS is disabled
ALTER TABLE IF EXISTS shipping_settings DISABLE ROW LEVEL SECURITY;

-- Insert default settings if not exists (using proper tenant_id format)
-- Note: tenant_id might be UUID in existing table, so we skip insert if table has data
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM shipping_settings LIMIT 1) THEN
    -- Only insert if table is empty
    INSERT INTO shipping_settings (shipping_cost, free_shipping_threshold, pickup_enabled, pickup_location)
    VALUES (6.95, 200.00, true, 'Reconnect Academy, Aalst');
  END IF;
END $$;

COMMENT ON TABLE shipping_settings IS 'Verzendkosten instellingen per tenant';
