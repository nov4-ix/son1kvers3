#!/usr/bin/env bash
set -euo pipefail

# Ruta raíz del repositorio (asumiendo que este script está en Sub-Son1k-2.3/scripts)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/packages/backend"
FRONTEND_DIR="$ROOT_DIR/apps/the-generator"
ENV_FILE="$ROOT_DIR/.env"

# Cargar .env si existe
load_env_file() {
  if [[ -f "$ENV_FILE" ]]; then
    echo "Loading environment from $ENV_FILE..."
    # shellcheck disable=SC1090
    set -a
    source "$ENV_FILE"
    set +a
  else
    echo "No .env file found at $ENV_FILE"
  fi
}

# Pedir valores si no están seteados
prompt_for_vars() {
  if [[ -z "${JWT_SECRET:-}" ]]; then
    read -rp "JWT_SECRET: " JWT_SECRET
  fi
  if [[ -z "${DATABASE_URL:-}" ]]; then
    read -rp "DATABASE_URL: " DATABASE_URL
  fi
  if [[ -z "${REDIS_URL:-}" ]]; then
    read -rp "REDIS_URL: " REDIS_URL
  fi

  export JWT_SECRET DATABASE_URL REDIS_URL
}

# Verificar CLI disponibles
check_clis() {
  if ! command -v railway >/dev/null 2>&1; then
    echo "Advertencia: Railway CLI no está instalado. Backend deployment se omite." >&2
  fi
  if ! command -v vercel >/dev/null 2>&1; then
    echo "Advertencia: Vercel CLI no está instalado. Frontend deployment se omite." >&2
  fi
}

# Desplegar backend (Railway)
deploy_backend() {
  if [[ -d "$BACKEND_DIR" ]] && command -v railway >/dev/null 2>&1; then
    pushd "$BACKEND_DIR" >/dev/null
    railway login >/dev/null 2>&1 || true
    railway link "${RAILWAY_PROJECT:-son1kvers3-backend}" >/dev/null 2>&1 || true
    railway variables set JWT_SECRET="$JWT_SECRET" DATABASE_URL="$DATABASE_URL" REDIS_URL="$REDIS_URL" >/dev/null 2>&1 || true
    railway up --detach
    popd >/dev/null
  else
    echo "Backend deployment skipped (missing dir or Railway CLI)."
  fi
}

# Desplegar frontend (Vercel)
deploy_frontend() {
  if [[ -d "$FRONTEND_DIR" ]] && command -v vercel >/dev/null 2>&1; then
    pushd "$FRONTEND_DIR" >/dev/null
    if [[ -n "${VERCEL_PROJECT:-}" ]]; then
      vercel --prod --confirm --project "$VERCEL_PROJECT"
    else
      vercel --prod --confirm
    fi
    popd >/dev/null
  else
    echo "Frontend deployment skipped (missing dir or Vercel CLI)."
  fi
}

main() {
  # Paso 1: cargar .env si existe
  load_env_file

  # Paso 2: si no están las variables obligatorias, pedirlas
  if [[ -z "${JWT_SECRET:-}" || -z "${DATABASE_URL:-}" || -z "${REDIS_URL:-}" ]]; then
    prompt_for_vars
  else
    echo "Usando variables de entorno desde .env (si existen) o desde export/global."
  fi

  # Overrides opcionales
  export RAILWAY_PROJECT="${RAILWAY_PROJECT:-son1kvers3-backend}"
  export VERCEL_PROJECT="${VERCEL_PROJECT:-son1kvers3-frontend}"

  check_clis
  deploy_backend
  deploy_frontend

  echo "Deployment complete."
}

main "$@"
