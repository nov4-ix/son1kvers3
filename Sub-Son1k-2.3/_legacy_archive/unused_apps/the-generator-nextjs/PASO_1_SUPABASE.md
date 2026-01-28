# 🔧 PASO 1: Crear tabla en Supabase

## Instrucciones:

1. Ve a tu proyecto de Supabase: https://supabase.com/dashboard
2. Clic en "SQL Editor" (icono de base de datos en el menú lateral)
3. Clic en "New Query"
4. **Copia y pega TODO el contenido** del archivo:
   `database/migrations/002_unified_token_pool.sql`
5. Clic en "Run" o presiona Cmd+Enter

## ✅ Verificación:

Si todo salió bien, deberías ver:

```
Success. No rows returned
```

Y en la pestaña "Tables" verás la nueva tabla:
- `suno_auth_tokens`

## 🎯 Lo que acabas de crear:

- ✅ Tabla `suno_auth_tokens` con todos los campos
- ✅ Índices para queries rápidas
- ✅ Función `get_best_token()` - obtener el mejor token
- ✅ Función `cleanup_expired_tokens()` - limpiar expirados
- ✅ Función `get_pool_stats()` - estadísticas del pool
- ✅ Políticas de seguridad (RLS)
- ✅ Trigger para actualizar `updated_at` automáticamente

---

✅ Cuando termines, avísame para continuar con el PASO 2.
