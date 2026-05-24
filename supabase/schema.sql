-- Biblioteca Virtual - Schema Supabase
-- Execute no SQL Editor do Supabase

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE notification_type AS ENUM ('new_book', 'comment_reply', 'system');
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');

-- Perfis (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  role user_role DEFAULT 'user' NOT NULL,
  is_blocked BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Categorias
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tags
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Livros
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT,
  isbn TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  cover_url TEXT,
  pdf_url TEXT,
  year INTEGER,
  language TEXT DEFAULT 'pt-BR',
  page_count INTEGER DEFAULT 0,
  download_allowed BOOLEAN DEFAULT FALSE NOT NULL,
  is_featured BOOLEAN DEFAULT FALSE NOT NULL,
  is_published BOOLEAN DEFAULT TRUE NOT NULL,
  read_count INTEGER DEFAULT 0 NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE book_tags (
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (book_id, tag_id)
);

-- Avaliações
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  is_approved BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(book_id, user_id)
);

-- Comentários
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Denúncias
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  status report_status DEFAULT 'pending' NOT NULL,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Favoritos
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, book_id)
);

-- Listas pessoais
CREATE TABLE reading_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, slug)
);

CREATE TABLE reading_list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID REFERENCES reading_lists(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(list_id, book_id)
);

-- Progresso de leitura
CREATE TABLE reading_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  current_page INTEGER DEFAULT 1 NOT NULL,
  total_pages INTEGER DEFAULT 0 NOT NULL,
  progress_percent NUMERIC(5,2) DEFAULT 0 NOT NULL,
  reading_time_seconds INTEGER DEFAULT 0 NOT NULL,
  last_read_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, book_id)
);

-- Marcadores de página
CREATE TABLE page_bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  page_number INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Histórico de downloads
CREATE TABLE download_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  downloaded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Notificações
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Logs do sistema
CREATE TABLE system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices
CREATE INDEX idx_books_category ON books(category_id);
CREATE INDEX idx_books_featured ON books(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_author ON books(author);
CREATE INDEX idx_comments_book ON comments(book_id);
CREATE INDEX idx_ratings_book ON ratings(book_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_reading_progress_user ON reading_progress(user_id);

-- View: média de avaliações por livro
CREATE OR REPLACE VIEW book_ratings_summary AS
SELECT
  book_id,
  ROUND(AVG(score)::numeric, 1) AS avg_rating,
  COUNT(*)::integer AS rating_count
FROM ratings
WHERE is_approved = TRUE
GROUP BY book_id;

-- Trigger: criar perfil ao registrar
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON TABLE public.profiles TO supabase_auth_admin;
GRANT ALL ON TABLE public.reading_lists TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- Trigger: updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER books_updated_at BEFORE UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Helper: is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_blocked = FALSE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile" ON profiles FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete profiles" ON profiles FOR DELETE USING (is_admin());

-- Categories
CREATE POLICY "Categories public read" ON categories FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage categories" ON categories FOR ALL USING (is_admin());

-- Tags
CREATE POLICY "Tags public read" ON tags FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage tags" ON tags FOR ALL USING (is_admin());

-- Books
CREATE POLICY "Published books public read" ON books FOR SELECT USING (is_published = TRUE OR is_admin());
CREATE POLICY "Admins manage books" ON books FOR ALL USING (is_admin());

-- Book tags
CREATE POLICY "Book tags public read" ON book_tags FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage book tags" ON book_tags FOR ALL USING (is_admin());

-- Ratings
CREATE POLICY "Approved ratings public read" ON ratings FOR SELECT USING (is_approved = TRUE OR auth.uid() = user_id OR is_admin());
CREATE POLICY "Users create own ratings" ON ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own ratings" ON ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage ratings" ON ratings FOR ALL USING (is_admin());

-- Comments
CREATE POLICY "Approved comments public read" ON comments FOR SELECT USING (is_approved = TRUE OR auth.uid() = user_id OR is_admin());
CREATE POLICY "Users create comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- Reports
CREATE POLICY "Users create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reported_by);
CREATE POLICY "Admins manage reports" ON reports FOR ALL USING (is_admin());

-- Favorites
CREATE POLICY "Users manage own favorites" ON favorites FOR ALL USING (auth.uid() = user_id);

-- Reading lists
CREATE POLICY "Users manage own lists" ON reading_lists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own list items" ON reading_list_items FOR ALL
  USING (EXISTS (SELECT 1 FROM reading_lists WHERE id = list_id AND user_id = auth.uid()));

-- Reading progress
CREATE POLICY "Users manage own progress" ON reading_progress FOR ALL USING (auth.uid() = user_id);

-- Page bookmarks
CREATE POLICY "Users manage own bookmarks" ON page_bookmarks FOR ALL USING (auth.uid() = user_id);

-- Download history
CREATE POLICY "Users view own downloads" ON download_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own downloads" ON download_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all downloads" ON download_history FOR SELECT USING (is_admin());

-- Notifications
CREATE POLICY "Users manage own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- System logs
CREATE POLICY "Admins view logs" ON system_logs FOR SELECT USING (is_admin());
CREATE POLICY "Authenticated insert logs" ON system_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Storage buckets (execute separately in Storage)
-- books-covers (public)
-- books-pdfs (authenticated)

-- Dados iniciais de categorias
INSERT INTO categories (name, slug, description) VALUES
  ('Ficção', 'ficcao', 'Romances e narrativas fictícias'),
  ('Não-Ficção', 'nao-ficcao', 'Obras baseadas em fatos reais'),
  ('Ciência', 'ciencia', 'Livros científicos e técnicos'),
  ('História', 'historia', 'Obras históricas'),
  ('Tecnologia', 'tecnologia', 'Programação, TI e inovação'),
  ('Filosofia', 'filosofia', 'Pensamento e reflexão'),
  ('Infantil', 'infantil', 'Literatura infantil e juvenil')
ON CONFLICT (slug) DO NOTHING;
