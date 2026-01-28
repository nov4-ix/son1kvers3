/**
 * 🎯 API: Obtener Token del Pool
 * 
 * La extensión llama a este endpoint para obtener un token
 * del pool comunitario y usarlo para generar música.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUnifiedTokenPool } from '@/lib/unified-token-pool'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://swbnenfucupmtpihmmht.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3Ym5lbmZ1Y3VwbXRwaWhtbWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjAyNzgsImV4cCI6MjA3NTIzNjI3OH0.7TFVQkfSJAyTWsPcOTcbqBTDw2grBYxHMw9UVtpt6-I'
)

export async function POST(req: NextRequest) {
  try {
    console.log('🔍 Request para obtener token del pool...')

    // 1. Obtener userId del request
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'userId requerido' },
        { status: 400 }
      )
    }

    console.log('👤 Usuario solicitando token:', userId)

    // 2. Verificar que el usuario exista y tenga créditos (opcional)
    // Por ahora, permitimos acceso si tiene la extensión instalada

    // 3. Obtener token del pool
    const tokenPool = getUnifiedTokenPool()
    const token = await tokenPool.getToken()

    if (!token) {
      console.error('❌ No hay tokens disponibles en el pool')
      return NextResponse.json(
        { 
          error: 'No hay tokens disponibles en el pool',
          message: 'El pool comunitario está vacío. Contribuye un token o espera a que se agreguen más.'
        },
        { status: 503 } // Service Unavailable
      )
    }

    console.log('✅ Token obtenido del pool:', token.substring(0, 20) + '...')

    // 4. (Opcional) Registrar uso en analytics
    try {
      await supabase
        .from('token_usage_analytics')
        .insert({
          user_id: userId,
          token_used: token.substring(0, 20) + '...',
          timestamp: new Date().toISOString()
        })
    } catch (analyticsError) {
      console.warn('⚠️ Error registrando analytics:', analyticsError)
      // No bloquear el request si falla analytics
    }

    // 5. Retornar token
    return NextResponse.json({
      success: true,
      token: token,
      expiresIn: '48h',
      poolSize: (await tokenPool.getPoolStatus()).total
    })

  } catch (error: any) {
    console.error('❌ Error en /api/pool/get-token:', error)
    
    return NextResponse.json(
      { 
        error: error.message || 'Error obteniendo token del pool',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// También permitir GET para testing
export async function GET(req: NextRequest) {
  try {
    const tokenPool = getUnifiedTokenPool()
    const status = await tokenPool.getPoolStatus()

    return NextResponse.json({
      available: status.active > 0,
      totalTokens: status.total,
      activeTokens: status.active,
      message: status.active > 0 
        ? 'Tokens disponibles' 
        : 'No hay tokens disponibles'
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

