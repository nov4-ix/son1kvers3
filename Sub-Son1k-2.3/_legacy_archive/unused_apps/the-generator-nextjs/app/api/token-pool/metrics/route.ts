import { NextResponse } from 'next/server'
import { getTokenPoolManager } from '@/lib/token-pool-manager'

/**
 * 📊 TOKEN POOL METRICS
 * 
 * Obtiene métricas actuales del pool de tokens.
 */

export async function GET() {
  console.log('📊 Consultando métricas del pool...')
  
  try {
    const tokenManager = getTokenPoolManager()
    const metrics = await tokenManager.getPoolMetrics()
    
    console.log('✅ Métricas obtenidas:', metrics)
    
    return NextResponse.json({
      success: true,
      metrics: {
        ...metrics,
        health_percentage: metrics.total_tokens > 0 
          ? Math.round((metrics.healthy_tokens / metrics.total_tokens) * 100) 
          : 0,
        availability_percentage: metrics.total_tokens > 0
          ? Math.round((metrics.available_tokens / metrics.total_tokens) * 100)
          : 0
      },
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('❌ Error obteniendo métricas:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'

