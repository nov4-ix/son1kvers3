# 🔧 Troubleshooting - Backend Suno

## 📊 Resumen del Problema Actual

**Síntoma:** La generación de música se queda en "processing" con progreso de 45% indefinidamente.

**Causa:** La API de Suno está devolviendo respuestas vacías (Content-Length: 0), lo que indica:
- ✅ La generación se envió correctamente
- ✅ Se recibió un trackId válido
- ❌ Pero Suno no está devolviendo el resultado

---

## 🔍 Diagnóstico

### Lo que está funcionando:
✅ Backend configurado correctamente  
✅ Token presente en `.env.local`  
✅ Endpoint `/api/generate-music` funciona  
✅ Endpoint `/api/track-status` consulta API real  
✅ GROQ_API_KEY configurado para letras  
✅ Polling implementado correctamente  

### El problema:
❌ API de Suno devuelve respuestas vacías  
❌ No se recibe `audio_url`  
❌ Content-Length: 0

---

## 🛠️ Solución 1: Renovar Token de Suno (MÁS COMÚN)

El token JWT de Suno **expira** después de un tiempo. Tu token actual:
```
eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJxMHVsa2pTNjhHZ2E5RFVpRnUzQzFVbmdLQjRxMW90RCIsImV4cCI6MTc2MDg3MTQ3NX0.ORAugL90suqFVnrk3imnAR6os00-vvMHEXPCS4UJoew
```

**Expira:** Verificar campo `exp` en el JWT

### Pasos para Renovar:

1. **Abre la extensión Chrome de Suno**
   - Ve a: https://suno.com
   - Inicia sesión si no lo estás

2. **Abre DevTools del navegador**
   - Presiona: `Cmd + Option + I` (Mac) o `F12` (Windows/Linux)
   - Ve a la pestaña **Network**

3. **Genera una canción en Suno**
   - Escribe cualquier prompt
   - Click en "Create"

4. **Busca la request `generate`**
   - En Network, busca: `suno/generate`
   - Click en esa request
   - Ve a la pestaña **Headers**

5. **Copia el nuevo token**
   - Busca el header `authorization`
   - Copia el valor (será algo como: `Bearer eyJ0eXAi...`)
   - **IMPORTANTE:** Copia solo la parte **después** de "Bearer " (el JWT completo)

6. **Actualiza `.env.local`**
   ```bash
   cd /Users/nov4-ix/Downloads/SSV-ALFA/apps/the-generator
   
   # Editar .env.local y reemplazar SUNO_COOKIE
   nano .env.local
   
   # O con sed:
   sed -i.bak 's/SUNO_COOKIE=.*/SUNO_COOKIE=TU_NUEVO_TOKEN_AQUI/' .env.local
   ```

7. **Reinicia el servidor**
   ```bash
   pkill -f "next dev -p 3002"
   npm run dev
   ```

8. **Prueba de nuevo**
   - Genera una nueva canción
   - Debería funcionar ahora

---

## 🛠️ Solución 2: Verificar Estado de Suno

A veces Suno tiene problemas de servicio.

### Verificar manualmente:

```bash
# Probar con un taskId que sabes que funcionó antes
curl -v "https://usa.imgkits.com/node-api/suno/get_mj_status/TASK_ID_AQUI" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "channel: node-api"
```

**Respuestas posibles:**
- **Content-Length: 0** → Aún procesando o falló
- **200 con JSON** → ¡Exitoso!
- **401/403** → Token expirado
- **502/504** → Suno caído temporalmente

---

## 🛠️ Solución 3: Usar Extensión Chrome Directamente

Si el backend sigue fallando, puedes verificar que Suno funciona directamente:

1. Abre: https://suno.com
2. Genera una canción ahí
3. Si funciona → el problema es el token
4. Si NO funciona → Suno tiene problemas de servicio

---

## 🛠️ Solución 4: Modo Alternativo (Suno API Oficial)

Si imgkits.com está teniendo problemas, considera usar la API oficial de Suno:

1. Crea cuenta en: https://suno.com
2. Genera API key en: https://suno.com/api
3. Actualiza el backend para usar API oficial en lugar de imgkits

**Nota:** Esto requiere modificar el código del backend.

---

## 📝 Script de Diagnóstico Rápido

Crea este archivo para diagnosticar rápido:

```bash
#!/bin/bash
# test-suno.sh

echo "🔍 Diagnóstico de Suno..."
echo ""

# 1. Verificar token
echo "1. Verificando token en .env.local..."
if grep -q "SUNO_COOKIE=" /Users/nov4-ix/Downloads/SSV-ALFA/apps/the-generator/.env.local; then
    TOKEN=$(grep "SUNO_COOKIE=" /Users/nov4-ix/Downloads/SSV-ALFA/apps/the-generator/.env.local | cut -d'=' -f2)
    echo "   ✅ Token presente: ${TOKEN:0:20}..."
else
    echo "   ❌ Token no encontrado"
    exit 1
fi

# 2. Probar generación
echo ""
echo "2. Probando generación..."
RESPONSE=$(curl -s -X POST "https://ai.imgkits.com/suno/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "channel: node-api" \
  -d '{"prompt":"test","style":"","title":"","customMode":false,"instrumental":true,"lyrics":"","gender":""}')

echo "   Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "taskId"; then
    TASK_ID=$(echo "$RESPONSE" | grep -o '"taskId":"[^"]*"' | cut -d'"' -f4)
    echo "   ✅ Generación exitosa"
    echo "   TaskId: $TASK_ID"
    
    # 3. Esperar y verificar status
    echo ""
    echo "3. Esperando 10 segundos..."
    sleep 10
    
    echo "4. Verificando status..."
    STATUS=$(curl -s "https://usa.imgkits.com/node-api/suno/get_mj_status/$TASK_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "channel: node-api")
    
    if [ -z "$STATUS" ]; then
        echo "   ⚠️ Respuesta vacía (normal si aún procesa)"
    else
        echo "   ✅ Respuesta recibida: $STATUS"
    fi
else
    echo "   ❌ Error en generación"
    echo "   ¿Token expirado?"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Diagnóstico completo"
```

**Uso:**
```bash
chmod +x test-suno.sh
./test-suno.sh
```

---

## 🎯 Recomendación Final

**El problema más probable es que el token expiró.**

### Acción inmediata:

1. ✅ Obtén un nuevo token de la extensión Chrome (sigue pasos arriba)
2. ✅ Actualiza `.env.local`
3. ✅ Reinicia servidor
4. ✅ Prueba de nuevo

### Si sigue fallando:

1. Verifica que Suno.com funcione directamente en tu navegador
2. Prueba generar una canción en suno.com
3. Si funciona ahí, el problema es definitivamente el token
4. Si NO funciona ahí, Suno tiene problemas de servicio (espera unas horas)

---

## 📊 Logs Útiles para Debugging

Cuando generes música, revisa los logs del servidor (`npm run dev`) y busca:

### Logs Exitosos:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎵 API generate-music LLAMADA
📡 Llamando a ai.imgkits.com/suno/generate...
📊 Response Status: 200
✅ TaskId extraído: abc123...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Logs de Polling:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 API track-status LLAMADA
🎯 TrackId: abc123...
📡 Llamando a usa.imgkits.com...
📊 Response Status: 200
⚠️ Respuesta vacía, asumiendo procesando...  ← ESTO ES NORMAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Logs cuando está listo:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 API track-status LLAMADA
📦 Parsed Data: { "audio_url": "https://cdn1.suno.ai/..." }
✅ Status: complete
🎵 Audio URL: https://cdn1.suno.ai/...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Logs de Error (Token Expirado):
```
❌ Error Response: Unauthorized
📊 Response Status: 401
```

---

## 🆘 Soporte Adicional

Si después de renovar el token sigue fallando:

1. Revisa que el token sea **válido** (genera una canción en suno.com primero)
2. Verifica que copiaste el token **completo** (JWT es largo, ~300+ caracteres)
3. Asegúrate de no tener espacios extra en `.env.local`
4. El token debe estar en **una sola línea**

---

**Última actualización:** 2025-10-19  
**Estado:** Token probablemente expirado - necesita renovación

