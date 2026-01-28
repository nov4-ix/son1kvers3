# 🚀 PASO 3: Desplegar a Producción

## Requisitos previos:

✅ PASO 1 completado (tabla creada en Supabase)
✅ PASO 2 completado (tokens migrados exitosamente)

## Instrucciones:

### 1. Verificar variables en Vercel

Ve a tu proyecto en Vercel (the-generator-functional) y verifica que tengas:

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
GROQ_API_KEY=gsk_xxx...  # Para traducción de estilos
```

**IMPORTANTE:** Ya NO necesitas `SUNO_COOKIE` porque ahora usa el pool!

### 2. Hacer commit de los cambios

```bash
cd /Users/nov4-ix/Downloads/SSV-ALFA

git add .
git commit -m "feat: Implementar Unified Token Pool con auto-rotación"
git push origin main
```

### 3. Desplegar a Vercel

Vercel detectará automáticamente el push y desplegará. O puedes forzar un despliegue:

```bash
cd apps/the-generator
vercel --prod
```

### 4. Verificar el despliegue

Una vez desplegado, visita:

1. **Estado del pool:**
   ```
   https://the-generator.son1kvers3.com/api/pool/status
   ```

   Deberías ver algo como:
   ```json
   {
     "totalTokens": 4,
     "activeTokens": 4,
     "expiredTokens": 0,
     "unhealthyTokens": 0,
     "nextRotationIndex": 0,
     "tokens": [...]
   }
   ```

2. **Probar generación de música:**
   ```
   https://the-generator.son1kvers3.com/generator
   ```

## ✅ Verificación Final:

### Test 1: Generar música
1. Ve a https://the-generator.son1kvers3.com/generator
2. Ingresa:
   - Letra: "indie rock, melancholic"
   - Estilo: "male vocals, guitar"
3. Clic en "Generar"
4. Debería generar sin error `SUNO_COOKIE no configurada`

### Test 2: Verificar rotación automática
1. Genera 5 canciones seguidas
2. Ve a `/api/pool/status`
3. Verás que `usage_count` aumenta y los tokens rotan

## 🎉 Resultado Final:

### ✅ Sistema Activado:

- **Tokens en Supabase:** Ya no en variables de entorno
- **Rotación automática:** Round-robin entre todos los tokens
- **Auto-limpieza:** Cada 30 min marca expirados como inactivos
- **Recuperación automática:** Si un token falla (401), rota al siguiente
- **Agregar tokens sin redeploy:** `POST /api/pool/add`
- **Dashboard de estado:** `GET /api/pool/status`

### 🆚 Antes vs Después:

| **Antes** | **Después** |
|-----------|-------------|
| 1 token manual | 4+ tokens auto-gestionados |
| Token expira → app cae | Token expira → rotación automática |
| Actualizar = redeploy | Actualizar = API call |
| Sin monitoreo | Dashboard en tiempo real |
| Límite de 1 token | Límite multiplicado x N tokens |

## 🎯 Agregar Más Tokens (Opcional):

Para agregar un nuevo token en el futuro:

```bash
curl -X POST https://the-generator.son1kvers3.com/api/pool/add \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJxxx...",
    "userId": "admin",
    "userEmail": "admin@son1kvers3.com",
    "userTier": "ADMIN"
  }'
```

O simplemente obtén un nuevo JWT de Suno y agrégalo manualmente a la tabla `suno_auth_tokens` en Supabase.

---

🎉 ¡FELICIDADES! El Unified Token Pool está completamente activado.
