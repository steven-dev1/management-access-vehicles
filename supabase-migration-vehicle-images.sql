-- =============================================
-- MIGRATION: Add vehicle images support
-- =============================================

-- Add images column to vehicles table
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Create storage bucket for vehicle images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vehicle-images',
  'vehicle-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policy: allow all operations
CREATE POLICY "Allow all operations on vehicle images"
  ON storage.objects
  FOR ALL
  USING (bucket_id = 'vehicle-images')
  WITH CHECK (bucket_id = 'vehicle-images');
