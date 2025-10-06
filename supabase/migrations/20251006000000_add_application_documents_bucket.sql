-- Create bucket for application document uploads and add RLS policies

-- 1) Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('application-documents', 'application-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 2) Policies: authenticated users can manage their own objects in this bucket
--    Path convention: <auth.uid()>/<opportunity_id>/<filename>

DO $$
BEGIN
  -- INSERT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Users can insert own application documents'
  ) THEN
    CREATE POLICY "Users can insert own application documents" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'application-documents' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  -- SELECT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Users can read own application documents'
  ) THEN
    CREATE POLICY "Users can read own application documents" ON storage.objects
    FOR SELECT TO authenticated
    USING (
      bucket_id = 'application-documents' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  -- UPDATE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Users can update own application documents'
  ) THEN
    CREATE POLICY "Users can update own application documents" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
      bucket_id = 'application-documents' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  -- DELETE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Users can delete own application documents'
  ) THEN
    CREATE POLICY "Users can delete own application documents" ON storage.objects
    FOR DELETE TO authenticated
    USING (
      bucket_id = 'application-documents' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;


