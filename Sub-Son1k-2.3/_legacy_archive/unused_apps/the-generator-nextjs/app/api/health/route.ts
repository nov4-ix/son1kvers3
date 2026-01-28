/**
 * 💚 API: Health Check
 * 
 * Verifica que el backend esté funcionando correctamente
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Verificar conexión a Supabase
    let supabaseStatus = 'unknown'
    let supabaseLatency = 0

    try {
      const supabase = createClient(
        process.env.SUPABASE_URL || 'https://swbnenfucupmtpihmmht.supabase.co',
        process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3Ym5lbmZ1Y3VwbXRwaWhtbWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjAyNzgsImV4cCI6MjA3NTIzNjI3OH0.7TFVQkfSJAyTWsPcOTcbqBTDw2grBYxHMw9UVtpt6-I'
      )

      const supabaseStart = Date.now()
      const { error } = await supabase
        .from('suno_auth_tokens')
        .select('count', { count: 'exact', head: true })
        .limit(1)

      supabaseLatency = Date.now() - supabaseStart

      if (error) {
        supabaseStatus = 'error'
        console.error('Supabase health check error:', error)
      } else {
        supabaseStatus = 'healthy'
      }
    } catch (supabaseError) {
      supabaseStatus = 'error'
      console.error('Supabase connection error:', supabaseError)
    }

    // 2. Verificar variables de entorno
    const envStatus = {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
      GROQ_API_KEY: !!process.env.GROQ_API_KEY,
      SUNO_COOKIE: !!process.env.SUNO_COOKIE,
      SUNO_TOKENS: !!process.env.SUNO_TOKENS
    }

    const allEnvVarsPresent = Object.values(envStatus).every(v => v === true)

    // 3. Estado general
    const isHealthy = supabaseStatus === 'healthy' && allEnvVarsPresent
    const totalLatency = Date.now() - startTime

    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      latency: {
        total: totalLatency,
        supabase: supabaseLatency
      },
      services: {
        supabase: {
          status: supabaseStatus,
          latency: supabaseLatency
        },
        environment: {
          status: allEnvVarsPresent ? 'healthy' : 'missing_vars',
          variables: envStatus
        }
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'production'
    }, {
      status: isHealthy ? 200 : 503
    })

  } catch (error: any) {
    console.error('❌ Health check error:', error)

    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      latency: {
        total: Date.now() - startTime
      }
    }, {
      status: 500
    })
  }
}

