# Cleanup Script - Eliminar archivos redundantes
Write-Host "🧹 Iniciando limpieza del repositorio..." -ForegroundColor Cyan

$filesToDelete = @(
    # Documentación redundante
    "ACCIONES_DNS_IONOS.md",
    "ACTIVAR_PIXEL_AHORA.md",
    "ADAPTACION_POLLING_LEGACY.md",
    "ANALISIS_ESTADO_PRE_DEPLOY.md",
    "ANALISIS_MEJ

ORA.md",
    "ANALIZADOR_Y_KNOBS_COMPLETADO.md",
    "ARQUITECTURA_FINAL.md",
    "ARQUITECTURA_INTEGRACION.md",
    "CHECKLIST_COMPLETO.md",
    "CHECKLIST_CONSOLIDACION.md",
    "COMANDOS_RAPIDOS.md",
    "COMO_ALIMENTAR_TOKEN_POOL.md",
    "COMO_OBTENER_TOKENS_SUNO.md",
    "CONFIGURACION_COMPLETADA.md",
    "CONFIGURACION_DOMINIO_IONOS.md",
    "CONFIGURAR_DOMINIOS_WEB.md",
    "CONFIGURAR_PIXEL.md",
    "CONFIRMACION_IMPLEMENTACION.md",
    "CONSOLIDACION_100_COMPLETA.md",
    "CONSOLIDACION_COMPLETADA.md",
    "CONSOLIDACION_FINAL_COMPLETA.md",
    "DEPLOYMENT_STATUS.md",
    "DEPLOY_AHORA.md",
    "DEPLOY_FINAL.md",
    "DEPLOY_PROGRESO.md",
    "DEPLOY_READY_FINAL.md",
    "DEPLOY_STATUS.md",
    "DESPLEGAR_ECOSISTEMA.md",
    "DESPLEGAR_FRONTENDS.md",
    "DIAGNOSTICO_COMPLETO.md",
    "DISENO_UNIFICADO_PROGRESO.md",
    "E2E_TESTING_GUIDE.md",
    "ECOSISTEMA_100_COMPLETO.md",
    "ECOSISTEMA_COMPLETO.md",
    "ECOSISTEMA_LANZADO.md",
    "ENV_CONFIG_TEMPLATE.md",
    "ESTADO_FINAL_ECOSISTEMA.md",
    "ESTRATEGIA_TOKENS_HIBRIDA.md",
    "ESTRATEGIA_TOKENS_SIGILOSA.md",
    "FASE_1_COMPLETADA.md",
    "FIX_VERCEL_DOMAIN.md",
    "GUIA_DESPLIEGUE_COMPLETO.md",
    "GUIA_MANUAL_DESPLIEGUE.md",
    "HERRAMIENTAS_INTEGRADAS.md",
    "INDICE_MAESTRO_V2.3.md",
    "INFORME_AVANCE.md",
    "INICIO_RAPIDO.md",
    "INSTRUCCIONES_POST_LANZAMIENTO.md",
    "INSTRUCCIONES_PUSH_Y_DEPLOY.md",
    "LANZAMIENTO.md",
    "LANZAMIENTO_OFICIAL.md",
    "LIMPIAR_DNS_IONOS.md",
    "LISTO_PARA_DEPLOY.md",
    "MIGRACION_COMPLETA.md",
    "MISION_COMPLETADA.md",
    "PLAN_CONSOLIDACION_DEFINITIVO.md",
    "PLAN_CONSOLIDACION_OPTIMIZADO.md",
    "PLAN_CORE_4_APPS.md",
    "PLAN_DEPLOY_DOMINIOS.md",
    "PLAN_INTEGRACION_HERRAMIENTAS.md",
    "PLAN_LANZAMIENTO_COMPLETO.md",
    "PLAN_UNIFICACION_PLATAFORMA.md",
    "POST_DEPLOY_SETUP.md",
    "PROGRESO_CONSOLIDACION.md",
    "PROGRESO_INTEGRACION.md",
    "RAILWAY_CLI_GUIDE.md",
    "RAILWAY_DEPLOY_GUIDE.md",
    "README_CONSOLIDACION.md",
    "README_v2.3.md",
    "REPORTE_85_COMPLETO.md",
    "REPORTE_EJECUTIVO_BETA.md",
    "REPORTE_EJECUTIVO_INTEGRACION.md",
    "REPORTE_FINAL_BACKEND.md",
    "RESTAURACION_COMPLETADA.md",
    "RESULTADO_DEPLOY.md",
    "RESUMEN_CONSOLIDACION_OPTIMIZADA.md",
    "RESUMEN_EJECUTIVO.md",
    "RESUMEN_EJECUTIVO_CONSOLIDACION.md",
    "RESUMEN_EJECUTIVO_ES.md",
    "RESUMEN_FINAL.md",
    "RESUMEN_FINAL_CONSOLIDACION.md",
    "RESUMEN_IMPLEMENTACION.md",
    "RESUMEN_LANZAMIENTO.md",
    "SESION_COMPLETA.md",
    "SETUP_RAPIDO.md",
    "SIGUIENTE_PASO_DEPLOY.md",
    "SIGUIENTE_PASO_RAILWAY.md",
    "SISTEMA_DISENO_UNIFICADO.md",
    "SOLUCIONAR_VERCEL.md",
    "STATUS_CRITICO_COMPLETADO.md",
    "TOS_OPTIMIZACION_LEGAL.md",
    "UNIFICACION_COMPLETADA.md",
    "URLS_FINALES_CONFIRMADAS.md",
    "VERIFICACION_CUENTAS.md",
    "VERIFICACION_GENERATOR.md",
    "VERIFICAR_VERCEL_DOMINIOS.md",
    "ÍNDICE_MAESTRO.md",
    
    # Archivos temporales
    ".cleanup-list.txt",
    ".production-package-shared-types.json",
    ".production-package-shared-utils.json",
    ".railway-secrets-template.txt",
    ".vercel-version",
    "COOKIES_RAILWAY.txt",
    "COOKIE_EXTRACTOR.html",
    "EXTRACT_SUNO_COOKIES.js",
    "tatus",
    "landing-page-demo.html",
    
    # Scripts no usados
    "Despliegue_final.ps1",
    "build-nova-isolated.sh",
    "check-tokens.js",
    "configurar-dominios.ps1",
    "install-extension.sh",
    "install-test-deps.sh",
    "prepare-generator-deploy.sh",
    "railway-setup.sh",
    "setup-auto.ps1",
    "setup-dev.ps1",
    "start-dev.ps1",
    "validar-adaptacion-legacy.ps1",
    "add-valid-token.ts",
    
    # Configuraciones redundantes
    "Dockerfile.backend",
    "railway.json",
    "vercel-the-generator.json",
    "nixpacks.toml",
    "CLEANUP_LIST.md"
)

$deletedCount = 0
$notFoundCount = 0

foreach ($file in $filesToDelete) {
    $fullPath = Join-Path -Path $PSScriptRoot -ChildPath $file
    
    if (Test-Path $fullPath) {
        Remove-Item $fullPath -Force
        Write-Host "  ✓ Eliminado: $file" -ForegroundColor Green
        $deletedCount++
    }
    else {
        $notFoundCount++
    }
}

Write-Host "`n📊 Resultado de la limpieza:" -ForegroundColor Cyan
Write-Host "  Archivos eliminados: $deletedCount" -ForegroundColor Green
Write-Host "  Archivos no encontrados: $notFoundCount" -ForegroundColor Yellow

Write-Host "`n✅ Limpieza completada!" -ForegroundColor Green
Write-Host "   Archivos preservados:" -ForegroundColor Cyan
Write-Host "   - README.md"
Write-Host "   - DEPLOYMENT_GUIDE.md"
Write-Host "   - DEPLOYMENT_MANUAL.md"
Write-Host "   - REPORTE_100_FINAL.md"
Write-Host "   - ROADMAP_MAESTRA.md"
Write-Host "   - GUIA_INTEGRACION.md"
Write-Host "   - RAILWAY_CHECKLIST.md"
Write-Host "   - ESTADO_ACTUAL.md"
