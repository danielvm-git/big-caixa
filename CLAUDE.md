# big-caixa

SvelteKit estático; leitura/escrita via Neon Functions no schema `caixa` (Postgres). O SQLite em My_Finances é legado — só `scripts/copy-sqlite-to-neon.mjs` para migração pontual.

## Observability

| O quê             | Comando                                         |
| ----------------- | ----------------------------------------------- |
| Logs JSON         | `tail -f logs/app.jsonl`                        |
| Health local      | `bash scripts/health.sh`                        |
| Setup idempotente | `bash scripts/setup.sh`                         |
| Consulta SQLite   | `bash scripts/consulta.sh custo-mensal 2026-11` |

Nunca logar valores, lojas, e-mails ou tokens.
