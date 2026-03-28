# 🚀 CHECKLIST FINAL - DEPLOY BETA PÚBLICO

**Fuente:** Adaptado del repositorio `Super-Son1k-2.1`

---

## ✅ REPARACIONES COMPLETADAS

### 1. ✅ Endpoints Corregidos
- **Ghost Studio:** `/api/v1/generations` → `/api/generation/create`
- **Status endpoint:** Corregido formato de respuesta del backend
- **Token Pool:** Ahora acepta solo `token` desde extensión (sin requerir userId/email/tier)

### 2. ✅ Extension Chrome
- URL por defecto actualizada: `https://the-generator.son1kvers3.com`
- Puerto de desarrollo corregido: `3002`

### 3. ✅ Manejo de Respuestas
- Actualizado formato `{ success: true, data: {...} }`
- Extracción correcta de `generationId`, `status`, `audioUrl`

---

## 🔧 CONFIGURACIÓN REQUERIDA EN VERCEL

### The Generator Next.js

**Variables de Entorno:**
```env
# Backend
BACKEND_URL=https://tu-backend.railway.app
NEXT_PUBLIC_BACKEND_URL=https://tu-backend.railway.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://swbnenfucupmtpihmmht.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Groq (para traducción)
GROQ_API_KEY=tu-groq-api-key

# Admin (opcional, para /api/pool/add)
NEXT_PUBLIC_ADMIN_PASSWORD=tu-password-seguro

# Ambiente
NODE_ENV=production
```

**Root Directory:** `apps/the-generator-nextjs`

**Build Command:** `npm run build` (Next.js lo detecta automáticamente)

---

### Ghost Studio

**Variables de Entorno:**
```env
# Backend
VITE_BACKEND_URL=https://tu-backend.railway.app

# Supabase (si usa storage)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key

# Suno API (solo si NO usa backend)
VITE_SUNO_API_KEY=opcional

# Ambiente
VITE_ENVIRONMENT=production
```

**Root Directory:** `apps/ghost-studio`

**Build Command:** `npm run build` o `npm run build:vercel`

**Output Directory:** `dist`

---

## 🔧 CONFIGURACIÓN DEL BACKEND (Railway/Render)

### Variables de Entorno del Backend

```env
# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# Redis (opcional pero recomendado)
REDIS_HOST=redis-host
REDIS_PORT=6379
REDIS_PASSWORD=redis-pass

# JWT
JWT_SECRET=tu-secret-super-seguro
JWT_EXPIRES_IN=7d

# CORS - CRÍTICO
FRONTEND_URL=https://the-generator.son1kvers3.com,https://ghost-studio.vercel.app,https://the-generator.vercel.app

# Server
PORT=3001
NODE_ENV=production

# Opcional: Suno API (si tiene)
SUNO_API_KEY=opcional

# Supabase (si usa)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-key
```

---

## 📋 PASOS PARA DEPLOY

### Paso 1: Deploy Backend
1. ✅ Crear proyecto en Railway/Render
2. ✅ Configurar variables de entorno (ver arriba)
3. ✅ Conectar repositorio o hacer deploy manual
4. ✅ Verificar que `/health` responde
5. ✅ Verificar CORS permite orígenes de frontend

### Paso 2: Deploy The Generator
1. ✅ Ir a Vercel Dashboard
2. ✅ Crear nuevo proyecto o editar existente
3. ✅ **Root Directory:** `apps/the-generator-nextjs`
4. ✅ Configurar variables de entorno
5. ✅ Deploy
6. ✅ Verificar dominio: `the-generator.son1kvers3.com`

### Paso 3: Deploy Ghost Studio
1. ✅ Crear proyecto en Vercel (o editar existente)
2. ✅ **Root Directory:** `apps/ghost-studio`
3. ✅ Configurar variables de entorno
4. ✅ **Build Command:** `npm run build:vercel`
5. ✅ **Output Directory:** `dist`
6. ✅ Deploy

---

## 🧪 TESTS POST-DEPLOY

### Test 1: Health Check Backend
```bash
curl https://tu-backend.railway.app/health
# Debe responder: { "status": "ok", ... }
```

### Test 2: CORS Backend
```bash
curl -H "Origin: https://the-generator.son1kvers3.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://tu-backend.railway.app/api/generation/create
# Debe incluir: Access-Control-Allow-Origin
```

### Test 3: Token Pool Endpoint
```bash
# Desde extensión o manualmente
curl -X POST https://the-generator.son1kvers3.com/api/token-pool/add \
  -H 'Content-Type: application/json' \
  -d '{"token":"tu-jwt-token-aqui","label":"test"}'
# Debe responder: { "success": true, ... }
```

### Test 4: Generación de Música (The Generator)
1. ✅ Abrir `https://the-generator.son1kvers3.com`
2. ✅ Escribir letra y estilo
3. ✅ Click "Generate"
4. ✅ Verificar que llega al backend
5. ✅ Verificar que obtiene `generationId`
6. ✅ Verificar polling de status
7. ✅ Verificar que audio se reproduce

### Test 5: Generación de Cover (Ghost Studio)
1. ✅ Abrir Ghost Studio
2. ✅ Escribir prompt
3. ✅ Click "Generar (Backend)"
4. ✅ Verificar que llega al backend
5. ✅ Verificar polling y audio final

### Test 6: Extension Chrome
1. ✅ Instalar extensión
2. ✅ Ir a suno.com (logueado)
3. ✅ Click "Extraer y Enviar al Pool"
4. ✅ Verificar que token llega a `/api/token-pool/add`
5. ✅ Verificar en Supabase que token se guardó

---

## ⚠️ PROBLEMAS COMUNES Y SOLUCIONES

### Error: CORS blocked
**Solución:**
- Verificar `FRONTEND_URL` en backend incluye todos los dominios
- Verificar que backend está corriendo y accesible
- Verificar que URLs en frontend apuntan al backend correcto

### Error: 500 al generar música
**Solución:**
- Confirmar que `BACKEND_SECRET` coincide en backend y frontend
- Verificar que hay tokens disponibles en el pool
- Revisar logs de BullMQ (cola) y worker

### Error: Token Pool vacío
**Solución:**
- Ejecutar extensión Chrome y enviar tokens
- Usar script `/api/token-pool/add` con token válido
- Revisar Supabase tabla `suno_tokens`

---

## 📎 Recursos
- **Backend:** `/api/generation/create`, `/api/generation-public/create`
- **Status:** `/api/generation/:id/status`
- **Token Pool:** `/api/token-pool/status`
- **Health:** `/health`

