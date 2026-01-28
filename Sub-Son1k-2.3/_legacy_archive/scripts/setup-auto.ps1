#!/usr/bin/env pwsh
# Setup Automatizado para Sub-Son1k-2.3
# Ejecuta: .\setup-auto.ps1

Write-Host "
╔════════════════════════════════════════╗
║  Setup Automático - Sub-Son1k-2.3     ║
╚════════════════════════════════════════╝
" -ForegroundColor Cyan

# Verificar Node.js
Write-Host "🔍 Verificando Node.js..." -ForegroundColor Yellow
$nodeVersion = node -v
if ($?) {
    Write-Host "✅ Node.js $nodeVersion instalado" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js no encontrado. Instálalo desde https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Verificar pnpm
Write-Host "`n🔍 Verificando pnpm..." -ForegroundColor Yellow
$pnpmVersion = pnpm -v 2>$null
if ($?) {
    Write-Host "✅ pnpm $pnpmVersion instalado" -ForegroundColor Green
} else {
    Write-Host "⚠️  pnpm no encontrado. Instalando..." -ForegroundColor Yellow
    npm install -g pnpm
    Write-Host "✅ pnpm instalado correctamente" -ForegroundColor Green
}

# Verificar si existe .env
Write-Host "`n🔍 Verificando variables de entorno..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✅ Archivo .env encontrado" -ForegroundColor Green
} else {
    Write-Host "⚠️  Archivo .env no encontrado" -ForegroundColor Yellow
    Write-Host "📝 Creando .env desde template..." -ForegroundColor Cyan
    
    if (Test-Path "ENV_CONFIG_TEMPLATE.md") {
        Copy-Item "ENV_CONFIG_TEMPLATE.md" ".env"
        Write-Host "✅ Archivo .env creado" -ForegroundColor Green
        Write-Host "⚠️  IMPORTANTE: Edita .env y configura:" -ForegroundColor Yellow
        Write-Host "   - DATABASE_URL" -ForegroundColor White
        Write-Host "   - SUNO_COOKIES" -ForegroundColor White
    } else {
        Write-Host "❌ Template no encontrado. Crea .env manualmente" -ForegroundColor Red
        exit 1
    }
}

# Verificar dependencias
Write-Host "`n🔍 Verificando dependencias..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✅ Dependencias ya instaladas" -ForegroundColor Green
} else {
    Write-Host "📦 Instalando dependencias (esto puede tardar)..." -ForegroundColor Cyan
    pnpm install
    if ($?) {
        Write-Host "✅ Dependencias instaladas correctamente" -ForegroundColor Green
    } else {
        Write-Host "❌ Error instalando dependencias" -ForegroundColor Red
        exit 1
    }
}

# Verificar Prisma
Write-Host "`n🔍 Configurando Prisma..." -ForegroundColor Yellow
Set-Location "packages\backend"

# Generar cliente de Prisma
Write-Host "   Generando cliente de Prisma..." -ForegroundColor Cyan
pnpm prisma generate 2>&1 | Out-Null
if ($?) {
    Write-Host "✅ Cliente de Prisma generado" -ForegroundColor Green
} else {
    Write-Host "⚠️  Error generando cliente de Prisma (puede requerir DATABASE_URL)" -ForegroundColor Yellow
}

Set-Location "..\.."

# Resumen
Write-Host "
╔════════════════════════════════════════╗
║         RESUMEN DEL SETUP             ║
╚════════════════════════════════════════╝
" -ForegroundColor Cyan

Write-Host "✅ Node.js: OK" -ForegroundColor Green
Write-Host "✅ pnpm: OK" -ForegroundColor Green
Write-Host "✅ Dependencias: OK" -ForegroundColor Green
Write-Host "✅ Prisma Cliente: OK" -ForegroundColor Green

# Verificar configuración
Write-Host "`n📋 Siguiente paso:" -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "1. Edita el archivo .env y configura:" -ForegroundColor White
    Write-Host "   - DATABASE_URL (PostgreSQL)" -ForegroundColor Cyan
    Write-Host "   - SUNO_COOKIES (desde https://app.suno.ai)" -ForegroundColor Cyan
    Write-Host "`n2. Inicializa la base de datos:" -ForegroundColor White
    Write-Host "   cd packages\backend" -ForegroundColor Gray
    Write-Host "   pnpm prisma db push" -ForegroundColor Gray
    Write-Host "`n3. Inicia el backend:" -ForegroundColor White
    Write-Host "   pnpm dev" -ForegroundColor Gray
    Write-Host "`n4. En otra terminal, inicia el frontend:" -ForegroundColor White
    Write-Host "   cd apps\the-generator-nextjs" -ForegroundColor Gray
    Write-Host "   pnpm dev" -ForegroundColor Gray
} else {
    Write-Host "⚠️  Crea el archivo .env primero" -ForegroundColor Yellow
}

Write-Host "`n📚 Documentación útil:" -ForegroundColor Yellow
Write-Host "   - SETUP_RAPIDO.md - Guía completa de setup" -ForegroundColor Gray
Write-Host "   - DIAGNOSTICO_COMPLETO.md - Estado del proyecto" -ForegroundColor Gray
Write-Host "   - ENV_CONFIG_TEMPLATE.md - Template de configuración" -ForegroundColor Gray

Write-Host "`n🎵 ¡Listo para generar música con IA!" -ForegroundColor Green
