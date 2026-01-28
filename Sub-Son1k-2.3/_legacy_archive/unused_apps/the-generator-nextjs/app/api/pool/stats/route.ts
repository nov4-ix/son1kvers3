/**
 * 📊 API: Estadísticas del Pool Comunitario
 * 
 * Retorna métricas en tiempo real del pool de tokens
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://swbnenfucupmtpihmmht.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3Ym5lbmZ1Y3VwbXRwaWhtbWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjAyNzgsImV4cCI6MjA3NTIzNjI3OH0.7TFVQkfSJAyTWsPcOTcbqBTDw2grBYxHMw9UVtpt6-I'
)

export async function GET(req: NextRequest) {
  try {
    console.log('📊 Solicitando estadísticas del pool...')
    
    // 1. Obtener todos los tokens del pool
    const { data: allTokens, error: allError } = await supabase
      .from('suno_auth_tokens')
      .select('*')
    
    if (allError) {
      console.error('❌ Error obteniendo tokens:', allError)
      throw allError
    }
    
    // 2. Filtrar tokens activos y saludables
    const now = new Date()
    const activeTokens = allTokens?.filter(token => 
      token.is_active && 
      token.health_status === 'healthy' &&
      new Date(token.expires_at) > now
    ) || []
    
    // 3. Obtener uso de hoy
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { data: todayGenerations, error: todayError } = await supabase
      .from('user_generations')
      .select('id')
      .gte('created_at', today.toISOString())
    
    const todayUsage = todayGenerations?.length || 0
    
    // 4. Calcular capacidad
    // Cada token puede hacer 5 generaciones por día
    const dailyCapacity = activeTokens.length * 5
    // Capacidad mensual en miles
    const monthlyCapacity = Math.floor((activeTokens.length * 5 * 30) / 1000)
    
    // 5. Estadísticas adicionales
    const tokensBySource = allTokens?.reduce((acc, token) => {
      const source = token.source || 'unknown'
      acc[source] = (acc[source] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}
    
    const stats = {
      total: allTokens?.length || 0,
      active: activeTokens.length,
      inactive: (allTokens?.length || 0) - activeTokens.length,
      healthy: activeTokens.filter(t => t.health_status === 'healthy').length,
      todayUsage,
      dailyCapacity,
      capacity: monthlyCapacity, // En miles (k)
      utilizationRate: dailyCapacity > 0 ? (todayUsage / dailyCapacity * 100).toFixed(1) : 0,
      tokensBySource,
      timestamp: new Date().toISOString()
    }
    
    console.log('✅ Estadísticas del pool:', stats)
    
    return NextResponse.json(stats)
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error)
    return NextResponse.json(
      { 
        error: 'Error obteniendo estadísticas del pool',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Permitir CORS para la extensión
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
