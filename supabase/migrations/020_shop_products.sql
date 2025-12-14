-- ===========================================
-- Shop Products & Variants in CRM Database
-- ===========================================
-- Migratie: 020_shop_products.sql
-- Doel: Producten en varianten voor de shop module

-- Products tabel
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'reconnect-academy',

  -- Basis info
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  seo_slug TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('clothing', 'gear', 'accessories')),

  -- Prijzen
  base_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  presale_price DECIMAL(10, 2),
  presale_ends_at TIMESTAMPTZ,

  -- Beschikbaarheid
  availability_status TEXT NOT NULL DEFAULT 'in_stock'
    CHECK (availability_status IN ('in_stock', 'presale', 'out_of_stock', 'discontinued')),

  -- Pre-order opties
  allow_preorder BOOLEAN DEFAULT true,
  preorder_discount_percent INTEGER CHECK (preorder_discount_percent >= 0 AND preorder_discount_percent <= 100),
  preorder_note TEXT,

  -- Media
  images TEXT[] DEFAULT '{}',
  featured_image TEXT,
  video_url TEXT,
  video_thumbnail TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(tenant_id, seo_slug)
);

-- Product Variants tabel
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL DEFAULT 'reconnect-academy',

  -- Variant info
  name TEXT NOT NULL,
  size TEXT,
  color TEXT,
  sku TEXT,

  -- Prijs aanpassing (+ of - op base_price)
  price_adjustment DECIMAL(10, 2) DEFAULT 0,

  -- Voorraad
  stock_quantity INTEGER DEFAULT 0,
  low_stock_alert INTEGER DEFAULT 5,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders tabel (uitgebreid voor shop)
CREATE TABLE IF NOT EXISTS shop_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'reconnect-academy',
  order_number TEXT NOT NULL,

  -- Klant info
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  member_id UUID REFERENCES members(id),

  -- Levering
  delivery_method TEXT NOT NULL DEFAULT 'pickup' CHECK (delivery_method IN ('pickup', 'shipping')),
  shipping_address JSONB,

  -- Bedragen
  subtotal_amount DECIMAL(10, 2) NOT NULL,
  shipping_amount DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,

  -- Korting
  discount_code_id UUID,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'ready_for_pickup')),

  -- Payment
  stripe_payment_intent_id TEXT,
  stripe_session_id TEXT,
  mollie_payment_id TEXT,

  -- Verzending
  tracking_number TEXT,
  tracking_url TEXT,

  -- Notities
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  ready_for_pickup_at TIMESTAMPTZ,

  -- Constraints
  UNIQUE(tenant_id, order_number)
);

-- Order Items tabel
CREATE TABLE IF NOT EXISTS shop_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
  product_variant_id UUID REFERENCES product_variants(id),

  -- Product info snapshot (voor archief)
  product_name TEXT NOT NULL,
  variant_name TEXT NOT NULL,
  sku TEXT,

  -- Bestelling
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,

  -- Pre-order info
  is_preorder BOOLEAN DEFAULT false,
  preorder_note TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discount codes tabel
CREATE TABLE IF NOT EXISTS shop_discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'reconnect-academy',

  code TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,

  -- Voorwaarden
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  max_uses INTEGER,
  times_used INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(tenant_id, code)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(seo_slug);

CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_tenant ON product_variants(tenant_id);

CREATE INDEX IF NOT EXISTS idx_shop_orders_tenant ON shop_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shop_orders_status ON shop_orders(status);
CREATE INDEX IF NOT EXISTS idx_shop_orders_customer ON shop_orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_shop_orders_number ON shop_orders(order_number);

CREATE INDEX IF NOT EXISTS idx_shop_order_items_order ON shop_order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_shop_discount_codes_tenant ON shop_discount_codes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shop_discount_codes_code ON shop_discount_codes(code);

-- Update trigger voor products
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_updated_at ON products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();

DROP TRIGGER IF EXISTS product_variants_updated_at ON product_variants;
CREATE TRIGGER product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();

DROP TRIGGER IF EXISTS shop_orders_updated_at ON shop_orders;
CREATE TRIGGER shop_orders_updated_at
  BEFORE UPDATE ON shop_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();

-- Disable RLS for development (consistent met rest van project)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants DISABLE ROW LEVEL SECURITY;
ALTER TABLE shop_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE shop_order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE shop_discount_codes DISABLE ROW LEVEL SECURITY;

-- Order number generator functie
CREATE OR REPLACE FUNCTION generate_shop_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  year_prefix TEXT;
  seq_number INTEGER;
BEGIN
  year_prefix := TO_CHAR(NOW(), 'YY');

  -- Get the highest order number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 4) AS INTEGER)), 0) + 1
  INTO seq_number
  FROM shop_orders
  WHERE order_number LIKE 'RC' || year_prefix || '%';

  new_number := 'RC' || year_prefix || LPAD(seq_number::TEXT, 5, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE products IS 'Shop producten - beheerd via CRM admin';
COMMENT ON TABLE product_variants IS 'Product varianten (maat, kleur, etc.)';
COMMENT ON TABLE shop_orders IS 'Bestellingen uit de webshop';
COMMENT ON TABLE shop_order_items IS 'Individuele items in een bestelling';
COMMENT ON TABLE shop_discount_codes IS 'Kortingscodes voor de shop';
