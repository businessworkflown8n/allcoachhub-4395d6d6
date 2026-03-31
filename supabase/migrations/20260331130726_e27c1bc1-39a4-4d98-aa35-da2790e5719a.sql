
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Coaches can upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = 'coach-websites'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow authenticated users to update their own files
CREATE POLICY "Coaches can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = 'coach-websites'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Coaches can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = 'coach-websites'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
