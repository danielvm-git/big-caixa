#!/usr/bin/env bash
# Ativa .githooks deste repo (idempotente). Não altera git config global.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOOKS="$ROOT/.githooks"
chmod +x "$HOOKS"/prepare-commit-msg "$HOOKS"/commit-msg
git -C "$ROOT" config core.hooksPath .githooks
echo "git hooks: core.hooksPath=.githooks"