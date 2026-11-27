# Deploy no Oracle

## Caminho

1. Push na `main` → **Test Build Release**: preflight, lint, typecheck, testes, e2e,
   build, imagem `linux/arm64` em `ghcr.io/danielvm-git/big-caixa:<sha>` com atestação
   de proveniência, e o artefato `deploy-meta` (sha + digest).
2. **Deploy** (`workflow_run`, só push na `main` deste repo): confere a atestação e que
   a tag aponta para o digest atestado, entra na tailnet como `tag:ci` (OIDC, sem
   segredo do Tailscale), fixa a host key do `oracle-prod` e roda
   `kamal deploy --skip-push`.
3. No fim, confere que `https://caixa.danielvm.net` sem login redireciona para o
   Cloudflare Access. Se responder 200, o job falha.

## Environment `production`

| Nome                                | Tipo      | O quê                                  |
| ----------------------------------- | --------- | -------------------------------------- |
| `KAMAL_SSH_KEY`                     | segredo   | chave do usuário `deploy` no Oracle    |
| `CF_ACCESS_TEAM_DOMAIN`             | segredo   | `<time>.cloudflareaccess.com`          |
| `CF_ACCESS_AUD`                     | segredo   | AUD tag do app do Access               |
| `CAIXA_ALLOWED_EMAILS`              | segredo   | e-mails aceitos, separados por vírgula |
| `TS_OAUTH_CLIENT_ID`, `TS_AUDIENCE` | variáveis | identidade federada do Tailscale       |

## No host (uma vez)

- `/srv/caixa` com dono uid 1000 (o usuário `node` da imagem).
- Rota do túnel `oracle-prod` para `caixa.danielvm.net` → kamal-proxy em `127.0.0.1:8080`.
- App do Cloudflare Access para `caixa.danielvm.net` com política "só estes e-mails".
- Litestream: entrada de `/srv/caixa/caixa.db` em `/etc/litestream.yml`.

## Conferir

```bash
curl -sI https://caixa.danielvm.net/ | head -3   # 302 para *.cloudflareaccess.com
```
