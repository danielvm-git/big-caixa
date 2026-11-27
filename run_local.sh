#!/usr/bin/env bash
# Dev local: servidor SQLite (porta 8787, sem Cloudflare Access) + Vite (porta 5173).
# O banco fica em local/caixa.db (ignorado pelo git).
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

npm run dev:server &
API_PID=$!

cleanup() {
	kill $API_PID 2>/dev/null || true
}
trap cleanup EXIT INT TERM

for i in {1..20}; do
	if curl -s http://localhost:8787/up > /dev/null 2>&1; then
		echo "Servidor do caixa pronto em http://localhost:8787"
		break
	fi
	sleep 0.5
done

VITE_AUTH_MODE=local npx vite dev --host 0.0.0.0 --port 5173
