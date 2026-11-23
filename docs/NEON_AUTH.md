# Login com Neon Auth (só Google)

O e-mail/senha do BigBase deixa de ser usado no browser. Quem entra passa pelo **Neon Managed Better Auth** e **Google**.

## 1. CLI

```bash
npm i -g neonctl
neonctl auth          # uma vez, abre o browser
neonctl orgs list     # copie o org-id (ex.: Daniel → org-hidden-truth-74284896)
cd /Users/danielvm/Documents/big-caixa
export NEON_ORG_ID=org-hidden-truth-74284896   # obrigatório se o CLI pedir "What organization"
bash scripts/neon-auth-setup.sh
```

O script:

- Cria o projeto Neon `big-caixa` (se faltar)
- `neon-auth enable`
- Desliga email/senha (`--enabled false`)
- Regista `https://big-caixa.bigbase.click` e `http://localhost:5173`
- Ativa Google (credenciais partilhadas Neon em dev)

Saída: `specs/neon-auth.env` (ignorado pelo git).

## 2. Variáveis de build

Copie `VITE_NEON_AUTH_URL` do Neon Console (Auth → connection URL do branch) para:

- `.env` local (dev)
- `bigbase.toml` → `[env].VITE_NEON_AUTH_URL` (manifest v1; não use `[deploy.env]`)
- Opcional: secret `VITE_NEON_AUTH_URL` no GitHub (variável, não secret, se preferir)

## 3. Produção Google OAuth

Em [Neon OAuth](https://neon.com/docs/auth/guides/setup-oauth), para produção use **suas** credenciais:

```bash
neonctl neon-auth oauth-provider add \
  --provider-id google \
  --oauth-client-id '...' \
  --oauth-client-secret '...' \
  --project-id '<id>'
```

No Google Cloud Console, redirect URI:

```
{NEON_AUTH_BASE_URL}/callback/google
```

(Não use só a URL do site — isso gera `redirect_uri_mismatch`.)

## 4. BigBase collections

O login Neon **não** substitui `BIGBASE_API_KEY` no `npm run sync`. Leitura em produção ainda precisa de JWT compatível com o BigBase ou de fixtures até ligar os dois.
