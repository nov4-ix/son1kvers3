/**
 * 🔄 TOKEN POOL MANAGER
 * 
 * Sistema inteligente de gestión de pool de tokens de Neural Engine.
 * Selecciona el mejor token disponible basándose en múltiples factores.
 */

import { createClient } from '@supabase/supabase-js'

// Tipos
export interface NeuralToken {
  id: string
  user_id: string
  token: string
  user_email: string
  user_tier: 'FREE' | 'PREMIUM' | 'ADMIN'
  uses_count: number
  max_uses: number
  is_depleted: boolean
  status: 'active' | 'invalid' | 'expired' | 'suspended'
  health_status: 'healthy' | 'warning' | 'error'
  last_used_at: string | null
  last_health_check_at: string | null
  created_at: string
  updated_at: string
  expires_at: string | null
  total_requests: number
  successful_requests: number
  failed_requests: number
  metadata: Record<string, any>
}

export interface TokenUsageLog {
  token_id: string
  generation_id: string | null
  requested_by_user_id: string | null
  requested_by_tier: string | null
  status: 'success' | 'error' | 'timeout' | 'cancelled'
  error_message: string | null
  response_time_ms: number | null
  prompt: string | null
  is_instrumental: boolean | null
}

export interface PoolMetrics {
  total_tokens: number
  active_tokens: number
  available_tokens: number
  depleted_tokens: number
  premium_tokens: number
  free_tokens: number
  healthy_tokens: number
}

// Configuración
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://swbnenfucupmtpihmmht.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3Ym5lbmZ1Y3VwbXRwaWhtbWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjAyNzgsImV4cCI6MjA3NTIzNjI3OH0.7TFVQkfSJAyTWsPcOTcbqBTDw2grBYxHMw9UVtpt6-I'

class TokenPoolManager {
  private supabase: ReturnType<typeof createClient>
  private cache: Map<string, NeuralToken>
  private cacheExpiry: number = 60000 // 1 minuto

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    this.cache = new Map()
  }

  /**
   * Selecciona el mejor token disponible del pool
   */
  async selectBestToken(requestingUserId?: string): Promise<NeuralToken> {
    console.log('🔍 Seleccionando mejor token del pool...')

    // 1. Intentar usar token del propio usuario si es PREMIUM
    if (requestingUserId) {
      const ownToken = await this.getOwnToken(requestingUserId)
      if (ownToken && ownToken.user_tier === 'PREMIUM' && this.isTokenUsable(ownToken)) {
        console.log('✅ Usando token propio del usuario PREMIUM')
        return ownToken
      }
    }

    // 2. Obtener tokens disponibles del pool ordenados por prioridad
    const { data: tokens, error } = await this.supabase
      .from('neural_engine_tokens')
      .select('*')
      .eq('status', 'active')
      .eq('health_status', 'healthy')
      .eq('is_depleted', false)
      .order('last_used_at', { ascending: true, nullsFirst: true })
      .limit(10)

    if (error) {
      console.error('❌ Error obteniendo tokens:', error)
      throw new Error('Error obteniendo tokens del pool')
    }

    if (!tokens || tokens.length === 0) {
      console.error('❌ No hay tokens disponibles en el pool')
      throw new Error('No hay tokens disponibles en el pool')
    }

    // 3. Calcular scores y seleccionar el mejor
    const tokensWithScore = tokens.map(token => ({
      token: token as NeuralToken,
      score: this.calculateTokenScore(token as NeuralToken)
    }))

    tokensWithScore.sort((a, b) => b.score - a.score)

    const bestToken = tokensWithScore[0].token
    console.log(`✅ Token seleccionado: ${bestToken.id} (score: ${tokensWithScore[0].score.toFixed(2)})`)
    console.log(`   Tier: ${bestToken.user_tier}, Usos: ${bestToken.uses_count}/${bestToken.max_uses}`)

    return bestToken
  }

  /**
   * Obtiene el token del propio usuario
   */
  private async getOwnToken(userId: string): Promise<NeuralToken | null> {
    const { data, error } = await this.supabase
      .from('neural_engine_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (error || !data) return null
    return data as NeuralToken
  }

  /**
   * Verifica si un token es usable
   */
  private isTokenUsable(token: NeuralToken): boolean {
    return (
      token.status === 'active' &&
      token.health_status === 'healthy' &&
      !token.is_depleted &&
      (token.expires_at === null || new Date(token.expires_at) > new Date())
    )
  }

  /**
   * Calcula score de prioridad para un token
   * Mayor score = mayor prioridad
   */
  private calculateTokenScore(token: NeuralToken): number {
    let score = 100

    // Factor 1: Tier (peso alto)
    if (token.user_tier === 'ADMIN') score += 150
    else if (token.user_tier === 'PREMIUM') score += 100
    else score += 50

    // Factor 2: Porcentaje de uso (penalizar tokens muy usados)
    const usagePercentage = token.uses_count / token.max_uses
    score -= usagePercentage * 30

    // Factor 3: Tiempo sin uso (bonus por descanso)
    if (token.last_used_at) {
      const minutesSinceLastUse = (Date.now() - new Date(token.last_used_at).getTime()) / 60000
      score += Math.min(minutesSinceLastUse, 30)
    } else {
      score += 30 // Bonus máximo si nunca se usó
    }

    // Factor 4: Tasa de error (penalizar tokens con muchos errores)
    if (token.total_requests > 0) {
      const errorRate = token.failed_requests / token.total_requests
      score -= errorRate * 20
    }

    // Factor 5: Health status
    if (token.health_status === 'warning') score -= 10
    else if (token.health_status === 'error') score -= 50

    return Math.max(0, score)
  }

  /**
   * Incrementa el contador de uso de un token
   */
  async incrementTokenUsage(tokenId: string, success: boolean = true): Promise<void> {
    // Temporarily commented out due to Supabase RPC issues
    // const { error } = await this.supabase.rpc('increment_token_usage', {
    //   p_token_id: tokenId,
    //   p_success: success
    // })

    // if (error) {
    //   console.error('❌ Error incrementando uso de token:', error)
    // }
  }

  /**
   * Registra el uso de un token en los logs
   */
  async logTokenUsage(log: TokenUsageLog): Promise<void> {
    // Temporarily commented out due to Supabase issues
    // const { error } = await this.supabase
    //   .from('token_usage_logs')
    //   .insert(log)

    // if (error) {
    //   console.error('❌ Error registrando log de uso:', error)
    // }
  }

  /**
   * Obtiene métricas actuales del pool
   */
  async getPoolMetrics(): Promise<PoolMetrics> {
    // Temporarily commented out due to Supabase RPC issues
    // const { data, error } = await this.supabase.rpc('get_pool_metrics')

    // if (error || !data || data.length === 0) {
    //   console.error('❌ Error obteniendo métricas:', error)
    //   return {
    //     total_tokens: 0,
    //     active_tokens: 0,
    //     available_tokens: 0,
    //     depleted_tokens: 0,
    //     premium_tokens: 0,
    //     free_tokens: 0,
    //     healthy_tokens: 0
    //   }
    // }

    // return data[0] as PoolMetrics

    // Return mock data for now
    return {
      total_tokens: 4,
      active_tokens: 4,
      available_tokens: 4,
      depleted_tokens: 0,
      premium_tokens: 4,
      free_tokens: 0,
      healthy_tokens: 4
    }
  }

  /**
   * Agrega un nuevo token al pool
   */
  async addToken(params: {
    userId: string
    token: string
    email: string
    tier: 'FREE' | 'PREMIUM' | 'ADMIN'
  }): Promise<NeuralToken> {
    console.log('➕ Agregando nuevo token al pool...')

    // Extraer fecha de expiración del JWT (si es posible)
    let expiresAt: Date | null = null
    try {
      const payload = JSON.parse(atob(params.token.split('.')[1]))
      if (payload.exp) {
        expiresAt = new Date(payload.exp * 1000)
      }
    } catch (e) {
      console.warn('⚠️ No se pudo extraer expiración del token')
    }

    const maxUses = params.tier === 'PREMIUM' ? 999999 : params.tier === 'ADMIN' ? 999999 : 5

    const { data, error } = await this.supabase
      .from('neural_engine_tokens')
      .insert({
        user_id: params.userId,
        token: params.token,
        user_email: params.email,
        user_tier: params.tier,
        max_uses: maxUses,
        expires_at: expiresAt?.toISOString(),
        status: 'active',
        health_status: 'healthy'
      } as any)
      .select()
      .single()

    if (error) {
      console.error('❌ Error agregando token:', error)
      throw new Error('Error agregando token al pool')
    }

    if (!data) {
      throw new Error('Error: No se recibieron datos al agregar el token')
    }

    console.log('✅ Token agregado exitosamente:', (data as any).id)
    return data as NeuralToken
  }

  /**
   * Valida un token contra la API de Neural Engine
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch('https://ai.imgkits.com/suno/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'channel': 'node-api'
        },
        body: JSON.stringify({
          prompt: 'test',
          style: '',
          title: '',
          customMode: false,
          instrumental: true,
          lyrics: '',
          gender: ''
        })
      })

      // Si devuelve 401/403 = token inválido
      if (response.status === 401 || response.status === 403) {
        return false
      }

      // Cualquier otra respuesta (incluso 400) = token válido pero mal request
      return true
    } catch (error) {
      console.error('❌ Error validando token:', error)
      return false
    }
  }

  /**
   * Actualiza el health status de un token
   */
  async updateTokenHealth(tokenId: string, status: 'healthy' | 'warning' | 'error'): Promise<void> {
    // Temporarily commented out due to Supabase issues
    // const { error } = await this.supabase
    //   .from('suno_tokens')
    //   .update({
    //     health_status: status,
    //     last_health_check_at: new Date().toISOString()
    //   })
    //   .eq('id', tokenId)

    // if (error) {
    //   console.error('❌ Error actualizando health de token:', error)
    // }
  }

  /**
   * Marca un token como inválido
   */
  async invalidateToken(tokenId: string): Promise<void> {
    // Temporarily commented out due to Supabase issues
    // const { error } = await this.supabase
    //   .from('suno_tokens')
    //   .update({
    //     status: 'invalid',
    //     health_status: 'error'
    //   })
    //   .eq('id', tokenId)

    // if (error) {
    //   console.error('❌ Error invalidando token:', error)
    // }
  }
}

// Singleton instance
let tokenPoolManager: TokenPoolManager | null = null

// Agregar métodos compatibles con el API
export class CompatibleTokenPoolManager extends TokenPoolManager {
  async isServiceEnabled(): Promise<boolean> {
    const metrics = await this.getPoolMetrics()
    return metrics.active_tokens > 0
  }

  async getAvailableToken(): Promise<string> {
    const token = await this.selectBestToken()
    if (!token) {
      throw new Error('No tokens available')
    }
    return token.token
  }

  async markTokenInactive(token: string): Promise<void> {
    // Buscar token por valor de token
    // Temporarily commented out due to Supabase issues
    // const { error } = await this.supabase
    //   .from('suno_tokens')
    //   .update({
    //     status: 'invalid',
    //     health_status: 'error',
    //     last_used_at: new Date().toISOString()
    //   })
    //   .eq('token', token)

    // if (error) {
    //   console.error('❌ Error marcando token como inactivo:', error)
    // }
  }

  async markTokenUsed(token: string): Promise<void> {
    // Por ahora hacer un simple log, ya que el método exige tokenId y no valor del token
    console.log('✅ Token usado:', token.substring(0, 20) + '...')
    // TODO: Implementar búsqueda por valor de token para obtener tokenId
  }

  getInstance(): TokenPoolManager {
    return this
  }
}

// Función singleton para mantener compatibilidad
let compatiblePoolManager: CompatibleTokenPoolManager | null = null

export function getTokenPoolManager(): CompatibleTokenPoolManager {
  if (!compatiblePoolManager) {
    compatiblePoolManager = new CompatibleTokenPoolManager()
  }
  return compatiblePoolManager
}

export default TokenPoolManager
