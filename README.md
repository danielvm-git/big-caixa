# big-caixa

Livro-caixa da casa: site SvelteKit e uma API pequena em Node, servidos pelo mesmo
processo. Os dados ficam num arquivo SQLite (`/data/caixa.db`) no Oracle, com cópia
contínua para o Contabo pelo Litestream. Produção: `https://caixa.danielvm.net`, atrás
do **Cloudflare Access** (só e-mails da lista entram).

## Como funciona

| Parte                                            | Onde                                                      |
| ------------------------------------------------ | --------------------------------------------------------- |
| Schema SQLite (tabelas e views)                  | `db/schema.sql` — aplicado a cada boot, idempotente       |
| Leitura (`GET /api/leitura/:coleção[/:período]`) | `server/leitura.mjs`                                      |
| Escrita (`POST /api/escrita`, campo `op`)        | `server/escrita.mjs`                                      |
| Quem está logado (`GET /api/me`)                 | `server/access.mjs` confere o JWT do Access de novo       |
| Site e rotas                                     | `server/app.mjs` serve `build/`; `/up` é a saúde do Kamal |

O servidor confere em toda chamada à API o JWT que o Access põe em
`Cf-Access-Jwt-Assertion` (assinatura, emissor, audiência, validade) e exige que o
e-mail esteja em `CAIXA_ALLOWED_EMAILS`. Sem essa configuração ele não sobe.

## Desenvolvimento

```bash
npm ci
bash run_local.sh        # servidor local na 8787 (sem Access) + Vite na 5173
```

O banco local fica em `local/caixa.db` (ignorado pelo git). `VITE_AUTH_MODE=mock`
(só e2e) usa dados de exemplo.

E2E: `npx playwright install chromium && npm run test:e2e`.

## Qualidade

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run preflight
```

## Deploy

Só pelo GitHub Actions: `Test Build Release` testa, constrói a imagem arm64 e a
atesta; `Deploy` confere a atestação, entra na tailnet (OIDC) e roda o Kamal no
Oracle. Passo a passo e segredos: [docs/DEPLOY.md](docs/DEPLOY.md).

## Histórico

Até 2026-11-27 o livro ficava no Postgres do Neon, com Functions e Neon Auth. Foi
copiado para o SQLite com conferência tabela por tabela, e o projeto do Neon foi
apagado. O dump completo do Neon ficou no Contabo
(`/backup/neon-big-caixa-production-20261127.dump`).
