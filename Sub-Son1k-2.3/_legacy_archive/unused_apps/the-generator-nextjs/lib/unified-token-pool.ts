/**
 * 🔄 UNIFIED TOKEN POOL - Sistema Híbrido
 * 
 * Combina:
 * - Pool de tokens en Supabase (almacenamiento persistente)
 * - Rotación automática estilo extensión Chrome
 * - Auto-mantenimiento y limpieza
 * - Recolección continua de tokens
 */

import { createClient } from '@supabase/supabase-js'

interface TokenMetadata {
  id: string
  token: string
  issuer: string
  expires_at: string
  is_active: boolean
  usage_count: number
  last_used: string | null
  health_status: 'healthy' | 'degraded' | 'expired'
  source: 'manual' | 'api' | 'pool' | 'extension'
  created_at: string
}

interface PoolStatus {
  total: number
  active: number
  expired: number
  healthy: number
  degraded: number
  nextExpiration: string | null
  needsRefresh: boolean
}

export class UnifiedTokenPool {
  private supabase
  private tokens: TokenMetadata[] = []
  private currentIndex: number = 0
  private lastSync: number = 0
  private syncInterval: number = 5 * 60 * 1000 // Sincronizar cada 5 min
  private checkInterval: number = 30 * 60 * 1000 // Verificar cada 30 min
  private cleanupInterval: number = 60 * 60 * 1000 // Limpiar cada 1 hora
  private isInitialized: boolean = false

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://swbnenfucupmtpihmmht.supabase.co',
      process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3Ym5lbmZ1Y3VwbXRwaWhtbWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NjAyNzgsImV4cCI6MjA3NTIzNjI3OH0.7TFVQkfSJAyTWsPcOTcbqBTDw2grBYxHMw9UVtpt6-I'
    )

    // Iniciar procesos automáticos
    this.initialize()
  }

  /**
   * Inicializar el pool
   */
  private async initialize() {
    if (this.isInitialized) return

    console.log('🔄 Inicializando Unified Token Pool...')

    // Cargar tokens iniciales
    await this.syncTokensFromDB()

    // Iniciar procesos automáticos
    this.startAutoSync()
    this.startAutoVerification()
    this.startAutoCleanup()

    this.isInitialized = true
    console.log('✅ Unified Token Pool inicializado')
  }

  /**
   * ==========================================
   * CORE: Obtener Token (Rotación Round-Robin)
   * ==========================================
   */
  async getToken(): Promise<string> {
    // Sincronizar si hace más de 5 min
    if (Date.now() - this.lastSync > this.syncInterval) {
      await this.syncTokensFromDB()
    }

    // Filtrar solo tokens saludables, no expirados y NO BLOQUEADOS
    const healthyTokens = this.tokens.filter(t =>
      t.is_active &&
      t.health_status === 'healthy' &&
      new Date(t.expires_at) > new Date() &&
      !this.isTokenLocked(t.id)
    )

    if (healthyTokens.length === 0) {
      // Si todos están bloqueados pero hay saludables, esperar un poco (simple retry logic podría ir aquí)
      throw new Error('No available tokens (all busy or depleted). Please try again in a moment.')
    }

    // Rotación round-robin
    const token = healthyTokens[this.currentIndex % healthyTokens.length]
    this.currentIndex = (this.currentIndex + 1) % healthyTokens.length

    // BLOQUEAR TOKEN
    this.lockToken(token.id)

    // Actualizar uso (async, no bloquear retorno)
    this.incrementUsage(token.id).catch(e => console.error('Error incrementing usage:', e))

    console.log(`🎯 Token seleccionado: ${token.issuer.substring(0, 10)}... (uso: ${token.usage_count + 1})`)

    return token.token
  }

  // --- LOCKING MECHANISM ---
  private lockedTokens: Map<string, number> = new Map()
  private lockDuration: number = 30000 // 30 segundos de bloqueo

  private isTokenLocked(tokenId: string): boolean {
    const lockTime = this.lockedTokens.get(tokenId)
    if (!lockTime) return false

    // Verificar si el bloqueo expiró
    if (Date.now() > lockTime) {
      this.lockedTokens.delete(tokenId)
      return false
    }
    return true
  }

  private lockToken(tokenId: string): void {
    this.lockedTokens.set(tokenId, Date.now() + this.lockDuration)
  }

  private unlockToken(tokenId: string): void {
    this.lockedTokens.delete(tokenId)
  }

  /**
   * Marcar token como inválido y rotar al siguiente
   */
  async markInvalidAndRotate(invalidToken: string): Promise<string> {
    console.log('❌ Token inválido detectado, marcando y rotando...')

    // Marcar como inactivo en DB
    await this.supabase
      .from('neural_engine_tokens')
      .update({
        is_active: false,
        health_status: 'expired'
      })
      .eq('token', invalidToken)

    // Actualizar cache local
    this.tokens = this.tokens.map(t =>
      t.token === invalidToken
        ? { ...t, is_active: false, health_status: 'expired' as const }
        : t
    )

    // Re-sincronizar desde DB
    await this.syncTokensFromDB()

    // Obtener siguiente token válido
    return this.getToken()
  }

  /**
   * ==========================================
   * POOL MANAGEMENT: Agregar/Remover Tokens
   * ==========================================
   */

  /**
   * Agregar nuevo token al pool
   */
  async addToken(token: string, source: 'manual' | 'api' | 'pool' | 'extension' = 'manual'): Promise<void> {
    console.log(`➕ Agregando nuevo token al pool (source: ${source})...`)

    // Decodificar JWT para extraer metadata
    const metadata = this.decodeJWT(token)

    if (!metadata) {
      throw new Error('Invalid JWT token format')
    }

    // Insertar en DB
    const { error } = await this.supabase
      .from('neural_engine_tokens')
      .insert({
        token,
        issuer: metadata.issuer,
        expires_at: metadata.expiresAt,
        is_active: true,
        usage_count: 0,
        health_status: 'healthy',
        source
      })

    if (error) {
      console.error('Error agregando token:', error)
      throw error
    }

    // Re-sincronizar
    await this.syncTokensFromDB()

    console.log('✅ Token agregado exitosamente')
  }

  /**
   * Agregar múltiples tokens (batch)
   */
  async addTokensBatch(tokens: string[], source: 'manual' | 'api' | 'pool' | 'extension' = 'pool'): Promise<void> {
    console.log(`➕ Agregando ${tokens.length} tokens al pool...`)

    const tokensData = tokens
      .map(token => {
        const metadata = this.decodeJWT(token)
        if (!metadata) return null

        return {
          token,
          issuer: metadata.issuer,
          expires_at: metadata.expiresAt,
          is_active: true,
          usage_count: 0,
          health_status: 'healthy' as const,
          source
        }
      })
      .filter(Boolean)

    if (tokensData.length === 0) {
      throw new Error('No valid tokens to add')
    }

    const { error } = await this.supabase
      .from('neural_engine_tokens')
      .insert(tokensData)

    if (error && !error.message.includes('duplicate')) {
      throw error
    }

    await this.syncTokensFromDB()

    console.log(`✅ ${tokensData.length} tokens agregados exitosamente`)
  }

  /**
   * ==========================================
   * AUTO-SYNC: Sincronizar con Supabase
   * ==========================================
   */
  private async syncTokensFromDB(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('neural_engine_tokens')
        .select('*')
        .order('expires_at', { ascending: false })

      if (error) {
        console.error('Error sincronizando tokens:', error)
        return
      }

      this.tokens = (data || []) as TokenMetadata[]
      this.lastSync = Date.now()

      console.log(`🔄 Sincronizado: ${this.tokens.length} tokens en el pool`)
    } catch (error) {
      console.error('Error en syncTokensFromDB:', error)
    }
  }

  private startAutoSync(): void {
    setInterval(() => {
      this.syncTokensFromDB()
    }, this.syncInterval)

    console.log(`🔄 Auto-sync activado (cada ${this.syncInterval / 1000 / 60} min)`)
  }

  /**
   * ==========================================
   * AUTO-VERIFICATION: Verificar Tokens
   * ==========================================
   */
  private startAutoVerification(): void {
    setInterval(async () => {
      console.log('🔍 Verificación automática de tokens...')
      await this.verifyAllTokens()
    }, this.checkInterval)

    console.log(`🔍 Auto-verification activado (cada ${this.checkInterval / 1000 / 60} min)`)
  }

  private async verifyAllTokens(): Promise<void> {
    const activeTokens = this.tokens.filter(t => t.is_active)

    console.log(`🔍 Verificando ${activeTokens.length} tokens activos...`)

    for (const tokenMeta of activeTokens) {
      const isValid = await this.verifyToken(tokenMeta.token)

      if (!isValid) {
        console.log(`❌ Token inválido: ${tokenMeta.issuer.substring(0, 10)}...`)
        await this.markInvalidAndRotate(tokenMeta.token)
      } else {
        console.log(`✅ Token válido: ${tokenMeta.issuer.substring(0, 10)}...`)
      }
    }
  }

  private async verifyToken(token: string): Promise<boolean> {
    try {
      const response = await fetch('https://ai.imgkits.com/suno/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${token}`,
          'channel': 'node-api',
          'origin': 'https://www.livepolls.app',
          'referer': 'https://www.livepolls.app/'
        },
        body: JSON.stringify({
          title: 'test',
          style: 'test',
          lyrics: 'test',
          prompt: 'test',
          customMode: false,
          instrumental: true,
          duration: 10
        })
      })

      // Token válido si no es 401 (puede ser 400 por payload de prueba)
      return response.status !== 401
    } catch (error) {
      console.error('Error verificando token:', error)
      return false
    }
  }

  /**
   * ==========================================
   * AUTO-CLEANUP: Limpiar Tokens Expirados
   * ==========================================
   */
  private startAutoCleanup(): void {
    setInterval(async () => {
      console.log('🧹 Limpieza automática de tokens expirados...')
      await this.cleanupExpiredTokens()
    }, this.cleanupInterval)

    console.log(`🧹 Auto-cleanup activado (cada ${this.cleanupInterval / 1000 / 60} min)`)
  }

  private async cleanupExpiredTokens(): Promise<void> {
    try {
      // Marcar tokens expirados como inactivos
      const { error } = await this.supabase
        .from('neural_engine_tokens')
        .update({
          is_active: false,
          health_status: 'expired'
        })
        .lt('expires_at', new Date().toISOString())

      if (error) {
        console.error('Error en cleanup:', error)
        return
      }

      // Re-sincronizar
      await this.syncTokensFromDB()

      const expiredCount = this.tokens.filter(t => !t.is_active).length
      console.log(`🧹 Limpieza completada: ${expiredCount} tokens expirados marcados`)
    } catch (error) {
      console.error('Error en cleanupExpiredTokens:', error)
    }
  }

  /**
   * ==========================================
   * STATUS: Estado del Pool
   * ==========================================
   */
  async getPoolStatus(): Promise<PoolStatus> {
    await this.syncTokensFromDB()

    const now = new Date()
    const active = this.tokens.filter(t => t.is_active && new Date(t.expires_at) > now)
    const expired = this.tokens.filter(t => new Date(t.expires_at) <= now)
    const healthy = active.filter(t => t.health_status === 'healthy')
    const degraded = active.filter(t => t.health_status === 'degraded')

    // Próxima expiración
    const nextExpiration = active.length > 0
      ? active.reduce((earliest, t) =>
        new Date(t.expires_at) < new Date(earliest.expires_at) ? t : earliest
      ).expires_at
      : null

    // ¿Necesita refresh?
    const needsRefresh = active.length < 2 ||
      (nextExpiration && new Date(nextExpiration).getTime() - now.getTime() < 2 * 60 * 60 * 1000)

    return {
      total: this.tokens.length,
      active: active.length,
      expired: expired.length,
      healthy: healthy.length,
      degraded: degraded.length,
      nextExpiration,
      needsRefresh
    }
  }

  /**
   * ==========================================
   * UTILITIES
   * ==========================================
   */
  private decodeJWT(token: string): { issuer: string; expiresAt: string } | null {
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
          : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Default 24h
      }
    } catch (error) {
      console.error('Error decodificando JWT:', error)
      return null
    }
  }

  private async incrementUsage(tokenId: string): Promise<void> {
    await this.supabase
      .from('neural_engine_tokens')
      .update({
        usage_count: this.supabase.raw('usage_count + 1'),
        last_used: new Date().toISOString()
      })
      .eq('id', tokenId)
  }
}

/**
 * Singleton global
 */
let poolInstance: UnifiedTokenPool | null = null

export function getUnifiedTokenPool(): UnifiedTokenPool {
  if (!poolInstance) {
    poolInstance = new UnifiedTokenPool()
  }
  return poolInstance
}

