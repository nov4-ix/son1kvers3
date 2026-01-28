import { NextRequest, NextResponse } from 'next/server'
import { getTokenPoolManager } from '@/lib/token-pool-manager'

/**
 * ➕ ADD TOKEN TO POOL
 * 
 * Permite agregar un nuevo token al pool.
 */

export async function POST(req: NextRequest) {
  console.log('➕ Agregando token al pool...')
  
  try {
    const body = await req.json()
    const { userId, token, email, tier } = body
    
    // Validaciones
    if (!userId || !token || !email || !tier) {
      return NextResponse.json({ 
        success: false,
        error: 'Faltan parámetros requeridos: userId, token, email, tier' 
      }, { status: 400 })
    }
    
    if (!['FREE', 'PREMIUM', 'ADMIN'].includes(tier)) {
      return NextResponse.json({ 
        success: false,
        error: 'Tier inválido. Debe ser FREE, PREMIUM o ADMIN' 
      }, { status: 400 })
    }
    
    // Validar formato de token (JWT básico)
    if (!token.match(/^eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)) {
      return NextResponse.json({ 
        success: false,
        error: 'Formato de token inválido. Debe ser un JWT válido' 
      }, { status: 400 })
    }
    
    const tokenManager = getTokenPoolManager()
    
    // Validar token contra API de Suno
    console.log('🔐 Validando token contra API Suno...')
    const isValid = await tokenManager.validateToken(token)
    
    if (!isValid) {
      return NextResponse.json({ 
        success: false,
        error: 'Token inválido o expirado según la API de Suno' 
      }, { status: 400 })
    }
    
    console.log('✅ Token válido, agregando al pool...')
    
    // Agregar token al pool
    const addedToken = await tokenManager.addToken({
      userId,
      token,
      email,
      tier
    })
    
    return NextResponse.json({
      success: true,
      message: 'Token agregado exitosamente al pool',
      token: {
        id: addedToken.id,
        tier: addedToken.user_tier,
        max_uses: addedToken.max_uses,
        created_at: addedToken.created_at
      }
    })
    
  } catch (error: any) {
    console.error('❌ Error agregando token:', error)
    
    // Manejar error de duplicado
    if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
      return NextResponse.json({ 
        success: false,
        error: 'Este token ya existe en el pool' 
      }, { status: 409 })
    }
    
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Error agregando token al pool'
    }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'

