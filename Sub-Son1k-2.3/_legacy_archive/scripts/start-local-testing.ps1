# 🧪 Start Local Testing - Son1kVers3
# Este script inicia ambos servidores (backend + frontend) para testing local
# Ejecutar desde: c:\Users\qrrom\Downloads\Sub-Son1k-2.3\Sub-Son1k-2.3\

Write-Host "🚀 Son1kVers3 - Start Local Testing" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# ==============================================================================
# Función para iniciar proceso en background
# ==============================================================================
function Start-BackgroundProcess {
    param(
        [string]$Name,
        [string]$Command,
        [string]$WorkingDir,
        [string]$Color = "White"
    )
    
    Write-Host "`n🔄 Iniciando $Name..." -ForegroundColor $Color
    
    $process = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$WorkingDir'; $Command" -PassThru
    
    Write-Host "  ✅ $Name iniciado (PID: $($process.Id))" -ForegroundColor Green
    
    return $process
}

# ==============================================================================
# VERIFICACIÓN PREVIA
# ==============================================================================
Write-Host "`n📋 Verificando prerequisitos..." -ForegroundColor Yellow

$canStart = $true

# Check backend venv
if (-not (Test-Path "backend\venv")) {
    Write-Host "  ❌ Backend venv no encontrado" -ForegroundColor Red
    Write-Host "     Ejecuta primero: .\setup-local-testing.ps1" -ForegroundColor Yellow
    $canStart = $false
}

# Check node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "  ❌ node_modules no encontrado" -ForegroundColor Red
    Write-Host "     Ejecuta primero: .\setup-local-testing.ps1" -ForegroundColor Yellow
    $canStart = $false
}

if (-not $canStart) {
    Write-Host "`n⛔ No se puede continuar. Ejecuta setup primero." -ForegroundColor Red
    exit 1
}

Write-Host "  ✅ Prerequisitos OK" -ForegroundColor Green

# ==============================================================================
# INICIAR BACKEND
# ==============================================================================
Write-Host "`n🐍 BACKEND (FastAPI)" -ForegroundColor Yellow
Write-Host "  → Puerto: 8000" -ForegroundColor Gray
Write-Host "  → Health Check: http://localhost:8000/health" -ForegroundColor Gray
Write-Host "  → API Docs: http://localhost:8000/docs" -ForegroundColor Gray

$backendDir = Join-Path $PSScriptRoot "backend"
$backendCommand = ".\venv\Scripts\Activate.ps1; uvicorn main:app --reload --host 0.0.0.0 --port 8000"

$backendProcess = Start-BackgroundProcess -Name "Backend Server" -Command $backendCommand -WorkingDir $backendDir -Color "Yellow"

Start-Sleep -Seconds 3

# ==============================================================================
# INICIAR FRONTEND
# ==============================================================================
Write-Host "`n⚛️  FRONTEND (Web Classic)" -ForegroundColor Yellow
Write-Host "  → Puerto: 5173 (por defecto)" -ForegroundColor Gray
Write-Host "  → URL: http://localhost:5173" -ForegroundColor Gray

$frontendCommand = "pnpm dev --filter @super-son1k/web-classic"

$frontendProcess = Start-BackgroundProcess -Name "Frontend Server" -Command $frontendCommand -WorkingDir $PSScriptRoot -Color "Cyan"

Start-Sleep -Seconds 3

# ==============================================================================
# STATUS Y PRÓXIMOS PASOS
# ==============================================================================
Write-Host "`n" -NoNewline
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "✅ SERVIDORES INICIADOS!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Gray

Write-Host "`n📊 STATUS:" -ForegroundColor Cyan
Write-Host "  🐍 Backend:  http://localhost:8000" -ForegroundColor Yellow
Write-Host "  ⚛️  Frontend: http://localhost:5173" -ForegroundColor Cyan

Write-Host "`n🧪 TESTING CHECKLIST:" -ForegroundColor Cyan
Write-Host "  1. Verificar Backend Health:" -ForegroundColor White
Write-Host "     → http://localhost:8000/health" -ForegroundColor Green
Write-Host ""
Write-Host "  2. Verificar API Docs:" -ForegroundColor White
Write-Host "     → http://localhost:8000/docs" -ForegroundColor Green
Write-Host ""
Write-Host "  3. Abrir Frontend:" -ForegroundColor White
Write-Host "     → http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "  4. Test de integración:" -ForegroundColor White
Write-Host "     → Verificar que frontend se conecte a backend" -ForegroundColor Yellow
Write-Host "     → Revisar consola del navegador (F12)" -ForegroundColor Yellow
Write-Host ""

Write-Host "⚠️  NOTA:" -ForegroundColor Yellow
Write-Host "    - Las generaciones de música requieren tokens de Suno AI" -ForegroundColor Gray
Write-Host "    - Configura SUNO_TOKENS en backend\.env si los tienes" -ForegroundColor Gray
Write-Host ""

Write-Host "📝 LOGS:" -ForegroundColor Cyan
Write-Host "    - Backend: En la ventana de PowerShell del backend" -ForegroundColor Gray
Write-Host "    - Frontend: En la ventana de PowerShell del frontend" -ForegroundColor Gray
Write-Host ""

Write-Host "🛑 PARA DETENER:" -ForegroundColor Red
Write-Host "    - Cierra las ventanas de PowerShell" -ForegroundColor Gray
Write-Host "    - O pulsa Ctrl+C en cada ventana" -ForegroundColor Gray
Write-Host ""

Write-Host "🎉 Happy testing!" -ForegroundColor Green
Write-Host ""

# Esperar input del usuario
Write-Host "Presiona Enter para abrir los URLs en el navegador..." -ForegroundColor Cyan
Read-Host

# Abrir URLs en navegador
Start-Process "http://localhost:8000/health"
Start-Sleep -Seconds 1
Start-Process "http://localhost:8000/docs"
Start-Sleep -Seconds 1
Start-Process "http://localhost:5173"

Write-Host "`n✨ URLs abiertos en el navegador!" -ForegroundColor Green
Write-Host ""
Write-Host "Este script permanecerá abierto. Ciérralo cuando termines el testing." -ForegroundColor Gray
Write-Host ""

# Mantener el script abierto
Read-Host "Presiona Enter para salir"
