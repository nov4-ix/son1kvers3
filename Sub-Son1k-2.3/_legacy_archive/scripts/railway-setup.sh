#!/bin/bash

# 🚂 Railway CLI Automated Setup Script
# Este script configura todo el proyecto en Railway desde CLI

set -e  # Exit on error

echo "🚂 Railway CLI Setup - Super-Son1k-2.2"
echo "======================================"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para mostrar pasos
step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 1. Verificar que Railway CLI esté instalado
step "Verificando Railway CLI..."
if ! command -v railway &> /dev/null; then
    error "Railway CLI no está instalado."
    echo "Instalando con: brew install railway"
    brew install railway
fi

# 2. Login (abrirá navegador para autenticación)
step "Iniciando sesión en Railway..."
railway login

# 3. Crear proyecto (conectado a GitHub)
step "Creando proyecto Railway..."
railway init

# Preguntar nombre del proyecto
read -p "Nombre del proyecto [sub-son1k-2-2]: " PROJECT_NAME
PROJECT_NAME=${PROJECT_NAME:-sub-son1k-2-2}

# 4. Agregar PostgreSQL
step "Agregando PostgreSQL..."
railway add --database postgres

# 5. Agregar Redis
step "Agregando Redis..."
railway add --database redis

# 6. Configurar variables de entorno
step "Configurando variables de entorno..."

# Solicitar tokens y secrets
echo ""
warning "NECESITAMOS CONFIGURAR VARIABLES CRÍTICAS:"
echo ""

read -p "SUNO_TOKENS (separados por comas): " SUNO_TOKENS
read -p "JWT_SECRET (mínimo 32 chars): " JWT_SECRET
read -p "TOKEN_ENCRYPTION_KEY (mínimo 32 chars): " TOKEN_ENCRYPTION_KEY

# Configurar variables
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set SUNO_TOKENS="$SUNO_TOKENS"
railway variables set JWT_SECRET="$JWT_SECRET"
railway variables set TOKEN_ENCRYPTION_KEY="$TOKEN_ENCRYPTION_KEY"

# APIs externas
railway variables set GENERATION_API_URL=https://ai.imgkits.com/suno
railway variables set NEURAL_ENGINE_API_URL=https://ai.imgkits.com/suno
railway variables set COVER_API_URL=https://usa.imgkits.com/node-api/suno
railway variables set GENERATION_POLLING_URL=https://usa.imgkits.com/node-api/suno
railway variables set NEURAL_ENGINE_POLLING_URL=https://usa.imgkits.com/node-api/suno

# CORS (actualizar luego con dominio real)
railway variables set ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000"

step "Variables configuradas ✓"

# 7. Deploy
step "Desplegando a Railway..."
railway up

# 8. Obtener URL
step "Obteniendo URL del deployment..."
RAILWAY_URL=$(railway domain)

echo ""
echo "======================================"
echo -e "${GREEN}✅ DEPLOYMENT COMPLETADO${NC}"
echo "======================================"
echo ""
echo "Backend URL: $RAILWAY_URL"
echo ""
echo "Verificar health check:"
echo "curl $RAILWAY_URL/health"
echo ""
echo "Próximos pasos:"
echo "1. Probar health check"
echo "2. Agregar tokens Suno si faltaron"
echo "3. Configurar frontend con esta URL"
echo "4. ¡Empezar pruebas online!"
echo ""
