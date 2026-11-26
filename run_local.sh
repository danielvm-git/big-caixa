#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

echo "=== Starting local Caixa backend (port 8787) ==="
DATABASE_URL="${DATABASE_URL:-postgresql://danielvm@localhost:5432/my_finances}" \
PORT=8787 \
node scripts/run-local-api.mjs &
API_PID=$!

cleanup() {
    echo "Stopping background processes..."
    kill $API_PID 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Waiting for API to be ready..."
for i in {1..10}; do
    if curl -s http://localhost:8787/contas > /dev/null 2>&1; then
        echo "Caixa API is ready at http://localhost:8787"
        break
    fi
    sleep 0.5
done

echo "=== Starting Vite dev server (port 5173) ==="
npx vite dev --host 0.0.0.0 --port 5173
