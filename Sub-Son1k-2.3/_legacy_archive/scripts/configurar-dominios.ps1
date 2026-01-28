# Script para configurar dominios en Vercel usando CLI
# Fecha: 3 de Enero, 2026

Write-Host "🔧 CONFIGURACIÓN DE DOMINIOS EN VERCEL" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que Vercel CLI esté instalado
Write-Host "📦 Verificando Vercel CLI..." -ForegroundColor Yellow
try {
    $vercelVersion = vercel --version
    Write-Host "✅ Vercel CLI instalado: $vercelVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error: Vercel CLI no está instalado" -ForegroundColor Red
    Write-Host "Instala con: npm install -g vercel" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🔐 PASO 1: Login en Vercel" -ForegroundColor Cyan
Write-Host "Abriendo navegador para autenticación..." -ForegroundColor Yellow
Write-Host ""

# Login en Vercel
vercel login

Write-Host ""
Write-Host "✅ Login completado" -ForegroundColor Green
Write-Host ""

# Dominios a configurar
$dominiosWebClassic = @("son1kvers3.com", "www.son1kvers3.com")
$dominioGenerator = "the-generator.son1kvers3.com"

Write-Host "📋 DOMINIOS A CONFIGURAR:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Web Classic:" -ForegroundColor Yellow
foreach ($dominio in $dominiosWebClassic) {
    Write-Host "  - $dominio" -ForegroundColor White
}
Write-Host ""
Write-Host "The Generator:" -ForegroundColor Yellow
Write-Host "  - $dominioGenerator" -ForegroundColor White
Write-Host ""

# Confirmar con el usuario
$confirm = Read-Host "¿Continuar con la configuración? (s/n)"
if ($confirm -ne "s" -and $confirm -ne "S") {
    Write-Host "❌ Configuración cancelada" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🚀 PASO 2: Configurando Web Classic" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Configurar dominios para Web Classic
Write-Host "📍 Proyecto: web-classic" -ForegroundColor Yellow
Write-Host ""

foreach ($dominio in $dominiosWebClassic) {
    Write-Host "Agregando dominio: $dominio" -ForegroundColor White
    
    # Cambiar al directorio de web-classic
    Set-Location "apps\web-classic"
    
    # Agregar dominio
    vercel domains add $dominio --yes
    
    # Volver al directorio raíz
    Set-Location "..\..\"
    
    Write-Host "✅ Dominio $dominio agregado" -ForegroundColor Green
    Write-Host ""
}

Write-Host ""
Write-Host "🚀 PASO 3: Configurando The Generator" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Configurar dominio para The Generator
Write-Host "📍 Proyecto: the-generator-nextjs" -ForegroundColor Yellow
Write-Host ""
Write-Host "Agregando dominio: $dominioGenerator" -ForegroundColor White

# Cambiar al directorio de the-generator
Set-Location "apps\the-generator-nextjs"

# Agregar dominio
vercel domains add $dominioGenerator --yes

# Volver al directorio raíz
Set-Location "..\..\"

Write-Host "✅ Dominio $dominioGenerator agregado" -ForegroundColor Green
Write-Host ""

Write-Host ""
Write-Host "🎉 CONFIGURACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "===========================" -ForegroundColor Green
Write-Host ""

Write-Host "📊 RESUMEN:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Web Classic (web-classic):" -ForegroundColor Yellow
Write-Host "  ✅ son1kvers3.com" -ForegroundColor Green
Write-Host "  ✅ www.son1kvers3.com" -ForegroundColor Green
Write-Host ""
Write-Host "The Generator (the-generator-nextjs):" -ForegroundColor Yellow
Write-Host "  ✅ the-generator.son1kvers3.com" -ForegroundColor Green
Write-Host ""

Write-Host "⏱️  Los certificados SSL se generarán automáticamente en 5-10 minutos" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔍 Puedes verificar el estado con:" -ForegroundColor Cyan
Write-Host "   vercel domains ls" -ForegroundColor White
Write-Host ""

Write-Host "🌐 URLs Finales:" -ForegroundColor Cyan
Write-Host "   https://son1kvers3.com" -ForegroundColor White
Write-Host "   https://www.son1kvers3.com" -ForegroundColor White
Write-Host "   https://the-generator.son1kvers3.com" -ForegroundColor White
Write-Host ""
