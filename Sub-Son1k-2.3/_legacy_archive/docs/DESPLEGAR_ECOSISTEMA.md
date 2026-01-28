# 🚀 DESPLIEGUE DEL ECOSISTEMA COMPLETO

**Estado Actual:** The Generator ✅ Funcionando  
**Próximo:** Web Classic + Generator Express + Integración

---

## 📋 PLAN DE ACCIÓN INMEDIATO

### **PASO 1: DEPLOY WEB CLASSIC (Dashboard Principal)**

**Usar Vercel CLI:**

```powershell
# Navegar a web-classic
cd C:\Users\qrrom\Downloads\Sub-Son1k-2.3\Sub-Son1k-2.3\apps\web-classic

# Deploy a producción
vercel --prod
```

**Configuración durante deploy:**
```
? Set up and deploy? → Y
? Which scope? → Tu cuenta
? Link to existing project? → N
? Project name? → son1kvers3-web-classic
? In which directory? → ./ (Enter)
? Want to override? → N

? Add environment variables? → Y

Name: VITE_BACKEND_URL
Value: [TU URL DE RAILWAY]

Name: VITE_GENERATOR_URL
Value: https://the-generator-gpzj6pn9y-son1kvers3s-projects.vercel.app

Name: VITE_ENVIRONMENT
Value: production

? Add another? → N
```

**URL resultante:** `https://son1kvers3-web-classic.vercel.app`

---

### **PASO 2: DEPLOY GENERATOR EXPRESS (Versión Simplificada)**

```powershell
# Navegar a the-generator
cd C:\Users\qrrom\Downloads\Sub-Son1k-2.3\Sub-Son1k-2.3\apps\the-generator

# Deploy a producción
vercel --prod
```

**Configuración:**
```
? Project name? → son1kvers3-generator-express

Variables:
Name: VITE_BACKEND_URL
Value: [TU URL DE RAILWAY]

Name: VITE_ENVIRONMENT
Value: production
```

**URL resultante:** `https://son1kvers3-generator-express.vercel.app`

---

### **PASO 3: ACTUALIZAR CORS EN RAILWAY**

Una vez que tengas las URLs de ambos frontends:

```
Railway → Backend → Variables

ALLOWED_ORIGINS:
https://the-generator-gpzj6pn9y-son1kvers3s-projects.vercel.app,https://son1kvers3-web-classic.vercel.app,https://son1kvers3-generator-express.vercel.app,http://localhost:3002
```

---

## 🎨 CONFIGURACIÓN DE WEB CLASSIC

### **Crear archivo de configuración de apps:**

**Archivo:** `apps/web-classic/src/config/apps.config.ts`

```typescript
export const APPS_CONFIG = {
  generator: {
    name: "The Generator",
    url: "https://the-generator-gpzj6pn9y-son1kvers3s-projects.vercel.app",
    icon: "🎵",
    description: "Generador completo de música con IA",
    features: ["Knobs creativos", "Control avanzado", "Múltiples estilos"],
    type: "primary"
  },
  generatorExpress: {
    name: "Generator Express",
    url: "https://son1kvers3-generator-express.vercel.app",
    icon: "⚡",
    description: "Generación rápida con un click",
    features: ["Presets listos", "Ultra rápido", "Interfaz simple"],
    type: "primary"
  },
  ghostStudio: {
    name: "Ghost Studio",
    url: "#", // Pendiente
    icon: "🎛️",
    description: "Mini DAW para covers y edición",
    features: ["Covers con IA", "Editor de audio", "Efectos"],
    type: "secondary",
    comingSoon: true
  },
  novaPostPilot: {
    name: "Nova Post Pilot",
    url: "#", // Pendiente
    icon: "📊",
    description: "Marketing y analytics",
    features: ["Scheduling", "Analytics", "Hooks con IA"],
    type: "secondary",
    comingSoon: true
  }
};

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
```

---

## 📊 ESTRUCTURA DEL ECOSISTEMA

```
┌────────────────────────────────────────────┐
│     WEB CLASSIC (Landing + Dashboard)      │
│  https://son1kvers3-web-classic.vercel.app │
│                                            │
│  ┌──────────────┬──────────────┐          │
│  │ 🎵 Generator │ ⚡ Express   │          │
│  │    Full      │   (Rápido)   │          │
│  └──────────────┴──────────────┘          │
└────────────────────────────────────────────┘
              │              │
              ▼              ▼
    ┌────────────────────────────────┐
    │         BACKEND RAILWAY         │
    │  https://[tu-url].railway.app   │
    │                                 │
    │  ✅ Generación de música        │
    │  ✅ Gestión de tokens          │
    │  ✅ Base de datos              │
    └────────────────────────────────┘
```

---

## 🎯 COMANDOS RÁPIDOS

### **Deploy Quick:**

```powershell
# Web Classic
cd apps/web-classic && vercel --prod

# Generator Express  
cd apps/the-generator && vercel --prod
```

### **Verificar builds locales:**

```powershell
# Web Classic
cd apps/web-classic
pnpm build
pnpm preview

# Generator Express
cd apps/the-generator
pnpm build
pnpm preview
```

---

## ✅ CHECKLIST DE DEPLOYMENT

### **Web Classic:**
- [ ] Deploy a Vercel
- [ ] Variables de entorno configuradas
- [ ] Links a The Generator funcionando
- [ ] Links a Generator Express funcionando
- [ ] Navegación funcionando
- [ ] Diseño responsive
- [ ] URL copiada

### **Generator Express:**
- [ ] Deploy a Vercel
- [ ] Variables de entorno configuradas
- [ ] Generación funcionando
- [ ] Presets configurados
- [ ] UI simplificada
- [ ] URL copiada

### **Integración:**
- [ ] CORS actualizado en Railway
- [ ] Todos los links funcionando
- [ ] Navegación entre apps OK
- [ ] Generación E2E funcionando

---

## 🚨 IMPORTANTE: URLs FINALES

**Anota tus URLs aquí:**

```
Backend Railway:
https://_____________________.up.railway.app

The Generator (Full):
https://the-generator-gpzj6pn9y-son1kvers3s-projects.vercel.app

Web Classic:
https://_____________________.vercel.app

Generator Express:
https://_____________________.vercel.app
```

---

## 💡 SIGUIENTE ACCIÓN

**AHORA MISMO:**

1. **Abre PowerShell**
2. **Ejecuta:**
   ```powershell
   cd C:\Users\qrrom\Downloads\Sub-Son1k-2.3\Sub-Son1k-2.3\apps\web-classic
   vercel --prod
   ```
3. **Sigue las instrucciones**
4. **Copia la URL que te de**
5. **Repite para apps/the-generator**

**Dime cuando tengas las URLs y continúo con la integración.** 🚀

---

*Guía generada: 28 de Diciembre, 2025*
