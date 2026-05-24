# Biblioteca Virtual

Plataforma moderna de biblioteca digital construída com **Next.js 15**, **TypeScript**, **Tailwind CSS**, **shadcn/ui** e **Supabase**.

## Funcionalidades

### Usuário
- Autenticação (registro, login, recuperação e redefinição de senha)
- Perfil editável (nome, e-mail, foto, telefone, senha)
- Catálogo com pesquisa por título, autor e categoria
- Filtros e ordenação de resultados
- Leitor PDF no navegador (zoom, modo escuro, progresso, marcadores, link compartilhável)
- Favoritos e listas pessoais (Quero Ler, Lendo, Finalizados)
- Download de livros (quando permitido pelo admin)
- Avaliações e comentários com respostas
- Notificações (novos livros, respostas)
- Histórico e progresso de leitura

### Administrador
- Dashboard com estatísticas e gráficos
- CRUD de livros (PDF, capa, categorias, destaques)
- Gestão de usuários (bloquear, permissões)
- Categorias e tags
- Moderação de comentários, avaliações e denúncias
- Logs do sistema e orientações de backup

## Requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com)

## Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.local.example .env.local
# Edite .env.local com suas chaves do Supabase

# 3. Executar em desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Configuração do Supabase

### 1. Criar projeto
Crie um projeto em [supabase.com](https://supabase.com) e copie:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Executar schema SQL
No **SQL Editor** do Supabase, execute o conteúdo de:

```
supabase/schema.sql
```

### 3. Configurar Storage
No painel **Storage**, crie os buckets (ou execute a migração abaixo):

| Bucket         | Público | Uso              |
|----------------|---------|------------------|
| `books-covers` | **Sim** | Capas dos livros |
| `books-pdfs`   | **Sim** | Arquivos PDF     |
| `avatars`      | **Sim** | Fotos de perfil  |

Execute também `supabase/migrations/avatars_storage.sql` (upload de foto no perfil).

Execute também no SQL Editor:

```
supabase/migrations/storage_and_read_count.sql
```

Isto cria buckets, políticas de acesso e acelera a contagem de leituras.

### 4. Autenticação (URLs corretas)

No Supabase → **Authentication** → **URL Configuration**:

| Campo | Valor em desenvolvimento |
|-------|--------------------------|
| **Site URL** | `http://localhost:3000` |
| **Redirect URLs** | `http://localhost:3000/**` e `http://localhost:3000/auth/callback` |

No `.env.local`, use `NEXT_PUBLIC_APP_URL=http://localhost:3000` (não use URLs temporárias do Cursor).

Abra a app no browser em **http://localhost:3000** (`npm run dev`). Se aparecer *"All set! Feel free to return to Cursor"*, está num URL de túnel do Cursor em vez da app — use localhost.

---

## Como adicionar um livro (passo a passo)

### Método A — Upload direto no painel (recomendado)

1. Entre como **administrador** → **Administração** → **Livros** → **Adicionar livro**.
2. Preencha título, autor, descrição e categoria.
3. Em **Capa do livro**, clique em **Enviar imagem** e escolha um JPG/PNG/WebP.
4. Em **Ficheiro PDF**, clique em **Enviar PDF** e escolha o ficheiro `.pdf`.
5. Clique em **Adicionar livro**.

O sistema envia os ficheiros para o Supabase Storage e preenche as URLs automaticamente. **Não precisa copiar URL manualmente.**

### Método B — Upload manual no Supabase + colar URL

Use este método se preferir enviar ficheiros pelo site do Supabase.

#### Passo 1: Abrir o Storage

1. Aceda a [supabase.com](https://supabase.com) → seu projeto.
2. Menu lateral → **Storage**.

#### Passo 2: Enviar a capa

1. Abra o bucket **`books-covers`** (crie-o como **público** se não existir).
2. Clique em **Upload file** e envie a imagem (ex.: `minha-capa.jpg`).
3. Após o upload, clique no ficheiro → **Copy URL** (ou **Get URL**).

A URL terá este formato:

```
https://XXXXXXXX.supabase.co/storage/v1/object/public/books-covers/minha-capa.jpg
```

4. No formulário do livro, cole essa URL no campo **URL da capa**.

#### Passo 3: Enviar o PDF

1. Abra o bucket **`books-pdfs`** (crie-o como **público**).
2. Crie uma pasta com o ID do livro (opcional) ou envie diretamente, ex.: `meu-livro.pdf`.
3. Clique no ficheiro → **Copy URL**.

Exemplo de URL:

```
https://XXXXXXXX.supabase.co/storage/v1/object/public/books-pdfs/meu-livro.pdf
```

4. No formulário, cole no campo **URL do PDF**.

#### Passo 4: Onde encontrar a URL?

| Local no Supabase | O que fazer |
|-------------------|-------------|
| **Storage → bucket → ficheiro → ⋮ (menu)** | **Copy URL** ou **Get public URL** |
| **Storage → bucket → ficheiro → duplo clique** | Painel lateral mostra o caminho; URL pública = `Project URL` + `/storage/v1/object/public/` + `bucket` + `/` + `caminho` |

Substitua `XXXXXXXX` pelo ID do seu projeto (visível em **Settings → API → Project URL**).

#### Passo 5: Testar a leitura

1. Guarde o livro como **Publicado**.
2. Abra a página do livro no site → **Ler agora**.
3. O PDF é servido por `/api/books/ID/pdf` (proxy interno), o que evita erros de CORS e buckets privados.

### Problemas comuns ao ler o PDF

| Sintoma | Solução |
|---------|---------|
| Demora muito / não abre | Execute `storage_and_read_count.sql`; envie o PDF pelo formulário (Método A). |
| Erro 502 no leitor | O ficheiro não existe no bucket ou a URL está errada — volte a copiar do Storage. |
| PDF em bucket privado | Use Método A ou torne `books-pdfs` público e execute a migração SQL. |
| `Connect Timeout` nos logs | Rede lenta com Supabase Auth — o leitor já usa `getSession` (cookie) em vez de validar em cada página. |

### 4. Leitor PDF — como funciona

- A rota `/ler/[id]` carrega no cliente (rápido).
- Os dados vêm de `/api/books/[id]/reader`.
- O ficheiro PDF é servido por `/api/books/[id]/pdf` (proxy com URL assinada se necessário).
- Não carrega header/footer na página de leitura (ecrã completo).

### 5. Corrigir erro ao criar usuários (se necessário)
Se aparecer **"Database error saving new user"** ao registrar o 2º usuário em diante, execute:

```
supabase/migrations/fix_user_signup.sql
```

### 6. Criar primeiro administrador
Após registrar sua conta, execute no SQL Editor (substitua o e-mail):

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'seu@email.com';
```

Confirme na página **Meu Perfil** — o campo **Perfil / Papel** deve mostrar **Administrador**.

### 7. Auth — URLs de redirecionamento
Em **Authentication → URL Configuration**, adicione:
- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/auth/callback`

## Estrutura do projeto

```
src/
├── app/              # Rotas (App Router)
│   ├── admin/        # Painel administrativo
│   ├── auth/         # Login, registro, senha
│   ├── livros/       # Catálogo e página do livro
│   ├── ler/          # Leitor PDF
│   ├── perfil/       # Perfil do usuário
│   ├── favoritos/
│   ├── listas/
│   └── notificacoes/
├── components/       # UI e componentes de negócio
├── lib/              # Supabase, actions, utils
├── hooks/
└── types/
supabase/
└── schema.sql        # Schema completo do banco
```

## Scripts

| Comando        | Descrição              |
|----------------|------------------------|
| `npm run dev`  | Servidor de desenvolvimento |
| `npm run build`| Build de produção      |
| `npm run start`| Servidor de produção   |
| `npm run lint` | Verificar código       |

## Deploy

Recomendado: [Vercel](https://vercel.com) + Supabase.

**Guia completo passo a passo:** consulte [`readme_Build.md`](readme_Build.md) (deploy do frontend na Vercel).

Resumo:

1. Faça push do repositório
2. Importe no Vercel
3. Configure as variáveis de ambiente
4. Atualize as URLs de redirect no Supabase para o domínio de produção

## Segurança

- Row Level Security (RLS) em todas as tabelas
- Middleware de proteção de rotas
- Separação de papéis (user / admin)
- Logs de atividades para auditoria
- Backups automáticos via Supabase (ativar PITR em produção)

## Licença

MIT
