-- Create hotel-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hotel-images',
  'hotel-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

-- Public read access for hotel images
DROP POLICY IF EXISTS "hotel_images_public_read" ON storage.objects;
CREATE POLICY "hotel_images_public_read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'hotel-images');

-- Admin upload access
DROP POLICY IF EXISTS "hotel_images_admin_insert" ON storage.objects;
CREATE POLICY "hotel_images_admin_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'hotel-images'
  AND EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Admin update access
DROP POLICY IF EXISTS "hotel_images_admin_update" ON storage.objects;
CREATE POLICY "hotel_images_admin_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'hotel-images'
  AND EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Admin delete access
DROP POLICY IF EXISTS "hotel_images_admin_delete" ON storage.objects;
CREATE POLICY "hotel_images_admin_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'hotel-images'
  AND EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);
