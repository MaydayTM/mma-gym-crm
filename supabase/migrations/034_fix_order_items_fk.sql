-- ===========================================
-- Fix shop_order_items foreign key constraint
-- ===========================================
-- Migratie: 034_fix_order_items_fk.sql
-- Doel: Maak product_variant_id optioneel (geen FK constraint)
-- Reden: Shop producten komen van externe bron, niet altijd in CRM database

-- Drop de foreign key constraint
ALTER TABLE shop_order_items
DROP CONSTRAINT IF EXISTS shop_order_items_product_variant_id_fkey;

-- product_variant_id blijft bestaan maar is nu optioneel zonder FK check
COMMENT ON COLUMN shop_order_items.product_variant_id IS 'Optional reference to product variant - may not exist in local DB if product comes from external shop';
