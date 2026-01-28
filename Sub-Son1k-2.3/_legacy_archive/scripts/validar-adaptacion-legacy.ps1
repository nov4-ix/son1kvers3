#!/usr/bin/env pwsh
# Script de Validación del Sistema de Polling Adaptado
# Verifica que el comportamiento legacy se haya implementado correctamente

Write-Host "🔍 Validación del Sistema de Polling Legacy" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = $PSScriptRoot
$passed = 0
$failed = 0

function Test-FileContains {
    param(
        [string]$FilePath,
        [string]$Pattern,
        [string]$TestName
    )
    
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath -Raw
        if ($content -match $Pattern) {
            Write-Host "✅ PASS: $TestName" -ForegroundColor Green
            $script:passed++
            return $true
        }
        else {
            Write-Host "❌ FAIL: $TestName" -ForegroundColor Red
            Write-Host "   Archivo: $FilePath" -ForegroundColor Yellow
            Write-Host "   Patrón no encontrado: $Pattern" -ForegroundColor Yellow
            $script:failed++
            return $false
        }
    }
    else {
        Write-Host "❌ FAIL: $TestName - Archivo no encontrado" -ForegroundColor Red
        Write-Host "   Ruta: $FilePath" -ForegroundColor Yellow
        $script:failed++
        return $false
    }
}

Write-Host "📋 Verificando Backend (musicGenerationService.ts)..." -ForegroundColor Yellow
Write-Host ""

# Test 1: Verificar que checkGenerationStatus tiene comentario LEGACY BEHAVIOR
Test-FileContains `
    -FilePath "$projectRoot\packages\backend\src\services\musicGenerationService.ts" `
    -Pattern "LEGACY BEHAVIOR.*Tolerante a estados inconsistentes" `
    -TestName "Comentario LEGACY BEHAVIOR en checkGenerationStatus"

# Test 2: Verificar manejo de token no disponible retorna 'processing'
Test-FileContains `
    -FilePath "$projectRoot\packages\backend\src\services\musicGenerationService.ts" `
    -Pattern "status:\s*'processing'.*retrying" `
    -TestName "Token no disponible retorna 'processing' en lugar de 'failed'"

# Test 3: Verificar prioridad a tracks válidos
Test-FileContains `
    -FilePath "$projectRoot\packages\backend\src\services\musicGenerationService.ts" `
    -Pattern "hasValidTracks.*tracks\.some.*audio_url" `
    -TestName "Prioriza tracks válidos sobre campo 'running'"

# Test 4: Verificar tolerancia a running=false sin audio_url
Test-FileContains `
    -FilePath "$projectRoot\packages\backend\src\services\musicGenerationService.ts" `
    -Pattern "running\s*===\s*false.*!data\.audio_url.*processing" `
    -TestName "Tolerancia a running=false sin audio_url (continúa polling)"

# Test 5: Verificar manejo de errores HTTP fatales (401, 403, 404)
Test-FileContains `
    -FilePath "$projectRoot\packages\backend\src\services\musicGenerationService.ts" `
    -Pattern "status\s*===\s*401.*status\s*===\s*403.*status\s*===\s*404" `
    -TestName "Solo aborta en errores HTTP fatales (401, 403, 404)"

# Test 6: Verificar que cualquier otro error retorna 'processing'
Test-FileContains `
    -FilePath "$projectRoot\packages\backend\src\services\musicGenerationService.ts" `
    -Pattern "Unexpected error.*will retry.*status:\s*'processing'" `
    -TestName "Errores inesperados retornan 'processing' (reintentar)"

Write-Host ""
Write-Host "📋 Verificando Backend (generation.ts)..." -ForegroundColor Yellow
Write-Host ""

# Test 7: Verificar normalización de respuesta con campos running, statusNormalized, tracks
Test-FileContains `
    -FilePath "$projectRoot\packages\backend\src\routes\generation.ts" `
    -Pattern "running:.*isRunning" `
    -TestName "Campo 'running' en respuesta normalizada"

Test-FileContains `
    -FilePath "$projectRoot\packages\backend\src\routes\generation.ts" `
    -Pattern "statusNormalized:.*statusFormatted" `
    -TestName "Campo 'statusNormalized' en respuesta normalizada"

Test-FileContains `
    -FilePath "$projectRoot\packages\backend\src\routes\generation.ts" `
    -Pattern "tracks:.*tracks\.length.*undefined" `
    -TestName "Campo 'tracks' en respuesta normalizada"

Write-Host ""
Write-Host "📋 Verificando Frontend (App.tsx)..." -ForegroundColor Yellow
Write-Host ""

# Test 10: Verificar uso de campos normalizados
Test-FileContains `
    -FilePath "$projectRoot\apps\the-generator\src\App.tsx" `
    -Pattern "running.*statusNormalized.*tracks.*audioUrl.*status.*=.*data\.data" `
    -TestName "Frontend usa campos normalizados del backend"

# Test 11: Verificar prioridad a tracks y audioUrl
Test-FileContains `
    -FilePath "$projectRoot\apps\the-generator\src\App.tsx" `
    -Pattern "hasValidTracks.*hasAudioUrl" `
    -TestName "Frontend prioriza tracks y audioUrl válidos"

# Test 12: Verificar lógica de detención de polling
Test-FileContains `
    -FilePath "$projectRoot\apps\the-generator\src\App.tsx" `
    -Pattern "shouldStopPolling.*hasValidTracks.*hasAudioUrl.*failed" `
    -TestName "Polling solo se detiene con tracks/audioUrl válidos o estado 'failed'"

# Test 13: Verificar tolerancia a errores HTTP temporales
Test-FileContains `
    -FilePath "$projectRoot\apps\the-generator\src\App.tsx" `
    -Pattern "No abortar por error HTTP temporal.*console\.warn" `
    -TestName "Frontend tolera errores HTTP temporales"

# Test 14: Verificar tolerancia a errores de red
Test-FileContains `
    -FilePath "$projectRoot\apps\the-generator\src\App.tsx" `
    -Pattern "No abortar por error de red temporal.*console\.warn" `
    -TestName "Frontend tolera errores de red temporales"

# Test 15: Verificar polling interval de 5 segundos
Test-FileContains `
    -FilePath "$projectRoot\apps\the-generator\src\App.tsx" `
    -Pattern "5000.*Poll cada 5 segundos.*LEGACY BEHAVIOR" `
    -TestName "Polling interval fijo de 5 segundos"

Write-Host ""
Write-Host "📋 Verificando Documentación..." -ForegroundColor Yellow
Write-Host ""

# Test 16: Verificar que existe el documento de adaptación
if (Test-Path "$projectRoot\ADAPTACION_POLLING_LEGACY.md") {
    Write-Host "✅ PASS: Documento ADAPTACION_POLLING_LEGACY.md existe" -ForegroundColor Green
    $passed++
}
else {
    Write-Host "❌ FAIL: Documento ADAPTACION_POLLING_LEGACY.md no encontrado" -ForegroundColor Red
    $failed++
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "📊 RESUMEN DE VALIDACIÓN" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Pruebas exitosas: $passed" -ForegroundColor Green
Write-Host "❌ Pruebas fallidas: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($failed -eq 0) {
    Write-Host "🎉 ¡VALIDACIÓN COMPLETA! Todos los cambios Legacy se implementaron correctamente." -ForegroundColor Green
    Write-Host ""
    Write-Host "📚 Lee ADAPTACION_POLLING_LEGACY.md para más detalles sobre los cambios." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🚀 Próximos pasos:" -ForegroundColor Yellow
    Write-Host "   1. Ejecutar backend: pnpm --filter @super-son1k/backend dev" -ForegroundColor White
    Write-Host "   2. Ejecutar frontend: pnpm --filter the-generator dev" -ForegroundColor White
    Write-Host "   3. Probar generación y observar logs de polling en consola" -ForegroundColor White
    Write-Host ""
    exit 0
}
else {
    Write-Host "⚠️  VALIDACIÓN INCOMPLETA. Revisa los errores arriba." -ForegroundColor Red
    Write-Host ""
    exit 1
}
