-- Execute no SQL Editor do Supabase se o registro de novos usuários falhar
-- Erro típico: "Database error saving new user"

-- 1. Corrigir função do trigger (search_path + conflitos + permissões)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, 'user'), '@', 1))
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name);

  INSERT INTO public.reading_lists (user_id, name, slug)
  VALUES
    (NEW.id, 'Quero Ler', 'quero-ler'),
    (NEW.id, 'Lendo', 'lendo'),
    (NEW.id, 'Finalizados', 'finalizados')
  ON CONFLICT (user_id, slug) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 2. Permissões para o Auth criar perfil/listas via trigger
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON TABLE public.profiles TO supabase_auth_admin;
GRANT ALL ON TABLE public.reading_lists TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- 3. Garantir que o trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Permitir que usuário crie o próprio perfil se o trigger falhou antes
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
