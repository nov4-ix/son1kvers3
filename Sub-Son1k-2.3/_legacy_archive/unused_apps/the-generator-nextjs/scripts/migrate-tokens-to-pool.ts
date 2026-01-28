#!/usr/bin/env tsx
/**
 * 🔄 Script de Migración: Tokens de .env.local → Unified Pool
 * 
 * Migra los 4 tokens existentes en .env.local al sistema de Unified Token Pool
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'

// Función para decodificar JWT
function decodeJWT(token: string): { issuer: string; expiresAt: string } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    )

    return {
      issuer: payload.iss || 'unknown',
      expiresAt: payload.exp 
        ? new Date(payload.exp * 1000).toISOString()
        : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }
  } catch (error) {
    console.error('Error decodificando JWT:', error)
    return null
  }
}

async function migrate() {
  console.log('🔄 Migrando tokens al Unified Pool...')
  console.log('')

  // 0. Cargar variables de entorno
  config({ path: path.join(process.cwd(), '../../.env.local') })

  // 1. Leer tokens de .env.local
  const envPath = path.join(process.cwd(), '../../.env.local')
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ No se encontró .env.local en:', envPath)
    process.exit(1)
  }

  const envContent = fs.readFileSync(envPath, 'utf-8')
  const sunoTokensMatch = envContent.match(/SUNO_TOKENS="([^"]+)"/)

  if (!sunoTokensMatch) {
    console.error('❌ No se encontró SUNO_TOKENS en .env.local')
    process.exit(1)
  }

  const tokensString = sunoTokensMatch[1]
  const tokens = tokensString.split(',').map(t => t.trim()).filter(Boolean)

  console.log(`✅ Encontrados ${tokens.length} tokens en .env.local`)
  console.log('')

  // 2. Validar tokens
  console.log('🔍 Validando tokens...')
  const validTokens = tokens
    .map(token => {
      const metadata = decodeJWT(token)
      if (!metadata) {
        console.log(`  ❌ Token inválido (no es JWT): ${token.substring(0, 20)}...`)
        return null
      }

      const expiresAt = new Date(metadata.expiresAt)
      const now = new Date()
      const isExpired = expiresAt < now

      console.log(`  ${isExpired ? '❌' : '✅'} Token ${metadata.issuer.substring(0, 10)}... | Expira: ${expiresAt.toLocaleString()} ${isExpired ? '(EXPIRADO)' : ''}`)

      return {
        token,
        issuer: metadata.issuer,
        expires_at: metadata.expiresAt,
        is_active: !isExpired,
        usage_count: 0,
        health_status: isExpired ? 'expired' : 'healthy',
        source: 'migration'
      }
    })
    .filter(Boolean)

  if (validTokens.length === 0) {
    console.error('❌ No hay tokens válidos para migrar')
    process.exit(1)
  }

  console.log('')
  console.log(`✅ ${validTokens.length} tokens válidos listos para migrar`)
  console.log('')

  // 3. Conectar a Supabase
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://swbnenfucupmtpihmmht.supabase.co'
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3Ym5lbmZ1Y3VwbXRwaWhtbWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjAyNzgsImV4cCI6MjA3NTIzNjI3OH0.7TFVQkfSJAyTWsPcOTcbqBTDw2grBYxHMw9UVtpt6-I'

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables de entorno de Supabase no configuradas')
    console.error('   SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
    console.error('   SUPABASE_ANON_KEY:', supabaseKey ? '✓' : '✗')
    console.log('')
    console.log('💡 Asegúrate de tener estas variables en .env.local:')
    console.log('   SUPABASE_URL=https://xxx.supabase.co')
    console.log('   SUPABASE_ANON_KEY=eyJxxx...')
    process.exit(1)
  }

  console.log('🔗 Conectando a Supabase...')
  const supabase = createClient(supabaseUrl, supabaseKey)

  // 4. Insertar tokens en Supabase
  console.log('📤 Insertando tokens en Supabase...')
  
  const { data, error } = await supabase
    .from('suno_auth_tokens')
    .insert(validTokens)
    .select()

  if (error) {
    if (error.message.includes('duplicate')) {
      console.log('⚠️  Algunos tokens ya existen en la base de datos')
      
      // Intentar actualizar en lugar de insertar
      for (const tokenData of validTokens) {
        const { error: updateError } = await supabase
          .from('suno_auth_tokens')
          .upsert(tokenData, { onConflict: 'token' })
        
        if (updateError) {
          console.error(`  ❌ Error actualizando token: ${updateError.message}`)
        } else {
          console.log(`  ✅ Token actualizado: ${tokenData.issuer.substring(0, 10)}...`)
        }
      }
    } else {
      console.error('❌ Error insertando tokens:', error.message)
      process.exit(1)
    }
  } else {
    console.log(`✅ ${data?.length || 0} tokens insertados exitosamente`)
  }

  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  console.log('✅ Migración completada exitosamente!')
  console.log('')
  console.log('📊 Resumen:')
  console.log(`   Total tokens: ${tokens.length}`)
  console.log(`   Válidos: ${validTokens.length}`)
  console.log(`   Activos: ${validTokens.filter(t => t.is_active).length}`)
  console.log(`   Expirados: ${validTokens.filter(t => !t.is_active).length}`)
  console.log('')
  console.log('🎯 Próximos pasos:')
  console.log('   1. Los tokens están ahora en Supabase')
  console.log('   2. El sistema de rotación automática está activado')
  console.log('   3. Verifica el estado en: /api/pool/status')
  console.log('   4. Agrega más tokens en: /api/pool/add')
  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

// Ejecutar
migrate().catch(error => {
  console.error('❌ Error en migración:', error)
  process.exit(1)
})

