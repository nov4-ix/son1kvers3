# 🚀 DESPLIEGUE DE FRONTENDS A VERCEL

**Fecha:** 28 de Diciembre, 2025
**Repositorio:** https://github.com/nov4-ix/son1kvers3-2.3

---

## 📱 FRONTENDS DISPONIBLES

### **Frontend Principal (PRIORIDAD):**
1. ✅ **The Generator (Next.js)** - `apps/the-generator-nextjs`
   - Generación de música con IA
   - Sistema de knobs creativos
   - Reproducción de audio

### **Frontends Secundarios:**
2. 🔶 **Ghost Studio** - `apps/ghost-studio`
3. 🔶 **Nova Post Pilot** - `apps/nova-post-pilot`
4. 🔶 **Web Classic (Dashboard)** - `apps/web-classic`

---

## 🎯 DESPLIEGUE 1: THE GENERATOR (PRINCIPAL)

### **📋 Configuración Lista para Vercel**

**Framework:** Next.js 16  
**Root Directory:** `apps/the-generator-nextjs`  
**Build Command:** `pnpm build`  
**Install Command:** `pnpm install`  
**Output Directory:** `.next`

---

### **🔐 VARIABLES DE ENTORNO (COPIAR Y PEGAR)**

```env
NEXT_PUBLIC_BACKEND_URL=https://sub-son1k-2-3-production.up.railway.app
NEXT_PUBLIC_ENVIRONMENT=production
```

**⚠️ IMPORTANTE:** Reemplaza la URL del backend con TU URL real de Railway.

**Para encontrar tu URL de Railway:**
```
1. Ve a Railway.app
2. Click en tu servicio Backend
3. Settings → Domains
4. Copia la URL (termina en .up.railway.app)
```

---

### **📝 PASOS PARA DESPLEGAR EN VERCEL**

#### **Paso 1: Ir a Vercel**
```
1. Abre: https://vercel.com
2. Click "Login"
3. Usa tu cuenta GitHub
```

#### **Paso 2: Importar Proyecto**
```
1. Click "Add New..." → "Project"
2. Click "Import Git Repository"
3. Busca: nov4-ix/son1kvers3-2.3
4. Click "Import"
```

#### **Paso 3: Configurar Build Settings**
```
En "Configure Project":

Framework Preset: Next.js ✅ (auto-detectado)

⚠️ CRÍTICO - Root Directory:
Click "Edit" → Escribe: apps/the-generator-nextjs

Build Command: pnpm build ✅
Output Directory: .next ✅
Install Command: pnpm install ✅

Node.js Version: 20.x ✅
```

#### **Paso 4: Agregar Variables de Entorno**
```
Antes de hacer deploy, scroll down a "Environment Variables"

1. Click "Add Variable"

Variable 1:
Name: NEXT_PUBLIC_BACKEND_URL
Value: https://TU-URL-RAILWAY.up.railway.app
(Reemplaza con tu URL real de Railway)

2. Click "Add Variable"

Variable 2:
Name: NEXT_PUBLIC_ENVIRONMENT
Value: production

3. Opcional - Si usas Supabase:

Variable 3:
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://xxx.supabase.co

Variable 4:
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGci...
```

#### **Paso 5: Deploy**
```
1. Click "Deploy"
2. Vercel iniciará el build
3. Espera 3-5 minutos
4. ✅ Deploy completo
```

#### **Paso 6: Copiar URL de Vercel**
```
Una vez desplegado:
1. Vercel te mostrará tu URL
2. Será algo como: https://son1kvers3-2-3.vercel.app
3. COPIA esta URL (la necesitarás para actualizar CORS)
```

---

### **🔄 ACTUALIZAR CORS EN RAILWAY**

**Inmediatamente después del deploy de Vercel:**

```
1. Ve a Railway.app
2. Click en tu proyecto → Servicio Backend
3. Click "Variables"
4. Busca estas 3 variables:

ALLOWED_ORIGINS
CORS_ORIGIN
FRONTEND_URL

5. Actualízalas con tu URL de Vercel:

ALLOWED_ORIGINS=https://son1kvers3-2-3.vercel.app,http://localhost:3002
CORS_ORIGIN=https://son1kvers3-2-3.vercel.app
FRONTEND_URL=https://son1kvers3-2-3.vercel.app

(Reemplaza "son1kvers3-2-3.vercel.app" con TU URL real)

6. Railway redeployará automáticamente
```

---

## ✅ VERIFICAR QUE FUNCIONA

### **Paso 1: Abrir Frontend**
```
1. Ve a tu URL de Vercel: https://tu-app.vercel.app
2. La interfaz debería cargar
```

### **Paso 2: Probar Generación de Música**
```
1. En la interfaz, escribe un prompt
   Ejemplo: "una canción pop alegre sobre el verano"
2. Ajusta los knobs si quieres
3. Click "THE GENERATOR"
4. Espera 60-120 segundos
5. ✅ Deberías recibir el audio generado
6. Click Play para escucharlo
```

### **Paso 3: Verificar en DevTools**
```
1. Presiona F12
2. Ve a la pestaña "Network"
3. Genera música nuevamente
4. Deberías ver requests a tu backend de Railway
5. Status 200 = ✅ Funcionando
```

---

## 🚀 FRONTENDS ADICIONALES (OPCIONAL)

Si quieres desplegar más frontends:

### **Ghost Studio**
```
Root Directory: apps/ghost-studio
Framework: Vite/React
Variables:
- NEXT_PUBLIC_BACKEND_URL=https://tu-railway-url.up.railway.app
```

### **Nova Post Pilot**
```
Root Directory: apps/nova-post-pilot
Framework: Next.js
Variables:
- NEXT_PUBLIC_BACKEND_URL=https://tu-railway-url.up.railway.app
```

### **Web Classic**
```
Root Directory: apps/web-classic
Framework: Vite/React
Variables:
- VITE_BACKEND_URL=https://tu-railway-url.up.railway.app
```

**Para cada uno:**
1. Vercel → New Project
2. Mismo repo: nov4-ix/son1kvers3-2.3
3. Cambiar Root Directory
4. Agregar variables
5. Deploy

---

## 📊 CHECKLIST DE DESPLIEGUE

### **The Generator (Principal):**
- [ ] Proyecto importado en Vercel
- [ ] Root Directory: `apps/the-generator-nextjs` ✅
- [ ] Variables de entorno agregadas
- [ ] Build completado
- [ ] URL de Vercel copiada
- [ ] CORS actualizado en Railway
- [ ] Frontend carga correctamente
- [ ] Generación de música funciona

### **Post-Deploy:**
- [ ] Dominio personalizado (opcional)
- [ ] SSL verificado (auto con Vercel)
- [ ] Analytics configurado (opcional)

---

## 🆘 TROUBLESHOOTING

### **Error: "Build failed"**
```
Causa: Root Directory incorrecto
Solución: Settings → General → Root Directory
         Debe ser: apps/the-generator-nextjs
```

### **Error: "Module not found"**
```
Causa: Dependencias compartidas no encontradas
Solución: Vercel ya maneja monorepos, debería funcionar automáticamente
         Si persiste: Usar "pnpm install --no-frozen-lockfile"
```

### **Error: Frontend carga pero no genera música**
```
Causa: CORS o Backend URL incorrecta
Solución:
1. Verifica NEXT_PUBLIC_BACKEND_URL en Vercel
2. Verifica ALLOWED_ORIGINS en Railway
3. Ambas deben coincidir
```

### **Error: "502 Bad Gateway"**
```
Causa: Backend de Railway está caído
Solución: Ve a Railway → Verifica que el servicio esté running
```

---

## 🎯 RESUMEN DE URLs

**Repositorio:**
https://github.com/nov4-ix/son1kvers3-2.3

**Railway Backend:**
https://TU-PROYECTO.up.railway.app
(Reemplazar con tu URL real)

**Vercel Frontend:**
https://TU-APP.vercel.app
(La obtendrás después del deploy)

---

## 💡 SIGUIENTE PASO INMEDIATO

**ACCIÓN:**
1. Ve a https://vercel.com
2. Click "Add New → Project"
3. Importa el repo
4. Configura Root Directory: `apps/the-generator-nextjs`
5. Agrega las 2 variables de entorno
6. Click "Deploy"
7. Espera 3-5 minutos

**Una vez desplegado:**
1. Copia la URL de Vercel
2. Actualiza CORS en Railway
3. Prueba la generación de música

---

## 🚨 MUY IMPORTANTE

**ANTES de hacer el deploy:**
1. Asegúrate que Railway esté funcionando
2. Verifica que `/health` responda OK
3. Ten tu URL de Railway lista para copiar

**URL de Railway se ve así:**
```
https://sub-son1k-2-3-production.up.railway.app
```

**O también:**
```
https://web-production-xxxx.up.railway.app
```

---

**¿Listo para desplegar? Ve a Vercel ahora!** 🚀

*Última actualización: 28 de Diciembre, 2025*
