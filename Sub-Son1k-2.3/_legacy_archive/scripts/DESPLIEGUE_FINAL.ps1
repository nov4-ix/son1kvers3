
Write-Host "🚀 INICIANDO DESPLIEGUE AUTOMATIZADO - SON1KVERS3" -ForegroundColor Cyan
Write-Host "=================================================="

# 1. Backend (Railway)
Write-Host "`n📡 PASO 1: Desplegando Backend en Railway..." -ForegroundColor Yellow

# Chequear login
$railwayLogin = railway whoami
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ No estás logueado en Railway. Ejecuta 'railway login' primero." -ForegroundColor Red
    exit
}

# Linkear proyecto (Interactivo)
Write-Host "ℹ️  Selecciona tu proyecto de Railway (o crea uno nuevo):" -ForegroundColor Cyan
railway link

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error linkeando proyecto." -ForegroundColor Red
    exit
}

# Deploy
Write-Host "🔥 Desplegando Backend..." -ForegroundColor Yellow
railway up --detach

Write-Host "✅ Backend en proceso de despliegue!" -ForegroundColor Green


# 2. Frontend (Vercel)
Write-Host "`n🎨 PASO 2: Desplegando Frontend en Vercel..." -ForegroundColor Yellow

Set-Location "apps\the-generator-nextjs"

# Chequear login
$vercelLogin = vercel whoami
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ No estás logueado en Vercel. Ejecuta 'vercel login' primero." -ForegroundColor Red
    exit
}

# Deploy Prod (Interactivo la primera vez para settings)
Write-Host "ℹ️  Configurando proyecto Vercel (acepta los defaults):" -ForegroundColor Cyan
vercel --prod

Write-Host "`n✨ DEPLOY FINALIZADO O EN PROCESO ✨" -ForegroundColor Green
Write-Host "========================================"
Write-Host "Verifica las URLs generadas arriba."
