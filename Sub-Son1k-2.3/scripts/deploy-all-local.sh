#!/usr/bin/env bash
set -euo pipefail
echo "Starting deploy to Railway (backend) and Vercel (frontend) ..."

ROOT=$(pwd)
BACKEND_DIR="$ROOT/packages/backend" 
FRONTEND_DIR="$ROOT/apps/the-generator"

RAILWAY_PROJECT="${RAILWAY_PROJECT:-son1kvers3-backend}"
JWT_SECRET="${JWT_SECRET:-}"
DATABASE_URL="${DATABASE_URL:-}"
REDIS_URL="${REDIS_URL:-}"
VERCEL_PROJECT="${VERCEL_PROJECT:-son1kvers3-frontend}"

if [ -z "$JWT_SECRET" ]; then
  echo "ERROR: JWT_SECRET env var not set. Export it and re-run." >&2
  exit 1
fi
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL env var not set. Export it and re-run." >&2
  exit 1
fi

echo "[Backend] Deploying to Railway..."
cd "$BACKEND_DIR"
railway login || true
railway link "$RAILWAY_PROJECT" || true
railway variables set JWT_SECRET="$JWT_SECRET" DATABASE_URL="$DATABASE_URL" REDIS_URL="$REDIS_URL" || true
railway up --detach
cd "$ROOT"

echo "[Frontend] Deploying to Vercel..."
cd "$FRONTEND_DIR"
vercel --prod --confirm
cd "$ROOT"

echo "Deployment complete. Check Railway and Vercel dashboards for status."
