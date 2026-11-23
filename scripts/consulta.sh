#!/usr/bin/env bash
# Consultas operacionais no Postgres Neon (schema caixa). Não imprime valores sensíveis por padrão.
set -euo pipefail
PROJECT_ID="${NEON_PROJECT_ID:-gentle-voice-24390268}"
BRANCH="${CAIXA_BRANCH:-production}"
CMD="${1:-custo-mensal}"
MES="${2:-}"

conn() {
	neon connection-string "$BRANCH" --project-id "$PROJECT_ID" --pooled false
}

run_sql() {
	psql "$(conn)" -v ON_ERROR_STOP=1 -c "$1"
}

case "$CMD" in
	custo-mensal)
		[[ -n "$MES" ]] || { echo "uso: consulta.sh custo-mensal YYYY-MM" >&2; exit 1; }
		run_sql "SET search_path TO caixa; SELECT COUNT(*) AS linhas FROM v_custo_mensal WHERE mes = '$MES';"
		;;
	pessoas)
		run_sql "SET search_path TO caixa; SELECT id, nome FROM dim_pessoa ORDER BY nome;"
		;;
	*)
		echo "comandos: custo-mensal YYYY-MM | pessoas" >&2
		exit 1
		;;
esac