/*
  # Create logos storage bucket and policies

  1. Storage
    - Create public 'logos' bucket for business logo uploads

  2. Policies
    - Allow authenticated users to upload their own logos (user_id folder)
    - Allow public read access (logos are shown on invoices/PDFs)
    - Allow authenticated users to update/delete their own logos
*/

INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own logo"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own logo"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own logo"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public read logos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'logos');
