import { NextRequest, NextResponse } from 'next/server'
import { getUnifiedTokenPool } from '@/lib/unified-token-pool'

/**
 * POST /api/pool/add
 * Agregar token(s) al pool
 * 
 * Body: {
 *   token?: string,          // Token único
 *   tokens?: string[],       // Múltiples tokens
 *   adminPassword: string    // Password de admin
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, tokens, adminPassword } = body
    
    // Validar password de admin
    if (adminPassword !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const pool = getUnifiedTokenPool()
    
    // Agregar token(s)
    if (tokens && Array.isArray(tokens)) {
      // Batch de tokens
      await pool.addTokensBatch(tokens, 'api')
      
      return NextResponse.json({
        success: true,
        message: `${tokens.length} tokens agregados exitosamente`,
        count: tokens.length
      })
    } else if (token) {
      // Token único
      await pool.addToken(token, 'api')
      
      return NextResponse.json({
        success: true,
        message: 'Token agregado exitosamente'
      })
    } else {
      return NextResponse.json(
        { error: 'Token o tokens requeridos' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error agregando token:', error)
    return NextResponse.json(
      { 
        error: 'Error agregando token',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

