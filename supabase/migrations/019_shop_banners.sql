-- =====================================================
-- SHOP BANNERS - Configureerbare banners via CRM
-- =====================================================
--
-- Banner Types en Optimale Formaten:
--
-- | Type       | Gebruik                    | Desktop        | Mobiel         | Ratio  |
-- |------------|----------------------------|----------------|----------------|--------|
-- | hero       | Hoofdbanner bovenaan       | 1920×600 px    | 768×500 px     | 16:5   |
-- | promo      | Seizoens/actie banner      | 1920×400 px    | 768×300 px     | ~5:1   |
-- | category   | Category cards (3x)        | 800×1000 px    | 400×500 px     | 4:5    |
-- | spotlight  | Product highlight sectie   | 800×600 px     | 600×450 px     | 4:3    |
--
-- Aanbevolen bestandsformaten:
-- - JPG voor foto's (80-85% kwaliteit)
-- - PNG voor afbeeldingen met transparantie
-- - WebP als alternatief (40% kleiner)
--
-- Maximale bestandsgrootte: 2MB
--
-- =====================================================

-- Create shop_banners table
CREATE TABLE IF NOT EXISTS shop_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL, -- For multi-tenant support (e.g., 'reconnect')

  -- Banner type and identification
  type TEXT NOT NULL CHECK (type IN ('hero', 'promo', 'category', 'spotlight')),
  slug TEXT, -- For category banners: 'clothing', 'gear', 'accessories'

  -- Content
  title TEXT NOT NULL,
  subtitle TEXT,
  badge_text TEXT, -- e.g., "NEW COLLECTION", "SALE", "PRE-ORDER"
  cta_text TEXT, -- Call-to-action button text
  cta_link TEXT, -- Call-to-action button URL

  -- Images - Desktop and Mobile versions
  image_url TEXT NOT NULL, -- Primary/desktop image
  image_url_mobile TEXT, -- Optional mobile-specific image
  image_alt TEXT,

  -- Styling
  background_color TEXT DEFAULT '#1a1a1a',
  text_color TEXT DEFAULT '#ffffff',
  overlay_opacity INTEGER DEFAULT 50 CHECK (overlay_opacity >= 0 AND overlay_opacity <= 100),

  -- Ordering and visibility
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  -- Scheduling - for seasonal/campaign banners
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,

  -- Constraints
  CONSTRAINT valid_banner_dates CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at),
  CONSTRAINT unique_category_slug UNIQUE (tenant_id, type, slug)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_shop_banners_tenant_type ON shop_banners(tenant_id, type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_shop_banners_scheduling ON shop_banners(is_active, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_shop_banners_slug ON shop_banners(tenant_id, slug) WHERE slug IS NOT NULL;

-- Disable RLS for development (consistent with other tables)
ALTER TABLE shop_banners DISABLE ROW LEVEL SECURITY;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_shop_banner_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS shop_banners_updated_at ON shop_banners;
CREATE TRIGGER shop_banners_updated_at
  BEFORE UPDATE ON shop_banners
  FOR EACH ROW
  EXECUTE FUNCTION update_shop_banner_timestamp();

-- =====================================================
-- SEED DATA - Default Reconnect Academy banners
-- =====================================================

-- Hero Banner
INSERT INTO shop_banners (tenant_id, type, title, subtitle, badge_text, cta_text, cta_link, image_url, image_alt, position)
VALUES (
  'reconnect',
  'hero',
  'Train Like A Champion',
  'Officiële Reconnect Academy merchandise. Premium kwaliteit voor echte vechters.',
  'NEW COLLECTION',
  'Shop Now',
  '/shop/products',
  '/Fight GEAR.png',
  'Reconnect Academy Fighter Gear',
  1
) ON CONFLICT (tenant_id, type, slug) DO NOTHING;

-- Promo Banner (seasonal/campaign)
INSERT INTO shop_banners (tenant_id, type, title, subtitle, badge_text, cta_text, cta_link, image_url, image_alt, position)
VALUES (
  'reconnect',
  'promo',
  'GEAR UP FOR GREATNESS',
  'Pre-order nu en ontvang exclusieve early bird korting op onze nieuwste collectie',
  'PRE-ORDER',
  'Shop Pre-Orders',
  '/shop/products',
  '',
  'Pre-order Reconnect Gear',
  1
) ON CONFLICT (tenant_id, type, slug) DO NOTHING;

-- Category Banners
INSERT INTO shop_banners (tenant_id, type, slug, title, subtitle, image_url, image_alt, position)
VALUES
  (
    'reconnect',
    'category',
    'clothing',
    'Kleding',
    'Hoodies, T-shirts & meer',
    'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=1000&fit=crop',
    'Reconnect Kleding Collectie',
    1
  ),
  (
    'reconnect',
    'category',
    'gear',
    'Fight Gear',
    'Handschoenen, Bescherming',
    'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800&h=1000&fit=crop',
    'Reconnect Fight Gear',
    2
  ),
  (
    'reconnect',
    'category',
    'accessories',
    'Accessoires',
    'Tassen, Wraps & meer',
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=1000&fit=crop',
    'Reconnect Accessoires',
    3
  )
ON CONFLICT (tenant_id, type, slug) DO NOTHING;

-- Spotlight Banner (featured product/custom gear section)
INSERT INTO shop_banners (tenant_id, type, slug, title, subtitle, badge_text, cta_text, cta_link, image_url, image_alt, position)
VALUES (
  'reconnect',
  'spotlight',
  'custom-gloves',
  'Custom Gloves',
  '8 glove models, up to 20 customizable areas, nearly 30 materials available. Design je eigen unieke bokshandschoenen met het Reconnect logo.',
  'CUSTOM GEAR',
  'Customize Now',
  '/shop/products/reconnect-boxing-gloves',
  'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800&h=600&fit=crop',
  'Reconnect Custom Boxing Gloves',
  1
) ON CONFLICT (tenant_id, type, slug) DO NOTHING;

-- =====================================================
-- HELPER VIEW - Active banners with scheduling
-- =====================================================
CREATE OR REPLACE VIEW active_shop_banners AS
SELECT *
FROM shop_banners
WHERE is_active = true
  AND (starts_at IS NULL OR starts_at <= NOW())
  AND (ends_at IS NULL OR ends_at >= NOW())
ORDER BY type, position;

-- Grant access to the view
GRANT SELECT ON active_shop_banners TO anon, authenticated;

-- =====================================================
-- STORAGE BUCKET for banner images
-- =====================================================
-- Note: Run this in Supabase Dashboard > Storage if not exists:
--
-- 1. Create bucket: 'shop-banners'
-- 2. Make public: true
-- 3. Allowed MIME types: image/jpeg, image/png, image/webp
-- 4. Max file size: 2MB (2097152 bytes)
-- =====================================================
