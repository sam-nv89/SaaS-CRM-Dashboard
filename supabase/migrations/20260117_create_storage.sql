-- Create a new storage bucket for logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public viewing of logos
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'logos' );

-- Policy to allow authenticated users to upload logos
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'logos' );

-- Policy to allow authenticated users to update their logos
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'logos' );

-- Policy to allow authenticated users to delete their logos
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'logos' );
