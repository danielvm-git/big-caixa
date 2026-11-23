# Onda 5 — site no BigBase

Estado: o código, os workflows e o health check estão prontos. Os passos abaixo exigem
credenciais do BigBase e **não foram executados** (não há segredo neste ambiente).

## Passos manuais

1. Registrar o repo `danielvm-git/big-caixa` no BigBase (org, chave, repo).
2. Criar o site `https://big-caixa.bigbase.click` (framework: static).
3. Liberar CORS para a origem `https://big-caixa.bigbase.click` (auth e collections).
   Hoje a API responde `403 origin not allowed` (ver `specs/auth-probe.md`).
   O deploy já envia `passthrough_paths: ["/api"]` via GitHub Action.
   Variáveis de build (`VITE_*`) ficam em `bigbase.toml` → secção `[env]` (manifest v1).
   Em dev local, use `.env` a partir de `specs/neon-auth.env`.
4. GitHub → Settings → Environments → `production`, criar os segredos (hoje o environment
   `production` existe mas **não tem secrets**):
   - `BIGBASE_SITE_ID` — ID do site `big-caixa` (MCP `list_sites` / `get_site`)
   - `BIGBASE_DEPLOY_TOKEN` — MCP `provision_ci_credentials` → prefixo `bb_dep_`

   Passo a passo BigBase MCP: [discussão 192](https://github.com/danielvm-git/bigbase/discussions/192).

5. Push na `main` dispara **`Test Build Release`** (test → build → release). Quando esse workflow termina **com sucesso** num push à `main`, o workflow **`Deploy`** corre via `workflow_run`. Se o build falha, o job de deploy não corre.

**Dois builds, um gate:** o GitHub Actions corre lint/test/build para validar o push e grava `deploy-meta.json` (sha). O job `deploy` só chama a API BigBase com esse sha; o **host** clona o repo **big-caixa** (não o monólito BigBase) e corre `npm run build:bigbase` conforme `bigbase.toml`. O artefato `build/` do CI **não** é enviado — produção é sempre o build remoto no BigBase.

**Webhook GitHub → BigBase:** o push só atualiza o mirror do repo; **não** dispara deploy sem a API (`bb_dep_`). O deploy de produção é o workflow `Deploy`, e só depois de `Test Build Release` concluir com sucesso.

**BigBase + manifest:** o host corre `build.command` com `exec` (sem shell). Não use
`npm ci && npm run build` no TOML — só corre `npm ci`. Use `npm run build:bigbase` no
manifest (script npm com `&&` interno).
O job `deploy` baixa `deploy-meta.json`, chama a action `@v1` e espera até **6 min** que `health.json` em produção tenha o mesmo `sha` do push (não basta HTTP 200 no `/`).

6. Conferir:

```bash
SITE_URL=https://big-caixa.bigbase.click bash scripts/health.sh
curl -s https://big-caixa.bigbase.click/health.json   # version e sha do push
```

7. Dados do livro: Postgres Neon (`npm run caixa:migrate`). Carga legada opcional: `node scripts/copy-sqlite-to-neon.mjs production staging`. Deploy das functions `leitura` e `escrita` no branch **production**; o site usa `VITE_CAIXA_URL` e `VITE_CAIXA_ESCRITA_URL` no `bigbase.toml`.

## Verificação local (sem site)

```bash
npm run build
python3 -m http.server 4181 -d build &
SITE_URL=http://localhost:4181 bash scripts/health.sh
```

Sem `SITE_URL`, `scripts/health.sh` confere só `build/health.json` e tenta a URL de produção.
