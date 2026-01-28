-- ============================================
-- 🔧 ACTUALIZACIÓN: Políticas RLS para Migración
-- ============================================

-- Eliminar políticas anteriores
DROP POLICY IF EXISTS "Service role full access" ON suno_auth_tokens;
DROP POLICY IF EXISTS "Authenticated users can read" ON suno_auth_tokens;
DROP POLICY IF EXISTS "Authenticated users can manage tokens" ON suno_auth_tokens;

-- Política: Usuarios autenticados pueden leer/escribir (para migración y dashboard)
CREATE POLICY "Authenticated users can manage tokens" ON suno_auth_tokens
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Política: Service role también tiene acceso completo
CREATE POLICY "Service role full access" ON suno_auth_tokens
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
