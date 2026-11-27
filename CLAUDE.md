# big-caixa

SvelteKit + servidor Node (`server/`) com SQLite (`db/schema.sql`). Produção no Oracle
via Kamal, atrás do Cloudflare Access; o servidor também confere o JWT do Access.

## Observability

| O quê             | Comando                  |
| ----------------- | ------------------------ |
| Health local      | `bash scripts/health.sh` |
| Setup idempotente | `bash scripts/setup.sh`  |
| Dev local         | `bash run_local.sh`      |

Logs do servidor: JSON por linha (`event`, `method`, `path`, `status`, `ms`).
Nunca logar valores, lojas, e-mails, query strings ou tokens.
