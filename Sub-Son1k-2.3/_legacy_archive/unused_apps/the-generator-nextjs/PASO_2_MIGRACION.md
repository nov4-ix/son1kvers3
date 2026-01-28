# 🔄 PASO 2: Migrar Tokens al Pool

## Requisitos previos:

✅ PASO 1 completado (tabla `suno_auth_tokens` creada en Supabase)

## Instrucciones:

### 1. Instalar dependencias

```bash
cd /Users/nov4-ix/Downloads/SSV-ALFA/apps/the-generator
npm install
```

### 2. Verificar variables de entorno

Abre `.env.local` en la raíz del proyecto y verifica que tengas:

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUNO_TOKENS="token1,token2,token3,token4"
```

### 3. Ejecutar migración

```bash
npm run migrate-tokens
```

## ✅ Salida Esperada:

```
🔄 Migrando tokens al Unified Pool...

✅ Encontrados 4 tokens en .env.local

🔍 Validando tokens...
  ✅ Token P8pO8Yl2F6... | Expira: 22/10/2025, 18:33:07
  ✅ Token Q9rP9Zm3G7... | Expira: 23/10/2025, 19:45:22
  ✅ Token R1sQ1An4H8... | Expira: 24/10/2025, 20:12:33
  ✅ Token S2tR2Bo5I9... | Expira: 25/10/2025, 21:55:44

✅ 4 tokens válidos listos para migrar

🔗 Conectando a Supabase...
📤 Insertando tokens en Supabase...
✅ 4 tokens insertados exitosamente

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Migración completada exitosamente!

📊 Resumen:
   Total tokens: 4
   Válidos: 4
   Activos: 4
   Expirados: 0

🎯 Próximos pasos:
   1. Los tokens están ahora en Supabase
   2. El sistema de rotación automática está activado
   3. Verifica el estado en: /api/pool/status
   4. Agrega más tokens en: /api/pool/add

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## ⚠️ Problemas Comunes:

### Error: "Variables de entorno no configuradas"
- Verifica que `SUPABASE_URL` y `SUPABASE_ANON_KEY` estén en `.env.local`

### Error: "No se encontró SUNO_TOKENS"
- Verifica que tengas `SUNO_TOKENS="..."` en `.env.local`

### Error: "Todos los tokens están expirados"
- Necesitas obtener nuevos tokens JWT de Suno

---

✅ Cuando veas "Migración completada exitosamente", avísame para continuar con el PASO 3.
