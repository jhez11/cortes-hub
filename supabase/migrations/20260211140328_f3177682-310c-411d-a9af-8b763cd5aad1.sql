
-- Add image_url column to announcements
ALTER TABLE public.announcements ADD COLUMN image_url TEXT;

-- Create storage bucket for announcement images
INSERT INTO storage.buckets (id, name, public) VALUES ('announcement-images', 'announcement-images', true);

-- Allow public read access to announcement images
CREATE POLICY "Announcement images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'announcement-images');

-- Allow authenticated users to upload announcement images
CREATE POLICY "Authenticated users can upload announcement images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'announcement-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to update their announcement images
CREATE POLICY "Authenticated users can update announcement images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'announcement-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete announcement images
CREATE POLICY "Authenticated users can delete announcement images"
ON storage.objects FOR DELETE
USING (bucket_id = 'announcement-images' AND auth.role() = 'authenticated');
