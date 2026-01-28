#!/bin/bash

# ========================================
# THE GENERATOR - Environment Setup Script
# ========================================

set -e

echo "🔧 THE GENERATOR - Configuración de Variables de Entorno"
echo "=========================================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: No se encontró package.json${NC}"
    echo "Por favor ejecuta este script desde /apps/the-generator/"
    exit 1
fi

echo -e "${BLUE}📋 Este script te ayudará a configurar las variables de entorno${NC}"
echo ""

# Función para leer input
read_input() {
    local prompt="$1"
    local var_name="$2"
    local required="$3"
    
    while true; do
        echo -e "${YELLOW}${prompt}${NC}"
        read -r value
        
        if [ -z "$value" ] && [ "$required" = "true" ]; then
            echo -e "${RED}⚠️  Este campo es obligatorio${NC}"
            continue
        fi
        
        if [ -z "$value" ]; then
            echo -e "${YELLOW}⏭️  Saltando (opcional)${NC}"
            echo ""
            return 1
        fi
        
        eval "$var_name='$value'"
        echo ""
        return 0
    done
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  SUNO_COOKIE (OBLIGATORIO)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Para obtener tu token de Suno:"
echo "1. Abre la extensión Chrome de Suno"
echo "2. Abre Chrome DevTools (F12)"
echo "3. Ve a Network → Genera una canción"
echo "4. Busca la request a 'ai.imgkits.com/suno/generate'"
echo "5. Copia el valor del header 'authorization' (sin 'Bearer ')"
echo ""

if read_input "🔑 Pega tu SUNO_COOKIE (Bearer token JWT):" SUNO_COOKIE "true"; then
    HAS_SUNO=true
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  GROQ_API_KEY (OPCIONAL - Para traducción de estilos)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Obtén una API key gratis en: https://console.groq.com/keys"
echo "Si no la configuras, la herramienta funcionará sin traducción automática."
echo ""

if read_input "🤖 GROQ_API_KEY (Enter para saltar):" GROQ_API_KEY "false"; then
    HAS_GROQ=true
fi

# Crear archivo .env.local
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Creando archivo .env.local..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cat > .env.local << EOF
# ========================================
# THE GENERATOR - Environment Variables
# ========================================
# Generated on $(date)

# Suno API Token (REQUIRED)
SUNO_COOKIE=${SUNO_COOKIE}

EOF

if [ "$HAS_GROQ" = true ]; then
    cat >> .env.local << EOF
# Groq API Key (OPTIONAL - For style translation)
GROQ_API_KEY=${GROQ_API_KEY}

EOF
fi

cat >> .env.local << EOF
# Development Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
EOF

echo -e "${GREEN}✅ Archivo .env.local creado exitosamente${NC}"
echo ""

# Preguntar si quiere configurar en Vercel
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "☁️  Configurar en Vercel (Producción)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "¿Quieres configurar estas variables en Vercel ahora?"
echo "(Necesario para que funcione en producción)"
echo ""
read -p "Configurar en Vercel? (s/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo ""
    echo -e "${BLUE}📡 Configurando variables en Vercel...${NC}"
    echo ""
    
    # SUNO_COOKIE
    echo "Configurando SUNO_COOKIE..."
    echo "$SUNO_COOKIE" | npx vercel env add SUNO_COOKIE production
    echo "$SUNO_COOKIE" | npx vercel env add SUNO_COOKIE preview
    echo "$SUNO_COOKIE" | npx vercel env add SUNO_COOKIE development
    
    # GROQ_API_KEY (si existe)
    if [ "$HAS_GROQ" = true ]; then
        echo "Configurando GROQ_API_KEY..."
        echo "$GROQ_API_KEY" | npx vercel env add GROQ_API_KEY production
        echo "$GROQ_API_KEY" | npx vercel env add GROQ_API_KEY preview
        echo "$GROQ_API_KEY" | npx vercel env add GROQ_API_KEY development
    fi
    
    echo ""
    echo -e "${GREEN}✅ Variables configuradas en Vercel${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANTE: Ahora debes redesplegar para que surtan efecto${NC}"
    echo ""
    read -p "¿Quieres redesplegar ahora? (s/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        echo ""
        echo -e "${BLUE}🚀 Redesplegando en Vercel...${NC}"
        npx vercel --prod
        echo ""
        echo -e "${GREEN}✅ Redesplegado exitosamente${NC}"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 ¡Configuración completada!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Próximos pasos:"
echo ""
echo "🔹 Para desarrollo local:"
echo "   npm run dev"
echo ""
echo "🔹 Para verificar variables en Vercel:"
echo "   npx vercel env ls"
echo ""
echo "🔹 Para redesplegar manualmente:"
echo "   npx vercel --prod"
echo ""
echo "📖 Lee ENV_SETUP_GUIDE.md para más información"
echo ""


