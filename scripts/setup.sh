#!/usr/bin/env bash
# Setup idempotente: deps npm + migração v2 no Neon (branches production e staging).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
npm ci
echo "setup: npm ok"
if command -v neon >/dev/null 2>&1; then
	node scripts/apply-caixa-migration.mjs production staging || true
else
	echo "setup: neon CLI ausente — pule migração ou instale neonctl"
fi
echo "setup: ok"