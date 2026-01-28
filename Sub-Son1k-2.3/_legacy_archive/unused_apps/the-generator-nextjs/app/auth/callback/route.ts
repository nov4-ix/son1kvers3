import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://swbnenfucupmtpihmmht.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3Ym5lbmZ1Y3VwbXRwaWhtbWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjAyNzgsImV4cCI6MjA3NTIzNjI3OH0.7TFVQkfSJAyTWsPcOTcbqBTDw2grBYxHMw9UVtpt6-I'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const error_description = searchParams.get('error_description')

    // ✅ URL local para desarrollo
    const baseUrl = request.headers.get('host')?.includes('localhost') 
      ? `http://${request.headers.get('host')}` 
      : 'https://the-generator.son1kvers3.com'

    // Verificar errores de OAuth
    if (error) {
      console.error('OAuth error:', error, error_description)
      return NextResponse.redirect(`${baseUrl}/generator?error=${encodeURIComponent(error_description || error)}`)
    }

    if (!code) {
      return NextResponse.redirect(`${baseUrl}/generator?error=no_code`)
    }

    // Intercambiar código por sesión
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      return NextResponse.redirect(`${baseUrl}/generator?error=exchange_failed`)
    }

    if (!data.session) {
      console.error('No session returned from code exchange')
      return NextResponse.redirect(`${baseUrl}/generator?error=no_session`)
    }

    // Verificar/crear cuota para el usuario
    if (data.session.user?.id) {
      try {
        // Verificar si ya existe una cuota
        const { data: existingQuota } = await supabase
          .from('user_quotas')
          .select('*')
          .eq('user_id', data.session.user.id)
          .single()

        if (!existingQuota) {
          // Crear cuota por defecto (FREE)
          const { error: quotaError } = await supabase
            .from('user_quotas')
            .insert({
              user_id: data.session.user.id,
              tier: 'free',
              monthly_limit: 10 // Default para FREE
            })

          if (quotaError) {
            console.warn('Error creando cuota por defecto:', quotaError)
            // No fallar por esto, continuar
          }
        }
      } catch (quotaCheckError) {
        console.warn('Error verificando/creando cuota:', quotaCheckError)
        // No fallar por esto, continuar
      }
    }

    console.log('✅ Auth callback exitoso para usuario:', data.session.user?.email)
    return NextResponse.redirect(`${baseUrl}/generator?success=true`)

  } catch (error) {
    console.error('Error en auth callback:', error)
    const baseUrl = request.headers.get('host')?.includes('localhost') 
      ? `http://${request.headers.get('host')}` 
      : 'https://the-generator.son1kvers3.com'
    return NextResponse.redirect(`${baseUrl}/generator?error=callback_failed`)
  }
}
