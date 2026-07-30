-- =============================================
-- MIGRATION: Add vehicle images support
-- =============================================

-- Create storage bucket for vehicle images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vehicle-images',
  'vehicle-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policy: permissive (tenant isolation client-side)
CREATE POLICY "vehicle_images_all" ON storage.objects
  FOR ALL USING (bucket_id = 'vehicle-images')
  WITH CHECK (bucket_id = 'vehicle-images');
