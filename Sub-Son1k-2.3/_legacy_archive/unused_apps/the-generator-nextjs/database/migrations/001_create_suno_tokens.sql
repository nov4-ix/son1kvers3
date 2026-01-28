-- ============================================================================
-- MIGRACIÓN: Sistema de Pool de Tokens de Suno
-- Versión: 1.0
-- Descripción: Crea tablas para gestionar pool dinámico de tokens de usuarios
-- ============================================================================

-- 1. Tabla principal de tokens
CREATE TABLE IF NOT EXISTS suno_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  
  -- Metadata del usuario
  user_email TEXT NOT NULL,
  user_tier TEXT NOT NULL CHECK (user_tier IN ('FREE', 'PREMIUM', 'ADMIN')),
  
  -- Control de uso
  uses_count INTEGER DEFAULT 0,
  max_uses INTEGER NOT NULL DEFAULT 5,
  is_depleted BOOLEAN GENERATED ALWAYS AS (uses_count >= max_uses) STORED,
  
  -- Estado del token
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'invalid', 'expired', 'suspended')),
  health_status TEXT DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'warning', 'error')),
  
  -- Tracking
  last_used_at TIMESTAMPTZ,
  last_health_check_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- Métricas
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  
  -- Metadata adicional
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para optimizar queries de selección de tokens
CREATE INDEX idx_suno_tokens_active_healthy ON suno_tokens(status, health_status, is_depleted) 
  WHERE status = 'active' AND health_status = 'healthy' AND is_depleted = false;

CREATE INDEX idx_suno_tokens_tier_available ON suno_tokens(user_tier, uses_count) 
  WHERE status = 'active' AND is_depleted = false;

CREATE INDEX idx_suno_tokens_last_used ON suno_tokens(last_used_at DESC NULLS FIRST) 
  WHERE status = 'active';

CREATE INDEX idx_suno_tokens_health_check ON suno_tokens(last_health_check_at ASC NULLS FIRST) 
  WHERE status = 'active';

CREATE INDEX idx_suno_tokens_user ON suno_tokens(user_id);

-- 2. Tabla de logs de uso
CREATE TABLE IF NOT EXISTS token_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  token_id UUID NOT NULL REFERENCES suno_tokens(id) ON DELETE CASCADE,
  generation_id TEXT, -- taskId de Suno
  
  -- Request info
  requested_by_user_id UUID,
  requested_by_tier TEXT,
  
  -- Resultado
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'timeout', 'cancelled')),
  error_message TEXT,
  response_time_ms INTEGER,
  
  -- Metadata
  prompt TEXT,
  is_instrumental BOOLEAN,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_token_usage_logs_token ON token_usage_logs(token_id, created_at DESC);
CREATE INDEX idx_token_usage_logs_user ON token_usage_logs(requested_by_user_id, created_at DESC);
CREATE INDEX idx_token_usage_logs_generation ON token_usage_logs(generation_id);
CREATE INDEX idx_token_usage_logs_created ON token_usage_logs(created_at DESC);

-- 3. Tabla de métricas del pool (snapshot diario)
CREATE TABLE IF NOT EXISTS token_pool_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Métricas de tokens
  total_tokens INTEGER NOT NULL,
  active_tokens INTEGER NOT NULL,
  available_tokens INTEGER NOT NULL,
  depleted_tokens INTEGER NOT NULL,
  
  premium_tokens INTEGER NOT NULL,
  free_tokens INTEGER NOT NULL,
  
  healthy_tokens INTEGER NOT NULL,
  warning_tokens INTEGER NOT NULL,
  error_tokens INTEGER NOT NULL,
  
  -- Métricas de uso
  total_generations_today INTEGER NOT NULL,
  successful_generations_today INTEGER NOT NULL,
  failed_generations_today INTEGER NOT NULL,
  
  avg_response_time_ms INTEGER,
  
  -- Proyecciones
  estimated_days_until_depletion NUMERIC(10,2),
  
  -- Timestamp
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(snapshot_date)
);

CREATE INDEX idx_pool_metrics_date ON token_pool_metrics(snapshot_date DESC);

-- 4. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_suno_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER suno_tokens_updated_at_trigger
BEFORE UPDATE ON suno_tokens
FOR EACH ROW
EXECUTE FUNCTION update_suno_tokens_updated_at();

-- 5. Función para incrementar uso de token (thread-safe)
CREATE OR REPLACE FUNCTION increment_token_usage(
  p_token_id UUID,
  p_success BOOLEAN DEFAULT true
)
RETURNS void AS $$
BEGIN
  UPDATE suno_tokens
  SET 
    uses_count = uses_count + 1,
    total_requests = total_requests + 1,
    successful_requests = CASE WHEN p_success THEN successful_requests + 1 ELSE successful_requests END,
    failed_requests = CASE WHEN NOT p_success THEN failed_requests + 1 ELSE failed_requests END,
    last_used_at = NOW()
  WHERE id = p_token_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Vista para obtener tokens disponibles ordenados por prioridad
CREATE OR REPLACE VIEW available_tokens_prioritized AS
SELECT 
  t.*,
  -- Score de prioridad (mayor = mejor)
  (
    CASE 
      WHEN t.user_tier = 'PREMIUM' THEN 100
      WHEN t.user_tier = 'ADMIN' THEN 150
      ELSE 50
    END
    - (t.uses_count::float / NULLIF(t.max_uses, 0) * 30) -- Penalizar tokens muy usados
    + COALESCE(EXTRACT(EPOCH FROM (NOW() - t.last_used_at)) / 60, 60) -- Bonus por tiempo sin uso
    - (t.failed_requests::float / NULLIF(t.total_requests, 0) * 20) -- Penalizar alto error rate
  ) as priority_score
FROM suno_tokens t
WHERE t.status = 'active'
  AND t.health_status = 'healthy'
  AND t.is_depleted = false
ORDER BY priority_score DESC, t.last_used_at ASC NULLS FIRST;

-- 7. Función para obtener métricas actuales del pool
CREATE OR REPLACE FUNCTION get_pool_metrics()
RETURNS TABLE (
  total_tokens BIGINT,
  active_tokens BIGINT,
  available_tokens BIGINT,
  depleted_tokens BIGINT,
  premium_tokens BIGINT,
  free_tokens BIGINT,
  healthy_tokens BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_tokens,
    COUNT(*) FILTER (WHERE status = 'active')::BIGINT as active_tokens,
    COUNT(*) FILTER (WHERE status = 'active' AND is_depleted = false)::BIGINT as available_tokens,
    COUNT(*) FILTER (WHERE is_depleted = true)::BIGINT as depleted_tokens,
    COUNT(*) FILTER (WHERE user_tier = 'PREMIUM')::BIGINT as premium_tokens,
    COUNT(*) FILTER (WHERE user_tier = 'FREE')::BIGINT as free_tokens,
    COUNT(*) FILTER (WHERE health_status = 'healthy')::BIGINT as healthy_tokens
  FROM suno_tokens;
END;
$$ LANGUAGE plpgsql;

-- 8. Política de RLS (Row Level Security) - Opcional si usas Supabase Auth
-- Los usuarios solo pueden ver su propio token
ALTER TABLE suno_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own token" ON suno_tokens
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own token" ON suno_tokens
  FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- Admins pueden ver todos los tokens
CREATE POLICY "Admins can view all tokens" ON suno_tokens
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM suno_tokens
      WHERE user_id::text = auth.uid()::text
        AND user_tier = 'ADMIN'
    )
  );

-- 9. Insertar token de ejemplo (comentar en producción)
-- INSERT INTO suno_tokens (
--   user_id,
--   token,
--   user_email,
--   user_tier,
--   max_uses,
--   expires_at
-- ) VALUES (
--   gen_random_uuid(),
--   'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
--   'admin@son1kvers3.com',
--   'ADMIN',
--   999999,
--   NOW() + INTERVAL '30 days'
-- );

-- ============================================================================
-- FIN DE MIGRACIÓN
-- ============================================================================

-- Para ejecutar:
-- psql -d tu_database -f 001_create_suno_tokens.sql

-- Para revertir (CUIDADO - borra todos los datos):
-- DROP TABLE IF EXISTS token_usage_logs CASCADE;
-- DROP TABLE IF EXISTS token_pool_metrics CASCADE;
-- DROP TABLE IF EXISTS suno_tokens CASCADE;
-- DROP FUNCTION IF EXISTS update_suno_tokens_updated_at() CASCADE;
-- DROP FUNCTION IF EXISTS increment_token_usage(UUID, BOOLEAN) CASCADE;
-- DROP FUNCTION IF EXISTS get_pool_metrics() CASCADE;
-- DROP VIEW IF EXISTS available_tokens_prioritized CASCADE;

