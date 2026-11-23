# big-caixa

Web app **Livro-caixa** da casa: SvelteKit estático hospedado no [BigBase](https://bigbase.click). Os extratos, faturas e o `livro-caixa.sqlite` ficam em **My_Finances**, fora deste repositório.

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

## Sync (máquina local)

```bash
SQLITE_PATH=~/Documents/My_Finances/livro-caixa.sqlite \
BIGBASE_API_KEY=bb_... \
npm run sync
```

## Deploy (GitHub Actions)

Workflows em `.github/workflows/` (templates v1 de `danielvm-git/.github`).

**O job Deploy falha até existir:**

1. Site `big-caixa` no BigBase apontando para este repo
2. Secrets no environment `production`:
   - `BIGBASE_SITE_ID`
   - `BIGBASE_DEPLOY_TOKEN` (`bb_dep_…`)

3. Origem `https://big-caixa.bigbase.click` allowlisted para CORS na API de auth

Passo a passo e verificação local: [docs/DEPLOY.md](docs/DEPLOY.md).

Ver [discussão 192 do BigBase](https://github.com/danielvm-git/bigbase/discussions/192).
