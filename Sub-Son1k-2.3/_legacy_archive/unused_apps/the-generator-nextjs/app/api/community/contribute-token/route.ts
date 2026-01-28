/**
 * ➕ API: Contribuir Token al Pool
 * 
 * Permite a usuarios contribuir sus tokens de Suno manualmente
 * y ganar créditos a cambio
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { decode } from 'jsonwebtoken'

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://swbnenfucupmtpihmmht.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3Ym5lbmZ1Y3VwbXRwaWhtbWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjAyNzgsImV4cCI6MjA3NTIzNjI3OH0.7TFVQkfSJAyTWsPcOTcbqBTDw2grBYxHMw9UVtpt6-I'
)

// Créditos otorgados por contribuir un token
const CREDITS_PER_TOKEN = 100

export async function POST(req: NextRequest) {
  try {
    console.log('➕ Request para contribuir token...')

    // 1. Obtener datos del request
    const { token, userId, userEmail, userTier } = await req.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Token requerido' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId requerido' },
        { status: 400 }
      )
    }

    console.log('👤 Usuario contribuyendo:', userId)

    // 2. Validar y decodificar token JWT
    let decoded: any
    let expiresAt: string
    let issuer: string

    try {
      decoded = decode(token)
      
      if (!decoded) {
        return NextResponse.json(
          { error: 'Token inválido o no es un JWT' },
          { status: 400 }
        )
      }

      // Extraer fecha de expiración
      expiresAt = decoded.exp 
        ? new Date(decoded.exp * 1000).toISOString()
        : new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // Default: 48h

      // Extraer issuer
      issuer = decoded.iss || 'unknown'

      console.log('✅ Token decodificado:', {
        issuer: issuer.substring(0, 20) + '...',
        expiresAt
      })

      // Verificar si ya expiró
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        return NextResponse.json(
          { 
            error: 'El token ya ha expirado',
            expiredAt: new Date(decoded.exp * 1000).toISOString()
          },
          { status: 400 }
        )
      }

    } catch (decodeError) {
      console.error('❌ Error decodificando token:', decodeError)
      return NextResponse.json(
        { error: 'Token inválido o corrupto' },
        { status: 400 }
      )
    }

    // 3. Verificar que el token no exista ya en el pool
    const { data: existingToken, error: checkError } = await supabase
      .from('suno_auth_tokens')
      .select('id, owner_user_id')
      .eq('token', token)
      .maybeSingle()

    if (checkError) {
      console.error('❌ Error verificando token existente:', checkError)
      // Continuar de todas formas
    }

    if (existingToken) {
      const isOwnToken = existingToken.owner_user_id === userId

      return NextResponse.json(
        { 
          error: isOwnToken 
            ? 'Ya has contribuido este token anteriormente' 
            : 'Este token ya fue contribuido por otro usuario',
          tokenId: existingToken.id
        },
        { status: 409 } // Conflict
      )
    }

    // 4. Insertar token en el pool
    const { data: insertedToken, error: insertError } = await supabase
      .from('suno_auth_tokens')
      .insert({
        token,
        issuer,
        expires_at: expiresAt,
        is_active: true,
        health_status: 'healthy',
        source: 'manual_contribution',
        owner_user_id: userId,
        is_community: true,
        last_used_at: new Date().toISOString(),
        usage_count: 0
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error insertando token en Supabase:', insertError)
      return NextResponse.json(
        { 
          error: 'Error al agregar token al pool',
          details: insertError.message
        },
        { status: 500 }
      )
    }

    console.log('✅ Token insertado en el pool:', insertedToken.id)

    // 5. Otorgar créditos al usuario (si existe la tabla)
    let creditsAwarded = 0
    try {
      const { error: creditError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          amount: CREDITS_PER_TOKEN,
          type: 'contribution',
          description: `Contribución manual de token ${issuer.substring(0, 10)}...`,
          related_token_id: insertedToken.id
        })

      if (creditError) {
        console.warn('⚠️ Error otorgando créditos (tabla puede no existir):', creditError)
        // No bloqueamos el flujo si falla
      } else {
        creditsAwarded = CREDITS_PER_TOKEN
        console.log(`✅ ${CREDITS_PER_TOKEN} créditos otorgados al usuario`)
      }
    } catch (creditException) {
      console.warn('⚠️ Sistema de créditos no disponible aún')
    }

    // 6. Retornar éxito
    return NextResponse.json({
      success: true,
      message: creditsAwarded > 0 
        ? `Token agregado al pool. Has ganado ${creditsAwarded} créditos!`
        : 'Token agregado al pool exitosamente',
      token: {
        id: insertedToken.id,
        issuer: issuer.substring(0, 20) + '...',
        expiresAt: expiresAt
      },
      credits: {
        earned: creditsAwarded,
        message: creditsAwarded > 0 
          ? `Puedes generar ${creditsAwarded} canciones con estos créditos`
          : 'Sistema de créditos próximamente disponible'
      }
    })

  } catch (error: any) {
    console.error('❌ Error en /api/community/contribute-token:', error)
    
    return NextResponse.json(
      { 
        error: error.message || 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// GET: Información sobre cómo contribuir
export async function GET(req: NextRequest) {
  return NextResponse.json({
    info: 'API para contribuir tokens de Suno al pool comunitario',
    method: 'POST',
    requiredFields: ['token', 'userId'],
    optionalFields: ['userEmail', 'userTier'],
    rewards: {
      credits: CREDITS_PER_TOKEN,
      description: `Recibes ${CREDITS_PER_TOKEN} créditos por cada token válido`
    },
    howToGetToken: [
      '1. Ve a suno.com e inicia sesión',
      '2. Abre DevTools (F12) → Pestaña Network',
      '3. Genera una canción en Suno',
      '4. Busca el request "generate" en la lista',
      '5. Haz clic en el request → Headers',
      '6. Busca "Authorization: Bearer ..."',
      '7. Copia el token (empieza con "eyJ...")',
      '8. Pégalo aquí en Son1kVers3'
    ]
  })
}

