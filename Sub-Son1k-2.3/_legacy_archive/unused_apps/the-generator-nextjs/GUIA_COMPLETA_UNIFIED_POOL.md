# 🎯 GUÍA COMPLETA: UNIFIED TOKEN POOL

Sistema de auto-gestión de tokens JWT de Suno con rotación automática y recuperación de fallos.

---

## 📋 RESUMEN EJECUTIVO

**Problema:**
- Token JWT de Suno expira cada ~48 horas
- App se cae cuando el token expira
- Actualizar token requiere redeploy manual

**Solución:**
- Pool de múltiples tokens en Supabase
- Rotación automática (round-robin)
- Auto-limpieza de tokens expirados
- Recuperación automática si un token falla (401)
- Agregar/remover tokens sin redeploy

---

## 🚀 IMPLEMENTACIÓN (3 PASOS)

### 📍 PASO 1: Crear Tabla en Supabase
👉 Lee: `PASO_1_SUPABASE.md`

**Acción:** Ejecutar SQL en Supabase SQL Editor
**Archivo:** `database/migrations/002_unified_token_pool.sql`
**Tiempo:** 2 minutos

---

### 📍 PASO 2: Migrar Tokens Actuales
👉 Lee: `PASO_2_MIGRACION.md`

**Acción:** Ejecutar script de migración
**Comando:**
```bash
cd /Users/nov4-ix/Downloads/SSV-ALFA/apps/the-generator
npm install
npm run migrate-tokens
```
**Tiempo:** 1 minuto

---

### 📍 PASO 3: Desplegar a Producción
👉 Lee: `PASO_3_DESPLIEGUE.md`

**Acción:** Push a Git + Deploy en Vercel
**Comandos:**
```bash
cd /Users/nov4-ix/Downloads/SSV-ALFA
git add .
git commit -m "feat: Unified Token Pool"
git push origin main
```
**Tiempo:** 3 minutos

---

## 🎉 RESULTADO

### ✅ Sistema Auto-Gestionado:

| Feature | Estado |
|---------|--------|
| Pool de tokens en Supabase | ✅ |
| Rotación automática (round-robin) | ✅ |
| Auto-limpieza cada 30 min | ✅ |
| Recuperación ante 401 | ✅ |
| Dashboard de estado (`/api/pool/status`) | ✅ |
| Agregar tokens sin redeploy (`/api/pool/add`) | ✅ |
| Funciones SQL para gestión | ✅ |

### 🆚 Antes vs Después:

| Antes | Después |
|-------|---------|
| 1 token manual en Vercel | 4+ tokens en Supabase |
| Token expira → app cae | Token expira → rota automáticamente |
| Actualizar = redeploy (5 min) | Actualizar = API call (0 min) |
| Sin monitoreo | Dashboard en tiempo real |
| Límite: 1 token | Límite: N tokens |

---

## �� ARQUITECTURA

```
┌─────────────────────────────────────────────────────────────┐
│                    THE GENERATOR (Frontend)                  │
│                                                              │
│  User → Genera música → API /generate-music                │
└─────────────────────────────────┬───────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────┐
│              UnifiedTokenPool (Token Manager)                │
│                                                              │
│  1. getToken() → Obtiene mejor token disponible            │
│  2. Supabase → SELECT token WHERE active + healthy         │
│  3. Round-robin → Usa el menos usado                        │
│  4. UPDATE usage_count + last_used                          │
└─────────────────────────────────┬───────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────┐
│                  Suno API (ai.imgkits.com)                   │
│                                                              │
│  Authorization: Bearer {JWT_TOKEN_FROM_POOL}                │
│                                                              │
│  ✅ 200 OK → Música generada                                │
│  ❌ 401 Unauthorized → Token inválido                       │
└─────────────────────────────────┬───────────────────────────┘
                                   │
                                   │ (si 401)
                                   ▼
┌─────────────────────────────────────────────────────────────┐
│         Auto-Recovery (markInvalidAndRotate)                 │
│                                                              │
│  1. Marca token como unhealthy en Supabase                  │
│  2. Obtiene un nuevo token del pool                         │
│  3. Reintenta la request con el nuevo token                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 MANTENIMIENTO

### Agregar un nuevo token:

**Opción 1: API**
```bash
curl -X POST https://the-generator.son1kvers3.com/api/pool/add \
  -H "Content-Type: application/json" \
  -d '{"token": "eyJxxx..."}'
```

**Opción 2: Supabase SQL Editor**
```sql
INSERT INTO suno_auth_tokens (token, issuer, expires_at, source)
VALUES ('eyJxxx...', 'issuer', '2025-10-25T00:00:00Z', 'manual');
```

### Ver estado del pool:

```bash
curl https://the-generator.son1kvers3.com/api/pool/status
```

### Limpiar tokens expirados manualmente:

```sql
SELECT cleanup_expired_tokens();
```

---

## 📚 ARCHIVOS CREADOS

```
apps/the-generator/
├── lib/
│   └── unified-token-pool.ts              # Manager principal
├── app/api/
│   ├── pool/
│   │   ├── status/route.ts                # GET estado
│   │   └── add/route.ts                   # POST agregar token
│   └── generate-music/route.ts            # Integrado con pool
├── database/
│   └── migrations/
│       └── 002_unified_token_pool.sql     # Schema Supabase
├── scripts/
│   └── migrate-tokens-to-pool.ts          # Script migración
└── docs/ (estos archivos)
    ├── PASO_1_SUPABASE.md
    ├── PASO_2_MIGRACION.md
    ├── PASO_3_DESPLIEGUE.md
    └── GUIA_COMPLETA_UNIFIED_POOL.md
```

---

## 🎯 SIGUIENTE PASO

👉 **Abre `PASO_1_SUPABASE.md` y comienza!**

---

## 💬 SOPORTE

Si algo falla, revisa:
1. Variables de entorno en Vercel
2. Tabla `suno_auth_tokens` existe en Supabase
3. Logs de Vercel: `vercel logs --prod`
4. Estado del pool: `/api/pool/status`

---

Creado por Cursor AI - Son1kVers3 Project
