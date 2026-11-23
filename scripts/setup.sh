#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SQLITE_PATH="${SQLITE_PATH:-$HOME/Documents/My_Finances/livro-caixa.sqlite}"
cd "$ROOT"
if [ -d "$ROOT/.githooks" ]; then
	bash "$ROOT/scripts/setup-git-hooks.sh"
fi
mkdir -p logs
if [ -f package-lock.json ]; then
  npm ci
fi
if [ -f "$SQLITE_PATH" ]; then
  sqlite3 "$SQLITE_PATH" "
    CREATE TABLE IF NOT EXISTS fato_evento (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ocorrido_em TEXT NOT NULL DEFAULT (datetime('now')),
      tipo TEXT NOT NULL,
      entidade_id TEXT,
      categoria_anterior TEXT,
      categoria_nova TEXT
    );
    CREATE TABLE IF NOT EXISTS app_event (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ocorrido_em TEXT NOT NULL DEFAULT (datetime('now')),
      tipo TEXT NOT NULL,
      rota TEXT,
      mes TEXT,
      escopo TEXT,
      duracao_ms INTEGER,
      resultado TEXT
    );
  "
  echo "setup: tabelas de evento ok em $SQLITE_PATH"
else
  echo "setup: SQLITE_PATH ausente ($SQLITE_PATH) — pulando DDL"
fi
echo "setup: ok"