# 🔐 VARIABLES DE ENTORNO - DEPLOYMENT CHECKLIST
## Son1kVers3 - Deployment Configuration

**Fecha**: 2026-01-09 06:08:26

---

## 🚂 RAILWAY (Backend)

### Variables Obligatorias:
- [ ] \DATABASE_URL\ - PostgreSQL connection string (provisto por Railway)
  - Ejemplo: \postgresql://user:password@host:port/dbname\
  - Railway provee esto automáticamente al agregar PostgreSQL service

### Variables Recomendadas:
- [ ] \STRIPE_SECRET_KEY\ - Para procesamiento de pagos
  - Obtener de: https://dashboard.stripe.com/apikeys
  - Formato: \sk_live_...\ (producción) o \sk_test_...\ (testing)

- [ ] \STRIPE_WEBHOOK_SECRET\ - Para webhooks de Stripe
  - Obtener de: https://dashboard.stripe.com/webhooks
  - Formato: \whsec_...\

- [ ] \GROQ_API_KEY\ - Para Pixel AI Companion
  - Obtener de: https://console.groq.com
  - Formato: \gsk_...\
  - GRATIS con límite generoso

- [ ] \FRONTEND_URL\ - URL del frontend en Vercel
  - Ejemplo: \https://tu-app.vercel.app\
  - Necesario para CORS

### Variables Opcionales:
- [ ] \SUNO_TOKENS\ - Array de tokens de Suno AI
  - Formato: \["token1", "token2", "token3"]\
  - Obtener de: https://app.suno.ai (inspeccionar cookies)

- [ ] \MAX_REQUESTS_PER_ACCOUNT\ - Límite del stealth system
  - Default: 50

- [ ] \COOLDOWN_DURATION_MINUTES\ - Cooldown del stealth system
  - Default: 30

---

## ▲ VERCEL (Frontend)

### Variables Obligatorias:
- [ ] \VITE_API_URL\ - URL del backend en Railway
  - Ejemplo: \https://tu-backend.railway.app\

### Variables Recomendadas:
- [ ] \VITE_STRIPE_PUBLISHABLE_KEY\ - Stripe public key
  - Obtener de: https://dashboard.stripe.com/apikeys
  - Formato: \pk_live_...\ (producción) o \pk_test_...\ (testing)

### Variables Opcionales (si usas Supabase Auth):
- [ ] \VITE_SUPABASE_URL\ - Supabase project URL
  - Ejemplo: \https://xxxxx.supabase.co\

- [ ] \VITE_SUPABASE_ANON_KEY\ - Supabase anon key
  - Formato: \yJhbGc...\

---

## 🎯 SERVICIOS EXTERNOS NECESARIOS

### PostgreSQL (Required):
- [ ] Railway PostgreSQL service provisioned
- [ ] O usar Supabase PostgreSQL (gratis)
- [ ] DATABASE_URL configurado en Railway

### Stripe (Opcional - para pagos):
- [ ] Cuenta creada en https://stripe.com
- [ ] API keys obtenidas (test primero, luego live)
- [ ] Webhook endpoint configurado: \https://tu-backend.railway.app/api/tiers/webhook\

### Groq (Opcional - para Pixel AI):
- [ ] Cuenta creada en https://console.groq.com
- [ ] API key obtenida (gratis)

### Suno AI (Crítico - para generación de música):
- [ ] Cuenta en https://app.suno.ai
- [ ] Tokens obtenidos (via cookies o extensión Chrome)
- [ ] Mínimo 1 token válido

---

## 📋 PASOS DEPLOYMENT

### Railway (Backend):

1. **Crear Proyecto**:
   \\\ash
   # Opción 1: Desde GitHub
   - Ir a https://railway.app
   - New Project → Deploy from GitHub
   - Seleccionar repositorio
   - Root directory: backend/
   
   # Opción 2: Con Railway CLI
   npm i -g @railway/cli
   railway login
   railway init
   railway up
   \\\

2. **Agregar PostgreSQL**:
   - En Railway dashboard
   - New → Database → PostgreSQL
   - Se auto-configura DATABASE_URL

3. **Configurar Variables**:
   - Settings → Variables
   - Agregar todas las variables listadas arriba

4. **Verificar Deploy**:
   - Esperar build completo
   - Abrir: https://tu-backend.railway.app/health
   - Debe responder: \{"status": "healthy"}\

### Vercel (Frontend):

1. **Importar Proyecto**:
   \\\ash
   # Opción 1: Desde dashboard
   - Ir a https://vercel.com
   - New Project → Import Git Repository
   - Root Directory: apps/web-classic
   - Framework Preset: Vite
   
   # Opción 2: Con Vercel CLI
   npm i -g vercel
   vercel login
   vercel
   \\\

2. **Configurar Variables**:
   - Project Settings → Environment Variables
   - Agregar todas las variables listadas arriba

3. **Deploy**:
   - Deploy automático en cada push
   - O manual: \ercel --prod\

4. **Verificar**:
   - Abrir URL de Vercel
   - Verificar que carga correctamente
   - Check consola del navegador (F12) para errores

---

## ✅ POST-DEPLOYMENT CHECKLIST

### Backend:
- [ ] Health check responde: \/health\
- [ ] API docs accesibles: \/docs\
- [ ] Database conectada correctamente
- [ ] Logs sin errores críticos

### Frontend:
- [ ] Aplicación carga correctamente
- [ ] Se conecta al backend (verificar Network tab)
- [ ] No hay errores en consola
- [ ] Estilos cargando correctamente

### Integración:
- [ ] CORS configurado correctamente
- [ ] Frontend puede hacer requests al backend
- [ ] Autenticación funciona (si aplica)
- [ ] Generación de música funciona (si tienes tokens)

---

## 🔧 TROUBLESHOOTING

### Backend no arranca:
- Verificar logs en Railway dashboard
- Comprobar que todas las variables estén configuradas
- Verificar que DATABASE_URL sea válido

### Frontend no se conecta:
- Verificar VITE_API_URL en Vercel
- Comprobar CORS en backend (agregar URL de Vercel)
- Verificar Network tab en navegador

### Database errors:
- Verificar que PostgreSQL service esté running
- Ejecutar migraciones si es necesario
- Comprobar DATABASE_URL formato correcto

---

## 📞 RECURSOS

- **Railway**: https://railway.app
- **Vercel**: https://vercel.com
- **Stripe**: https://stripe.com
- **Groq**: https://console.groq.com
- **Suno AI**: https://app.suno.ai
- **Documentación**: Ver DEPLOYMENT_GUIDE.md

---

**Generado**: 2026-01-09 06:08:26
**Proyecto**: Son1kVers3 v2.3
