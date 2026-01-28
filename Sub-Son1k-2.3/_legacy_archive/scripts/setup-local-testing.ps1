# 🧪 Setup Local Testing - Son1kVers3
# Este script prepara el entorno para pruebas locales
# Ejecutar desde: c:\Users\qrrom\Downloads\Sub-Son1k-2.3\Sub-Son1k-2.3\

Write-Host "🚀 Son1kVers3 - Setup Local Testing Environment" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# ==============================================================================
# PASO 1: Verificar Prerequisitos
# ==============================================================================
Write-Host "`n📋 PASO 1: Verificando prerequisitos..." -ForegroundColor Yellow

# Check Node.js
Write-Host "  → Verificando Node.js..." -NoNewline
try {
    $nodeVersion = node --version
    Write-Host " ✅ $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host " ❌ Node.js no encontrado" -ForegroundColor Red
    Write-Host "    Instalar desde: https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# Check pnpm
Write-Host "  → Verificando pnpm..." -NoNewline
try {
    $pnpmVersion = pnpm --version
    Write-Host " ✅ v$pnpmVersion" -ForegroundColor Green
}
catch {
    Write-Host " ❌ pnpm no encontrado" -ForegroundColor Red
    Write-Host "    Instalando pnpm..." -ForegroundColor Yellow
    npm install -g pnpm
}

# Check Python
Write-Host "  → Verificando Python..." -NoNewline
try {
    $pythonVersion = python --version
    Write-Host " ✅ $pythonVersion" -ForegroundColor Green
}
catch {
    Write-Host " ❌ Python no encontrado" -ForegroundColor Red
    Write-Host "    Instalar desde: https://python.org" -ForegroundColor Yellow
    exit 1
}

# ==============================================================================
# PASO 2: Setup Backend Python
# ==============================================================================
Write-Host "`n🐍 PASO 2: Configurando Backend (Python/FastAPI)..." -ForegroundColor Yellow

Push-Location backend

# Crear entorno virtual si no existe
if (-not (Test-Path "venv")) {
    Write-Host "  → Creando entorno virtual Python..." -ForegroundColor Cyan
    python -m venv venv
    Write-Host "  ✅ Entorno virtual creado" -ForegroundColor Green
}
else {
    Write-Host "  ℹ️  Entorno virtual ya existe" -ForegroundColor Gray
}

# Activar entorno virtual
Write-Host "  → Activando entorno virtual..." -ForegroundColor Cyan
try {
    .\venv\Scripts\Activate.ps1
    Write-Host "  ✅ Entorno virtual activado" -ForegroundColor Green
}
catch {
    Write-Host "  ⚠️  Error activando entorno virtual" -ForegroundColor Yellow
}

# Instalar dependencias
Write-Host "  → Instalando dependencias Python..." -ForegroundColor Cyan
pip install -r requirements.txt
Write-Host "  ✅ Dependencias instaladas" -ForegroundColor Green

# Configurar variables de entorno
if (-not (Test-Path ".env")) {
    Write-Host "  → Creando archivo .env desde template..." -ForegroundColor Cyan
    Copy-Item "env.template" ".env"
    Write-Host "  ⚠️  IMPORTANTE: Edita backend\.env con tus configuraciones!" -ForegroundColor Yellow
    Write-Host "     - DATABASE_URL (SQLite por defecto, funciona para local)" -ForegroundColor Yellow
    Write-Host "     - STRIPE_SECRET_KEY (opcional para testing local)" -ForegroundColor Yellow
    Write-Host "     - GROQ_API_KEY (para Pixel AI)" -ForegroundColor Yellow
}
else {
    Write-Host "  ℹ️  Archivo .env ya existe" -ForegroundColor Gray
}

# Inicializar base de datos
Write-Host "  → Inicializando base de datos SQLite..." -ForegroundColor Cyan
python -c "from database import Base, engine; Base.metadata.create_all(bind=engine); print('✅ Base de datos inicializada')"

Pop-Location

# ==============================================================================
# PASO 3: Setup Frontend (Node.js/pnpm)
# ==============================================================================
Write-Host "`n⚛️  PASO 3: Configurando Frontend (React/Vite)..." -ForegroundColor Yellow

# Verificar si node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "  → Instalando dependencias Node.js (esto puede tardar)..." -ForegroundColor Cyan
    pnpm install
    Write-Host "  ✅ Dependencias instaladas" -ForegroundColor Green
}
else {
    Write-Host "  ℹ️  node_modules ya existe, verificando..." -ForegroundColor Gray
    Write-Host "  → Actualizando dependencias..." -ForegroundColor Cyan
    pnpm install
    Write-Host "  ✅ Dependencias actualizadas" -ForegroundColor Green
}

# Configurar variables de entorno para web-classic
$webClassicEnv = "apps\web-classic\.env.local"
if (-not (Test-Path $webClassicEnv)) {
    Write-Host "  → Creando .env.local para web-classic..." -ForegroundColor Cyan
    
    $envContent = @"
# Son1kVers3 - Web Classic Environment
# Backend API URL
VITE_API_URL=http://localhost:8000

# Stripe (opcional para testing local)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Supabase (opcional - para auth)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
"@
    
    Set-Content -Path $webClassicEnv -Value $envContent
    Write-Host "  ✅ Archivo .env.local creado en apps\web-classic\" -ForegroundColor Green
    Write-Host "  ⚠️  Edita este archivo si necesitas configuraciones adicionales" -ForegroundColor Yellow
}
else {
    Write-Host "  ℹ️  .env.local ya existe en web-classic" -ForegroundColor Gray
}

# ==============================================================================
# PASO 4: Verificar configuración
# ==============================================================================
Write-Host "`n🔍 PASO 4: Verificando configuración..." -ForegroundColor Yellow

$allGood = $true

# Check backend venv
if (Test-Path "backend\venv") {
    Write-Host "  ✅ Backend venv OK" -ForegroundColor Green
}
else {
    Write-Host "  ❌ Backend venv FALTA" -ForegroundColor Red
    $allGood = $false
}

# Check backend .env
if (Test-Path "backend\.env") {
    Write-Host "  ✅ Backend .env OK" -ForegroundColor Green
}
else {
    Write-Host "  ❌ Backend .env FALTA" -ForegroundColor Red
    $allGood = $false
}

# Check database
if (Test-Path "backend\sql_app.db") {
    Write-Host "  ✅ Database SQLite OK" -ForegroundColor Green
}
else {
    Write-Host "  ⚠️  Database no inicializada (se creará al arrancar)" -ForegroundColor Yellow
}

# Check node_modules
if (Test-Path "node_modules") {
    Write-Host "  ✅ Frontend dependencies OK" -ForegroundColor Green
}
else {
    Write-Host "  ❌ Frontend dependencies FALTAN" -ForegroundColor Red
    $allGood = $false
}

# Check frontend .env
if (Test-Path "apps\web-classic\.env.local") {
    Write-Host "  ✅ Frontend .env.local OK" -ForegroundColor Green
}
else {
    Write-Host "  ⚠️  Frontend .env.local FALTA" -ForegroundColor Yellow
}

# ==============================================================================
# PASO 5: Instrucciones finales
# ==============================================================================
Write-Host "`n" -NoNewline
Write-Host "=" * 60 -ForegroundColor Gray
if ($allGood) {
    Write-Host "✅ SETUP COMPLETADO EXITOSAMENTE!" -ForegroundColor Green
}
else {
    Write-Host "⚠️  SETUP COMPLETADO CON ADVERTENCIAS" -ForegroundColor Yellow
}
Write-Host "=" * 60 -ForegroundColor Gray

Write-Host "`n📝 PRÓXIMOS PASOS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Editar variables de entorno:" -ForegroundColor Yellow
Write-Host "   → backend\.env" -ForegroundColor White
Write-Host "   → apps\web-classic\.env.local" -ForegroundColor White
Write-Host ""
Write-Host "2️⃣  Iniciar Backend:" -ForegroundColor Yellow
Write-Host "   → cd backend" -ForegroundColor White
Write-Host "   → .\venv\Scripts\Activate" -ForegroundColor White
Write-Host "   → uvicorn main:app --reload --host 0.0.0.0 --port 8000" -ForegroundColor White
Write-Host "   → Verificar: http://localhost:8000/health" -ForegroundColor Green
Write-Host ""
Write-Host "3️⃣  Iniciar Frontend (en otra terminal):" -ForegroundColor Yellow
Write-Host "   → pnpm dev --filter @super-son1k/web-classic" -ForegroundColor White
Write-Host "   → Abrir: http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "4️⃣  Ejecutar script de testing:" -ForegroundColor Yellow
Write-Host "   → .\start-local-testing.ps1" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentación completa en: ANALISIS_EJECUTIVO_2026.md" -ForegroundColor Cyan
Write-Host ""
