# big-caixa

SvelteKit estático, dados via collections BigBase, depósito em `~/Documents/My_Finances/livro-caixa.sqlite`.

## Observability

| O quê             | Comando                                         |
| ----------------- | ----------------------------------------------- |
| Logs JSON         | `tail -f logs/app.jsonl`                        |
| Health local      | `bash scripts/health.sh`                        |
| Setup idempotente | `bash scripts/setup.sh`                         |
| Consulta SQLite   | `bash scripts/consulta.sh custo-mensal 2026-11` |

Nunca logar valores, lojas, e-mails ou tokens.
