# Deploy na Vercel — checklist

## 1. Enviar o código atualizado para o GitHub

A Vercel compila o repositório **GitHub**, não a pasta local. O commit `main` precisa incluir:

- `pdfjs-dist` em `package.json`
- `transpilePackages: ["react-pdf", "pdfjs-dist"]` em `next.config.ts`
- `src/components/reader/pdf-reader-view.tsx`
- `reader-shell.tsx` com `dynamic()` para o leitor PDF

```bash
git add .
git commit -m "fix: build Vercel (react-pdf ESM e env Supabase)"
git push origin main
```

## 2. Variáveis de ambiente na Vercel

**Settings → Environment Variables** (Production + Preview):

| Variável | Obrigatória |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sim |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim (admin/backup) |
| `NEXT_PUBLIC_APP_URL` | Sim — URL da Vercel, ex. `https://biblioteca-digital.vercel.app` |

Sem as duas primeiras, a app em produção **não autentica** (o build pode passar, mas login falha).

## 3. Supabase — URLs de redirect

**Authentication → URL Configuration:**

- **Site URL:** `https://SEU_DOMINIO.vercel.app`
- **Redirect URLs:** `https://SEU_DOMINIO.vercel.app/**` e `https://SEU_DOMINIO.vercel.app/auth/callback`

## 4. Erro típico no build (já corrigido localmente)

```
ESM packages (pdfjs-dist) need to be imported
```

**Causa:** versão antiga no GitHub sem `transpilePackages` e sem `pdf-reader-view`.

## 5. Depois do push

Vercel → **Deployments** → **Redeploy** no último commit.
