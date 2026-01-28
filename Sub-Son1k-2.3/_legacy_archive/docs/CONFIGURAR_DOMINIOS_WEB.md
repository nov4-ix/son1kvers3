# 🌐 CONFIGURACIÓN DE DOMINIOS VÍA WEB VERCEL

**Fecha:** 3 de Enero, 2026  
**Método:** Panel Web de Vercel

---

## 🎯 PASOS PARA CONFIGURAR DOMINIOS

### PROYECTO 1: Web Classic (Hub Central)

#### Paso 1: Acceder al proyecto
```
https://vercel.com/son1kvers3s-projects-c805d053/web-classic/settings/domains
```

#### Paso 2: Agregar dominios

**Dominio 1: son1kvers3.com**
1. En el campo "Domain", escribir: `son1kvers3.com`
2. Click "Add"
3. Vercel validará automáticamente (DNS ya configurado ✅)

**Dominio 2: www.son1kvers3.com**
1. En el campo "Domain", escribir: `www.son1kvers3.com`
2. Click "Add"
3. Vercel validará automáticamente (DNS ya configurado ✅)

---

### PROYECTO 2: The Generator

#### Paso 1: Acceder al proyecto
```
https://vercel.com/son1kvers3s-projects-c805d053/the-generator-nextjs/settings/domains
```

#### Paso 2: Agregar dominio

**Dominio: the-generator.son1kvers3.com**
1. En el campo "Domain", escribir: `the-generator.son1kvers3.com`
2. Click "Add"
3. Vercel validará automáticamente (DNS ya configurado ✅)

---

## ✅ VERIFICACIÓN DE ESTADO

Después de agregar los dominios, deberías ver:

### Web Classic:
```
✓ son1kvers3.com              Valid Configuration
✓ www.son1kvers3.com          Valid Configuration
```

### The Generator:
```
✓ the-generator.son1kvers3.com   Valid Configuration
```

---

## 🔐 CERTIFICADOS SSL

Vercel generará automáticamente certificados SSL (Let's Encrypt) en 5-10 minutos.

**Estado esperado:**
- Inicial: "Pending"
- Final: "Valid" con candado verde 🔒

---

## 🚀 SIGUIENTE PASO: ACTUALIZAR CONFIGURACIÓN

Una vez agregados los dominios, actualizar `apps.ts`:

### Archivo: `apps/web-classic/src/config/apps.ts`

```typescript
export const APPS_CONFIG = {
  generatorFull: {
    name: "The Generator",
    externalUrl: "https://the-generator.son1kvers3.com", // ← ACTUALIZAR
    status: "active"
  },
  
  novaPostPilot: {
    name: "Nova Post Pilot",
    externalUrl: "https://nova-post-pilot-27dl5sd8o-son1kvers3s-projects-c805d053.vercel.app",
    status: "active"
  },
  
  ghostStudio: {
    name: "Ghost Studio",
    externalUrl: "#",
    status: "pending",
    comingSoon: true
  }
};
```

---

## 🔄 REDEPLOY

Después de actualizar `apps.ts`, hacer redeploy:

### Opción A: Via CLI
```powershell
cd apps/web-classic
vercel --prod
```

### Opción B: Via Git
```powershell
git add .
git commit -m "Update domains to custom URLs"
git push
```
Vercel redeployará automáticamente.

---

## 🎯 VARIABLES DE ENTORNO

### Web Classic

Actualizar en Vercel → Settings → Environment Variables:

```env
VITE_API_URL=https://api.son1kvers3.com
VITE_GENERATOR_URL=https://the-generator.son1kvers3.com
```

### The Generator

Actualizar en Vercel → Settings → Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://api.son1kvers3.com
```

---

## 🔧 CORS EN RAILWAY

Actualizar backend en Railway:

1. Ir a: https://railway.app
2. Seleccionar proyecto backend
3. Variables → Add/Update:

```env
ALLOWED_ORIGINS=https://son1kvers3.com,https://www.son1kvers3.com,https://the-generator.son1kvers3.com
```

4. Redeploy

---

## ✅ CHECKLIST COMPLETO

### Configuración de dominios:
- [ ] Web Classic: Agregar `son1kvers3.com`
- [ ] Web Classic: Agregar `www.son1kvers3.com`
- [ ] The Generator: Agregar `the-generator.son1kvers3.com`
- [ ] Verificar estado "Valid Configuration"
- [ ] Esperar SSL activo (5-10 min)

### Actualizar código:
- [ ] Modificar `apps/web-classic/src/config/apps.ts`
- [ ] Commit y push
- [ ] Verificar redeploy automático

### Variables de entorno:
- [ ] Web Classic: `VITE_GENERATOR_URL`
- [ ] The Generator: `NEXT_PUBLIC_API_URL`
- [ ] Railway Backend: `ALLOWED_ORIGINS`
- [ ] Redeploy todos los servicios

### Verificación final:
- [ ] `https://son1kvers3.com` carga
- [ ] `https://www.son1kvers3.com` carga
- [ ] `https://the-generator.son1kvers3.com` carga
- [ ] SSL activo en todos
- [ ] Navegación funciona
- [ ] Generación de música funciona

---

## 🌐 URLS DIRECTAS

**Configuración de dominios:**
- [Web Classic - Domains](https://vercel.com/son1kvers3s-projects-c805d053/web-classic/settings/domains)
- [The Generator - Domains](https://vercel.com/son1kvers3s-projects-c805d053/the-generator-nextjs/settings/domains)

**Variables de entorno:**
- [Web Classic - Env Vars](https://vercel.com/son1kvers3s-projects-c805d053/web-classic/settings/environment-variables)
- [The Generator - Env Vars](https://vercel.com/son1kvers3s-projects-c805d053/the-generator-nextjs/settings/environment-variables)

**Railway:**
- [Railway Dashboard](https://railway.app)

---

## ⏱️ TIEMPO ESTIMADO

- Agregar dominios: 5 minutos
- Esperar SSL: 10 minutos
- Actualizar código: 5 minutos
- Actualizar variables: 5 minutos
- Redeploy: 5 minutos
- Verificación: 5 minutos

**Total:** ~35 minutos

---

**Estado:** Listo para ejecutar  
**Acción:** Agregar dominios via panel web de Vercel
