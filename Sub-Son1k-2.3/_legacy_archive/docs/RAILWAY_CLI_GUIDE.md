# 🚂 RAILWAY CLI - CONFIGURACIÓN COMPLETA

## 📋 Estado Actual

### ✅ Preparación Completada
- [x] Repo limpiado (150+ archivos eliminados)
- [x] `railway.json` configurado
- [x] `railway-setup.sh` creado y ejecutable
- [x] Push a GitHub exitoso
- [ ] Railway CLI instalándose... (en progreso)

---

## 🎯 Qué hará el script `railway-setup.sh`

### Paso 1: Login
```bash
railway login
```
- Abre navegador automáticamente
- Autentica con GitHub
- Guarda credenciales localmente

### Paso 2: Crear Proyecto
```bash
railway init
```
- Crea proyecto nuevo en Railway
- Lo conecta con tu repo GitHub
- Te pide nombre (default: `sub-son1k-2-2`)

### Paso 3: Agregar PostgreSQL
```bash
railway add --database postgres
```
- Crea instancia PostgreSQL
- Auto-genera `DATABASE_URL`
- Listo en ~30 segundos

### Paso 4: Agregar Redis
```bash
railway add --database redis
```
- Crea instancia Redis
- Auto-genera `REDIS_URL`
- Opcional pero recomendado

### Paso 5: Configurar Variables
El script te pedirá interactivamente:

```bash
SUNO_TOKENS (separados por comas): █
JWT_SECRET (mínimo 32 chars): █
TOKEN_ENCRYPTION_KEY (mínimo 32 chars): █
```

Y configurará automáticamente:
- ✅ NODE_ENV=production
- ✅ PORT=3000
- ✅ Todas las URLs de API
- ✅ CORS básico (localhost)
- ✅ DATABASE_URL (auto)
- ✅ REDIS_URL (auto)

### Paso 6: Deploy
```bash
railway up
```
- Sube el código a Railway
- Ejecuta build automático
- Inicia el servidor
- ~3-5 minutos

### Paso 7: Obtener URL
```bash
railway domain
```
- Te da la URL pública
- Ejemplo: `https://sub-son1k-2-2-production.up.railway.app`

---

## 🚀 Cómo Ejecutar (cuando termine la instalación)

```bash
cd /Users/nov4-ix/Sub-Son1k-2.2/Sub-Son1k-2.2
./railway-setup.sh
```

**Tiempo total estimado**: 10-15 minutos

---

## 📝 Información que Necesitarás

Prepara estos valores ANTES de ejecutar el script:

### 1. SUNO_TOKENS
- **Formato**: `token1,token2,token3`
- **Cómo obtenerlos**:
  - Ve a https://suno.com y loguea
  - Abre DevTools (F12) → Application → Cookies
  - Busca `clerk_token` o session token
  - Copia el valor

O usa la extension del repo:
```bash
cd extensions/chrome-suno-harvester
# Carga la extension en Chrome
# Auto-captura tokens
```

### 2. JWT_SECRET
- **Qué es**: Secret para firmar tokens JWT
- **Requisito**: Mínimo 32 caracteres
- **Ejemplo**: `mi-super-secret-jwt-para-produccion-2024-son1k`

Genera uno aleatorio:
```bash
openssl rand -base64 32
```

### 3. TOKEN_ENCRYPTION_KEY
- **Qué es**: Key para encriptar tokens en DB
- **Requisito**: Mínimo 32 caracteres
- **Ejemplo**: `encryption-key-tokens-seguro-2024-32chars`

Genera uno aleatorio:
```bash
openssl rand -base64 32
```

---

## ✅ Verificación Post-Deploy

Una vez complete el script:

### 1. Health Check
```bash
curl https://tu-url.railway.app/health
```

**Debe responder:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-18T...",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

### 2. Ver Logs
```bash
railway logs
```

### 3. Agregar más variables (si necesitas)
```bash
railway variables set MI_VARIABLE=valor
```

### 4. Abrir dashboard
```bash
railway open
```

---

## 🔧 Comandos Útiles Railway CLI

```bash
# Ver proyecto actual
railway status

# Ver variables
railway variables

# Abrir shell en producción
railway shell

# Ver logs en tiempo real
railway logs --follow

# Ejecutar comando en Railway
railway run npx prisma db push

# Abrir dashboard web
railway open
```

---

## 🎯 Después del Deploy

1. **Copia la URL del backend** que te dará el script
2. **Actualiza frontend** en Vercel:
   ```bash
   # Variables de Vercel
   VITE_BACKEND_URL=https://tu-url.railway.app
   ```
3. **Redeploy frontend**
4. **¡Prueba generación real!**

---

## 💡 Tips

- Railway auto-deploya en cada push a `main`
- Los logs son en tiempo real y muy claros
- PostgreSQL y Redis son nativos (no Docker)
- Free tier: $5/mes gratis (500 horas)
- Puedes pausar el proyecto cuando no lo uses

---

**Estado**: Esperando que termine instalación de Railway CLI...
**Siguiente**: Ejecutar `./railway-setup.sh`
