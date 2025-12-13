-- Shop Database Migration: Stock decrease function
-- Run this in your SHOP Supabase project
-- Date: 2025-12-13

-- Function to safely decrease variant stock after payment
CREATE OR REPLACE FUNCTION decrease_variant_stock(
  p_variant_id UUID,
  p_quantity INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_stock INTEGER;
BEGIN
  -- Get current stock with lock
  SELECT stock_quantity INTO v_current_stock
  FROM product_variants
  WHERE id = p_variant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Decrease stock (allow negative for overselling edge cases)
  UPDATE product_variants
  SET
    stock_quantity = GREATEST(0, stock_quantity - p_quantity),
    updated_at = NOW()
  WHERE id = p_variant_id;

  RETURN TRUE;
END;
$$;

-- Grant execute to authenticated users (for edge functions)
GRANT EXECUTE ON FUNCTION decrease_variant_stock TO authenticated;
GRANT EXECUTE ON FUNCTION decrease_variant_stock TO service_role;

-- Also create a function to restore stock (for cancelled orders)
CREATE OR REPLACE FUNCTION restore_variant_stock(
  p_variant_id UUID,
  p_quantity INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE product_variants
  SET
    stock_quantity = stock_quantity + p_quantity,
    updated_at = NOW()
  WHERE id = p_variant_id;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION restore_variant_stock TO authenticated;
GRANT EXECUTE ON FUNCTION restore_variant_stock TO service_role;
