-- Políticas de Storage e função para contagem de leituras

-- ========== STORAGE: books-covers (público) ==========
INSERT INTO storage.buckets (id, name, public)
VALUES ('books-covers', 'books-covers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Capas públicas leitura" ON storage.objects;
CREATE POLICY "Capas públicas leitura" ON storage.objects
  FOR SELECT USING (bucket_id = 'books-covers');

DROP POLICY IF EXISTS "Admins upload capas" ON storage.objects;
CREATE POLICY "Admins upload capas" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'books-covers'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins atualizar capas" ON storage.objects;
CREATE POLICY "Admins atualizar capas" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'books-covers'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ========== STORAGE: books-pdfs ==========
INSERT INTO storage.buckets (id, name, public)
VALUES ('books-pdfs', 'books-pdfs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "PDFs leitura autenticados" ON storage.objects;
CREATE POLICY "PDFs leitura autenticados" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'books-pdfs');

DROP POLICY IF EXISTS "PDFs leitura anónimos públicos" ON storage.objects;
CREATE POLICY "PDFs leitura anónimos públicos" ON storage.objects
  FOR SELECT USING (bucket_id = 'books-pdfs');

DROP POLICY IF EXISTS "Admins upload PDFs" ON storage.objects;
CREATE POLICY "Admins upload PDFs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'books-pdfs'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins atualizar PDFs" ON storage.objects;
CREATE POLICY "Admins atualizar PDFs" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'books-pdfs'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ========== Contagem de leituras (rápida) ==========
CREATE OR REPLACE FUNCTION public.increment_book_read_count(p_book_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.books SET read_count = read_count + 1 WHERE id = p_book_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_book_read_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_book_read_count(UUID) TO anon;
