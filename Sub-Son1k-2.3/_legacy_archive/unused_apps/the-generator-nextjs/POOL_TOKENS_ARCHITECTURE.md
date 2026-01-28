# 🔄 Sistema de Pool de Tokens - Arquitectura Completa

## 🎯 Objetivo

Crear un sistema inteligente que:
1. **Reutilice tokens de usuarios FREE** (5 generaciones c/u) para usuarios PREMIUM
2. **Autogestione el pool** para nunca quedarse sin tokens disponibles
3. **Distribuya la carga** entre múltiples tokens activos
4. **Monitoree salud** y expire tokens automáticamente
5. **Escale horizontalmente** conforme crece la base de usuarios

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    USUARIO REGISTRA CUENTA                      │
│                  (FREE o PREMIUM con su token)                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      TOKEN POOL MANAGER                         │
│  • Valida token contra API Suno                                 │
│  • Almacena en DB con metadata                                  │
│  • Asigna quota según tier (FREE=5, PREMIUM=∞)                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  POOL DE TOKENS (DATABASE)                      │
│                                                                 │
│  Token 1 (user_123): 3/5 usos | healthy | última uso: 2min     │
│  Token 2 (user_456): 0/5 usos | healthy | última uso: 1h       │
│  Token 3 (user_789): 5/5 usos | depleted | inactivo            │
│  Token 4 (user_premium_1): ∞ usos | healthy | activo           │
│                                                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              GENERACIÓN DE MÚSICA (REQUEST)                     │
│                                                                 │
│  1. Usuario PREMIUM solicita generar música                     │
│  2. TokenPoolManager selecciona token disponible:               │
│     - Prioridad 1: Tokens PREMIUM (usos ilimitados)            │
│     - Prioridad 2: Tokens FREE con usos disponibles            │
│     - Estrategia: Round-robin + health check                   │
│  3. Incrementa contador de uso del token                        │
│  4. Marca token como "en uso" temporalmente                     │
│  5. Ejecuta generación con token seleccionado                   │
│                                                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AUTO-GESTIÓN (BACKGROUND)                    │
│                                                                 │
│  • Health Check cada 5 min:                                     │
│    - Valida tokens contra API Suno                              │
│    - Marca tokens expirados como "invalid"                      │
│    - Desactiva tokens con 401/403                               │
│                                                                 │
│  • Rebalanceo cada 10 min:                                      │
│    - Distribuye carga equitativamente                           │
│    - Prioriza tokens menos usados                               │
│                                                                 │
│  • Alertas automáticas:                                         │
│    - Menos de 10 tokens disponibles → Email admin               │
│    - Token pool bajo 50% → Notificación in-app                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Esquema de Base de Datos

### Tabla: `suno_tokens`

```sql
CREATE TABLE suno_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE, -- JWT de Suno
  
  -- Metadata del usuario
  user_email TEXT NOT NULL,
  user_tier TEXT NOT NULL CHECK (user_tier IN ('FREE', 'PREMIUM', 'ADMIN')),
  
  -- Control de uso
  uses_count INTEGER DEFAULT 0, -- Generaciones hechas con este token
  max_uses INTEGER NOT NULL DEFAULT 5, -- 5 para FREE, NULL/999999 para PREMIUM
  is_depleted BOOLEAN DEFAULT false, -- true cuando uses_count >= max_uses
  
  -- Estado del token
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'invalid', 'expired', 'suspended')),
  health_status TEXT DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'warning', 'error')),
  
  -- Tracking
  last_used_at TIMESTAMPTZ, -- Última vez que se usó este token
  last_health_check_at TIMESTAMPTZ, -- Último health check
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Fecha de expiración del JWT (extraída del token)
  
  -- Métricas
  total_requests INTEGER DEFAULT 0, -- Requests totales hechos
  successful_requests INTEGER DEFAULT 0, -- Requests exitosos
  failed_requests INTEGER DEFAULT 0, -- Requests fallidos
  
  -- Metadata adicional
  metadata JSONB DEFAULT '{}'::jsonb, -- Info extra (región, preferencias, etc)
  
  -- Índices
  CONSTRAINT unique_user_token UNIQUE(user_id, token)
);

-- Índices para optimizar queries
CREATE INDEX idx_suno_tokens_status ON suno_tokens(status) WHERE status = 'active';
CREATE INDEX idx_suno_tokens_depleted ON suno_tokens(is_depleted) WHERE is_depleted = false;
CREATE INDEX idx_suno_tokens_tier ON suno_tokens(user_tier);
CREATE INDEX idx_suno_tokens_health ON suno_tokens(health_status);
CREATE INDEX idx_suno_tokens_last_used ON suno_tokens(last_used_at DESC);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_suno_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER suno_tokens_updated_at
BEFORE UPDATE ON suno_tokens
FOR EACH ROW
EXECUTE FUNCTION update_suno_tokens_updated_at();
```

### Tabla: `token_usage_logs`

```sql
CREATE TABLE token_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  token_id UUID NOT NULL REFERENCES suno_tokens(id) ON DELETE CASCADE,
  generation_id UUID, -- Referencia a la generación de música
  
  -- Request info
  requested_by_user_id UUID REFERENCES auth.users(id),
  requested_by_tier TEXT, -- Tier del usuario que solicitó (puede ser diferente al dueño del token)
  
  -- Resultado
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'timeout')),
  error_message TEXT,
  response_time_ms INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_token_usage_logs_token ON token_usage_logs(token_id);
CREATE INDEX idx_token_usage_logs_user ON token_usage_logs(requested_by_user_id);
CREATE INDEX idx_token_usage_logs_created ON token_usage_logs(created_at DESC);
```

---

## 🔧 Implementación del TokenPoolManager

### Lógica de Selección de Token

```typescript
interface TokenSelectionStrategy {
  // Prioridad 1: Tokens PREMIUM del pool (ilimitados)
  selectPremiumToken(): Token | null
  
  // Prioridad 2: Tokens FREE con usos disponibles
  selectFreeToken(): Token | null
  
  // Fallback: Token del propio usuario (si tiene)
  selectOwnToken(userId: string): Token | null
}

// Algoritmo de selección
async function selectBestToken(requestingUserId: string): Promise<Token> {
  // 1. Si el usuario es PREMIUM, intentar usar su propio token primero
  if (await isPremiumUser(requestingUserId)) {
    const ownToken = await getOwnToken(requestingUserId)
    if (ownToken && isTokenHealthy(ownToken)) {
      return ownToken
    }
  }
  
  // 2. Buscar tokens PREMIUM del pool (usos ilimitados)
  const premiumTokens = await query(`
    SELECT * FROM suno_tokens
    WHERE status = 'active'
      AND health_status = 'healthy'
      AND user_tier = 'PREMIUM'
      AND is_depleted = false
    ORDER BY last_used_at ASC NULLS FIRST -- Menos usado primero
    LIMIT 1
  `)
  
  if (premiumTokens.length > 0) {
    return premiumTokens[0]
  }
  
  // 3. Buscar tokens FREE con usos disponibles
  const freeTokens = await query(`
    SELECT * FROM suno_tokens
    WHERE status = 'active'
      AND health_status = 'healthy'
      AND user_tier = 'FREE'
      AND is_depleted = false
      AND uses_count < max_uses
    ORDER BY uses_count ASC, last_used_at ASC NULLS FIRST -- Menos usado primero
    LIMIT 1
  `)
  
  if (freeTokens.length > 0) {
    return freeTokens[0]
  }
  
  // 4. Si el usuario tiene su propio token, usarlo aunque esté agotado (cobrar extra)
  if (await userHasOwnToken(requestingUserId)) {
    const ownToken = await getOwnToken(requestingUserId)
    if (ownToken && isTokenHealthy(ownToken)) {
      return ownToken
    }
  }
  
  // 5. No hay tokens disponibles
  throw new Error('No hay tokens disponibles en el pool')
}
```

---

## 🚀 Sistema de Auto-Gestión

### 1. Health Check Automático (cada 5 minutos)

```typescript
async function healthCheckAllTokens() {
  const tokens = await query(`
    SELECT * FROM suno_tokens
    WHERE status = 'active'
    ORDER BY last_health_check_at ASC NULLS FIRST
    LIMIT 100 -- Procesar en lotes
  `)
  
  for (const token of tokens) {
    try {
      // Test simple: intentar obtener status de un taskId dummy
      const response = await fetch('https://ai.imgkits.com/suno/health', {
        headers: {
          'Authorization': `Bearer ${token.token}`,
          'channel': 'node-api'
        }
      })
      
      if (response.status === 401 || response.status === 403) {
        // Token inválido/expirado
        await updateToken(token.id, {
          status: 'invalid',
          health_status: 'error'
        })
        await notifyAdmin(`Token ${token.id} marcado como inválido`)
      } else if (response.ok) {
        // Token saludable
        await updateToken(token.id, {
          health_status: 'healthy',
          last_health_check_at: new Date()
        })
      }
    } catch (error) {
      await updateToken(token.id, {
        health_status: 'warning'
      })
    }
  }
}
```

### 2. Monitoreo de Disponibilidad (cada 10 minutos)

```typescript
async function checkPoolAvailability() {
  const stats = await query(`
    SELECT 
      COUNT(*) FILTER (WHERE status = 'active' AND is_depleted = false) as available,
      COUNT(*) FILTER (WHERE status = 'active') as total_active,
      COUNT(*) FILTER (WHERE user_tier = 'PREMIUM') as premium_count,
      COUNT(*) FILTER (WHERE user_tier = 'FREE' AND is_depleted = false) as free_available
    FROM suno_tokens
  `)
  
  const { available, total_active, premium_count, free_available } = stats[0]
  
  // Alertas
  if (available < 10) {
    await sendAlert({
      level: 'critical',
      message: `Solo ${available} tokens disponibles en el pool`,
      action: 'Solicitar a usuarios que agreguen sus tokens'
    })
  } else if (available < 50) {
    await sendAlert({
      level: 'warning',
      message: `Pool bajo: ${available} tokens disponibles`
    })
  }
  
  // Métricas
  await saveMetrics({
    available_tokens: available,
    premium_tokens: premium_count,
    free_tokens_available: free_available,
    utilization_rate: ((total_active - available) / total_active) * 100
  })
}
```

### 3. Limpieza Automática (diario)

```typescript
async function cleanupExpiredTokens() {
  // Marcar tokens expirados
  await query(`
    UPDATE suno_tokens
    SET status = 'expired'
    WHERE expires_at < NOW()
      AND status = 'active'
  `)
  
  // Archivar tokens antiguos (>90 días sin uso)
  await query(`
    UPDATE suno_tokens
    SET status = 'suspended'
    WHERE last_used_at < NOW() - INTERVAL '90 days'
      AND status = 'active'
  `)
}
```

---

## 🎨 Dashboard de Administración

### Métricas en Tiempo Real

```typescript
interface PoolDashboardMetrics {
  // Tokens
  total_tokens: number
  active_tokens: number
  available_tokens: number
  depleted_tokens: number
  
  // Por tier
  premium_tokens: number
  free_tokens: number
  
  // Salud
  healthy_tokens: number
  warning_tokens: number
  error_tokens: number
  
  // Uso
  total_generations_today: number
  avg_generations_per_token: number
  most_used_token: TokenInfo
  least_used_token: TokenInfo
  
  // Proyecciones
  estimated_days_until_depletion: number
  recommended_new_tokens: number
}
```

### Componente de Dashboard

```tsx
// apps/the-generator/app/admin/token-pool/page.tsx
export default function TokenPoolDashboard() {
  const { metrics, tokens, refresh } = useTokenPoolMetrics()
  
  return (
    <div className="grid gap-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Tokens Disponibles"
          value={metrics.available_tokens}
          total={metrics.total_tokens}
          status={metrics.available_tokens > 50 ? 'healthy' : 'warning'}
        />
        <MetricCard
          title="Tokens Premium"
          value={metrics.premium_tokens}
          icon="👑"
        />
        <MetricCard
          title="Generaciones Hoy"
          value={metrics.total_generations_today}
          trend="+12%"
        />
        <MetricCard
          title="Días Restantes"
          value={metrics.estimated_days_until_depletion}
          subtitle="hasta depleción"
        />
      </div>
      
      {/* Tabla de tokens */}
      <TokensTable tokens={tokens} onRefresh={refresh} />
      
      {/* Gráficos */}
      <UsageChart data={metrics.usage_history} />
    </div>
  )
}
```

---

## 🔐 Flujo de Registro de Usuario

### 1. Usuario se registra en la plataforma

```typescript
// apps/the-generator/app/api/auth/register/route.ts
export async function POST(req: Request) {
  const { email, password, tier, suno_token } = await req.json()
  
  // 1. Crear usuario en Supabase Auth
  const { user, error } = await supabase.auth.signUp({
    email,
    password
  })
  
  if (error) throw error
  
  // 2. Si provee token de Suno, agregarlo al pool
  if (suno_token) {
    await addTokenToPool({
      userId: user.id,
      token: suno_token,
      email: email,
      tier: tier || 'FREE'
    })
  }
  
  return NextResponse.json({ success: true, user })
}
```

### 2. Validación y extracción de metadata del token

```typescript
async function addTokenToPool(params: AddTokenParams) {
  const { userId, token, email, tier } = params
  
  // 1. Validar token contra API Suno
  const isValid = await validateSunoToken(token)
  if (!isValid) {
    throw new Error('Token de Suno inválido')
  }
  
  // 2. Extraer fecha de expiración del JWT
  const decoded = decodeJWT(token)
  const expiresAt = new Date(decoded.exp * 1000)
  
  // 3. Determinar max_uses según tier
  const maxUses = tier === 'PREMIUM' ? 999999 : 5
  
  // 4. Insertar en DB
  await supabase.from('suno_tokens').insert({
    user_id: userId,
    token: token,
    user_email: email,
    user_tier: tier,
    max_uses: maxUses,
    expires_at: expiresAt,
    status: 'active',
    health_status: 'healthy'
  })
  
  // 5. Notificar al sistema
  await notifyTokenAdded(userId, tier)
}
```

---

## 📱 Interfaz para Usuario

### Página de Perfil con Gestión de Token

```tsx
// apps/the-generator/app/profile/token/page.tsx
export default function UserTokenPage() {
  const { user } = useAuth()
  const { tokenInfo, updateToken } = useUserToken()
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1>Mi Token de Suno</h1>
      
      {/* Estado actual */}
      <TokenStatusCard
        status={tokenInfo.status}
        usesRemaining={tokenInfo.max_uses - tokenInfo.uses_count}
        totalUses={tokenInfo.max_uses}
        tier={user.tier}
      />
      
      {/* Form para actualizar token */}
      <TokenUpdateForm
        currentToken={tokenInfo.token}
        onUpdate={updateToken}
      />
      
      {/* Historial de uso */}
      <TokenUsageHistory
        logs={tokenInfo.usage_logs}
      />
      
      {/* Upgrade a Premium */}
      {user.tier === 'FREE' && (
        <UpgradeToPremiumCTA />
      )}
    </div>
  )
}
```

---

## 🎯 Estrategias de Optimización

### 1. **Prioridad Inteligente**

```typescript
// Asignar pesos a tokens según múltiples factores
function calculateTokenScore(token: Token): number {
  let score = 100
  
  // Penalizar tokens muy usados
  score -= (token.uses_count / token.max_uses) * 30
  
  // Penalizar tokens usados recientemente (darles descanso)
  const minutesSinceLastUse = (Date.now() - token.last_used_at) / 60000
  score += Math.min(minutesSinceLastUse, 30)
  
  // Bonus para tokens PREMIUM
  if (token.user_tier === 'PREMIUM') {
    score += 50
  }
  
  // Penalizar tokens con alto rate de errores
  const errorRate = token.failed_requests / token.total_requests
  score -= errorRate * 20
  
  return score
}
```

### 2. **Rate Limiting por Token**

```typescript
// Evitar saturar un solo token
const TOKEN_RATE_LIMIT = {
  FREE: {
    max_requests_per_hour: 2,
    max_concurrent: 1
  },
  PREMIUM: {
    max_requests_per_hour: 10,
    max_concurrent: 3
  }
}
```

### 3. **Cache de Tokens Calientes**

```typescript
// Mantener tokens frecuentes en Redis
class TokenCache {
  async getHotTokens(): Promise<Token[]> {
    const cached = await redis.get('hot_tokens')
    if (cached) return JSON.parse(cached)
    
    const tokens = await db.query(`
      SELECT * FROM suno_tokens
      WHERE status = 'active'
        AND is_depleted = false
      ORDER BY last_used_at DESC
      LIMIT 20
    `)
    
    await redis.setex('hot_tokens', 60, JSON.stringify(tokens))
    return tokens
  }
}
```

---

## 🔔 Sistema de Incentivos

### Gamificación para Agregar Tokens

```typescript
// Recompensas por agregar token al pool
const REWARDS = {
  add_token: {
    credits: 10, // Créditos de generación extra
    badge: 'contributor',
    message: '¡Gracias por contribuir al pool!'
  },
  token_generates_for_others: {
    credits_per_use: 0.5,
    message: 'Tu token ayudó a otro usuario'
  }
}
```

---

## 📈 Roadmap de Implementación

### Fase 1: MVP (1-2 semanas)
- [x] Esquema de base de datos
- [ ] TokenPoolManager básico
- [ ] Integración con endpoints existentes
- [ ] Dashboard admin simple

### Fase 2: Auto-gestión (2-3 semanas)
- [ ] Health checks automáticos
- [ ] Sistema de alertas
- [ ] Limpieza automática
- [ ] Métricas en tiempo real

### Fase 3: Optimización (3-4 semanas)
- [ ] Cache de tokens
- [ ] Algoritmos de selección avanzados
- [ ] Rate limiting inteligente
- [ ] Interfaz de usuario completa

### Fase 4: Escalabilidad (4+ semanas)
- [ ] Multi-región
- [ ] Replicación de pool
- [ ] ML para predicción de demanda
- [ ] API pública para partners

---

## ✅ Beneficios del Sistema

1. **Escalabilidad Infinita** - Cada nuevo usuario FREE = 5 generaciones extra para el pool
2. **Resiliencia** - Si un token falla, automáticamente usa otro
3. **Optimización de Costos** - Reutiliza tokens FREE que no se usan completamente
4. **Transparencia** - Dashboard muestra estado del pool en tiempo real
5. **Auto-sustentable** - Sistema se mantiene solo con nuevos registros
6. **Fair Use** - Distribuye carga equitativamente entre tokens

---

**¿Listo para implementar? Empecemos con la Fase 1 (MVP) 🚀**

