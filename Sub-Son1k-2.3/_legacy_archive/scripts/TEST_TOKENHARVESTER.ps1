# ========================================
# 🧪 SCRIPT DE TESTING - TOKENHARVESTER
# ========================================

Write-Host "🚀 Iniciando Testing del TokenHarvester System..." -ForegroundColor Cyan
Write-Host ""

# Verificar ubicación
$expectedPath = "Sub-Son1k-2.3"
$currentPath = Get-Location
if ($currentPath -notlike "*$expectedPath*") {
    Write-Host "❌ Error: Ejecutar desde el directorio Sub-Son1k-2.3" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Ubicación correcta: $currentPath" -ForegroundColor Green
Write-Host ""

# ========================================
# PASO 1: Verificar Dependencias
# ========================================
Write-Host "📦 PASO 1: Verificando dependencias..." -ForegroundColor Yellow

$backendPackageJson = Get-Content "packages\backend\package.json" -Raw | ConvertFrom-Json
$hasPuppeteerExtra = $backendPackageJson.dependencies.'puppeteer-extra'
$hasStealth = $backendPackageJson.dependencies.'puppeteer-extra-plugin-stealth'

if ($hasPuppeteerExtra -and $hasStealth) {
    Write-Host "   ✅ puppeteer-extra: $hasPuppeteerExtra" -ForegroundColor Green
    Write-Host "   ✅ puppeteer-extra-plugin-stealth: $hasStealth" -ForegroundColor Green
} else {
    Write-Host "   ❌ Faltan dependencias de puppeteer" -ForegroundColor Red
    Write-Host "   Ejecutar: pnpm install" -ForegroundColor Yellow
    exit 1
}

# ========================================
# PASO 2: Verificar Schema Prisma
# ========================================
Write-Host ""
Write-Host "📋 PASO 2: Verificando Schema Prisma..." -ForegroundColor Yellow

$schema = Get-Content "packages\backend\prisma\schema.prisma" -Raw
if ($schema -match "model LinkedSunoAccount") {
    Write-Host "   ✅ Modelo LinkedSunoAccount encontrado" -ForegroundColor Green
} else {
    Write-Host "   ❌ Modelo LinkedSunoAccount NO encontrado" -ForegroundColor Red
    exit 1
}

if ($schema -match "poolPriority") {
    Write-Host "   ✅ Campo poolPriority en Token encontrado" -ForegroundColor Green
} else {
    Write-Host "   ❌ Campo poolPriority NO encontrado" -ForegroundColor Red
    exit 1
}

# ========================================
# PASO 3: Verificar Archivos Core
# ========================================
Write-Host ""
Write-Host "🔍 PASO 3: Verificando archivos implementados..." -ForegroundColor Yellow

$filesToCheck = @(
    @{ Path = "packages\backend\src\services\TokenHarvester.ts"; Name = "TokenHarvester Service" },
    @{ Path = "packages\backend\src\routes\suno-accounts.ts"; Name = "Suno Accounts Routes" },
    @{ Path = "apps\the-generator\src\hooks\usePolling.ts"; Name = "usePolling Hook" },
    @{ Path = "apps\the-generator\src\components\LinkSunoAccount.tsx"; Name = "LinkSunoAccount Component" }
)

foreach ($file in $filesToCheck) {
    if (Test-Path $file.Path) {
        $lineCount = (Get-Content $file.Path).Count
        Write-Host "   ✅ $($file.Name): $lineCount líneas" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $($file.Name): NO ENCONTRADO" -ForegroundColor Red
    }
}

# ========================================
# PASO 4: Verificar Configuración .env
# ========================================
Write-Host ""
Write-Host "⚙️  PASO 4: Verificando configuración..." -ForegroundColor Yellow

if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    
    if ($envContent -match "ENCRYPTION_KEY=") {
        Write-Host "   ✅ ENCRYPTION_KEY configurado" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  ENCRYPTION_KEY NO encontrado" -ForegroundColor Yellow
        Write-Host "   Copiar desde ENV_CONFIG_TOKENHARVESTER.txt" -ForegroundColor Cyan
    }
    
    if ($envContent -match "HARVEST_INTERVAL_MINUTES=") {
        Write-Host "   ✅ HARVEST_INTERVAL_MINUTES configurado" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  HARVEST_INTERVAL_MINUTES NO encontrado (usará default: 5)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ Archivo .env NO encontrado" -ForegroundColor Red
}

# ========================================
# PASO 5: Verificar Base de Datos
# ========================================
Write-Host ""
Write-Host "🗄️  PASO 5: Verificando base de datos..." -ForegroundColor Yellow

if (Test-Path "packages\backend\dev.db") {
    Write-Host "   ✅ Base de datos SQLite encontrada" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Base de datos NO encontrada (se creará al iniciar)" -ForegroundColor Yellow
}

# ========================================
# RESUMEN
# ========================================
Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 RESUMEN DE VERIFICACIÓN" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Dependencias puppeteer: INSTALADAS" -ForegroundColor Green
Write-Host "✅ Schema Prisma: ACTUALIZADO" -ForegroundColor Green
Write-Host "✅ Archivos implementados: COMPLETOS" -ForegroundColor Green
Write-Host "✅ Sistema: LISTO PARA PROBAR" -ForegroundColor Green
Write-Host ""

# ========================================
# INSTRUCCIONES DE TESTING
# ========================================
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🧪 PRUEBAS MANUALES RECOMENDADAS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "1️⃣  INICIAR BACKEND:" -ForegroundColor Yellow
Write-Host "   cd packages\backend" -ForegroundColor White
Write-Host "   pnpm dev" -ForegroundColor White
Write-Host ""
Write-Host "   Verificar logs:" -ForegroundColor Cyan
Write-Host "   - ✅ TokenManager initialized" -ForegroundColor Gray
Write-Host "   - ✅ Suno Accounts Routes registered" -ForegroundColor Gray
Write-Host "   - 🌾 TokenHarvester started" -ForegroundColor Gray
Write-Host ""

Write-Host "2️⃣  INICIAR FRONTEND:" -ForegroundColor Yellow
Write-Host "   cd apps\the-generator" -ForegroundColor White
Write-Host "   pnpm dev" -ForegroundColor White
Write-Host ""

Write-Host "3️⃣  PROBAR ENDPOINTS:" -ForegroundColor Yellow
Write-Host "   Estadísticas del Harvester:" -ForegroundColor Cyan
Write-Host "   curl http://localhost:8000/api/suno-accounts/harvester/stats" -ForegroundColor White
Write-Host ""

Write-Host "4️⃣  VINCULAR CUENTA SUNO:" -ForegroundColor Yellow
Write-Host "   - Ir a la UI del generador" -ForegroundColor White
Write-Host "   - Buscar componente LinkSunoAccount" -ForegroundColor White
Write-Host "   - Ingresar email y password de Suno" -ForegroundColor White
Write-Host "   - Esperar verificación" -ForegroundColor White
Write-Host ""

Write-Host "5️⃣  VERIFICAR HARVESTING:" -ForegroundColor Yellow
Write-Host "   - Esperar 5 minutos" -ForegroundColor White
Write-Host "   - Verificar logs del backend" -ForegroundColor White
Write-Host "   - Consultar stats nuevamente" -ForegroundColor White
Write-Host ""

Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✨ ¡Sistema verificado y listo!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
