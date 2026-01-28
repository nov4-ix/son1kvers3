 # 🚀 GUÍA DE DESPLIEGUE COMPLETO - Sub-Son1k-2.3
**Generado: 22 de Diciembre, 2025**

---

## ✅ ARCHIVOS DE CONFIGURACIÓN CREADOS

He creado automáticamente los siguientes archivos:

1. **`.env`** (raíz del proyecto) → Configuración del backend
2. **`apps/the-generator-nextjs/.env.local`** → Configuración del frontend

---

## 📋 CHECKLIST PREVIO AL DESPLIEGUE

### Variables Críticas que DEBES Configurar:

#### 1️⃣ **Base de Datos (DATABASE_URL)**
Actualmente en `.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/super_son1k"
```

**Opciones recomendadas:**

**A. Supabase (GRATIS - Recomendado):**
1. Ve a https://supabase.com
2. Crea cuenta y nuevo proyecto
3. Settings → Database → Connection String
4. Copia la "Connection String" (mode: Session)
5. Reemplázala en `.env` línea 13

**B. Railway:**
1. Ve a https://railway.app
2. New Project → Provision PostgreSQL
3. Copia la DATABASE_URL generada
4. Reemplázala en `.env` línea 13

---

#### 2️⃣ **Cookies de Suno (SUNO_COOKIES)**
Actualmente en `.env`:
```env
SUNO_COOKIES="__session=TU_SESSION_AQUI; cf_clearance=TU_CLEARANCE_AQUI"
```

**Cómo obtenerlas:**
1. Abre https://app.suno.ai en Chrome
2. Inicia sesión en tu cuenta
3. Presiona **F12** → Pestaña **"Application"**
4. En el menú lateral: **Cookies** → **https://app.suno.ai**
5. Busca **`__session`** → Copia su valor
6. Busca **`cf_clearance`** → Copia su valor
7. Reemplaza en `.env` línea 42 con el formato:
   ```env
   SUNO_COOKIES="__session=sess_VALOR_AQUI; cf_clearance=VALOR_AQUI"
   ```

**NOTA:** Las cookies expiran cada ~24 horas, necesitarás renovarlas periódicamente.

---

#### 3️⃣ **GROQ API Key (Opcional - Para generación de letras con IA)**
Actualmente en `.env`:
```env
GROQ_API_KEY=tu-groq-api-key-aqui
```

**Cómo obtenerla:**
1. Ve a https://console.groq.com
2. Crea cuenta gratuita
3. API Keys → Create API Key
4. Copia el key y reemplázalo en `.env` línea 87

---

## 🔧 CONFIGURACIÓN LOCAL (Para probar antes de desplegar)

### Paso 1: Inicializar Base de Datos

```powershell
# Navega al backend
cd packages\backend

# Genera el cliente de Prisma
pnpm prisma generate

# Crea las tablas en la base de datos
pnpm prisma db push

# (Opcional) Abre Prisma Studio para ver la DB
pnpm prisma studio
```

### Paso 2: Iniciar Backend

```powershell
# Desde packages\backend
pnpm dev
```

Deberías ver:
```
✅ Database connected
✅ Token pool initialized
🚀 Backend running on http://localhost:3001
```

### Paso 3: Iniciar Frontend

**En una nueva terminal:**
```powershell
# Navega al frontend
cd apps\the-generator-nextjs

# Inicia el servidor de desarrollo
pnpm dev
```

Abre: http://localhost:3002

---

## 🌐 DESPLIEGUE A PRODUCCIÓN

### Opción A: Railway (Backend) + Vercel (Frontend)

#### BACKEND EN RAILWAY:

1. **Crear Proyecto:**
   - Ve a https://railway.app
   - New Project → Deploy from GitHub repo
   - Conecta tu repositorio

2. **Configurar Database:**
   - En el proyecto: New → Database → Add PostgreSQL
   - Railway genera `DATABASE_URL` automáticamente

3. **Configurar Backend Service:**
   - New → GitHub Repo
   - Root Directory: `packages/backend`
   - Railway detecta `railway.toml` automáticamente

4. **Agregar Variables de Entorno:**
   Click en el servicio Backend → Variables → Raw Editor:
   ```env
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   NODE_ENV=production
   PORT=3000
   
   # COPIAR DESDE TU .env LOCAL:
   SUNO_COOKIES=tu_valor_de_cookies_aqui
   JWT_SECRET=super-son1k-2-3-jwt-secret-XyZ123
   BACKEND_SECRET=backend-secret-son1k-2-3-AbC456
   TOKEN_ENCRYPTION_KEY=super-son1k-2-3-encryption-key-32chars-min
   GROQ_API_KEY=tu_groq_key_aqui
   
   # URLs
   SUNO_API_URL=https://studio-api.suno.ai
   SUNO_POLLING_URL=https://studio-api.suno.ai
   ALLOWED_ORIGINS=https://tu-frontend.vercel.app
   ```

5. **Deploy:**
   - Railway auto-deploya
   - Copia la URL generada (ej: `https://sub-son1k-backend.up.railway.app`)

6. **Ejecutar Migraciones:**
   ```bash
   railway run npx prisma db push
   ```

---

#### FRONTEND EN VERCEL:

1. **Crear Proyecto:**
   - Ve a https://vercel.com
   - Add New → Import Git Repository
   - Selecciona tu repo

2. **Configurar Build:**
   - Framework Preset: **Next.js**
   - Root Directory: **`apps/the-generator-nextjs`**
   - Build Command: `pnpm build` (auto-detectado)

3. **Variables de Entorno:**
   Antes de Deploy, agrega:
   ```env
   NEXT_PUBLIC_BACKEND_URL=https://sub-son1k-backend.up.railway.app
   NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url (si usaste Supabase)
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key (si usaste Supabase)
   NEXT_PUBLIC_ENVIRONMENT=production
   ```

4. **Deploy:**
   - Click "Deploy"
   - Vercel te dará tu URL final (ej: `son1k-generator.vercel.app`)

5. **Actualizar CORS en Railway:**
   - Vuelve a Railway → Variables
   - Actualiza `ALLOWED_ORIGINS` con tu URL de Vercel

---

### Opción B: Todo en Railway

Puedes desplegar frontend y backend en Railway:

1. Crea 2 servicios:
   - Servicio 1: `packages/backend` (Puerto: 3000)
   - Servicio 2: `apps/the-generator-nextjs` (Puerto: 3000)

2. Configura variables como se indicó arriba

3. Railway genera URLs públicas para ambos

---

## 🔍 VERIFICACIÓN POST-DESPLIEGUE

### Health Check del Backend:
```bash
curl https://tu-backend-url.railway.app/health
```

Debe responder:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-22...",
  "services": {
    "database": "connected"
  }
}
```

### Test de Generación:
1. Abre tu frontend en producción
2. Escribe una descripción de canción
3. Click "GENERAR LETRA"
4. Describe el estilo musical
5. Click "THE GENERATOR"
6. Espera 60-120 segundos
7. ✅ Deberías recibir tu música generada

---

## 📊 MONITOREO

Railway incluye automáticamente:
- ✅ Logs en tiempo real
- ✅ Métricas de CPU/RAM/Network
- ✅ Auto-restart en caso de fallo
- ✅ HTTPS automático
- ✅ Deploy automático en cada push a main

---

## 🆘 TROUBLESHOOTING

### Error: "No valid tokens available"
**Causa:** Cookies de Suno expiradas o inválidas
**Solución:**
1. Obtén nuevas cookies de https://app.suno.ai
2. Actualiza `SUNO_COOKIES` en Railway Variables
3. Redeploy

### Error: "Database connection failed"
**Causa:** DATABASE_URL incorrecta
**Solución:**
1. Verifica que PostgreSQL está activo en Railway
2. Copia la DATABASE_URL desde Railway → Database → Variables
3. Actualiza en Backend Variables
4. Ejecuta `railway run npx prisma db push`

### Error: Build falla en Vercel
**Causa:** Root Directory incorrecta
**Solución:**
1. Settings → General → Root Directory
2. Asegúrate que sea: `apps/the-generator-nextjs`
3. Redeploy

### Frontend no conecta con Backend
**Causa:** CORS o URL incorrecta
**Solución:**
1. Verifica `NEXT_PUBLIC_BACKEND_URL` en Vercel
2. Verifica `ALLOWED_ORIGINS` incluya tu URL de Vercel
3. Redeploy ambos servicios

---

## ✅ CHECKLIST FINAL DE DESPLIEGUE

- [ ] `.env` configurado con DATABASE_URL real
- [ ] `SUNO_COOKIES` con cookies válidas (frescas)
- [ ] `GROQ_API_KEY` configurada (opcional)
- [ ] Backend desplegado en Railway
- [ ] Database PostgreSQL activa en Railway
- [ ] Migraciones ejecutadas (`prisma db push`)
- [ ] Frontend desplegado en Vercel
- [ ] `NEXT_PUBLIC_BACKEND_URL` apunta a Railway
- [ ] CORS configurado con URL de Vercel
- [ ] Health check responde OK
- [ ] Test de generación exitoso

---

## 🎯 PRÓXIMOS PASOS

Una vez desplegado:

1. **Dominio Personalizado:**
   - Vercel: Settings → Domains → Add Domain
   - Railway: Settings → Domains → Custom Domain

2. **Monitoreo Avanzado:**
   - Configura Sentry (error tracking)
   - Configura PostHog (analytics)

3. **Optimización:**
   - Habilita caching con Redis en Railway
   - Configura CDN para assets estáticos

4. **Otras Apps:**
   - Despliega `ghost-studio` (puerto 3003)
   - Despliega `web-classic` (dashboard principal)

---

## 💰 COSTOS ESTIMADOS

**Railway (Backend + DB):**
- Hobby Plan: $5/mes de crédito gratis
- Pro: $20/mes (ilimitado)

**Vercel (Frontend):**
- Hobby: Gratis
- Pro: $20/mes (si necesitas más de 100GB bandwidth)

**Total estimado para empezar: $0-10/mes**

---

## 📞 RECURSOS ADICIONALES

- **Documentación Railway:** https://docs.railway.app
- **Documentación Vercel:** https://vercel.com/docs
- **Prisma:** https://www.prisma.io/docs
- **Next.js:** https://nextjs.org/docs

---

**🎵 ¡Listo para crear música con IA en producción! 🚀**

*Última actualización: 22 Diciembre 2025*
