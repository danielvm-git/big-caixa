#!/usr/bin/env bash
# Provisiona Neon Auth (só Google) para o big-caixa. Requer: neonctl autenticado (`neonctl auth`).
set -euo pipefail

PROJECT_NAME="${NEON_PROJECT_NAME:-big-caixa}"
NEON_ORG_ID="${NEON_ORG_ID:-}"
SITE_URL="${SITE_URL:-https://big-caixa.bigbase.click}"
LOCAL_DEV="${LOCAL_DEV_URL:-http://localhost:5173}"
OUT="${1:-specs/neon-auth.env}"

ORG_ARGS=()
if [ -n "$NEON_ORG_ID" ]; then
	ORG_ARGS=(--org-id "$NEON_ORG_ID")
fi

if ! command -v neonctl >/dev/null 2>&1; then
	echo "ERRO: instale neonctl (npm i -g neonctl)" >&2
	exit 1
fi

if ! neonctl projects list "${ORG_ARGS[@]}" --output json >/tmp/neon-projects.json 2>/dev/null; then
	echo "ERRO: neonctl sem sessão. Rode: neonctl auth" >&2
	exit 1
fi

# neonctl devolve array na raiz ou { projects: [...] } conforme a versão
PROJECT_ID=$(
	jq -r --arg n "$PROJECT_NAME" '
		(if type == "array" then . else .projects end)
		| .[] | select(.name == $n) | .id
	' /tmp/neon-projects.json
)
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "null" ]; then
	if [ -z "$NEON_ORG_ID" ]; then
		echo "ERRO: defina NEON_ORG_ID (org Daniel: org-hidden-truth-74284896) ou use: neonctl orgs list" >&2
		exit 1
	fi
	echo "==> criar projeto Neon: $PROJECT_NAME"
	PROJECT_ID=$(
		neonctl projects create --name "$PROJECT_NAME" "${ORG_ARGS[@]}" --output json | jq -r '.project.id // .id'
	)
fi
echo "==> project_id=$PROJECT_ID"

echo "==> enable Neon Auth"
neonctl neon-auth enable --project-id "$PROJECT_ID"

echo "==> desligar email/senha (só Google)"
neonctl neon-auth config email-password update --project-id "$PROJECT_ID" --enabled false

echo "==> trusted domains"
neonctl neon-auth domain add "$SITE_URL" --project-id "$PROJECT_ID" || true
neonctl neon-auth domain add "$LOCAL_DEV" --project-id "$PROJECT_ID" || true
neonctl neon-auth domain allow-localhost enable --project-id "$PROJECT_ID" || true

echo "==> OAuth: Google (credenciais partilhadas Neon em dev; produção: suas credenciais)"
if ! neonctl neon-auth oauth-provider list --project-id "$PROJECT_ID" --output json 2>/dev/null | jq -e '.[] | select(.id == "google")' >/dev/null; then
	neonctl neon-auth oauth-provider add --provider-id google --project-id "$PROJECT_ID"
fi
for p in github microsoft discord vercel apple; do
	neonctl neon-auth oauth-provider delete --provider-id "$p" --project-id "$PROJECT_ID" 2>/dev/null || true
done

echo "==> status"
neonctl neon-auth status --project-id "$PROJECT_ID"

# Extrair URL de auth (formato JSON varia; usuário confere no console se vazio)
AUTH_URL=$(neonctl neon-auth status --project-id "$PROJECT_ID" --output json 2>/dev/null | jq -r '
	.auth_url // .authUrl // .base_url // .url // empty
' || true)

mkdir -p "$(dirname "$OUT")"
{
	echo "# Gerado por scripts/neon-auth-setup.sh — não versionar se tiver segredos"
	echo "NEON_PROJECT_ID=$PROJECT_ID"
	if [ -n "$AUTH_URL" ]; then
		echo "VITE_NEON_AUTH_URL=$AUTH_URL"
	fi
} >"$OUT"

echo "==> gravado $OUT"
if [ -z "$AUTH_URL" ]; then
	echo "WARN: copie VITE_NEON_AUTH_URL do Neon Console → Auth → Connection string"
fi
echo "Depois: exporte VITE_NEON_AUTH_URL no build (bigbase.toml / GitHub vars) e faça deploy."