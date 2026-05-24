-- Reforço: admins podem substituir capas/PDFs (upsert no Storage)

DROP POLICY IF EXISTS "Admins apagar capas" ON storage.objects;
CREATE POLICY "Admins apagar capas" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'books-covers'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins apagar PDFs" ON storage.objects;
CREATE POLICY "Admins apagar PDFs" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'books-pdfs'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
