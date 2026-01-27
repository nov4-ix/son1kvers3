#!/usr/bin/env bash
set -euo pipefail

# Deployment all-in-one script for WSL (Frontend + Backend)
# - Carga variables desde .env o te pide introducirlas
# - Despliega Backend (Railway) y Frontend (Vercel) cuando haya CLI disponibles
# - Ruta del repo: pasa como primer argumento; si no, se detecta desde la ubicación del script

# 1) Determinar ruta del repo
ROOT_DIR="${1:-}"
if [ -z "$ROOT_DIR" ]; then
  ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
else
  ROOT_DIR="$(cd "$ROOT_DIR" && pwd)"
fi

echo "Repo root: $ROOT_DIR"

BACKEND_DIR="$ROOT_DIR/packages/backend"
FRONTEND_DIR="$ROOT_DIR/apps/the-generator"
ENV_FILE="$ROOT_DIR/.env"

# 2) Cargar .env si existe
load_env_file() {
  if [ -f "$ENV_FILE" ]; then
    echo "Loading environment from $ENV_FILE..."
    set -a
    # shellcheck disable=SC1090
    . "$ENV_FILE"
    set +a
  else
    echo "No .env file found at $ENV_FILE"
  fi
}

# 3) Pedir valores si no están seteados
prompt_for_vars() {
  if [ -z "${JWT_SECRET:-}" ]; then
    read -rp "JWT_SECRET: " JWT_SECRET
  fi
  if [ -z "${DATABASE_URL:-}" ]; then
    read -rp "DATABASE_URL: " DATABASE_URL
  fi
  if [ -z "${REDIS_URL:-}" ]; then
    read -rp "REDIS_URL: " REDIS_URL
  fi

  export JWT_SECRET DATABASE_URL REDIS_URL
  # Guardar en .env para futuras ejecuciones
  {
    echo "JWT_SECRET=$JWT_SECRET"
    echo "DATABASE_URL=$DATABASE_URL"
    echo "REDIS_URL=$REDIS_URL"
  } > "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  echo "Saved env to $ENV_FILE"
}

# 4) Opcionales (nombres de proyectos)
RAILWAY_PROJECT="${RAILWAY_PROJECT:-son1kvers3-backend}"
VERCEL_PROJECT="${VERCEL_PROJECT:-son1kvers3-frontend}"

# 5) Verificación de herramientas (opcional)
has_railway() { command -v railway >/dev/null 2>&1; }
has_vercel() { command -v vercel >/dev/null 2>&1; }

# 6) Despliegue Backend
deploy_backend() {
  if [ -d "$BACKEND_DIR" ]; then
    if has_railway; then
      pushd "$BACKEND_DIR" >/dev/null
      railway login >/dev/null 2>&1 || true
      railway link "$RAILWAY_PROJECT" >/dev/null 2>&1 || true
      railway variables set "JWT_SECRET=$JWT_SECRET" "DATABASE_URL=$DATABASE_URL" "REDIS_URL=$REDIS_URL" >/dev/null 2>&1 || true
      railway up --detach
      popd >/dev/null
    else
      echo "Railway CLI not found. Backend deployment skipped."
    fi
  else
    echo "Backend directory not found: $BACKEND_DIR"
  fi
}

# 7) Despliegue Frontend
deploy_frontend() {
  if [ -d "$FRONTEND_DIR" ]; then
    if has_vercel; then
      pushd "$FRONTEND_DIR" >/dev/null
      if [ -n "${VERCEL_PROJECT:-}" ]; then
        vercel --prod --confirm --project "$VERCEL_PROJECT"
      else
        vercel --prod --confirm
      fi
      popd >/dev/null
    else
      echo "Vercel CLI not found. Frontend deployment skipped."
    fi
  else
    echo "Frontend directory not found: $FRONTEND_DIR"
  fi
}

# 8) Ejecutar
main() {
  echo "Starting deployment from root: $ROOT_DIR"
  load_env_file

  if [ -z "${JWT_SECRET:-}" ] || [ -z "${DATABASE_URL:-}" ] || [ -z "${REDIS_URL:-}" ]; then
    echo "Missing environment variables. Will prompt for values."
    prompt_for_vars
  else
    echo "Using env vars from .env or exported vars."
  fi

  export JWT_SECRET DATABASE_URL REDIS_URL
  export RAILWAY_PROJECT="${RAILWAY_PROJECT:-son1kvers3-backend}"
  export VERCEL_PROJECT="${VERCEL_PROJECT:-son1kvers3-frontend}"

  deploy_backend
  deploy_frontend

  echo "Deployment complete."
}

main "$@"
