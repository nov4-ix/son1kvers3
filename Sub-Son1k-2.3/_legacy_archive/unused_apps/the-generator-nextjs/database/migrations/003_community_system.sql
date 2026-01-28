-- =============================================
-- 🌐 MIGRACIÓN 003: SISTEMA COMUNITARIO
-- =============================================
-- Crea tablas y funciones para el sistema de:
-- - Créditos por usuario
-- - Transacciones de créditos
-- - Analytics de uso de tokens
-- - Actualiza tabla suno_auth_tokens
-- =============================================

-- ============================================
-- 1. ACTUALIZAR TABLA SUNO_AUTH_TOKENS
-- ============================================

-- Agregar columnas para sistema comunitario (si no existen)
DO $$ 
BEGIN
  -- owner_user_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'suno_auth_tokens' AND column_name = 'owner_user_id'
  ) THEN
    ALTER TABLE suno_auth_tokens 
    ADD COLUMN owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_tokens_owner 
    ON suno_auth_tokens(owner_user_id);
  END IF;

  -- is_community
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'suno_auth_tokens' AND column_name = 'is_community'
  ) THEN
    ALTER TABLE suno_auth_tokens 
    ADD COLUMN is_community BOOLEAN DEFAULT true;
  END IF;

  -- contribution_date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'suno_auth_tokens' AND column_name = 'contribution_date'
  ) THEN
    ALTER TABLE suno_auth_tokens 
    ADD COLUMN contribution_date TIMESTAMPTZ DEFAULT NOW();
  END IF;

END $$;

-- ============================================
-- 2. TABLA DE TRANSACCIONES DE CRÉDITOS
-- ============================================

CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL, -- positivo = ganó, negativo = gastó
  type TEXT NOT NULL CHECK (type IN ('contribution', 'generation', 'bonus', 'refund', 'purchase')),
  description TEXT,
  related_token_id UUID REFERENCES suno_auth_tokens(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}', -- información adicional flexible
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_transactions_user 
ON credit_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_type 
ON credit_transactions(type, created_at DESC);

-- RLS Policies
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Usuarios autenticados pueden ver sus propias transacciones
CREATE POLICY "Users can view own transactions" ON credit_transactions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Service role acceso completo
CREATE POLICY "Service role full access transactions" ON credit_transactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 3. TABLA DE ANALYTICS DE USO
-- ============================================

CREATE TABLE IF NOT EXISTS token_usage_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  token_used TEXT, -- Solo primeros 20 chars por privacidad
  action TEXT DEFAULT 'generation', -- 'generation', 'polling', etc.
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_analytics_user 
ON token_usage_analytics(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_timestamp 
ON token_usage_analytics(timestamp DESC);

-- RLS Policies
ALTER TABLE token_usage_analytics ENABLE ROW LEVEL SECURITY;

-- Service role y anon pueden insertar
CREATE POLICY "Allow inserts for analytics" ON token_usage_analytics
  FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (true);

-- Solo service role puede leer
CREATE POLICY "Service role can read analytics" ON token_usage_analytics
  FOR SELECT
  TO service_role
  USING (true);

-- ============================================
-- 4. FUNCIÓN: OBTENER BALANCE DE CRÉDITOS
-- ============================================

CREATE OR REPLACE FUNCTION get_user_balance(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO v_balance
  FROM credit_transactions
  WHERE user_id = p_user_id;
  
  RETURN v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. FUNCIÓN: CONSUMIR CRÉDITOS
-- ============================================

CREATE OR REPLACE FUNCTION consume_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT 'Generación de música'
)
RETURNS JSONB AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Obtener balance actual
  v_current_balance := get_user_balance(p_user_id);
  
  -- Verificar si tiene suficientes créditos
  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Créditos insuficientes',
      'current_balance', v_current_balance,
      'required', p_amount
    );
  END IF;
  
  -- Consumir créditos
  INSERT INTO credit_transactions (user_id, amount, type, description)
  VALUES (p_user_id, -p_amount, 'generation', p_description);
  
  -- Nuevo balance
  v_new_balance := v_current_balance - p_amount;
  
  RETURN jsonb_build_object(
    'success', true,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance,
    'consumed', p_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. FUNCIÓN: OTORGAR CRÉDITOS
-- ============================================

CREATE OR REPLACE FUNCTION grant_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT DEFAULT 'bonus',
  p_description TEXT DEFAULT 'Créditos otorgados',
  p_token_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Obtener balance actual
  v_current_balance := get_user_balance(p_user_id);
  
  -- Otorgar créditos
  INSERT INTO credit_transactions (user_id, amount, type, description, related_token_id)
  VALUES (p_user_id, p_amount, p_type, p_description, p_token_id);
  
  -- Nuevo balance
  v_new_balance := v_current_balance + p_amount;
  
  RETURN jsonb_build_object(
    'success', true,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance,
    'granted', p_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. FUNCIÓN: ESTADÍSTICAS DEL POOL
-- ============================================

CREATE OR REPLACE FUNCTION get_community_stats()
RETURNS JSONB AS $$
DECLARE
  v_total_tokens INTEGER;
  v_active_tokens INTEGER;
  v_total_users INTEGER;
  v_total_contributions INTEGER;
  v_total_generations INTEGER;
BEGIN
  -- Contar tokens
  SELECT COUNT(*), COUNT(*) FILTER (WHERE is_active = true)
  INTO v_total_tokens, v_active_tokens
  FROM suno_auth_tokens
  WHERE is_community = true;
  
  -- Contar usuarios contribuyentes
  SELECT COUNT(DISTINCT owner_user_id)
  INTO v_total_users
  FROM suno_auth_tokens
  WHERE owner_user_id IS NOT NULL AND is_community = true;
  
  -- Contar contribuciones
  SELECT COUNT(*)
  INTO v_total_contributions
  FROM credit_transactions
  WHERE type = 'contribution';
  
  -- Contar generaciones
  SELECT COUNT(*)
  INTO v_total_generations
  FROM credit_transactions
  WHERE type = 'generation';
  
  RETURN jsonb_build_object(
    'pool', jsonb_build_object(
      'total_tokens', v_total_tokens,
      'active_tokens', v_active_tokens,
      'inactive_tokens', v_total_tokens - v_active_tokens
    ),
    'community', jsonb_build_object(
      'total_contributors', v_total_users,
      'total_contributions', v_total_contributions
    ),
    'usage', jsonb_build_object(
      'total_generations', v_total_generations
    ),
    'updated_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. TRIGGER: AUTO-ACTUALIZAR usage_count
-- ============================================

CREATE OR REPLACE FUNCTION increment_token_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.action = 'generation' AND NEW.success = true THEN
    UPDATE suno_auth_tokens
    SET usage_count = usage_count + 1,
        last_used_at = NOW()
    WHERE token LIKE (NEW.token_used || '%');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_token_usage
  AFTER INSERT ON token_usage_analytics
  FOR EACH ROW
  EXECUTE FUNCTION increment_token_usage();

-- ============================================
-- 9. VISTA: LEADERBOARD DE CONTRIBUYENTES
-- ============================================

CREATE OR REPLACE VIEW contributor_leaderboard AS
SELECT 
  u.id as user_id,
  u.email,
  COUNT(t.id) as tokens_contributed,
  COUNT(t.id) FILTER (WHERE t.is_active = true) as active_tokens,
  COALESCE(SUM(t.usage_count), 0) as total_usage,
  MAX(t.contribution_date) as last_contribution,
  get_user_balance(u.id) as current_balance
FROM auth.users u
LEFT JOIN suno_auth_tokens t ON t.owner_user_id = u.id
WHERE t.is_community = true
GROUP BY u.id, u.email
ORDER BY tokens_contributed DESC, total_usage DESC;

-- ============================================
-- 10. DATOS INICIALES (OPCIONAL)
-- ============================================

-- Comentar si ya tienes usuarios
-- INSERT INTO credit_transactions (user_id, amount, type, description)
-- SELECT id, 50, 'bonus', 'Créditos de bienvenida'
-- FROM auth.users
-- WHERE NOT EXISTS (
--   SELECT 1 FROM credit_transactions WHERE user_id = auth.users.id
-- );

-- ============================================
-- ✅ MIGRACIÓN COMPLETADA
-- ============================================

-- Verificar que todo se creó correctamente
DO $$
BEGIN
  RAISE NOTICE '✅ Migración 003 completada';
  RAISE NOTICE '   - Tabla credit_transactions creada';
  RAISE NOTICE '   - Tabla token_usage_analytics creada';
  RAISE NOTICE '   - Funciones de créditos creadas';
  RAISE NOTICE '   - Vista contributor_leaderboard creada';
  RAISE NOTICE '   - RLS policies aplicadas';
END $$;

