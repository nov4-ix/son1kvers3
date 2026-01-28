# 🚂 GUÍA DEPLOYMENT RAILWAY

## 📋 Pre-requisitos Completados
- ✅ Código limpiado (eliminados 150+ archivos obsoletos)
- ✅ `railway.json` configurado para monorepo
- ✅ Backend listo con gamificación + token management

## 🚀 PASO 2: Setup Railway (10 minutos)

### 1. Crear Proyecto en Railway

1. Ve a [railway.app](https://railway.app)
2. Click **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Conecta tu cuenta GitHub
5. Selecciona el repo: `nov4-ix/Sub-Son1k-2.2`

### 2. Configurar Servicios

Railway auto-detectará el monorepo. Necesitas **3 servicios**:

#### A. PostgreSQL Database
```
1. Click "New" → "Database" → "Add PostgreSQL"
2. Nombre: "sub-son1k-db"
3. Railway auto-genera DATABASE_URL
```

#### B. Redis (Opcional pero recomendado)
```
1. Click "New" → "Database" → "Add Redis"
2. Nombre: "sub-son1k-redis"
3. Railway auto-genera REDIS_URL
```

#### C. Backend Service
```
1. Click "New" → "GitHub Repo"
2. Root Directory: "packages/backend"
3. Build Command: (auto desde railway.json)
4. Start Command: (auto desde railway.json)
```

### 3. Variables de Entorno (Backend Service)

Click en el servicio Backend → **Variables** → **Raw Editor**:

```env
# Auto-generadas por Railway
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# Agregar manualmente
NODE_ENV=production
PORT=3000

# API Keys (CRÍTICO - Agregar tus valores)
SUNO_TOKENS=tu_token_aqui_separados_por_comas
JWT_SECRET=tu_secret_super_seguro_aqui
TOKEN_ENCRYPTION_KEY=otro_secret_para_encryption_32_chars_min

# URLs de servicios externos
GENERATION_API_URL=https://ai.imgkits.com/suno
NEURAL_ENGINE_API_URL=https://ai.imgkits.com/suno
COVER_API_URL=https://usa.imgkits.com/node-api/suno
GENERATION_POLLING_URL=https://usa.imgkits.com/node-api/suno
NEURAL_ENGINE_POLLING_URL=https://usa.imgkits.com/node-api/suno

# CORS (tu dominio frontend en Vercel)
ALLOWED_ORIGINS=https://tu-frontend.vercel.app,http://localhost:5173
```

### 4. Deploy

1. Railway auto-deploya cuando haces push a GitHub
2. O manualmente: Click **"Deploy"** en el dashboard
3. Espera 3-5 minutos para el build

### 5. Verificar

```bash
# Check health
curl https://tu-app.railway.app/health

# Debe responder:
{
  "status": "healthy",
  "timestamp": "2025-12-18...",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

### 6. Migraciones Prisma

Railway ejecuta `npx prisma generate` automáticamente.

Para ejecutar migraciones manualmente:
```bash
# En el dashboard Railway, ir a Deployments → Settings → Build Command
# Agregar: && npx prisma db push
```

O usar el shell de Railway:
```bash
railway run npx prisma db push
```

## 🎯 URLs Generadas

Después del deploy, Railway te dará:
- **Backend**: `https://sub-son1k-2-2-production.up.railway.app`
- Copia esta URL para configurar el frontend

## 📊 Monitoreo

Railway incluye:
- ✅ Logs en tiempo real
- ✅ Métricas de CPU/RAM
- ✅ Auto-restart si falla
- ✅ HTTPS automático

## 🔄 Continuous Deployment

Cada push a `main` auto-deploya. Para desactivar:
- Settings → Deployments → Disable Auto Deploy

## 💰 Costos

- **Free Tier**: $5/mes de crédito (500 horas)
- **Pro**: $20/mes (suficiente para producción)

---

## ✅ Checklist Final

- [ ] Proyecto creado en Railway
- [ ] PostgreSQL agregado
- [ ] Redis agregado (opcional)
- [ ] Variables de entorno configuradas
- [ ] Deploy exitoso
- [ ] Health check responde OK
- [ ] URL del backend copiada

**SIGUIENTE**: Actualizar frontend con la URL de Railway
