-- Shop Database Migration: Preorder & Shipping Options
-- Run this in your SHOP Supabase project (not the CRM database)
-- Date: 2025-12-13

-- ============================================
-- 1. Add preorder columns to products table
-- ============================================

ALTER TABLE products
ADD COLUMN IF NOT EXISTS allow_preorder BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS preorder_discount_percent DECIMAL(5,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS preorder_note VARCHAR(255) DEFAULT NULL;

COMMENT ON COLUMN products.allow_preorder IS 'Allow customers to preorder even when in stock';
COMMENT ON COLUMN products.preorder_discount_percent IS 'Discount percentage for preorders (e.g., 10 for 10% off)';
COMMENT ON COLUMN products.preorder_note IS 'Note shown to customer (e.g., "Delivery in 2-3 weeks")';

-- ============================================
-- 2. Add delivery columns to shop_orders table
-- ============================================

-- First check if delivery_method exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'shop_orders' AND column_name = 'delivery_method') THEN
        ALTER TABLE shop_orders ADD COLUMN delivery_method VARCHAR(20) DEFAULT 'shipping';
    END IF;
END $$;

-- Make shipping_address nullable (for pickup orders)
ALTER TABLE shop_orders
ALTER COLUMN shipping_address DROP NOT NULL;

-- Add Mollie payment ID
ALTER TABLE shop_orders
ADD COLUMN IF NOT EXISTS mollie_payment_id VARCHAR(255) DEFAULT NULL;

-- Add ready_for_pickup timestamp
ALTER TABLE shop_orders
ADD COLUMN IF NOT EXISTS ready_for_pickup_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add constraint for delivery_method
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage
                   WHERE constraint_name = 'shop_orders_delivery_method_check') THEN
        ALTER TABLE shop_orders
        ADD CONSTRAINT shop_orders_delivery_method_check
        CHECK (delivery_method IN ('pickup', 'shipping'));
    END IF;
END $$;

COMMENT ON COLUMN shop_orders.delivery_method IS 'pickup = collect at gym, shipping = home delivery';
COMMENT ON COLUMN shop_orders.ready_for_pickup_at IS 'When pickup order is ready for collection';

-- ============================================
-- 3. Add preorder columns to order_items table
-- ============================================

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS is_preorder BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS preorder_note VARCHAR(255) DEFAULT NULL;

COMMENT ON COLUMN order_items.is_preorder IS 'Whether this item was ordered as preorder';
COMMENT ON COLUMN order_items.preorder_note IS 'Preorder delivery note at time of order';

-- ============================================
-- 4. Create shipping_settings table (per tenant)
-- ============================================

CREATE TABLE IF NOT EXISTS shipping_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    pickup_enabled BOOLEAN DEFAULT true,
    pickup_location VARCHAR(255) DEFAULT 'Reconnect Academy, Aalst',
    shipping_enabled BOOLEAN DEFAULT true,
    shipping_cost DECIMAL(10,2) DEFAULT 6.95,
    free_shipping_threshold DECIMAL(10,2) DEFAULT 200.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(tenant_id)
);

COMMENT ON TABLE shipping_settings IS 'Shipping configuration per tenant';
COMMENT ON COLUMN shipping_settings.free_shipping_threshold IS '0 = no free shipping, otherwise free above this amount';

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_shipping_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS shipping_settings_updated_at ON shipping_settings;
CREATE TRIGGER shipping_settings_updated_at
    BEFORE UPDATE ON shipping_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_shipping_settings_updated_at();

-- ============================================
-- 5. Insert default shipping settings
-- ============================================

-- Note: Replace 'YOUR_TENANT_ID' with your actual tenant ID
-- INSERT INTO shipping_settings (tenant_id, pickup_enabled, pickup_location, shipping_enabled, shipping_cost, free_shipping_threshold)
-- VALUES ('YOUR_TENANT_ID', true, 'Reconnect Academy, Aalst', true, 6.95, 200.00)
-- ON CONFLICT (tenant_id) DO NOTHING;

-- ============================================
-- 6. Create index for better performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_shop_orders_delivery_method ON shop_orders(delivery_method);
CREATE INDEX IF NOT EXISTS idx_order_items_is_preorder ON order_items(is_preorder) WHERE is_preorder = true;

-- ============================================
-- Done!
-- ============================================
-- After running this migration, update your env with your tenant_id:
-- VITE_SHOP_TENANT_ID=your-tenant-id
--
-- Then insert default shipping settings:
-- INSERT INTO shipping_settings (tenant_id) VALUES ('your-tenant-id');
