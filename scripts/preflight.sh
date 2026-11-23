#!/usr/bin/env bash
# Porteira: lint, typecheck, teste, build e higiene de dados financeiros.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> dados financeiros fora do repo"
if git rev-parse --git-dir >/dev/null 2>&1; then
	bad=$(git ls-files | grep -E '\.(sqlite|sqlite-shm|sqlite-wal|db|csv|pdf)$|(^|/)\.env($|\.)|(^|/)\.envrc$|(^|/)logs/|deploy-meta\.json$' | grep -v '^\.env\.example$' || true)
	if [ -n "$bad" ]; then
		echo "ERRO: arquivos proibidos versionados:"; echo "$bad"; exit 1
	fi
fi

echo "==> lint";      npm run lint
echo "==> typecheck"; npm run typecheck
echo "==> test";      npm test
echo "==> build";     npm run build

echo "==> bundle sem sqlite/csv/pdf"
if find build -type f \( -name '*.sqlite*' -o -name '*.csv' -o -name '*.pdf' \) | grep -q .; then
	echo "ERRO: dado financeiro no bundle"; exit 1
fi
test -s build/health.json || { echo "ERRO: build/health.json ausente"; exit 1; }
if ! grep -rq 'ep-lucky-dawn-bbvltogw' build/_app 2>/dev/null; then
	echo "ERRO: bundle sem URL Neon Auth — defina VITE_NEON_AUTH_URL ou fallback em neon-public-url.ts"
	exit 1
fi
echo "preflight OK"
