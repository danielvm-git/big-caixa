# big-caixa

Web app **big-caixa**: SvelteKit estático hospedado no [BigBase](https://bigbase.click). O livro autoritativo fica no **Postgres do Neon** (schema `caixa`); a leitura passa pela Function `leitura` no branch **production**. Staging e produção no site usam a mesma `VITE_CAIXA_URL`; os branches `production` e `staging` no Neon recebem a mesma carga com `node scripts/copy-sqlite-to-neon.mjs production staging` (última migração do SQLite legado).

## Desenvolvimento

```bash
npm ci
npm run dev
```

Login: **Google** via [Neon Auth](docs/NEON_AUTH.md) (`neonctl` + `scripts/neon-auth-setup.sh`).
`VITE_AUTH_MODE=mock` (só e2e) usa o botão de mock na tela de login.

E2E: `npx playwright install chromium && npm run test:e2e` (o webServer faz build em modo mock e `preview` na 4173).

## Qualidade

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run preflight
bash scripts/setup.sh
```

## Dados (Neon)

```bash
npm run caixa:migrate
# migração legada SQLite → Neon (uma vez, se ainda precisar):
node scripts/copy-sqlite-to-neon.mjs production staging
```

## Deploy (GitHub Actions)

Workflows em `.github/workflows/` (templates v1 de `danielvm-git/.github`). Versão e GitHub Release:
[`big-release`](https://github.com/danielvm-git/big-release) com config em `.big-release.yml` (substitui
semantic-release nos templates estáticos antigos).

**O job Deploy falha até existir:**

1. Site `big-caixa` no BigBase apontando para este repo
2. Secrets no environment `production`:
   - `BIGBASE_SITE_ID`
   - `BIGBASE_DEPLOY_TOKEN` (`bb_dep_…`)

3. Origem `https://big-caixa.bigbase.click` allowlisted para CORS na API de auth

Passo a passo e verificação local: [docs/DEPLOY.md](docs/DEPLOY.md).

Ver [discussão 192 do BigBase](https://github.com/danielvm-git/bigbase/discussions/192).
