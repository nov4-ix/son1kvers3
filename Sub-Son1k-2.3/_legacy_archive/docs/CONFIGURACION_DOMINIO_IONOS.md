# 🌐 CONFIGURACIÓN DE DOMINIOS IONOS → VERCEL

**Fecha:** 3 de Enero, 2026  
**Dominios:**
- `son1kvers3.com` → Web Classic (Hub)
- `the-generator.son1kvers3.com` → The Generator

---

## 📋 ESTRUCTURA DE DOMINIOS

```
son1kvers3.com
├── [ROOT] → Web Classic (Hub Central)
├── the-generator.son1kvers3.com → The Generator
├── nova.son1kvers3.com → Nova Post Pilot (futuro)
└── ghost.son1kvers3.com → Ghost Studio (futuro)
```

---

## 🎯 PASO 1: CONFIGURAR EN VERCEL

### 1.1 Web Classic (Dominio Principal)

1. **Ir al proyecto en Vercel:**
   ```
   https://vercel.com/son1kvers3s-projects-c805d053/web-classic
   ```

2. **Settings → Domains**

3. **Agregar dos dominios:**
   - `son1kvers3.com` (dominio raíz)
   - `www.son1kvers3.com` (con www)

4. **Vercel te mostrará los registros DNS necesarios:**
   ```
   Tipo A:
   Nombre: @
   Valor: 76.76.21.21
   
   Tipo CNAME:
   Nombre: www
   Valor: cname.vercel-dns.com
   ```

### 1.2 The Generator (Subdominio)

1. **Ir al proyecto en Vercel:**
   ```
   https://vercel.com/son1kvers3s-projects-c805d053/the-generator-nextjs
   ```

2. **Settings → Domains**

3. **Agregar dominio:**
   - `the-generator.son1kvers3.com`

4. **Vercel te mostrará:**
   ```
   Tipo CNAME:
   Nombre: the-generator
   Valor: cname.vercel-dns.com
   ```

---

## 🔧 PASO 2: CONFIGURAR DNS EN IONOS

### 2.1 Acceder al Panel de IONOS

1. **Iniciar sesión:**
   ```
   https://www.ionos.com/
   ```

2. **Ir a:** Dominios y SSL → Seleccionar `son1kvers3.com`

3. **Click en:** DNS

### 2.2 Configurar Registros DNS

**IMPORTANTE:** Elimina cualquier registro A o CNAME existente que apunte al mismo nombre.

#### Para el Dominio Principal (`son1kvers3.com`)

**Registro A (para dominio raíz):**
```
Tipo: A
Nombre: @ (o dejar vacío)
Valor: 76.76.21.21
TTL: 3600 (1 hora)
```

**Registro CNAME (para www):**
```
Tipo: CNAME
Nombre: www
Valor: cname.vercel-dns.com
TTL: 3600
```

#### Para The Generator (`the-generator.son1kvers3.com`)

**Registro CNAME:**
```
Tipo: CNAME
Nombre: the-generator
Valor: cname.vercel-dns.com
TTL: 3600
```

### 2.3 Configuración Visual en IONOS

En el panel DNS de IONOS debería verse así:

```
┌─────────┬────────────────┬──────────────────────┬──────┐
│ Tipo    │ Nombre         │ Valor                │ TTL  │
├─────────┼────────────────┼──────────────────────┼──────┤
│ A       │ @              │ 76.76.21.21          │ 3600 │
│ CNAME   │ www            │ cname.vercel-dns.com │ 3600 │
│ CNAME   │ the-generator  │ cname.vercel-dns.com │ 3600 │
└─────────┴────────────────┴──────────────────────┴──────┘
```

**Click en "Guardar" o "Save"**

---

## ⏱️ PASO 3: ESPERAR PROPAGACIÓN DNS

### Tiempos Estimados:

- **IONOS → Vercel:** 5-10 minutos (rápido)
- **Propagación global:** 24-48 horas (completo)
- **Funcional:** Generalmente 15-30 minutos

### Verificar Propagación:

1. **Usar herramienta online:**
   ```
   https://dnschecker.org/
   ```

2. **Verificar desde terminal:**
   ```powershell
   nslookup son1kvers3.com
   nslookup the-generator.son1kvers3.com
   ```

3. **Debe mostrar:**
   ```
   son1kvers3.com → 76.76.21.21
   the-generator.son1kvers3.com → [IP de Vercel]
   ```

---

## 🔐 PASO 4: VERIFICAR SSL EN VERCEL

Una vez que los DNS se propaguen (15-30 min):

1. **Volver a Vercel → Settings → Domains**

2. **Deberías ver:**
   ```
   ✅ son1kvers3.com         (SSL Active)
   ✅ www.son1kvers3.com     (SSL Active)
   ```

3. **Para The Generator:**
   ```
   ✅ the-generator.son1kvers3.com (SSL Active)
   ```

**Vercel genera certificados SSL automáticamente** (Let's Encrypt).

---

## 🎯 PASO 5: ACTUALIZAR CONFIGURACIÓN DE APPS

### 5.1 Actualizar `apps.ts` en Web Classic

Archivo: `apps/web-classic/src/config/apps.ts`

```typescript
export const APPS_CONFIG = {
  generatorFull: {
    name: "The Generator",
    externalUrl: "https://the-generator.son1kvers3.com",
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

### 5.2 Redeploy Web Classic

```powershell
cd apps/web-classic
pnpm build
git add .
git commit -m "Update domains to custom URLs"
git push
```

Vercel detectará el push y redeployará automáticamente.

---

## 📊 PASO 6: CONFIGURAR CORS EN BACKEND (RAILWAY)

Actualizar las variables de entorno en Railway para permitir los nuevos dominios:

```env
ALLOWED_ORIGINS=https://son1kvers3.com,https://www.son1kvers3.com,https://the-generator.son1kvers3.com
```

**En Railway:**
1. Ir a tu proyecto backend
2. Variables → Add Variable
3. Agregar `ALLOWED_ORIGINS` con los valores arriba
4. Redeploy

---

## ✅ CHECKLIST COMPLETO

### En Vercel:
- [ ] Web Classic: Agregar `son1kvers3.com`
- [ ] Web Classic: Agregar `www.son1kvers3.com`
- [ ] The Generator: Agregar `the-generator.son1kvers3.com`

### En IONOS:
- [ ] Crear registro A: `@` → `76.76.21.21`
- [ ] Crear registro CNAME: `www` → `cname.vercel-dns.com`
- [ ] Crear registro CNAME: `the-generator` → `cname.vercel-dns.com`
- [ ] Guardar cambios

### Verificación:
- [ ] Esperar 15-30 minutos
- [ ] Verificar DNS con `nslookup`
- [ ] Confirmar SSL activo en Vercel
- [ ] Probar navegación: `https://son1kvers3.com`
- [ ] Probar navegación: `https://the-generator.son1kvers3.com`

### Configuración:
- [ ] Actualizar `apps.ts` con nuevas URLs
- [ ] Redeploy Web Classic
- [ ] Actualizar CORS en Railway
- [ ] Redeploy Backend

---

## 🚨 TROUBLESHOOTING

### Problema: "Domain not verified" en Vercel

**Solución:**
1. Verificar que los DNS estén correctos en IONOS
2. Esperar 30-60 minutos más
3. En Vercel, click "Refresh" en el dominio

### Problema: SSL no se activa

**Solución:**
1. Verificar que el dominio apunte correctamente
2. Eliminar y re-agregar el dominio en Vercel
3. Esperar 5-10 minutos

### Problema: "DNS_PROBE_FINISHED_NXDOMAIN"

**Solución:**
1. Los DNS aún no se han propagado
2. Usar modo incógnito o limpiar caché DNS:
   ```powershell
   ipconfig /flushdns
   ```

### Problema: CORS errors

**Solución:**
1. Verificar `ALLOWED_ORIGINS` en Railway
2. Redeploy del backend
3. Limpiar caché del navegador

---

## 🎉 RESULTADO ESPERADO

Después de completar todos los pasos:

```
✅ https://son1kvers3.com
   → Web Classic (Hub Central)
   → SSL Activo
   → Navegación a todas las apps

✅ https://the-generator.son1kvers3.com
   → The Generator
   → SSL Activo
   → Generación de música funcionando
```

---

## 📞 RECURSOS

**Documentación Oficial:**
- [Vercel Custom Domains](https://vercel.com/docs/concepts/projects/custom-domains)
- [IONOS DNS Settings](https://www.ionos.com/help/domains/configuring-your-ip-address/changing-a-domains-ipv4-and-ipv6-addresses-aaaa-record/)

**Herramientas de Verificación:**
- [DNS Checker](https://dnschecker.org/)
- [SSL Checker](https://www.ssllabs.com/ssltest/)
- [What's My DNS](https://whatsmydns.net/)

---

**Tiempo Total Estimado:** 30-60 minutos (incluyendo espera de DNS)

**¡Buena suerte con la configuración!** 🚀
