#!/bin/bash

# ========================================
# Script para actualizar token de Suno
# ========================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

clear
echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                        ║${NC}"
echo -e "${CYAN}║     🔄 ACTUALIZAR TOKEN DE SUNO - THE GENERATOR       ║${NC}"
echo -e "${CYAN}║                                                        ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}⚠️  Token actual EXPIRADO (19 de octubre 2025)${NC}"
echo ""
echo -e "${BLUE}Para obtener un nuevo token:${NC}"
echo ""
echo "  1. ${GREEN}Abre la extensión Chrome de Suno${NC}"
echo "  2. ${GREEN}Abre Chrome DevTools${NC} (F12 o Cmd+Option+I)"
echo "  3. ${GREEN}Ve a la pestaña 'Network'${NC}"
echo "  4. ${GREEN}Genera una canción${NC} en la extensión"
echo "  5. ${GREEN}Busca la request a${NC} 'ai.imgkits.com/suno/generate'"
echo "  6. ${GREEN}Click en esa request${NC} → Pestaña 'Headers'"
echo "  7. ${GREEN}Copia el valor del header 'authorization'${NC}"
echo "  8. ${GREEN}Elimina 'Bearer '${NC} al inicio, solo copia el JWT token"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Leer nuevo token
read -p "🔑 Pega tu nuevo SUNO token (JWT): " NEW_TOKEN

if [ -z "$NEW_TOKEN" ]; then
    echo -e "${RED}❌ No se proporcionó token. Saliendo...${NC}"
    exit 1
fi

# Validar formato JWT básico (3 partes separadas por punto)
if [[ ! "$NEW_TOKEN" =~ ^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$ ]]; then
    echo -e "${RED}❌ El token no parece ser un JWT válido${NC}"
    echo -e "${YELLOW}Formato esperado: xxxxx.yyyyy.zzzzz${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Token válido (formato JWT correcto)${NC}"
echo ""

# Verificar expiración del nuevo token
echo -e "${BLUE}🔍 Verificando expiración...${NC}"
python3 << EOF
import json
import base64
from datetime import datetime

token = "$NEW_TOKEN"
parts = token.split('.')
if len(parts) >= 2:
    payload = parts[1]
    padding = 4 - (len(payload) % 4)
    if padding != 4:
        payload += '=' * padding
    decoded = json.loads(base64.urlsafe_b64decode(payload))
    
    if 'exp' in decoded:
        exp_time = datetime.fromtimestamp(decoded['exp'])
        now = datetime.now()
        print(f"  📅 Expira: {exp_time.strftime('%Y-%m-%d %H:%M:%S')}")
        if exp_time < now:
            print(f"  ❌ Token ya expiró")
            exit(1)
        else:
            delta = exp_time - now
            days = delta.days
            hours = delta.seconds // 3600
            print(f"  ✅ Válido por {days} días y {hours} horas")
EOF

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ El token ya está expirado. Obtén uno nuevo.${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📝 Actualizando archivos...${NC}"
echo ""

# 1. Actualizar .env.local en la raíz
ENV_FILE="/Users/nov4-ix/Downloads/SSV-ALFA/.env.local"
if [ -f "$ENV_FILE" ]; then
    echo "  → Actualizando $ENV_FILE"
    # Actualizar SUNO_TOKENS (reemplazar el primer token)
    sed -i.backup "s|SUNO_TOKENS=\"[^\"]*\"|SUNO_TOKENS=\"$NEW_TOKEN\"|g" "$ENV_FILE"
    echo -e "    ${GREEN}✓${NC} .env.local actualizado"
else
    echo -e "    ${YELLOW}⚠${NC} No se encontró .env.local en la raíz"
fi

echo ""
echo -e "${BLUE}☁️  Actualizando en Vercel...${NC}"
echo ""

# 2. Actualizar en Vercel
cd /Users/nov4-ix/Downloads/SSV-ALFA/apps/the-generator

# Eliminar variables antiguas
echo "  → Eliminando variables antiguas..."
npx vercel env rm SUNO_COOKIE production --yes 2>/dev/null || true
npx vercel env rm SUNO_COOKIE preview --yes 2>/dev/null || true
npx vercel env rm SUNO_COOKIE development --yes 2>/dev/null || true

# Agregar nuevo token
echo "  → Agregando nuevo token..."
echo "$NEW_TOKEN" | npx vercel env add SUNO_COOKIE production 2>/dev/null || true
echo "$NEW_TOKEN" | npx vercel env add SUNO_COOKIE preview 2>/dev/null || true
echo "$NEW_TOKEN" | npx vercel env add SUNO_COOKIE development 2>/dev/null || true

echo -e "    ${GREEN}✓${NC} Variables actualizadas en Vercel"
echo ""

# 3. Verificar
echo -e "${BLUE}🔍 Verificando configuración...${NC}"
npx vercel env ls | grep SUNO_COOKIE

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}🚀 Redesplegando en producción...${NC}"
echo ""
npx vercel --prod --yes

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                        ║${NC}"
echo -e "${CYAN}║             ${GREEN}✅ ¡TOKEN ACTUALIZADO!${CYAN}                   ║${NC}"
echo -e "${CYAN}║                                                        ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Próximos pasos:${NC}"
echo "  1. Espera 2-3 minutos a que termine el deployment"
echo "  2. Ve a https://the-generator.son1kvers3.com"
echo "  3. Prueba generar música"
echo "  4. ✅ Ahora debería funcionar sin errores"
echo ""
echo -e "${YELLOW}💡 Tip: Guarda este token en un lugar seguro${NC}"
echo ""


