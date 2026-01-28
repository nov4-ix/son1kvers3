# 🚀 PLAN DE LANZAMIENTO - CORE 4 APPS

**Fecha:** 28 de Diciembre, 2025  
**Enfoque:** Las 4 aplicaciones principales del ecosistema

---

## 🎯 APPS PRINCIPALES

### **1. The Generator** ✅ FUNCIONANDO
```
Estado: ✅ EN PRODUCCIÓN
URL: https://the-generator-gpzj6pn9y-son1kvers3s-projects.vercel.app
Funcionalidad: Generación completa de música con IA
Features:
- Knobs creativos
- Sistema de polling robusto
- Reproducción de audio
- Generación exitosa probada
```

### **2. Ghost Studio** 🔧 PENDIENTE DEPLOY
```
Estado: ⏳ Código listo, deploy pendiente
Directorio: apps/ghost-studio
Framework: Vite + React
Funcionalidad: Mini DAW para covers y edición
Features:
- Covers con IA
- Editor de audio
- Efectos y procesamiento
```

### **3. Nova Post Pilot** 🔧 PENDIENTE DEPLOY
```
Estado: ⏳ Código listo, deploy pendiente
Directorio: apps/nova-post-pilot
Framework: Next.js
Funcionalidad: Marketing y analytics
Features:
- Scheduling de posts
- Generación de hooks con IA
- Analytics y métricas
```

### **4. Pixel** ✅ INTEGRADO
```
Estado: ✅ Ya implementado en Web Classic
Componente: PixelChatAdvanced.tsx
Funcionalidad: Asistente flotante que aprende del usuario
Features:
- Chat inteligente
- Aprende de interacciones
- Asistencia en navegación
- Siempre visible (flotante)
```

---

## 📋 PLAN DE DESPLIEGUE SIMPLIFICADO

### **PASO 1: Web Classic (Hub Central)** ⏳
```powershell
# Deploy del landing/hub principal
cd apps/web-classic
vercel --prod

Variables necesarias:
- VITE_BACKEND_URL=https://[railway-url].up.railway.app
- VITE_ENVIRONMENT=production
```

**Tiempo:** 10-15 minutos  
**Resultado:** Hub central con navegación a todas las apps

---

### **PASO 2: Ghost Studio** ⏳
```powershell
# Deploy de Ghost Studio
cd apps/ghost-studio
vercel --prod

Variables necesarias:
- VITE_BACKEND_URL=https://[railway-url].up.railway.app
- VITE_ENVIRONMENT=production
```

**Tiempo:** 10-15 minutos  
**Resultado:** Mini DAW operativo

---

### **PASO 3: Nova Post Pilot** ⏳
```powershell
# Deploy de Nova Post Pilot
cd apps/nova-post-pilot
vercel --prod

Variables necesarias:
- NEXT_PUBLIC_BACKEND_URL=https://[railway-url].up.railway.app
- NEXT_PUBLIC_ENVIRONMENT=production
```

**Tiempo:** 10-15 minutos  
**Resultado:** Herramienta de marketing activa

---

### **PASO 4: Actualizar Links** ⏳
```
1. Copiar URLs de Ghost Studio y Nova Post Pilot
2. Actualizar apps.ts con las URLs reales
3. Redeploy Web Classic
4. Verificar navegación
```

**Tiempo:** 5 minutos

---

## 🎨 ARQUITECTURA FINAL

```
┌───────────────────────────────────────┐
│     WEB CLASSIC (Hub Central)         │
│     https://son1kvers3.vercel.app     │
├───────────────────────────────────────┤
│                                       │
│  🎵 The Generator                     │
│  └─ Link externo ✅                  │
│                                       │
│  🎛️ Ghost Studio                     │
│  └─ Link externo ⏳                  │
│                                       │
│  📊 Nova Post Pilot                   │
│  └─ Link externo ⏳                  │
│                                       │
│  💫 Pixel (Flotante) ✅               │
│  └─ Integrado, siempre visible       │
│                                       │
└───────────────────────────────────────┘
           │
           ▼
   ┌──────────────┐
   │   BACKEND    │
   │   Railway    │
   └──────────────┘
```

---

## ✅ CHECKLIST DE LANZAMIENTO

### **The Generator:**
- [x] Deploy completado
- [x] Generación funcionando
- [x] Audio reproduciéndose
- [x] URL pública

### **Web Classic:**
- [ ] Deploy a Vercel
- [ ] Navegación configurada
- [ ] Links a The Generator
- [ ] Pixel integrado
- [ ] URL pública

### **Ghost Studio:**
- [ ] Deploy a Vercel
- [ ] Variables configuradas
- [ ] Funcionalidad verificada
- [ ] Link actualizado en Web Classic

### **Nova Post Pilot:**
- [ ] Deploy a Vercel
- [ ] Variables configuradas
- [ ] Funcionalidad verificada
- [ ] Link actualizado en Web Classic

### **Pixel:**
- [x] Código integrado
- [ ] Verificar en producción
- [ ] Confirmar learning funciona

---

## 🚀 ACCIÓN INMEDIATA

**ORDEN DE EJECUCIÓN:**

1. **Web Classic** (15 min)
   - Deploy del hub principal
   - Base para todo el ecosistema

2. **Ghost Studio** (15 min)
   - Deploy de la herramienta de audio
   - Actualizar link

3. **Nova Post Pilot** (15 min)
   - Deploy de herramienta de marketing
   - Actualizar link

4. **Verificación Final** (10 min)
   - Probar navegación
   - Verificar todas las apps funcionan
   - Confirmar Pixel aprende del usuario

**TOTAL: ~55 minutos para ecosistema completo** ✅

---

## 💡 COMANDOS RÁPIDOS

```powershell
# Script para deploy rápido de las 3 apps pendientes

# 1. Web Classic
cd C:\Users\qrrom\Downloads\Sub-Son1k-2.3\Sub-Son1k-2.3\apps\web-classic
vercel --prod

# 2. Ghost Studio
cd ..\ghost-studio
vercel --prod

# 3. Nova Post Pilot
cd ..\nova-post-pilot
vercel --prod
```

---

## 🎯 SIGUIENTE PASO

**¿Qué prefieres?**

**A) Deploy en secuencia** (empezar con Web Classic)  
**B) Deploy paralelo** (las 3 apps al mismo tiempo)  
**C) Solo Web Classic** (y después las demás)

**Dime y procedo.** 🚀

---

*Plan simplificado - Enfoque en las 4 apps core*
