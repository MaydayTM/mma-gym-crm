-- ============================================
-- Migration 062: Public Assets Storage Bucket
-- ============================================
-- Create a public bucket for static assets like logos
-- that need to be accessible in emails and public pages.
-- ============================================

-- Create the public assets bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assets',
  'assets',
  true,  -- Public bucket - no auth required to read
  5242880,  -- 5MB max file size
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public can view assets"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'assets');

-- Only authenticated users can upload/modify
CREATE POLICY "Authenticated users can upload assets"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'assets');

CREATE POLICY "Authenticated users can update assets"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'assets');

CREATE POLICY "Authenticated users can delete assets"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'assets');
