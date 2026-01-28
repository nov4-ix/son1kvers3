# 🎵 The Generator - Generador de Música con IA

Herramienta de generación de música potenciada por Suno AI y Groq.

---

## ⚠️ ESTADO ACTUAL

### ❌ Token Expirado

**El token de Suno expiró el 19 de octubre de 2025.**

**Error que verás:** `SUNO_COOKIE no configurada` (en realidad es error 401 - Unauthorized)

### ✅ Solución Rápida

```bash
cd /Users/nov4-ix/Downloads/SSV-ALFA/apps/the-generator
./actualizar-token-suno.sh
```

Sigue las instrucciones del script para obtener y actualizar el token.

📖 **Documentación completa:** [TOKEN_EXPIRADO.md](./TOKEN_EXPIRADO.md)

---

## 📚 Documentación Disponible

### 🚨 Urgente - Token Expirado
- **[TOKEN_EXPIRADO.md](./TOKEN_EXPIRADO.md)** - Cómo actualizar el token de Suno ⭐
- **[actualizar-token-suno.sh](./actualizar-token-suno.sh)** - Script automático

### 🚀 Setup Inicial (Primera vez)
- **[LEER_PRIMERO.md](./LEER_PRIMERO.md)** - Guía rápida de inicio
- **[CHECKLIST_SOLUCION.md](./CHECKLIST_SOLUCION.md)** - Checklist paso a paso
- **[setup-env.sh](./setup-env.sh)** - Script de configuración inicial

### 📖 Documentación Técnica
- **[ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md)** - Guía completa de variables de entorno
- **[DIAGNOSIS_AND_FIX.md](./DIAGNOSIS_AND_FIX.md)** - Análisis técnico detallado
- **[RESUMEN_REVISION_COMPLETA.md](./RESUMEN_REVISION_COMPLETA.md)** - Revisión de código completa
- **[README_SOLUCION.md](./README_SOLUCION.md)** - Índice de toda la documentación

---

## 🎯 Inicio Rápido

### Si el token expiró (ERROR 401):
```bash
./actualizar-token-suno.sh
```

### Si es primera configuración:
```bash
./setup-env.sh
```

### Para desarrollo local:
```bash
npm install
npm run dev
```

### Para desplegar a producción:
```bash
npx vercel --prod
```

---

## 🏗️ Arquitectura

```
Frontend (Next.js 14)
  └─→ /api/generate-lyrics (Groq)
  └─→ /api/generator-prompt (Groq)
  └─→ /api/generate-music (Suno)
       └─→ ai.imgkits.com/suno/generate
            └─→ Devuelve taskId
  └─→ /api/track-status (Polling)
       └─→ usa.imgkits.com/node-api/suno/get_mj_status/{taskId}
            └─→ Devuelve audio URLs
```

---

## 🔧 Variables de Entorno

### Requeridas:
- **`SUNO_COOKIE`** - Token JWT de Suno (expira cada 7-30 días)
- **`GROQ_API_KEY`** - API key de Groq (opcional, para traducción)

### Configuración:

**En Vercel (Producción):**
```bash
npx vercel env add SUNO_COOKIE production
npx vercel env add GROQ_API_KEY production
```

**Local (Desarrollo):**
```bash
# Editar /Users/nov4-ix/Downloads/SSV-ALFA/.env.local
SUNO_COOKIE=tu_token_aqui
GROQ_API_KEY=tu_api_key_aqui
```

---

## 🔍 Troubleshooting

### Error: "SUNO_COOKIE no configurada"

**Causa más común:** Token expirado (error 401)

**Solución:**
```bash
./actualizar-token-suno.sh
```

📖 Ver [TOKEN_EXPIRADO.md](./TOKEN_EXPIRADO.md)

### Error: "No taskId en respuesta"

**Causa:** Token inválido o expirado

**Solución:** Actualizar token (ver arriba)

### Error: Timeout en polling

**Causa:** Suno API está lento o saturado

**Solución:** Esperar y reintentar

---

## 📊 Estado del Código

| Componente | Status |
|------------|--------|
| Frontend | ✅ Funcionando |
| API Routes | ✅ Funcionando |
| Suno Integration | ⚠️ Token expirado |
| Groq Integration | ✅ Funcionando |
| Deployment | ✅ Configurado |

---

## 🛠️ Stack Tecnológico

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State:** Zustand
- **AI:** Suno API (música) + Groq API (texto)
- **Deployment:** Vercel

---

## 📝 Scripts Disponibles

```bash
npm run dev          # Desarrollo local
npm run build        # Build para producción
npm run start        # Servidor de producción local
npm run lint         # Linter

# Scripts de mantenimiento
./setup-env.sh               # Setup inicial
./actualizar-token-suno.sh   # Actualizar token
```

---

## 🎓 Mantenimiento

### Renovar token de Suno (cada 2-3 semanas):

1. Obtener nuevo token de Chrome DevTools
2. Ejecutar:
   ```bash
   ./actualizar-token-suno.sh
   ```
3. Verificar en https://the-generator.son1kvers3.com

### Verificar estado:

```bash
# Variables en Vercel
npx vercel env ls

# Logs de producción
npx vercel logs --follow

# Estado del deployment
npx vercel ls
```

---

## 🔗 Enlaces

- **Producción:** https://the-generator.son1kvers3.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Groq Console:** https://console.groq.com

---

## 📞 Soporte

Si tienes problemas:

1. ✅ Revisa [TOKEN_EXPIRADO.md](./TOKEN_EXPIRADO.md) si ves error 401
2. ✅ Revisa [DIAGNOSIS_AND_FIX.md](./DIAGNOSIS_AND_FIX.md) para análisis técnico
3. ✅ Ejecuta `npx vercel logs` para ver logs en tiempo real
4. ✅ Verifica que las variables estén configuradas: `npx vercel env ls`

---

## 📜 Licencia

Parte del ecosistema Son1kVers3 - ALFA-SSV

---

**Última actualización:** 22 de octubre de 2025  
**Status:** ⚠️ Requiere actualización de token


