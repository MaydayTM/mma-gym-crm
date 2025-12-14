-- ===========================================
-- Shop Storage Bucket
-- ===========================================
-- Migratie: 021_shop_storage.sql
-- Doel: Storage bucket voor shop product afbeeldingen

-- Maak de storage bucket aan (als deze nog niet bestaat)
INSERT INTO storage.buckets (id, name, public)
VALUES ('shop-products', 'shop-products', true)
ON CONFLICT (id) DO NOTHING;

-- Policies voor public access (lezen)
CREATE POLICY "Public read access for shop products"
ON storage.objects FOR SELECT
USING (bucket_id = 'shop-products');

-- Policies voor authenticated uploads (schrijven)
CREATE POLICY "Authenticated users can upload shop images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'shop-products');

-- Policies voor authenticated deletes
CREATE POLICY "Authenticated users can delete shop images"
ON storage.objects FOR DELETE
USING (bucket_id = 'shop-products');
