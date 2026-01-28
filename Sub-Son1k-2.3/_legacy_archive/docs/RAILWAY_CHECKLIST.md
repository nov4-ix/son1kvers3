# 🚀 RAILWAY DEPLOYMENT - Checklist en Vivo

**Status:** Logueado ✅  
**Siguiente:** Crear proyecto e inicializar

---

## ✅ **PASOS COMPLETADOS**

- [x] Railway CLI instalado
- [x] Login exitoso (nov4-ix@son1kvers3.com)
- [ ] Proyecto creado
- [ ] PostgreSQL agregado
- [ ] Variables de entorno configuradas
- [ ] Código deployed
- [ ] Database inicializada
- [ ] URL obtenida

---

## 🎯 **PASO ACTUAL: Crear Proyecto**

### **Ejecuta en tu terminal:**

```bash
cd c:\Users\qrrom\Downloads\Sub-Son1k-2.3\Sub-Son1k-2.3
railway init
```

**Cuando pregunte:**
- **Project Name:** `son1kvers3-backend`

**Deberías ver:**
```
✔ Created project son1kvers3-backend
```

---

## 📋 **DESPUÉS DE CREAR EL PROYECTO:**

### **1. Agregar PostgreSQL Database**

Ve a: https://railway.app

1. Cclick en tu proyecto **son1kvers3-backend**
2. Click en **"+ New"** → **"Database"** → **"PostgreSQL"**
3. Espera 10-20 segundos a que se provisione
4. Click en la database → Pestaña **"Variables"**
5. Copia el valor de **DATABASE_URL** (empieza con `postgresql://`)

---

### **2. Configurar Variables de Entorno**

En Railway dashboard → Tu servicio backend → **"Variables"** → **"+ New Variable"**:

Agregar **TODAS** estas:

```env
DATABASE_URL=postgresql://postgres... (la que copiaste)
STRIPE_SECRET_KEY=sk_test_51... (tu Stripe test key)
STRIPE_WEBHOOK_SECRET=whsec_... (lo agregaremos después, pon "pending" por ahora)
FRONTEND_URL=https://son1kvers3.vercel.app
MAX_REQUESTS_PER_ACCOUNT=50
COOLDOWN_DURATION_MINUTES=30
GROQ_API_KEY=gsk_... (si tienes, sino pon "pending")
```

**⚠️ IMPORTANTE:**
- Por ahora usa Stripe **TEST keys** (sk_test_...)
- DATABASE_URL la obtienes de PostgreSQL en Railway
- Las demás puedes poner "pending" si no las tienes aún

---

### **3. Deploy del Código**

En tu terminal:

```bash
railway up
```

Esto:
- Sube todo tu código a Railway
- Detecta que es Python
- Instala requirements.txt
- Inicia el servidor con uvicorn

**Espera 2-3 minutos** hasta ver:
```
✔ Build successful
✔ Deployment live
```

---

### **4. Crear un Dominio Público**

En tu terminal:

```bash
railway domain
```

Te dará una URL tipo:
```
https://son1kvers3-backend-production.up.railway.app
```

**📋 GUARDA ESTA URL** - Es tu backend en producción!

---

### **5. Inicializar la Base de Datos**

```bash
railway run python -m backend.migrations.init_db
```

Esto crea todas las tablas y el usuario de prueba.

Deberías ver:
```
✅ Database initialized
✅ Test user created
```

---

### **6. Verificar que Todo Funciona**

Abre en tu browser:
```
https://TU-URL-RAILWAY.railway.app/health
```

Deberías ver:
```json
{"status":"healthy","timestamp":"2026-01-07"}
```

**🎉 Si ves eso, tu backend está LIVE!**

---

## 🔄 **LOGS EN VIVO**

Si quieres ver los logs mientras deploya:

```bash
railway logs
```

Presiona Ctrl+C para salir de los logs.

---

## 🚨 **SI ALGO FALLA**

### **Error de build:**
```bash
railway logs
```
Busca el error. Común: falta variable de entorno.

### **Database connection error:**
- Verifica que DATABASE_URL esté configurada
- Asegúrate que PostgreSQL esté running en Railway

### **Puerto incorrecto:**
- Railway usa la variable $PORT automáticamente
- Nuestro código ya lo maneja correctamente

---

## 📞 **AVÍSAME CUANDO:**

- ✅ Termines de crear el proyecto
- ✅ Agregues PostgreSQL
- ✅ Configures las variables
- ✅ El deploy termine
- ✅ Obtengas la URL
- ✅ Inicialices la DB

**¡Y vamos al siguiente paso: Vercel!** 🚀

---

**Status Actual:** Esperando que crees el proyecto en Railway  
**Tiempo Estimado:** 5 minutos para este paso
