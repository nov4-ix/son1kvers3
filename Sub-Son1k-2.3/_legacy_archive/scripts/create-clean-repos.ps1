# Script para crear repos limpios - Backend y Frontend
# Ejecutar DESPUÉS de crear los repos en GitHub

Write-Host "🚀 Creando repositorios limpios..." -ForegroundColor Cyan

# Configuración
$baseDir = "c:\Users\qrrom\Downloads\Son1kVers3-Clean"
$sourceDir = "c:\Users\qrrom\Downloads\Sub-Son1k-2.3\Sub-Son1k-2.3"

# Crear directorio base
New-Item -ItemType Directory -Force -Path $baseDir | Out-Null

# ===================================
# BACKEND REPO
# ===================================
Write-Host "`n📦 1. Creando son1kvers3-backend..." -ForegroundColor Green

$backendDir = Join-Path $baseDir "son1kvers3-backend"
New-Item -ItemType Directory -Force -Path $backendDir | Out-Null

# Copiar solo el backend
Copy-Item -Path "$sourceDir\backend\*" -Destination $backendDir -Recurse -Force

# Copiar archivos raíz necesarios
Copy-Item -Path "$sourceDir\Procfile" -Destination $backendDir -ErrorAction SilentlyContinue
Copy-Item -Path "$sourceDir\.gitignore" -Destination $backendDir -ErrorAction SilentlyContinue

# Crear README para backend
@"
# Son1kVers3 Backend API

Backend API para el ecosistema Son1kVers3.

## Stack Técnico

- FastAPI
- SQLAlchemy
- PostgreSQL
- Stripe Integration

## Servicios

- ✅ Tier System (4 tiers con Stripe)
- ✅ Community Pool (democratización de generaciones)
- ✅ Stealth System (rotación de cuentas)
- ✅ ALVAE System (badges exclusivos)
- ✅ Pixel Companion (AI assistant)

## Quick Start

\`\`\`bash
# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Inicializar base de datos
python -m migrations.init_db

# Correr servidor
uvicorn main:app --reload
\`\`\`

## Deploy a Railway

\`\`\`bash
railway login
railway init
railway add --database postgres
railway up
\`\`\`

## Endpoints

- GET /health - Health check
- GET /docs - API documentation
- POST /api/tiers/checkout - Stripe checkout
- GET /api/community/pool - Pool content
- GET /api/alvae/status/{user_id} - ALVAE status
- POST /api/pixel/suggest - Pixel suggestions

## Environment Variables

\`\`\`env
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://...
\`\`\`

"@ | Out-File -FilePath "$backendDir\README.md" -Encoding UTF8

# Crear .env.example
@"
DATABASE_URL=postgresql://user:password@host:port/dbname
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000
MAX_REQUESTS_PER_ACCOUNT=50
COOLDOWN_DURATION_MINUTES=30
GROQ_API_KEY=gsk_...
"@ | Out-File -FilePath "$backendDir\.env.example" -Encoding UTF8

# Crear Procfile
@"
web: uvicorn main:app --host 0.0.0.0 --port `$PORT
"@ | Out-File -FilePath "$backendDir\Procfile" -Encoding UTF8

# Inicializar git
Set-Location $backendDir
git init
git add .
git commit -m "🎉 Initial commit: Son1kVers3 Backend API

- 5 services (Tiers, Pool, Stealth, ALVAE, Pixel)
- 26 RESTful endpoints
- PostgreSQL database
- Stripe integration
- Production ready"

Write-Host "  ✅ Backend repo creado en: $backendDir" -ForegroundColor Green

# ===================================
# FRONTEND REPO
# ===================================
Write-Host "`n📦 2. Creando son1kvers3-frontend..." -ForegroundColor Yellow

$frontendDir = Join-Path $baseDir "son1kvers3-frontend"
New-Item -ItemType Directory -Force -Path $frontendDir | Out-Null

# Copiar apps y packages necesarios
$appsSource = "$sourceDir\apps"
$packagesSource = "$sourceDir\packages"

# Copiar estructura
New-Item -ItemType Directory -Force -Path "$frontendDir\apps" | Out-Null
New-Item -ItemType Directory -Force -Path "$frontendDir\packages" | Out-Null

# Apps a copiar (solo las esenciales)
$essentialApps = @("web-classic", "the-generator")
foreach ($app in $essentialApps) {
    $appPath = Join-Path $appsSource $app
    if (Test-Path $appPath) {
        Copy-Item -Path $appPath -Destination "$frontendDir\apps" -Recurse -Force
        Write-Host "  ✓ Copiado: apps/$app" -ForegroundColor Gray
    }
}

# Packages a copiar (solo los que creamos)
$essentialPackages = @("tiers", "community-pool", "shared-hooks", "alvae-system", "pixel-companion")
foreach ($pkg in $essentialPackages) {
    $pkgPath = Join-Path $packagesSource $pkg
    if (Test-Path $pkgPath) {
        Copy-Item -Path $pkgPath -Destination "$frontendDir\packages" -Recurse -Force
        Write-Host "  ✓ Copiado: packages/$pkg" -ForegroundColor Gray
    }
}

# Copiar archivos raíz
Copy-Item -Path "$sourceDir\package.json" -Destination $frontendDir -ErrorAction SilentlyContinue
Copy-Item -Path "$sourceDir\pnpm-workspace.yaml" -Destination $frontendDir -ErrorAction SilentlyContinue
Copy-Item -Path "$sourceDir\turbo.json" -Destination $frontendDir -ErrorAction SilentlyContinue
Copy-Item -Path "$sourceDir\tsconfig.json" -Destination $frontendDir -ErrorAction SilentlyContinue
Copy-Item -Path "$sourceDir\.gitignore" -Destination $frontendDir -ErrorAction SilentlyContinue

# Crear README para frontend
@"
# Son1kVers3 Frontend

Frontend monorepo para el ecosistema Son1kVers3.

## Stack Técnico

- React 18 + TypeScript
- Vite
- TailwindCSS
- Framer Motion
- pnpm + Turborepo

## Estructura

\`\`\`
apps/
├── web-classic/          # App principal
└── the-generator/        # Generador de música

packages/
├── tiers/                # Sistema de tiers
├── community-pool/       # Pool comunitario
├── shared-hooks/         # Hooks compartidos
├── alvae-system/         # Sistema ALVAE
└── pixel-companion/      # Pixel AI companion
\`\`\`

## Quick Start

\`\`\`bash
# Instalar pnpm
npm install -g pnpm

# Instalar dependencias
pnpm install

# Configurar variables
cp .env.example .env
# Editar .env con tu backend URL

# Desarrollo
pnpm dev

# Build
pnpm build
\`\`\`

## Deploy a Vercel

\`\`\`bash
vercel login
vercel
vercel --prod
\`\`\`

## Environment Variables

\`\`\`env
VITE_API_URL=https://tu-backend.railway.app
VITE_STRIPE_PUBLISHABLE_KEY=pk_...
\`\`\`

"@ | Out-File -FilePath "$frontendDir\README.md" -Encoding UTF8

# Crear .env.example
@"
VITE_API_URL=http://localhost:8000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
"@ | Out-File -FilePath "$frontendDir\.env.example" -Encoding UTF8

# Inicializar git
Set-Location $frontendDir
git init
git add .
git commit -m "🎉 Initial commit: Son1kVers3 Frontend

- 2 apps (Web Classic, The Generator)
- 5 custom packages
- Tier system integration
- Community pool
- ALVAE system
- Pixel Companion
- Production ready"

Write-Host "  ✅ Frontend repo creado en: $frontendDir" -ForegroundColor Yellow

# ===================================
# RESUMEN
# ===================================
Write-Host "`n📊 REPOSITORIOS CREADOS:" -ForegroundColor Cyan
Write-Host "  Backend:  $backendDir" -ForegroundColor Green
Write-Host "  Frontend: $frontendDir" -ForegroundColor Yellow

Write-Host "`n🎯 PRÓXIMOS PASOS:" -ForegroundColor Cyan
Write-Host @"

1. Crear repos en GitHub:
   - https://github.com/new
   - Nombre: son1kvers3-backend (público/privado)
   - Nombre: son1kvers3-frontend (público/privado)

2. Conectar backend:
   cd $backendDir
   git remote add origin https://github.com/nov4-ix/son1kvers3-backend.git
   git push -u origin main

3. Conectar frontend:
   cd $frontendDir
   git remote add origin https://github.com/nov4-ix/son1kvers3-frontend.git
   git push -u origin main

4. Deploy backend a Railway:
   cd $backendDir
   railway login
   railway init
   railway add --database postgres
   railway up

5. Deploy frontend a Vercel:
   cd $frontendDir
   vercel login
   vercel
   vercel --prod

"@ -ForegroundColor White

Write-Host "✅ Script completado!" -ForegroundColor Green
