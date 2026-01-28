# Script de Inicio Rápido - TokenHarvester System
# Ejecutar en PowerShell

Write-Host "🚀 INICIANDO SISTEMA TOKENHARVESTER" -ForegroundColor Green
Write-Host "====================================`n" -ForegroundColor Green

# Paso 1: Verificar Backend
Write-Host "📍 Paso 1: Verificando backend..." -ForegroundColor Cyan
cd packages\backend

if (!(Test-Path ".env")) {
    Write-Host "⚠️  Archivo .env no encontrado!" -ForegroundColor Yellow
    Write-Host "📝 Copiando configuración desde ENV_CONFIG_TOKENHARVESTER.txt..." -ForegroundColor Yellow
    
    $envContent = @"
ENCRYPTION_KEY=8546ee7511112ef9993372ccc1fe507beff12a5e2a12fe11bd638291862bf9b6
HARVEST_INTERVAL_MINUTES=5
DATABASE_URL=file:./dev.db
PORT=8000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
SUNO_TOKENS=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdW5vLmNvbS9jbGFpbXMvdXNlcl9pZCI6IjRmMGI2NzBjLTNiMmMtNGI3YS05NDM5LTVlZGNjMmI3ZTJjMyIsImh0dHBzOi8vc3Vuby5haS9jbGFpbXMvY2xlcmtfaWQiOiJ1c2VyXzJyVzQ4bGVFU1FIUFJ6Z3FkMzNzNHJSNzVReCIsInN1bm8uY29tL2NsYWltcy90b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY4MDQ3Nzg4LCJhdWQiOiJzdW5vLWFwaSIsInN1YiI6InVzZXJfMnJXNDhsZUVTUUhQUnpncWQzM3M0clI3NVF4IiwiYXpwIjoiaHR0cHM6Ly9zdW5vLmNvbSIsImZ2YSI6WzAsLTFdLCJpYXQiOjE3NjgwNDQxODgsImlzcyI6Imh0dHBzOi8vYXV0aC5zdW5vLmNvbSIsImppdCI6IjU5OGY4NTc1LWQ5YmItNGQ2NS1hZWJiLTdlODdlOGUxNDgzYSIsInZpeiI6ZmFsc2UsInNpZCI6InNlc3Npb25fNjM2MjY5ODU2MGIxYTYzZjg3NjA2NSIsInN1bm8uY29tL2NsYWltcy9lbWFpbCI6Im5vdjQuaXhAZ21haWwuY29tIiwiaHR0cHM6Ly9zdW5vLmFpL2NsYWltcy9lbWFpbCI6Im5vdjQuaXhAZ21haWwuY29tIn0.E4y2cREctBwuiF9e-4Wytao1IrbeLBV-VkN7pra87kZgedYMD6OSnDLWOTS_YqY853TZBcFqSAVBjna2EuqDBnutVKg8W0AIUsxbLs4ql2z844JNJuS7QwrsJrjEpvxsJyWLlkdsMeLVF5Uc8dLvDPWEOsgPpxQLhhW7kY-y4wK1GSO1dJ47FXD6Utwxi7a0laStnj_ukV6DaT-LBLCZyMMQ9DEhSzcoLDmdmJWHbrTVer7ggmVc-KG1QSQiemDPVmeEDARr2FiDHmfZ6qbTGBokd6zGzkmaPd6dHroa8k8ccXedUJKVPYeZ-aNk8rm-rXXIDSJCSMVKMC4fNUFYjg
"@
    
    $envContent | Out-File -FilePath ".env" -Encoding utf8
    Write-Host "✅ Archivo .env creado" -ForegroundColor Green
}

Write-Host "✅ Backend listo`n" -ForegroundColor Green

# Paso 2: Iniciar Backend
Write-Host "📍 Paso 2: Iniciando backend en puerto 8000..." -ForegroundColor Cyan
Write-Host "Comando: pnpm dev" -ForegroundColor Gray
Write-Host "`n🔥 LOGS DEL BACKEND:" -ForegroundColor Yellow
Write-Host "Presiona Ctrl+C para detener`n" -ForegroundColor Yellow

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\qrrom\Downloads\Sub-Son1k-2.3\Sub-Son1k-2.3\packages\backend'; pnpm dev"

Write-Host "`n⏳ Esperando 10 segundos para que backend inicie..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Paso 3: Verificar Backend
Write-Host "`n📍 Paso 3: Verificando que backend esté activo..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 5
    $health = $response.Content | ConvertFrom-Json
    
    Write-Host "✅ Backend respondiendo en puerto 8000" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor Gray
}
catch {
    Write-Host "❌ Backend no responde. Verifica los logs." -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Paso 4: Verificar Harvester
Write-Host "`n📍 Paso 4: Verificando TokenHarvester..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/suno-accounts/harvester/stats" -UseBasicParsing
    $stats = $response.Content | ConvertFrom-Json
    
    Write-Host "✅ TokenHarvester activo" -ForegroundColor Green
    Write-Host "   Corriendo: $($stats.stats.isRunning)" -ForegroundColor Gray
    Write-Host "   Cuentas activas: $($stats.stats.activeAccounts)" -ForegroundColor Gray
    Write-Host "   Tokens recolectados: $($stats.stats.totalTokensHarvested)" -ForegroundColor Gray
    Write-Host "   Intervalo: $($stats.stats.harvestIntervalMinutes) minutos" -ForegroundColor Gray
}
catch {
    Write-Host "⚠️  No se pudo obtener stats del harvester" -ForegroundColor Yellow
    Write-Host "   Esto es normal si no hay cuentas vinculadas aún" -ForegroundColor Gray
}

# Paso 5: Iniciar Frontend
Write-Host "`n📍 Paso 5: Iniciando frontend en puerto 5173..." -ForegroundColor Cyan
Write-Host "Comando: pnpm dev --filter @super-son1k/web-classic" -ForegroundColor Gray

cd ..\..
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\qrrom\Downloads\Sub-Son1k-2.3\Sub-Son1k-2.3'; pnpm dev --filter @super-son1k/web-classic"

Write-Host "`n✅ SISTEMA INICIADO" -ForegroundColor Green
Write-Host "====================================`n" -ForegroundColor Green

Write-Host "📝 URLs:" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   Health:   http://localhost:8000/health" -ForegroundColor White
Write-Host "   Stats:    http://localhost:8000/api/suno-accounts/harvester/stats`n" -ForegroundColor White

Write-Host "🎯 Próximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Abrir http://localhost:5173" -ForegroundColor White
Write-Host "   2. Vincular tu cuenta de Suno" -ForegroundColor White
Write-Host "   3. Esperar 5 minutos y verificar stats" -ForegroundColor White
Write-Host "   4. Probar generación de música`n" -ForegroundColor White

Write-Host "🛑 Para detener: Cierra las ventanas de PowerShell" -ForegroundColor Yellow
Write-Host "`nPresiona Enter para salir..." -ForegroundColor Gray
Read-Host
