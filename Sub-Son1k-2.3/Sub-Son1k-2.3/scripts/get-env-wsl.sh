#!/usr/bin/env bash
# get-env-wsl.sh
# Preparar y exportar JWT_SECRET, DATABASE_URL y REDIS_URL para WSL (en la shell actual).

set -euo pipefail

# 1) Determinar ruta del repo (opcional argumento)
ARG_ROOT="${1:-}"
if [ -n "$ARG_ROOT" ]; then
  ROOT_DIR="$(cd "$ARG_ROOT" && pwd)"
else
  ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fi

ENV_FILE="$ROOT_DIR/.env"

# 2) Cargar .env si existe (exporta las variables cargadas)
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

# 3) Validar variables
validate_env() {
  local ok=0
  local issues=()

  if [ -z "${JWT_SECRET:-}" ]; then
    issues+=("JWT_SECRET is empty")
  else
    if [ ${#JWT_SECRET} -lt 32 ]; then
      issues+=("JWT_SECRET appears too short (${#JWT_SECRET} chars).")
    fi
    if [[ "$JWT_SECRET" =~ [[:space:]] ]]; then
      issues+=("JWT_SECRET contains whitespace.")
    fi
  fi

  if [ -z "${DATABASE_URL:-}" ]; then
    issues+=("DATABASE_URL is empty")
  else
    if [[ ! "$DATABASE_URL" =~ ^postgresql:// ]]; then
      issues+=("DATABASE_URL should start with 'postgresql://'")
    fi
  fi

  if [ -z "${REDIS_URL:-}" ]; then
    issues+=("REDIS_URL is empty")
  else
    if [[ ! "$REDIS_URL" =~ ^redis(s)?:// ]]; then
      issues+=("REDIS_URL should start with 'redis://' or 'rediss://'")
    fi
  fi

  if [ ${#issues[@]} -gt 0 ]; then
    ok=1
    echo "WARNING: Environment validation issues detected." >&2
    for i in "${issues[@]}"; do
      echo " - $i" >&2
    done
  fi

  return $ok
}

# 4) Resumen no sensible de las vars
log_env_summary() {
  echo "ENV summary (lengths):"
  echo "JWT_SECRET length: ${#JWT_SECRET:-0}"
  echo "DATABASE_URL length: ${#DATABASE_URL:-0}"
  echo "REDIS_URL length: ${#REDIS_URL:-0}"
}

# 5) Pedir valores si no están seteados
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
  # Persistir en .env para futuras ejecuciones
  {
    echo "JWT_SECRET=$JWT_SECRET"
    echo "DATABASE_URL=$DATABASE_URL"
    echo "REDIS_URL=$REDIS_URL"
  } > "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  echo "Saved env to $ENV_FILE"
}

# 6) Valores por defecto opcionales
RAILWAY_PROJECT="${RAILWAY_PROJECT:-son1kvers3-backend}"
VERCEL_PROJECT="${VERCEL_PROJECT:-son1kvers3-frontend}"
export RAILWAY_PROJECT VERCEL_PROJECT

# 7) Ejecutar flujo: cargar/validar/exportar
load_env_file

# Validar (no es fatal; permite corregir luego)
validate_env || true
log_env_summary

if [ -z "${JWT_SECRET:-}" ] || [ -z "${DATABASE_URL:-}" ] || [ -z "${REDIS_URL:-}" ]; then
  echo "Missing environment variables. Enter them now."
  prompt_for_vars
else
  echo "Using env vars from .env or exported variables."
fi

# Asegurar que estén exportadas para subshells
export JWT_SECRET DATABASE_URL REDIS_URL

echo "Variables prepared and exported. You can now run deployment scripts that depend on them."
