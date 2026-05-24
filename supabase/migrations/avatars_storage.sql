-- Bucket de avatares (fotos de perfil)

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Avatares leitura pública" ON storage.objects;
CREATE POLICY "Avatares leitura pública" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Usuário upload próprio avatar" ON storage.objects;
CREATE POLICY "Usuário upload próprio avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Usuário atualizar próprio avatar" ON storage.objects;
CREATE POLICY "Usuário atualizar próprio avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars');
