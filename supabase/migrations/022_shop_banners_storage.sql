-- ===========================================
-- Shop Banners Storage Bucket
-- ===========================================
-- Migratie: 022_shop_banners_storage.sql
-- Doel: Storage bucket voor shop banner afbeeldingen

-- Maak de storage bucket aan (als deze nog niet bestaat)
INSERT INTO storage.buckets (id, name, public)
VALUES ('shop-banners', 'shop-banners', true)
ON CONFLICT (id) DO NOTHING;

-- Policies voor public access (lezen)
CREATE POLICY "Public read access for shop banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'shop-banners');

-- Policies voor authenticated uploads (schrijven)
CREATE POLICY "Authenticated users can upload banner images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'shop-banners');

-- Policies voor authenticated deletes
CREATE POLICY "Authenticated users can delete banner images"
ON storage.objects FOR DELETE
USING (bucket_id = 'shop-banners');
