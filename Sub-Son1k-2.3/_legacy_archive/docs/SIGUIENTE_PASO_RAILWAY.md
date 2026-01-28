# ✅ PASO 1 COMPLETADO: Limpieza del Repo

## 🧹 Archivos Eliminados
- ✅ **150+ archivos MD** de documentación obsoleta
- ✅ **Configuración Fly.io**: fly.toml, Dockerfile, .dockerignore
- ✅ **Scripts obsoletos**: 15+ scripts de deployment antiguos
- ✅ **Carpetas**: hello-fly/, .continue/, .railway/
- ✅ **Archivos temporales**: son1k-deployment.zip (4.6MB), tsconfig.tsbuildinfo (2.4MB)
- ✅ **Archivos sistema Mac**: Todos los `._*`

## 📊 Resultados
**ANTES**: 273 archivos + 18 directorios
**DESPUÉS**: ~100 archivos esenciales

**Liberado**: ~7MB de espacio

## ✅ Archivos Creados
- ✅ `railway.json` - Config optimizada para monorepo
- ✅ `RAILWAY_DEPLOY_GUIDE.md` - Guía paso a paso
- ✅ Commit y push a GitHub exitoso

---

# 🚂 PASO 2: Configurar Railway (SIGUIENTE)

## 📋 Checklist de Setup

### 1. Crear Cuenta Railway
- [ ] Ve a https://railway.app
- [ ] Registrate con GitHub
- [ ] Confirma email

### 2. Nuevo Proyecto
- [ ] Click "New Project"
- [ ] Selecciona "Deploy from GitHub repo"
- [ ] Autoriza acceso a GitHub
- [ ] Selecciona `nov4-ix/Sub-Son1k-2.2`

### 3. Agregar PostgreSQL
- [ ] Click "+ New"
- [ ] Selecciona "Database" → "PostgreSQL"
- [ ] Nombre: `sub-son1k-db`
- [ ] Espera 30 segundos a que se provisione

### 4. Agregar Redis (Recomendado)
- [ ] Click "+ New"
- [ ] Selecciona "Database" → "Redis"
- [ ] Nombre: `sub-son1k-redis`
- [ ] Espera 30 segundos

### 5. Configurar Backend Service
- [ ] Railway auto-detecta el monorepo
- [ ] Click en el servicio que se creó
- [ ] Settings → General
  - Root Directory: `packages/backend`
  - Build Command: (vacío, usa railway.json)
  - Start Command: (vacío, usa railway.json)

### 6. Variables de Entorno
- [ ] Click en Backend service → Variables
- [ ] Click "RAW Editor"
- [ ] Pega esto (⚠️ EDITA TUS VALORES):

```env
# Auto-conectadas
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# Base
NODE_ENV=production
PORT=3000

# ⚠️ CRÍTICO - EDITA ESTOS ⚠️
SUNO_TOKENS=token1,token2,token3
JWT_SECRET=un_secret_muy_largo_minimo_32_caracteres
TOKEN_ENCRYPTION_KEY=otro_secret_para_encryptar_tokens_32_chars

# APIs externas
GENERATION_API_URL=https://ai.imgkits.com/suno
NEURAL_ENGINE_API_URL=https://ai.imgkits.com/suno
COVER_API_URL=https://usa.imgkits.com/node-api/suno
GENERATION_POLLING_URL=https://usa.imgkits.com/node-api/suno
NEURAL_ENGINE_POLLING_URL=https://usa.imgkits.com/node-api/suno

# CORS - Actualizar con tu dominio Vercel
ALLOWED_ORIGINS=http://localhost:5173,https://tu-frontend.vercel.app
```

### 7. Deploy Manual
- [ ] Click "Deploy" o espera auto-deploy
- [ ] Monitorea logs en tiempo real
- [ ] Espera ~3-5 minutos

### 8. Verificación
- [ ] Copia la URL generada (ej: `https://sub-son1k-2-2-production.up.railway.app`)
- [ ] Prueba health check:
```bash
curl https://tu-url.railway.app/health
```
- [ ] Debe responder JSON con `"status": "healthy"`

### 9. Obtener Tokens Suno

Si NO tienes tokens de Suno:

**Opción A: Extension de Chrome**
1. Instala la extension del repo: `extensions/chrome-suno-harvester`
2. Ve a suno.com y loguea
3. La extension auto-captura el token
4. Copia el token generado

**Opción B: Manual (DevTools)**
1. Ve a https://suno.com
2. Loguea con tu cuenta
3. Abre DevTools (F12)
4. Application → Cookies → suno.com
5. Busca `clerk_token` o `session_token`
6. Copia el valor

### 10. Agregar Token a Railway
- [ ] Vuelve a Variables en Railway
- [ ] Edita `SUNO_TOKENS`
- [ ] Pega tu token real
- [ ] Click "Save"
- [ ] Railway auto-redeploya

---

## 🎯 URLs Finales

Una vez completado:

```
Backend: https://sub-son1k-2-2-production.up.railway.app
Health:  https://sub-son1k-2-2-production.up.railway.app/health
Docs:    https://sub-son1k-2-2-production.up.railway.app/docs
```

Guarda la URL del backend para configurar el frontend.

---

## ⏭️ PASO 3: Configurar Frontend (DESPUÉS)

Una vez el backend esté corriendo:
1. Actualizar `VITE_BACKEND_URL` en Vercel
2. Redeploy frontend
3. ¡Probar generación de música real!

---

## 💡 Tips

**Railway es más simple que Fly.io:**
- ✅ No necesitas gestionar Dockerfiles
- ✅ PostgreSQL y Redis incluidos con 1 click
- ✅ Variables auto-conectadas (`${{Postgres.DATABASE_URL}}`)
- ✅ Logs en tiempo real claros
- ✅ Auto-restart si algo falla

**Costos:**
- Free Tier: $5/mes gratis (500 horas)
- Suficiente para pruebas y demos
- Upgrade a Pro ($20/mes) cuando tengas usuarios

---

¿Todo listo? Procede al PASO 2 ☝️
