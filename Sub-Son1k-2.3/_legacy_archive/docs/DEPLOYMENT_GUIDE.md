# 🚀 DEPLOYMENT GUIDE - Son1kVers3

**Fecha:** 2026-01-07  
**Status:** Ready for Production Deploy

---

## 📋 **PRE-DEPLOYMENT CHECKLIST**

### **1. Environment Variables Necesarias**

#### **Backend (.env):**
```env
# Database
DATABASE_URL=postgresql://user:password@host:port/dbname

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend URL
FRONTEND_URL=https://son1kvers3.vercel.app

# Stealth System (Optional)
MAX_REQUESTS_PER_ACCOUNT=50
COOLDOWN_DURATION_MINUTES=30

# Groq API (for Pixel Companion)
GROQ_API_KEY=gsk_...
```

#### **Frontend (.env):**
```env
VITE_API_URL=https://son1kvers3-api.railway.app
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## 🚂 **RAILWAY DEPLOYMENT (Backend)**

### **Paso 1: Preparar el Proyecto**

1. En el directorio raíz, asegúrate de tener `railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd backend && pip install -r requirements.txt"
  },
  "deploy": {
    "startCommand": "cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### **Paso 2: Deploy en Railway**

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Linkear proyecto (o crear uno nuevo)
railway link

# Deploy
railway up
```

### **Paso 3: Configurar Variables de Entorno**

En el dashboard de Railway:
1. Settings → Variables
2. Agregar todas las variables de entorno del backend
3. Especialmente importante: `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

### **Paso 4: Configurar PostgreSQL**

```bash
# En Railway dashboard:
# 1. New → Database → PostgreSQL
# 2. Copiar la DATABASE_URL generada
# 3. Agregarla a las variables de tu servicio backend
```

### **Paso 5: Inicializar Base de Datos**

```bash
# Conectarte vía Railway CLI
railway run python -m backend.migrations.init_db
```

### **Paso 6: Configurar Webhooks de Stripe**

1. En Stripe Dashboard:
   - Webhooks → Add endpoint
   - URL: `https://tu-backend.railway.app/api/tiers/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`

2. Copiar el Webhook Secret y agregarlo a Railway como `STRIPE_WEBHOOK_SECRET`

---

## ▲ **VERCEL DEPLOYMENT (Frontend)**

### **Paso 1: Preparar Configuración**

Crear `vercel.json` en la raíz:

```json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "vite",
  "outputDirectory": "dist",
  "env": {
    "VITE_API_URL": "@vite_api_url",
    "VITE_STRIPE_PUBLISHABLE_KEY": "@vite_stripe_key"
  }
}
```

### **Paso 2: Deploy via CLI**

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (primera vez, interactivo)
vercel

# Deploy a producción
vercel --prod
```

### **Paso 3: Configurar Variables de Entorno**

En Vercel Dashboard:
1. Settings → Environment Variables
2. Agregar:
   - `VITE_API_URL` = URL de Railway backend
   - `VITE_STRIPE_PUBLISHABLE_KEY` = pk_live_...

### **Paso 4: Configurar Dominios**

1. Settings → Domains
2. Agregar dominio custom (opcional):
   - `son1kvers3.com` → Production
   - `www.son1kvers3.com` → Production

---

## 🔒 **POST-DEPLOYMENT SECURITY**

### **1. Actualizar CORS en Backend**

En `backend/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://son1kvers3.vercel.app",
        "https://www.son1kvers3.com",
        # Add your custom domains
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### **2. Habilitar HTTPS**

Railway y Vercel proveen HTTPS automático ✅

### **3. Rate Limiting (Opcional)**

Agregar en `backend/main.py`:

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/api/*")
@limiter.limit("100/minute")
async def limited_route(request: Request):
    # ...
```

---

## 📊 **MONITORING & ANALYTICS**

### **1. Setup Sentry (Error Tracking)**

```bash
# Backend
pip install sentry-sdk[fastapi]
```

```python
# backend/main.py
import sentry_sdk

sentry_sdk.init(
    dsn="https://...@sentry.io/...",
    traces_sample_rate=1.0,
)
```

### **2. Setup Railway Metrics**

Railway provee métricas automáticas:
- CPU usage
- Memory usage
- Network
- Request latency

### **3. Setup Vercel Analytics**

```bash
# Frontend
pnpm add @vercel/analytics
```

```tsx
// apps/web-classic/src/main.tsx
import { Analytics } from '@vercel/analytics/react';

<Analytics />
```

---

## ✅ **DEPLOYMENT CHECKLIST**

### **Pre-Deploy:**
- [ ] Todas las variables de entorno configuradas
- [ ] Database backup creado
- [ ] Stripe in test mode verificado
- [ ] CORS configurado correctamente

### **Deploy Backend (Railway):**
- [ ] Proyecto creado en Railway
- [ ] PostgreSQL database provisioned
- [ ] Variables de entorno configuradas
- [ ] Database inicializada
- [ ] Webhooks de Stripe configurados
- [ ] Health check passing

### **Deploy Frontend (Vercel):**
- [ ] Proyecto creado en Vercel
- [ ] Variables de entorno configuradas
- [ ] Build successful
- [ ] Custom domain configurado (opcional)

### **Post-Deploy:**
- [ ] CORS actualizado a dominios reales
- [ ] Stripe webhooks en modo production
- [ ] Monitoring configurado (Sentry)
- [ ] Analytics configurado (Vercel)
- [ ] Rate limiting habilitado
- [ ] SSL certificates activos

### **Testing en Production:**
- [ ] Health check endpoint: https://tu-backend.railway.app/health
- [ ] Frontend cargando: https://tu-frontend.vercel.app
- [ ] Signup flow completo
- [ ] Generation flow (FREE tier)
- [ ] Upgrade flow (Stripe checkout)
- [ ] Community pool access
- [ ] Pixel companion funcionando

---

## 🚨 **TROUBLESHOOTING**

### **Backend no arranca:**
```bash
# Ver logs en Railway
railway logs

# Verificar que el puerto sea dinámico
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### **Frontend no conecta con Backend:**
- Verificar `VITE_API_URL` en Vercel
- Verificar CORS en backend
- Check browser console for errors

### **Stripe webhooks failing:**
- Verificar `STRIPE_WEBHOOK_SECRET` correcto
- Check endpoint URL en Stripe dashboard
- Ver logs de Railway para errores de signature

### **Database connection issues:**
- Verificar `DATABASE_URL` formato correcto
- Check firewall rules en Railway
- Verificar que database esté running

---

## 📞 **URLS POST-DEPLOYMENT**

```
Backend API:        https://son1kvers3-api.railway.app
Health Check:       https://son1kvers3-api.railway.app/health
API Docs:           https://son1kvers3-api.railway.app/docs

Frontend:           https://son1kvers3.vercel.app
Pricing Page:       https://son1kvers3.vercel.app/pricing
Community Pool:     https://son1kvers3.vercel.app/community-pool

Stripe Dashboard:   https://dashboard.stripe.com
Railway Dashboard:  https://railway.app
Vercel Dashboard:   https://vercel.com
```

---

## 🎉 **LANZAMIENTO PÚBLICO**

Una vez todo está funcionando:

1. **Cambiar Stripe a Live Mode:**
   - Stripe Dashboard → Toggle "View test data" OFF
   - Actualizar keys en Railway y Vercel

2. **Anuncio:**
   - Product Hunt launch
   - Social media posts
   - Blog announcement
   - Email a beta testers

3. **Monitoring:**
   - Watch Railway logs first 24h
   - Monitor Stripe payments
   - Check error rates en Sentry
   - Track user signups

---

**Status:** ✅ Ready to Deploy  
**Estimated Time:** 1-2 hours  
**Difficulty:** Medium

**¡Tu ecosistema está listo para producción!** 🚀
