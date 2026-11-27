#!/usr/bin/env bash
# Setup idempotente: dependências npm.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
npm ci
echo "setup: ok"
