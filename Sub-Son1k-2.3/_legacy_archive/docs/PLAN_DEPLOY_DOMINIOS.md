# 🚀 PLAN DE DEPLOY COMPLETO CON DOMINIOS

**Fecha:** 3 de Enero, 2026  
**Estado:** En ejecución

---

## ✅ COMPLETADO

- [x] DNS configurado en IONOS
  - [x] Registro A: @ → 76.76.21.21
  - [x] CNAME: www → Vercel
  - [x] CNAME: the-generator → Vercel
- [x] DNS propagado y verificado
- [x] Vercel CLI instalado (v50.1.3)

---

## 🔄 EN PROGRESO

### PASO 1: Autenticación Vercel ⏳
```
Estado: Esperando autorización
URL: https://vercel.com/oauth/device?user_code=HGSK-FJXK
Acción: Completar login en navegador
```

---

## 📋 PASOS SIGUIENTES

### PASO 2: Configurar Web Classic

**Ubicación:** `apps/web-classic`

**Acciones:**
1. Vincular proyecto existente en Vercel
2. Agregar dominios:
   - `son1kvers3.com`
   - `www.son1kvers3.com`
3. Deploy producción

**Comandos:**
```powershell
cd apps/web-classic
vercel link
vercel domains add son1kvers3.com
vercel domains add www.son1kvers3.com
vercel --prod
```

---

### PASO 3: Configurar The Generator

**Ubicación:** `apps/the-generator-nextjs`

**Acciones:**
1. Vincular proyecto existente en Vercel
2. Agregar dominio:
   - `the-generator.son1kvers3.com`
3. Deploy producción

**Comandos:**
```powershell
cd apps/the-generator-nextjs
vercel link
vercel domains add the-generator.son1kvers3.com
vercel --prod
```

---

### PASO 4: Actualizar variables de entorno

**En Web Classic:**
```env
VITE_API_URL=https://api.son1kvers3.com
VITE_GENERATOR_URL=https://the-generator.son1kvers3.com
```

**En The Generator:**
```env
NEXT_PUBLIC_API_URL=https://api.son1kvers3.com
```

---

### PASO 5: Actualizar configuración de apps

**Archivo:** `apps/web-classic/src/config/apps.ts`

```typescript
export const APPS_CONFIG = {
  generatorFull: {
    name: "The Generator",
    externalUrl: "https://the-generator.son1kvers3.com",
    status: "active"
  },
  // ... resto de la configuración
};
```

---

### PASO 6: Actualizar CORS en Railway

**Backend - Variables de entorno:**
```env
ALLOWED_ORIGINS=https://son1kvers3.com,https://www.son1kvers3.com,https://the-generator.son1kvers3.com
```

**Acción:**
1. Ir a Railway dashboard
2. Seleccionar proyecto backend
3. Variables → Add/Update `ALLOWED_ORIGINS`
4. Redeploy

---

### PASO 7: Redeploy final

**Redeploy de todos los proyectos para aplicar cambios:**

```powershell
# Web Classic
cd apps/web-classic
vercel --prod

# The Generator
cd apps/the-generator-nextjs
vercel --prod
```

---

## 🔍 VERIFICACIÓN FINAL

### Pruebas de conectividad:

```powershell
# Verificar DNS
nslookup son1kvers3.com
nslookup www.son1kvers3.com
nslookup the-generator.son1kvers3.com

# Verificar HTTPS (desde navegador)
# ✅ https://son1kvers3.com
# ✅ https://www.son1kvers3.com
# ✅ https://the-generator.son1kvers3.com
```

### Checklist de funcionamiento:

- [ ] `https://son1kvers3.com` carga Web Classic
- [ ] SSL activo (candado verde)
- [ ] Navegación funciona
- [ ] `https://the-generator.son1kvers3.com` carga The Generator
- [ ] SSL activo
- [ ] Generación de música funciona
- [ ] API en `https://api.son1kvers3.com` responde
- [ ] CORS permite ambos dominios

---

## ⏱️ TIEMPO ESTIMADO

- Autenticación Vercel: 2 min
- Configurar Web Classic: 5 min
- Deploy Web Classic: 3 min
- Configurar The Generator: 5 min
- Deploy The Generator: 3 min
- Actualizar variables: 5 min
- Actualizar CORS Railway: 3 min
- Redeploy final: 5 min
- Verificación: 5 min

**Total:** ~35 minutos

---

## 🎯 RESULTADO ESPERADO

```
✅ https://son1kvers3.com
   → Web Classic (Hub Central)
   → SSL activo
   → Navegación a todas las apps

✅ https://www.son1kvers3.com
   → Redirige a son1kvers3.com
   → SSL activo

✅ https://the-generator.son1kvers3.com
   → The Generator
   → SSL activo
   → Generación de música totalmente funcional

✅ https://api.son1kvers3.com
   → Backend (Railway)
   → CORS configurado para nuevos dominios
```

---

## 📞 ENLACES ÚTILES

**Proyectos Vercel:**
- [Web Classic Dashboard](https://vercel.com/son1kvers3s-projects-c805d053/web-classic)
- [The Generator Dashboard](https://vercel.com/son1kvers3s-projects-c805d053/the-generator-nextjs)

**Backend:**
- [Railway Dashboard](https://railway.app)

**DNS:**
- [IONOS Panel](https://www.ionos.com)

---

**Estado:** En ejecución  
**Próximo:** Completar login en Vercel CLI
