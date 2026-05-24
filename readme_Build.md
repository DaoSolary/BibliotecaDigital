# Deploy do Frontend — Biblioteca Virtual (Vercel)

Guia passo a passo para publicar a aplicação Next.js na [Vercel](https://vercel.com), com Supabase já configurado.

---

## Pré-requisitos

- Conta no [GitHub](https://github.com), [GitLab](https://gitlab.com) ou [Bitbucket](https://bitbucket.org)
- Código do projeto num repositório Git
- Projeto Supabase criado e configurado (ver `README.md`)
- Node.js 18+ instalado localmente (para testar o build)

---

## Passo 1 — Preparar o repositório

1. Abra o terminal na pasta do projeto (`BibliotecaVirtual`).
2. Inicialize o Git (se ainda não existir):

```bash
git init
git add .
git commit -m "Biblioteca Virtual - versão inicial"
```

3. Crie um repositório vazio no GitHub (ex.: `biblioteca-virtual`).
4. Envie o código:

```bash
git remote add origin https://github.com/SEU_USUARIO/biblioteca-virtual.git
git branch -M main
git push -u origin main
```

---

## Passo 2 — Testar o build localmente

Antes do deploy, confirme que o projeto compila:

```bash
npm install
npm run build
```

Se o build falhar, corrija os erros antes de continuar.

Crie o ficheiro `.env.local` na raiz (não envie para o Git):

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Passo 3 — Criar conta e projeto na Vercel

1. Aceda a [vercel.com](https://vercel.com) e registe-se (pode usar a conta GitHub).
2. No dashboard, clique em **Add New…** → **Project**.
3. **Import** o repositório `biblioteca-virtual` (autorize a Vercel a aceder ao GitHub se pedido).
4. A Vercel deteta automaticamente **Next.js** — mantenha:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./` (raiz do repositório)
   - **Build Command:** `npm run build` (padrão)
   - **Output Directory:** (deixar vazio — Next.js gere automaticamente)

---

## Passo 4 — Variáveis de ambiente na Vercel

Na página de importação do projeto (ou depois em **Settings → Environment Variables**), adicione:

| Nome | Valor | Ambientes |
|------|--------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave `anon` `public` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave `service_role` (secreta) | Production, Preview |
| `NEXT_PUBLIC_APP_URL` | URL da Vercel (ver passo 6) | Production |

**Onde obter as chaves Supabase**

1. [supabase.com](https://supabase.com) → seu projeto  
2. **Settings** → **API**  
3. Copie **Project URL** e **anon public**  
4. Copie **service_role** apenas para a Vercel (nunca no frontend público em repositório)

> Após o primeiro deploy, atualize `NEXT_PUBLIC_APP_URL` para `https://seu-projeto.vercel.app` e faça **Redeploy**.

---

## Passo 5 — Deploy

1. Clique em **Deploy**.
2. Aguarde o build (2–5 minutos na primeira vez).
3. Quando terminar, aparece um link: `https://biblioteca-virtual-xxx.vercel.app`.

---

## Passo 6 — Configurar Supabase para produção

### URLs de autenticação

1. Supabase → **Authentication** → **URL Configuration**
2. **Site URL:** `https://seu-projeto.vercel.app`
3. **Redirect URLs** — adicione:
   - `https://seu-projeto.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (desenvolvimento)

### SQL e Storage

Confirme que executou no Supabase:

- `supabase/schema.sql`
- `supabase/migrations/fix_user_signup.sql` (se necessário)
- `supabase/migrations/storage_and_read_count.sql`
- `supabase/migrations/avatars_storage.sql`

Buckets necessários: `books-covers`, `books-pdfs`, `avatars` (públicos).

---

## Passo 7 — Atualizar `NEXT_PUBLIC_APP_URL`

1. Vercel → projeto → **Settings** → **Environment Variables**
2. Edite `NEXT_PUBLIC_APP_URL` → `https://seu-dominio.vercel.app`
3. **Deployments** → último deploy → **⋯** → **Redeploy**

---

## Passo 8 — Domínio personalizado (opcional)

1. Vercel → **Settings** → **Domains**
2. Adicione o seu domínio (ex.: `biblioteca.seudominio.com`)
3. Siga as instruções DNS (CNAME ou A record)
4. Atualize no Supabase as **Redirect URLs** e **Site URL** com o novo domínio
5. Atualize `NEXT_PUBLIC_APP_URL` na Vercel

---

## Deploy automático (CI/CD)

Cada `git push` na branch `main` gera um novo deploy em produção.

- **Preview:** pull requests recebem URL temporária de preview
- **Production:** merges na `main` atualizam o site principal

---

## Checklist pós-deploy

- [ ] Site abre sem erro 500
- [ ] Login e registo funcionam
- [ ] Catálogo de livros carrega
- [ ] Upload de capa/PDF no admin funciona
- [ ] Leitor PDF abre (`/ler/[id]`)
- [ ] Foto de perfil faz upload (bucket `avatars`)
- [ ] Botões Quero Ler / Lendo / Finalizados no catálogo
- [ ] Histórico de leitura no perfil após abrir um livro

---

## Problemas comuns

| Problema | Solução |
|----------|---------|
| Build falha na Vercel | Corra `npm run build` localmente e corrija erros TypeScript |
| Login redireciona mal | Ajuste Site URL e Redirect URLs no Supabase |
| Imagens/PDF não carregam | Verifique buckets públicos e políticas SQL de Storage |
| Variáveis não aplicadas | Redeploy após alterar Environment Variables |
| `SUPABASE_SERVICE_ROLE_KEY` em falta | Adicione na Vercel; algumas rotas admin podem precisar |

---

## Comandos úteis

```bash
# Desenvolvimento local
npm run dev

# Build de produção (teste)
npm run build
npm run start

# Ver logs na Vercel
# Dashboard → Deployments → deployment → Runtime Logs / Build Logs
```

---

## Resumo rápido

1. Push do código para GitHub  
2. Importar projeto na Vercel  
3. Configurar 4 variáveis de ambiente  
4. Deploy  
5. Ajustar URLs no Supabase e `NEXT_PUBLIC_APP_URL`  
6. Testar login, livros, leitor e perfil  

Para funcionalidades da app e upload de livros, consulte o `README.md` principal.
