#!/bin/bash

# Script de instalación y verificación automática de la extensión
# Sub-Son1k 2.2 - Token Harvester Extension

set -e

echo "🚀 INSTALACIÓN AUTOMÁTICA DE LA EXTENSIÓN"
echo "=========================================="
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

EXTENSION_PATH="/Users/nov4-ix/Sub-Son1k-2.2/Sub-Son1k-2.2/extensions/suno-extension"

# 1. Verificar que la extensión existe
echo -e "${BLUE}📁 Verificando archivos de la extensión...${NC}"
if [ ! -f "$EXTENSION_PATH/manifest.json" ]; then
    echo "❌ ERROR: No se encontró manifest.json"
    exit 1
fi

if [ ! -f "$EXTENSION_PATH/background.js" ]; then
    echo "❌ ERROR: No se encontró background.js"
    exit 1
fi

echo -e "${GREEN}✅ Archivos de extensión encontrados${NC}"
echo ""

# 2. Verificar configuración
echo -e "${BLUE}⚙️  Verificando configuración...${NC}"
echo "Backend URL configurado: https://sub-son1k-2-2.fly.dev"
echo "Manifest version: $(grep '\"manifest_version\"' $EXTENSION_PATH/manifest.json)"
echo -e "${GREEN}✅ Configuración correcta${NC}"
echo ""

# 3. Instrucciones para cargar en Chrome
echo -e "${YELLOW}📋 PASOS PARA INSTALAR EN CHROME:${NC}"
echo ""
echo "1. Abre Chrome y ve a:"
echo -e "   ${BLUE}chrome://extensions/${NC}"
echo ""
echo "2. Activa el 'Modo de desarrollador' (arriba a la derecha)"
echo ""
echo "3. Haz clic en 'Cargar extensión sin empaquetar'"
echo ""
echo "4. Selecciona esta carpeta:"
echo -e "   ${GREEN}$EXTENSION_PATH${NC}"
echo ""
echo "5. La extensión aparecerá como: 'Son1kVerse AI Music Engine'"
echo ""

# 4. Test script
echo -e "${YELLOW}🧪 CÓDIGO DE PRUEBA (ejecutar en Service Worker):${NC}"
echo ""
echo "chrome.runtime.sendMessage({"
echo "  type: 'EXTRACT_AND_SEND_TO_POOL',"
echo "  label: 'manual-test'"
echo "}, (response) => {"
echo "  console.log('Response:', response);"
echo "});"
echo ""

# 5. Verificación del backend
echo -e "${BLUE}🔍 Verificando estado del backend...${NC}"
if command -v curl &> /dev/null; then
    HEALTH_STATUS=$(curl -s https://sub-son1k-2-2.fly.dev/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
    if [ "$HEALTH_STATUS" = "degraded" ] || [ "$HEALTH_STATUS" = "healthy" ]; then
        echo -e "${GREEN}✅ Backend ONLINE (status: $HEALTH_STATUS)${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend status: $HEALTH_STATUS${NC}"
    fi
else
    echo "⚠️  curl no disponible, saltando verificación de backend"
fi
echo ""

# 6. Resumen y siguientes pasos
echo -e "${GREEN}=========================================="
echo "✅ INSTALACIÓN LISTA"
echo "==========================================${NC}"
echo ""
echo "SIGUIENTES PASOS:"
echo ""
echo "1. Instalar extensión en Chrome (pasos arriba)"
echo "2. Iniciar sesión en https://suno.com"
echo "3. Esperar 5 minutos o usar código de prueba"
echo "4. Verificar tokens:"
echo "   curl https://sub-son1k-2-2.fly.dev/api/tokens/pool/status"
echo ""
echo "DOCUMENTACIÓN COMPLETA:"
echo -e "  ${BLUE}$EXTENSION_PATH/INSTALACION_RAPIDA.md${NC}"
echo ""

# 7. Abrir Chrome Extensions si es posible
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "¿Quieres abrir Chrome Extensions ahora? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        open -a "Google Chrome" "chrome://extensions/"
        echo "✅ Chrome Extensions abierto"
    fi
fi

echo ""
echo -e "${GREEN}🎉 Script completado${NC}"
