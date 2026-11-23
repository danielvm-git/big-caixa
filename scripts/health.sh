#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
if [ ! -f build/health.json ]; then
  echo "health: build/health.json missing — run npm run build"
  exit 1
fi
node -e "
const h=require('./build/health.json');
if(!h.version||!h.sha) process.exit(2);
console.log('health local:', h.version, h.sha);
"
SITE_URL="${SITE_URL:-https://big-caixa.bigbase.click}"
code=$(curl -s -o /dev/null -w '%{http_code}' "$SITE_URL/health.json" || echo 000)
if [ "$code" = "200" ]; then
  echo "health remote: $SITE_URL/health.json ok"
else
  echo "health remote: HTTP $code (site pode ainda não existir)"
fi