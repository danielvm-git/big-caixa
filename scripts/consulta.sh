#!/usr/bin/env bash
set -euo pipefail
SQLITE_PATH="${SQLITE_PATH:-$HOME/Documents/My_Finances/livro-caixa.sqlite}"
CMD="${1:-}"
ARG="${2:-}"
if [ ! -f "$SQLITE_PATH" ]; then
  echo "consulta: sqlite não encontrado: $SQLITE_PATH" >&2
  exit 1
fi
case "$CMD" in
  custo-mensal)
    MES="${ARG:-$(date +%Y-%m)}"
    sqlite3 -header -column "$SQLITE_PATH" \
      "SELECT mes, escopo, categoria_id, custo_recorrente, custo_extraordinario FROM v_custo_mensal WHERE mes='$MES' ORDER BY escopo, categoria_id LIMIT 40;"
    ;;
  transferencias-sem-par)
    sqlite3 -header -column "$SQLITE_PATH" \
      "SELECT id, data_caixa, descricao_original, valor_centavos FROM v_transferencia_sem_par ORDER BY data_caixa DESC LIMIT 30;"
    ;;
  eventos)
    TIPO="${ARG:-}"
    sqlite3 -header -column "$SQLITE_PATH" \
      "SELECT * FROM fato_evento WHERE tipo LIKE '%${TIPO}%' ORDER BY ocorrido_em DESC LIMIT 30;"
    ;;
  *)
    echo "Uso: consulta.sh custo-mensal [AAAA-MM] | transferencias-sem-par | eventos [tipo]" >&2
    exit 1
    ;;
esac