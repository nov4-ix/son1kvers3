import { NextResponse } from 'next/server'
import { getUnifiedTokenPool } from '@/lib/unified-token-pool'

/**
 * GET /api/pool/status
 * Obtener estado del pool de tokens
 */
export async function GET() {
  try {
    const pool = getUnifiedTokenPool()
    const status = await pool.getPoolStatus()
    
    return NextResponse.json({
      success: true,
      ...status,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error obteniendo status del pool:', error)
    return NextResponse.json(
      { 
        error: 'Error obteniendo status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

