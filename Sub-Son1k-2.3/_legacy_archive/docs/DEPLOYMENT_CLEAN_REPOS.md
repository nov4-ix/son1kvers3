# 🎯 REPOS LIMPIOS - GUÍA DE DEPLOYMENT

**Status:** Creando repos limpios...  
**Ubicación:** `c:\Users\qrrom\Downloads\Son1kVers3-Clean`

---

## 📦 **REPOS CREADOS**

### **1. Backend: `son1kvers3-backend`**
```
c:\Users\qrrom\Downloads\Son1kVers3-Clean\son1kvers3-backend\
```

**Contenido:**
- ✅ Código backend completo
- ✅ 5 servicios (Tiers, Pool, Stealth, ALVAE, Pixel)
- ✅ 26 endpoints RESTful
- ✅ README.md
- ✅ .env.example
- ✅ Procfile para Railway
- ✅ Git inicializado con commit

### **2. Frontend: `son1kvers3-frontend`**
```
c:\Users\qrrom\Downloads\Son1kVers3-Clean\son1kvers3-frontend\
```

**Contenido:**
- ✅ apps/web-classic
- ✅ apps/the-generator
- ✅ packages/ (5 custom packages)
- ✅ README.md
- ✅ .env.example
- ✅ Git inicializado con commit

---

## 🚀 **PASO 1: CREAR REPOS EN GITHUB**

### **A. Backend Repo**

1. **Ve a:** https://github.com/new

2. **Configuración:**
   - **Repository name:** `son1kvers3-backend`
   - **Description:** "Son1kVers3 Backend API - FastAPI + PostgreSQL"
   - **Visibility:** Private (recomendado)
   - **NO inicializar** con README, .gitignore o license

3. **Click "Create repository"**

4. **Copia la URL:** `https://github.com/nov4-ix/son1kvers3-backend.git`

---

### **B. Frontend Repo**

1. **Ve a:** https://github.com/new

2. **Configuración:**
   - **Repository name:** `son1kvers3-frontend`
   - **Description:** "Son1kVers3 Frontend - React + TypeScript Monorepo"
   - **Visibility:** Private (recomendado)
   - **NO inicializar** con README, .gitignore o license

3. **Click "Create repository"**

4. **Copia la URL:** `https://github.com/nov4-ix/son1kvers3-frontend.git`

---

## 🔗 **PASO 2: CONECTAR Y PUSHEAR**

### **Backend:**

```powershell
cd c:\Users\qrrom\Downloads\Son1kVers3-Clean\son1kvers3-backend

# Conectar con GitHub
git remote add origin https://github.com/nov4-ix/son1kvers3-backend.git

# Push
git branch -M main
git push -u origin main
```

### **Frontend:**

```powershell
cd c:\Users\qrrom\Downloads\Son1kVers3-Clean\son1kvers3-frontend

# Conectar con GitHub
git remote add origin https://github.com/nov4-ix/son1kvers3-frontend.git

# Push
git branch -M main
git push -u origin main
```

---

## 🚂 **PASO 3: DEPLOY BACKEND A RAILWAY**

```powershell
cd c:\Users\qrrom\Downloads\Son1kVers3-Clean\son1kvers3-backend

# Login (si no lo has hecho)
railway login

# Crear proyecto
railway init
# Nombre: son1kvers3-backend

# Agregar PostgreSQL
railway add --database postgres

# Configurar variables de entorno en el dashboard:
# https://railway.app → Tu proyecto → Variables

# Deploy
railway up

# Generar dominio público
railway domain
```

**Variables de entorno a configurar en Railway:**
```
DATABASE_URL=(auto-detectado de PostgreSQL)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://son1kvers3.vercel.app
```

---

## ▲ **PASO 4: DEPLOY FRONTEND A VERCEL**

```powershell
cd c:\Users\qrrom\Downloads\Son1kVers3-Clean\son1kvers3-frontend

# Login
vercel login

# Deploy inicial (staging)
vercel

# Deploy a producción
vercel --prod
```

**Variables de entorno a configurar en Vercel:**
```
VITE_API_URL=https://TU-BACKEND.railway.app
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## ✅ **PASO 5: VERIFICACIÓN**

### **Backend:**
```
https://TU-BACKEND.railway.app/health
```

Debería responder:
```json
{"status":"healthy","timestamp":"2026-01-09"}
```

### **Frontend:**
```
https://TU-FRONTEND.vercel.app
```

Debería cargar la aplicación.

---

## 🎯 **CHECKLIST FINAL**

### **GitHub:**
- [ ] Backend repo creado
- [ ] Frontend repo creado
- [ ] Backend pusheado
- [ ] Frontend pusheado

### **Railway (Backend):**
- [ ] Proyecto creado
- [ ] PostgreSQL agregado
- [ ] Variables configuradas
- [ ] Deploy exitoso
- [ ] Dominio público generado
- [ ] Health check funciona

### **Vercel (Frontend):**
- [ ] Proyecto creado
- [ ] Variables configuradas
- [ ] Deploy exitoso
- [ ] App carga correctamente

### **Stripe:**
- [ ] Webhook configurado
- [ ] Apunta a Railway backend
- [ ] Webhook secret en Railway

---

## 🆘 **SI ALGO FALLA**

### **Backend no deploya:**
```bash
railway logs
```
Buscar error específico.

### **Frontend build falla:**
```bash
vercel logs
```
Verificar imports y dependencies.

### **Database connection error:**
- Verificar DATABASE_URL en Railway
- Asegurarse que PostgreSQL está running

---

## 📞 **SIGUIENTE**

Una vez completados todos los pasos:
1. **Avísame** las URLs de tus deploys
2. **Probaré** los endpoints
3. **Configuraremos** Stripe webhooks
4. **Verificaremos** que todo funcione end-to-end

---

**Status:** ✅ Repos listos  
**Siguiente:** Crear repos en GitHub y pushear
