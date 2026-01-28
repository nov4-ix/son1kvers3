# 🚀 Prepare for Deployment - Son1kVers3
# Script para preparar el proyecto para deployment a Railway (backend) y Vercel (frontend)
# Ejecutar desde: c:\Users\qrrom\Downloads\Sub-Son1k-2.3\Sub-Son1k-2.3\

Write-Host "🚀 Son1kVers3 - Prepare for Deployment" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# ==============================================================================
# VERIFICACIONES INICIALES
# ==============================================================================
Write-Host "`n📋 PASO 1: Verificando estado del proyecto..." -ForegroundColor Yellow

# Check Git status
Write-Host "  → Verificando Git..." -NoNewline
try {
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Host " ⚠️  Hay cambios sin commit" -ForegroundColor Yellow
        Write-Host "     Archivos modificados/sin commit detectados" -ForegroundColor Gray
    }
    else {
        Write-Host " ✅ Git clean" -ForegroundColor Green
    }
}
catch {
    Write-Host " ⚠️  Git no inicializado o no disponible" -ForegroundColor Yellow
}

# Check remote
Write-Host "  → Verificando Git remote..." -NoNewline
try {
    $gitRemote = git remote -v
    if ($gitRemote) {
        Write-Host " ✅ Remote configurado" -ForegroundColor Green
    }
    else {
        Write-Host " ⚠️  No hay remote configurado" -ForegroundColor Yellow
    }
}
catch {
    Write-Host " ⚠️  Error verificando remote" -ForegroundColor Yellow
}

# ==============================================================================
# PREPARAR CONFIGURACIONES DE DEPLOYMENT
# ==============================================================================
Write-Host "`n⚙️  PASO 2: Verificando configuraciones de deployment..." -ForegroundColor Yellow

# Check Railway config
if (Test-Path "railway.json") {
    Write-Host "  ✅ railway.json presente" -ForegroundColor Green
}
else {
    Write-Host "  ⚠️  railway.json no encontrado" -ForegroundColor Yellow
}

if (Test-Path "backend\railway.toml") {
    Write-Host "  ✅ backend\railway.toml presente" -ForegroundColor Green
}
else {
    Write-Host "  ⚠️  backend\railway.toml no encontrado" -ForegroundColor Yellow
}

# Check Vercel configs
$vercelConfigs = @(
    "vercel.json",
    "apps\web-classic\vercel.json",
    "apps\the-generator-nextjs\vercel.json"
)

foreach ($config in $vercelConfigs) {
    if (Test-Path $config) {
        Write-Host "  ✅ $config presente" -ForegroundColor Green
    }
    else {
        Write-Host "  ⚠️  $config no encontrado" -ForegroundColor Yellow
    }
}

# ==============================================================================
# CREAR CHECKLIST DE VARIABLES DE ENTORNO
# ==============================================================================
Write-Host "`n📝 PASO 3: Creando checklist de variables de entorno..." -ForegroundColor Yellow

$envChecklistContent = @"
# 🔐 VARIABLES DE ENTORNO - DEPLOYMENT CHECKLIST
## Son1kVers3 - Deployment Configuration

**Fecha**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

---

## 🚂 RAILWAY (Backend)

### Variables Obligatorias:
- [ ] \`DATABASE_URL\` - PostgreSQL connection string (provisto por Railway)
  - Ejemplo: \`postgresql://user:password@host:port/dbname\`
  - Railway provee esto automáticamente al agregar PostgreSQL service

### Variables Recomendadas:
- [ ] \`STRIPE_SECRET_KEY\` - Para procesamiento de pagos
  - Obtener de: https://dashboard.stripe.com/apikeys
  - Formato: \`sk_live_...\` (producción) o \`sk_test_...\` (testing)

- [ ] \`STRIPE_WEBHOOK_SECRET\` - Para webhooks de Stripe
  - Obtener de: https://dashboard.stripe.com/webhooks
  - Formato: \`whsec_...\`

- [ ] \`GROQ_API_KEY\` - Para Pixel AI Companion
  - Obtener de: https://console.groq.com
  - Formato: \`gsk_...\`
  - GRATIS con límite generoso

- [ ] \`FRONTEND_URL\` - URL del frontend en Vercel
  - Ejemplo: \`https://tu-app.vercel.app\`
  - Necesario para CORS

### Variables Opcionales:
- [ ] \`SUNO_TOKENS\` - Array de tokens de Suno AI
  - Formato: \`["token1", "token2", "token3"]\`
  - Obtener de: https://app.suno.ai (inspeccionar cookies)

- [ ] \`MAX_REQUESTS_PER_ACCOUNT\` - Límite del stealth system
  - Default: 50

- [ ] \`COOLDOWN_DURATION_MINUTES\` - Cooldown del stealth system
  - Default: 30

---

## ▲ VERCEL (Frontend)

### Variables Obligatorias:
- [ ] \`VITE_API_URL\` - URL del backend en Railway
  - Ejemplo: \`https://tu-backend.railway.app\`

### Variables Recomendadas:
- [ ] \`VITE_STRIPE_PUBLISHABLE_KEY\` - Stripe public key
  - Obtener de: https://dashboard.stripe.com/apikeys
  - Formato: \`pk_live_...\` (producción) o \`pk_test_...\` (testing)

### Variables Opcionales (si usas Supabase Auth):
- [ ] \`VITE_SUPABASE_URL\` - Supabase project URL
  - Ejemplo: \`https://xxxxx.supabase.co\`

- [ ] \`VITE_SUPABASE_ANON_KEY\` - Supabase anon key
  - Formato: \`eyJhbGc...\`

---

## 🎯 SERVICIOS EXTERNOS NECESARIOS

### PostgreSQL (Required):
- [ ] Railway PostgreSQL service provisioned
- [ ] O usar Supabase PostgreSQL (gratis)
- [ ] DATABASE_URL configurado en Railway

### Stripe (Opcional - para pagos):
- [ ] Cuenta creada en https://stripe.com
- [ ] API keys obtenidas (test primero, luego live)
- [ ] Webhook endpoint configurado: \`https://tu-backend.railway.app/api/tiers/webhook\`

### Groq (Opcional - para Pixel AI):
- [ ] Cuenta creada en https://console.groq.com
- [ ] API key obtenida (gratis)

### Suno AI (Crítico - para generación de música):
- [ ] Cuenta en https://app.suno.ai
- [ ] Tokens obtenidos (via cookies o extensión Chrome)
- [ ] Mínimo 1 token válido

---

## 📋 PASOS DEPLOYMENT

### Railway (Backend):

1. **Crear Proyecto**:
   \`\`\`bash
   # Opción 1: Desde GitHub
   - Ir a https://railway.app
   - New Project → Deploy from GitHub
   - Seleccionar repositorio
   - Root directory: backend/
   
   # Opción 2: Con Railway CLI
   npm i -g @railway/cli
   railway login
   railway init
   railway up
   \`\`\`

2. **Agregar PostgreSQL**:
   - En Railway dashboard
   - New → Database → PostgreSQL
   - Se auto-configura DATABASE_URL

3. **Configurar Variables**:
   - Settings → Variables
   - Agregar todas las variables listadas arriba

4. **Verificar Deploy**:
   - Esperar build completo
   - Abrir: https://tu-backend.railway.app/health
   - Debe responder: \`{"status": "healthy"}\`

### Vercel (Frontend):

1. **Importar Proyecto**:
   \`\`\`bash
   # Opción 1: Desde dashboard
   - Ir a https://vercel.com
   - New Project → Import Git Repository
   - Root Directory: apps/web-classic
   - Framework Preset: Vite
   
   # Opción 2: Con Vercel CLI
   npm i -g vercel
   vercel login
   vercel
   \`\`\`

2. **Configurar Variables**:
   - Project Settings → Environment Variables
   - Agregar todas las variables listadas arriba

3. **Deploy**:
   - Deploy automático en cada push
   - O manual: \`vercel --prod\`

4. **Verificar**:
   - Abrir URL de Vercel
   - Verificar que carga correctamente
   - Check consola del navegador (F12) para errores

---

## ✅ POST-DEPLOYMENT CHECKLIST

### Backend:
- [ ] Health check responde: \`/health\`
- [ ] API docs accesibles: \`/docs\`
- [ ] Database conectada correctamente
- [ ] Logs sin errores críticos

### Frontend:
- [ ] Aplicación carga correctamente
- [ ] Se conecta al backend (verificar Network tab)
- [ ] No hay errores en consola
- [ ] Estilos cargando correctamente

### Integración:
- [ ] CORS configurado correctamente
- [ ] Frontend puede hacer requests al backend
- [ ] Autenticación funciona (si aplica)
- [ ] Generación de música funciona (si tienes tokens)

---

## 🔧 TROUBLESHOOTING

### Backend no arranca:
- Verificar logs en Railway dashboard
- Comprobar que todas las variables estén configuradas
- Verificar que DATABASE_URL sea válido

### Frontend no se conecta:
- Verificar VITE_API_URL en Vercel
- Comprobar CORS en backend (agregar URL de Vercel)
- Verificar Network tab en navegador

### Database errors:
- Verificar que PostgreSQL service esté running
- Ejecutar migraciones si es necesario
- Comprobar DATABASE_URL formato correcto

---

## 📞 RECURSOS

- **Railway**: https://railway.app
- **Vercel**: https://vercel.com
- **Stripe**: https://stripe.com
- **Groq**: https://console.groq.com
- **Suno AI**: https://app.suno.ai
- **Documentación**: Ver DEPLOYMENT_GUIDE.md

---

**Generado**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Proyecto**: Son1kVers3 v2.3
"@

Set-Content -Path "DEPLOYMENT_CHECKLIST.md" -Value $envChecklistContent
Write-Host "  ✅ Checklist creado: DEPLOYMENT_CHECKLIST.md" -ForegroundColor Green

# ==============================================================================
# CREAR .ENV TEMPLATES PARA PRODUCCIÓN
# ==============================================================================
Write-Host "`n📄 PASO 4: Creando templates de .env para producción..." -ForegroundColor Yellow

# Backend production template
$backendProdEnv = @"
# Son1kVers3 Backend - Production Environment
# Copy este archivo a Railway como variables de entorno

# Database (provisto automáticamente por Railway PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/dbname

# Stripe
STRIPE_SECRET_KEY=sk_live_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Frontend URL (actualizar con tu URL de Vercel)
FRONTEND_URL=https://your-app.vercel.app

# Groq API (para Pixel AI)
GROQ_API_KEY=gsk_your_key_here

# Suno Tokens (opcional)
SUNO_TOKENS=["token1", "token2", "token3"]

# Stealth System
MAX_REQUESTS_PER_ACCOUNT=50
COOLDOWN_DURATION_MINUTES=30
"@

Set-Content -Path "backend\.env.production.template" -Value $backendProdEnv
Write-Host "  ✅ Template creado: backend\.env.production.template" -ForegroundColor Green

# Frontend production template
$frontendProdEnv = @"
# Son1kVers3 Frontend - Production Environment
# Copy estas variables a Vercel

# Backend API (actualizar con tu URL de Railway)
VITE_API_URL=https://your-backend.railway.app

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here

# Supabase (opcional)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
"@

Set-Content -Path "apps\web-classic\.env.production.template" -Value $frontendProdEnv
Write-Host "  ✅ Template creado: apps\web-classic\.env.production.template" -ForegroundColor Green

# ==============================================================================
# VERIFICAR DEPENDENCIAS
# ==============================================================================
Write-Host "`n📦 PASO 5: Verificando dependencias..." -ForegroundColor Yellow

# Check backend requirements.txt
if (Test-Path "backend\requirements.txt") {
    $reqCount = (Get-Content "backend\requirements.txt" | Measure-Object -Line).Lines
    Write-Host "  ✅ backend\requirements.txt ($reqCount dependencias)" -ForegroundColor Green
}
else {
    Write-Host "  ❌ backend\requirements.txt no encontrado" -ForegroundColor Red
}

# Check package.json
if (Test-Path "package.json") {
    Write-Host "  ✅ package.json presente" -ForegroundColor Green
}
else {
    Write-Host "  ❌ package.json no encontrado" -ForegroundColor Red
}

# ==============================================================================
# RESUMEN FINAL
# ==============================================================================
Write-Host "`n" -NoNewline
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "✅ PREPARACIÓN PARA DEPLOYMENT COMPLETADA" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Gray

Write-Host "`n📝 ARCHIVOS GENERADOS:" -ForegroundColor Cyan
Write-Host "  → DEPLOYMENT_CHECKLIST.md" -ForegroundColor White
Write-Host "  → backend\.env.production.template" -ForegroundColor White
Write-Host "  → apps\web-classic\.env.production.template" -ForegroundColor White

Write-Host "`n🚀 PRÓXIMOS PASOS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Revisar y completar DEPLOYMENT_CHECKLIST.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "2️⃣  Configurar servicios externos:" -ForegroundColor Yellow
Write-Host "   → Stripe (https://stripe.com)" -ForegroundColor White
Write-Host "   → Groq (https://console.groq.com)" -ForegroundColor White
Write-Host "   → Obtener tokens de Suno AI" -ForegroundColor White
Write-Host ""
Write-Host "3️⃣  Deploy Backend a Railway:" -ForegroundColor Yellow
Write-Host "   → Ir a https://railway.app" -ForegroundColor White
Write-Host "   → New Project → Deploy from GitHub" -ForegroundColor White
Write-Host "   → Seguir pasos en DEPLOYMENT_CHECKLIST.md" -ForegroundColor White
Write-Host ""
Write-Host "4️⃣  Deploy Frontend a Vercel:" -ForegroundColor Yellow
Write-Host "   → Ir a https://vercel.com" -ForegroundColor White
Write-Host "   → New Project → Import Git Repository" -ForegroundColor White
Write-Host "   → Root Directory: apps/web-classic" -ForegroundColor White
Write-Host ""
Write-Host "5️⃣  Verificar deployment:" -ForegroundColor Yellow
Write-Host "   → Backend: https://tu-backend.railway.app/health" -ForegroundColor Green
Write-Host "   → Frontend: https://tu-app.vercel.app" -ForegroundColor Green
Write-Host ""

Write-Host "📚 Ver documentación completa en:" -ForegroundColor Cyan
Write-Host "   → DEPLOYMENT_GUIDE.md" -ForegroundColor White
Write-Host "   → DEPLOYMENT_CHECKLIST.md" -ForegroundColor White
Write-Host "   → ANALISIS_EJECUTIVO_2026.md" -ForegroundColor White
Write-Host ""

Write-Host "💡 TIP: Ejecuta primero pruebas locales con:" -ForegroundColor Yellow
Write-Host "   → .\setup-local-testing.ps1" -ForegroundColor White
Write-Host "   → .\start-local-testing.ps1" -ForegroundColor White
Write-Host ""

Write-Host "🎉 ¡Buena suerte con el deployment!" -ForegroundColor Green
Write-Host ""
