-- ===========================================
-- Fix Products Tenant ID Issue
-- ===========================================
-- Migratie: 023_fix_products_tenant.sql
-- Probleem: products.tenant_id is UUID met FK naar tenants, maar we willen TEXT gebruiken
-- Oplossing:
--   1. Drop RLS policies die tenant_id gebruiken
--   2. Drop FK constraints
--   3. Change column type naar TEXT
--   4. Set default value
--   5. Recreate policies (disabled for dev)

-- Drop ALL RLS policies op products en product_variants
-- (drop all possible policy names to be safe)
DROP POLICY IF EXISTS "Dev: Reconnect can manage products" ON products;
DROP POLICY IF EXISTS "Dev: Reconnect can manage product_variants" ON product_variants;
DROP POLICY IF EXISTS "Dev: Reconnect can manage variants" ON product_variants;
DROP POLICY IF EXISTS "Public can view active products" ON products;
DROP POLICY IF EXISTS "Public can view product variants" ON product_variants;

-- Drop any other policies that might exist
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'products'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON products', pol.policyname);
    END LOOP;

    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'product_variants'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON product_variants', pol.policyname);
    END LOOP;
END $$;

-- Drop de foreign key constraints
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_tenant_id_fkey;
ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS product_variants_tenant_id_fkey;
ALTER TABLE shop_orders DROP CONSTRAINT IF EXISTS shop_orders_tenant_id_fkey;
ALTER TABLE shop_banners DROP CONSTRAINT IF EXISTS shop_banners_tenant_id_fkey;
ALTER TABLE shop_discount_codes DROP CONSTRAINT IF EXISTS shop_discount_codes_tenant_id_fkey;

-- Change products.tenant_id van UUID naar TEXT
ALTER TABLE products ALTER COLUMN tenant_id TYPE TEXT USING tenant_id::TEXT;
ALTER TABLE products ALTER COLUMN tenant_id SET DEFAULT 'reconnect-academy';

-- Change product_variants.tenant_id van UUID naar TEXT
ALTER TABLE product_variants ALTER COLUMN tenant_id TYPE TEXT USING tenant_id::TEXT;
ALTER TABLE product_variants ALTER COLUMN tenant_id SET DEFAULT 'reconnect-academy';

-- Zorg dat alle bestaande data de juiste tenant_id heeft
UPDATE products SET tenant_id = 'reconnect-academy' WHERE tenant_id IS NULL OR tenant_id = '';
UPDATE product_variants SET tenant_id = 'reconnect-academy' WHERE tenant_id IS NULL OR tenant_id = '';
UPDATE shop_banners SET tenant_id = 'reconnect-academy' WHERE tenant_id IS NULL OR tenant_id = 'reconnect';

-- Disable RLS for development (we don't need tenant isolation yet)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants DISABLE ROW LEVEL SECURITY;
