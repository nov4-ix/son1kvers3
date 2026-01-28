# 🚀 DEPLOYMENT - Pasos Manuales (Ejecuta en tu terminal)

**Status:** Archivos de configuración listos ✅  
**Próximo:** Deploy manual paso a paso

---

## 🚂 **PARTE 1: RAILWAY (Backend) - 30 minutos**

### **Paso 1: Login en Railway**

Abre tu terminal en:
```
c:\Users\qrrom\Downloads\Sub-Son1k-2.3\Sub-Son1k-2.3
```

Ejecuta:
```bash
railway login
```

Se abrirá tu browser. Autoriza la aplicación.

---

### **Paso 2: Crear Proyecto en Railway**

```bash
railway init
```

Selecciona:
- **Create new project**
- Nombre: `son1kvers3-backend`

---

### **Paso 3: Agregar PostgreSQL**

En el dashboard de Railway (se abrirá automáticamente):

1. Click en **"New"** → **"Database"** → **"PostgreSQL"**
2. Espera unos segundos a que se provisione
3. Click en la database → **"Variables"** → Copia el **DATABASE_URL**

---

### **Paso 4: Configurar Variables de Entorno**

En Railway dashboard → Tu servicio backend → **"Variables"**:

Agregar estas variables:

```
DATABASE_URL=postgresql://postgres:... (la que copiaste)
STRIPE_SECRET_KEY=sk_test_51... (tu key de Stripe)
STRIPE_WEBHOOK_SECRET=whsec_... (lo configuraremos después)
FRONTEND_URL=https://son1kvers3.vercel.app
MAX_REQUESTS_PER_ACCOUNT=50
COOLDOWN_DURATION_MINUTES=30
```

**⚠️ IMPORTANTE:** Por ahora usa las **test keys** de Stripe (sk_test_...)

---

### **Paso 5: Deploy del Backend**

En tu terminal:

```bash
railway up
```

Esto:
- Sube tu código
- Instala dependencias
- Inicia el server

**Espera** 2-3 minutos hasta que veas: ✅ **Deployment successful**

---

### **Paso 6: Obtener la URL del Backend**

```bash
railway domain
```

Esto creará un dominio tipo:
```
https://son1kvers3-backend-production.up.railway.app
```

**📋 GUARDA ESTA URL** - la necesitarás para el frontend.

---

### **Paso 7: Inicializar Base de Datos**

```bash
railway run python -m backend.migrations.init_db
```

Esto crea todas las tablas y el usuario de prueba.

---

### **Paso 8: Verificar que Funciona**

Abre en tu browser:
```
https://TU-BACKEND-URL.railway.app/health
```

Deberías ver:
```json
{"status":"healthy","timestamp":"2026-01-07"}
```

✅ **Backend Deployed!**

---

## ▲ **PARTE 2: VERCEL (Frontend) - 20 minutos**

### **Paso 1: Login en Vercel**

En tu terminal:

```bash
vercel login
```

Ingresa tu email y verifica.

---

### **Paso 2: Deploy Inicial**

```bash
vercel
```

Responde las preguntas:
- **Set up and deploy?** → Yes
- **Which scope?** → Tu cuenta personal
- **Link to existing project?** → No
- **Project name?** → son1kvers3-frontend
- **Directory?** → ./ (dejar en blanco)
- **Override settings?** → No

Vercel automáticamente:
- Detecta que es un monorepo con Vite
- Instala dependencias
- Hace el build
- Deploya

**Espera** 3-5 minutos.

---

### **Paso 3: Configurar Variables de Entorno**

Ve a: https://vercel.com → Tu proyecto → **Settings** → **Environment Variables**

Agregar:

```
VITE_API_URL = https://TU-BACKEND-URL.railway.app
VITE_STRIPE_PUBLISHABLE_KEY = pk_test_51... (tu publishable key)
```

**⚠️ IMPORTANTE:** Usa la URL de Railway que obtuviste antes.

---

### **Paso 4: Redeploy con las Variables**

```bash
vercel --prod
```

Esto re-deploya con las nuevas variables.

---

### **Paso 5: Obtener URL del Frontend**

Vercel te dará una URL tipo:
```
https://son1kvers3-frontend.vercel.app
```

---

### **Paso 6: Actualizar FRONTEND_URL en Railway**

Vuelve a Railway → Variables → Edita `FRONTEND_URL`:

```
FRONTEND_URL=https://TU-FRONTEND-URL.vercel.app
```

Esto re-deployará automáticamente el backend con CORS actualizado.

---

## 🔗 **PARTE 3: CONFIGURAR STRIPE WEBHOOKS - 10 minutos**

### **Paso 1: Ir a Stripe Dashboard**

https://dashboard.stripe.com/test/webhooks

---

### **Paso 2: Add Endpoint**

1. Click **"Add endpoint"**
2. **Endpoint URL:**
   ```
   https://TU-BACKEND-URL.railway.app/api/tiers/webhook
   ```
3. **Description:** Son1kVers3 Payments
4. **Events to send:**
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`

5. Click **"Add endpoint"**

---

### **Paso 3: Copiar Webhook Secret**

1. Click en el endpoint que acabas de crear
2. Click **"Reveal"** en **Signing secret**
3. Copia el valor (empieza con `whsec_...`)

---

### **Paso 4: Actualizar en Railway**

Railway → Variables → Edita:

```
STRIPE_WEBHOOK_SECRET=whsec_... (el que copiaste)
```

Espera a que re-deploye (~30 segundos).

---

## ✅ **PARTE 4: TESTING - 10 minutos**

### **Test 1: Backend Health**

```
https://TU-BACKEND-URL.railway.app/health
```

Debería responder:
```json
{"status":"healthy","timestamp":"2026-01-07"}
```

---

### **Test 2: API Docs**

```
https://TU-BACKEND-URL.railway.app/docs
```

Deberías ver la interfaz de Swagger con todos los endpoints.

---

### **Test 3: Frontend**

```
https://TU-FRONTEND-URL.vercel.app
```

La app debería cargar correctamente.

---

### **Test 4: User Limits Endpoint**

```
https://TU-BACKEND-URL.railway.app/api/tiers/limits/test_user_1
```

Debería responder con los límites del usuario de prueba.

---

### **Test 5: Signup Flow** (desde el frontend)

1. Ve a tu frontend
2. Intenta hacer signup (si tienes esa página)
3. Verifica que se conecte al backend

---

### **Test 6: Stripe Checkout** (opcional por ahora)

1. Ve a `/pricing` en tu frontend
2. Click en "Upgrade to CREATOR"
3. Deberías ver el checkout de Stripe (modo test)
4. Usa tarjeta de prueba: `4242 4242 4242 4242`

---

## 🎉 **¡DEPLOYMENT COMPLETADO!**

Si todos los tests pasan, tienes:

✅ Backend en Railway  
✅ Frontend en Vercel  
✅ Database PostgreSQL  
✅ Stripe webhooks configurados  
✅ CORS configurado  
✅ Todo funcionando  

---

## 📊 **TUS URLS DE PRODUCCIÓN**

Guarda estas URLs:

```
Backend:
https://TU-BACKEND-URL.railway.app

Frontend:
https://TU-FRONTEND-URL.vercel.app

API Docs:
https://TU-BACKEND-URL.railway.app/docs

Dashboards:
Railway: https://railway.app
Vercel: https://vercel.com
Stripe: https://dashboard.stripe.com
```

---

## 🚨 **SI ALGO FALLA**

### **Railway no deploya:**
```bash
railway logs
```

Busca errores. Comunes:
- Falta variable de entorno
- Error en requirements.txt
- Puerto incorrecto

### **Vercel build falla:**
```bash
vercel logs
```

Comunes:
- Variables de entorno faltantes
- Error en package.json
- Import paths incorrectos

### **Stripe webhooks no funcionan:**
- Verifica la URL del endpoint
- Verifica el webhook secret
- Check Railway logs cuando hagas un test payment

---

## 📞 **SIGUIENTE**

Una vez que todo esté deployed:

1. **Mándame las URLs** de tu backend y frontend
2. **Probaré** los endpoints
3. **Verificaré** que todo funcione
4. **Te daré feedback** de optimizaciones

---

## 💡 **TIPS**

- **Railway:** Usa el free tier por ahora ($5/mes de crédito)
- **Vercel:** Hobby plan es gratis
- **PostgreSQL:** Railway provee 1GB gratis
- **Stripe:** Usa test mode hasta que estés listo

---

**Tiempo estimado total:** 60-80 minutos  
**Dificultad:** Media  
**Resultado:** App en producción 🚀

**¡Empieza con Paso 1 de Railway y avísame cuando termines cada parte!**
