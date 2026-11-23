# Onda 5 — site no BigBase

Estado: o código, os workflows e o health check estão prontos. Os passos abaixo exigem
credenciais do BigBase e **não foram executados** (não há segredo neste ambiente).

## Passos manuais

1. Registrar o repo `danielvm-git/big-caixa` no BigBase (org, chave, repo).
2. Criar o site `https://big-caixa.bigbase.click` (framework: static).
3. Liberar CORS para a origem `https://big-caixa.bigbase.click` (auth e collections).
   Hoje a API responde `403 origin not allowed` (ver `specs/auth-probe.md`).
   Se o BigBase não liberar a origem, usar `passthrough_paths` da action `bigbase-deploy`
   para servir `/api` na mesma origem.
4. GitHub → Settings → Environments → `production`, criar os segredos:
   - `BIGBASE_SITE_ID`
   - `BIGBASE_DEPLOY_TOKEN` (`bb_dep_…`)
5. Push na `main` dispara `Test Build Release` e, se verde, `Deploy`.
   O `deploy.yml` baixa `deploy-meta.json`, chama a action `@v1` e faz 8 tentativas de health.
6. Conferir:

   ```bash
   SITE_URL=https://big-caixa.bigbase.click bash scripts/health.sh
   curl -s https://big-caixa.bigbase.click/health.json   # version e sha do push
   ```

7. Popular as collections (`mes`, `sankey`, `compra`, …) a partir do SQLite:

   ```bash
   SQLITE_PATH=~/Documents/My_Finances/livro-caixa.sqlite BIGBASE_API_KEY=bb_... npm run sync
   ```

## Verificação local (sem site)

```bash
npm run build
python3 -m http.server 4181 -d build &
SITE_URL=http://localhost:4181 bash scripts/health.sh
```

Sem `SITE_URL`, `scripts/health.sh` confere só `build/health.json` e tenta a URL de produção.
