# 🚀 BACKEND - DEPLOYMENT SIN ERRORES

## ✅ Arreglos Completados

### 1. **Conexiones Redis Bloqueantes Eliminadas**
- ✅ `packages/backend/src/workers/generation.worker.ts` - Conexión Redis comentada
- ✅ `packages/backend/src/middleware/rateLimit.ts` - Conexión Redis comentada con fallback
- ✅ Funciones modificadas para trabajar sin Redis:
  - `startGenerationWorker()` - Retorna null si no hay Redis
  - `checkRateLimit()` - Permite todas las requests si no hay Redis
  - `cleanupRateLimit()` - Cleanup seguro

### 2. **CORS Configurado**
- ✅ `packages/backend/src/index.ts` - Permite `http://localhost:5174`

### 3. **Auto-Creación de Usuarios**
- ✅ `packages/backend/src/services/creditService.ts` - Crea users automáticamente

### 4. **Queue Opcional**
- ✅ `packages/backend/src/services/musicGenerationService.ts` - Queue solo si hay Redis

---

## 📋 Variables de Entorno Necesarias

### Desarrollo Local (`.env`)
```env
# Base de Datos (SQLite para local)
DATABASE_URL="file:./dev.db"

# API Keys (OPCIONAL - para funcionalidad completa)
SUNO_TOKENS="tu_token_aqui"
GROQ_API_KEY="tu_groq_key_aqui"

# Puerto
PORT=3000
HOST=0.0.0.0

# Redis (OPCIONAL - el sistema funciona sin esto)
# REDIS_URL="redis://localhost:6379"
```

### Producción (Railway/Fly.io)
```env
# Base de Datos (PostgreSQL en producción)
DATABASE_URL="postgresql://user:pass@host:5432/db"

# Redis (RECOMENDADO para producción)
REDIS_URL="redis://redis-host:6379"

# API Keys
SUNO_TOKENS="token1,token2,token3"
GROQ_API_KEY="gsk_..."

# CORS Origins
ALLOWED_ORIGINS="https://tu-frontend.vercel.app,https://www.son1kvers3.com"
```

---

## 🚢 Pasos para Deploy

### **Opción A: Railway (Recomendado)**

1. **Crear nuevo proyecto en Railway**
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Crear proyecto
railway init

# Agregar PostgreSQL
railway add postgresql

# Agregar Redis (opcional pero recomendado)
railway add redis
```

2. **Configurar variables de entorno en Railway**
- `DATABASE_URL` - Se auto-configura con PostgreSQL
- `REDIS_URL` - Se auto-configura con Redis  
- `SUNO_TOKENS` -  Agregar manualmente
- `GROQ_API_KEY` - Agregar manualmente
- `PORT` - Railway lo configura automáticamente

3. **Deploy**
```bash
# Desde la raíz del proyecto
railway up
```

---

### **Opción B: Fly.io**

1. **Crear Dockerfile** (ya existe en `packages/backend/Dockerfile`)

2. **Inicializar Fly.io**
```bash
# Instalar flyctl
# Windows: choco install flyctl
# Mac: brew install flyctl

# Login
flyctl auth login

# Crear app
flyctl launch --name son1k-backend
```

3. **Configurar secretos**
```bash
flyctl secrets set DATABASE_URL="postgresql://..."
flyctl secrets set SUNO_TOKENS="token1,token2"
flyctl secrets set GROQ_API_KEY="gsk_..."
flyctl secrets set REDIS_URL="redis://..."
```

4. **Deploy**
```bash
flyctl deploy
```

---

## ✅ Checklist Pre-Deploy

- [ ] **Base de Datos configurada**
  - [ ] PostgreSQL/MySQL para producción
  - [ ] Migraciones aplicadas: `npx prisma db push`
  - [ ] Prisma Client generado: `npx prisma generate`

- [ ] **Variables de entorno configuradas**
  - [ ] `DATABASE_URL`
  - [ ] `SUNO_TOKENS` (opcional)
  - [ ] `GROQ_API_KEY` (opcional)
  - [ ] `REDIS_URL` (opcional pero recomendado)

- [ ] **Build exitoso localmente**
```bash
cd packages/backend
pnpm build
```

- [ ] **Tests pasando** (si existen)
```bash
pnpm test
```

- [ ] **Health check funcional**
```bash
curl http://localhost:3000/health
# Debería retornar: {"status":"ok","timestamp":"..."}
```

---

## 🧪 Testing Local Antes de Deploy

### 1. **Iniciar Backend**
```bash
cd c:\Users\qrrom\Downloads\Sub-Son1k-2.3\Sub-Son1k-2.3
pnpm dev --filter @super-son1k/backend
```

### 2. **Verificar  Health**
```bash
curl http://localhost:3000/health
```

### 3. **Test de Endpoints**

**GET Credits**
```bash
curl http://localhost:3000/api/credits/test-user
```

**POST Generate** (sin Redis - se guardará pending)
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user","prompt":"happy song","style":"pop"}'
```

---

## 📊 Monitoring Post-Deploy

### Health Checks
```bash
# Railway
curl https://tu-app.railway.app/health

# Fly.io
curl https://son1k-backend.fly.dev/health
```

### Logs
```bash
# Railway
railway logs

# Fly.io
flyctl logs
```

---

## ⚠️ Troubleshooting

### Error: "Cannot access Prisma Client"
```bash
# Regenerar Prisma Client
npx prisma generate
```

### Error: "Port already in use"
```bash
# Matar proceso en puerto 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Error: "Redis connection failed"
- **Desarrollo**: Normal - el sistema funciona sin Redis
- **Producción**: Verificar que `REDIS_URL` esté configurada

---

## 🎯 Resultado Esperado

✅ Backend corriendo **SIN errores de Redis**
✅ Servidor HTTP escuchando en puerto 3000
✅ Endpoints respondiendo correctamente
✅ CORS configurado para frontend
✅ Auto-creación de usuarios funcionando
✅ Deploy listo para producción

---

## 📞 Soporte

Si hay algún error durante el deploy, verificar:
1. Logs del servidor
2. Variables de entorno configuradas
3. Base de datos accesible
4. Puertos correctamente mapeados
