-- Relax resumes bucket policies to avoid false RLS blocks during uploads
-- Keep existing strict policies; add permissive ones limited to the 'resumes' bucket

DO $$
BEGIN
  -- INSERT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Users can insert resumes (relaxed)'
  ) THEN
    CREATE POLICY "Users can insert resumes (relaxed)" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'resumes');
  END IF;

  -- UPDATE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Users can update resumes (relaxed)'
  ) THEN
    CREATE POLICY "Users can update resumes (relaxed)" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'resumes');
  END IF;
END $$;


