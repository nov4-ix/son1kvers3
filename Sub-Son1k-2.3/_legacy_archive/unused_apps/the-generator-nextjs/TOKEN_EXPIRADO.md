# ⚠️ TOKEN DE SUNO EXPIRADO

## 🔍 Diagnóstico

El error `SUNO_COOKIE no configurada` que ves **NO es porque falte la variable**, sino porque:

**El token JWT de Suno expiró el 19 de octubre de 2025 (hace 2 días)**

### Evidencia en los logs:

```
✅ Estilo traducido y limpio: Indie rock, melancholic...
✅ Estilo resumido: Indie rock, melancholic, slow...
📊 Response Status: 401  ← Unauthorized (token inválido)
```

El código llega hasta Suno API correctamente, pero Suno rechaza el token porque **ya expiró**.

---

## ✅ SOLUCIÓN RÁPIDA

### Opción 1: Script Automático (Recomendado)

```bash
cd /Users/nov4-ix/Downloads/SSV-ALFA/apps/the-generator
./actualizar-token-suno.sh
```

El script:
1. Te pedirá el nuevo token
2. Validará que sea un JWT válido
3. Verificará su fecha de expiración
4. Actualizará `.env.local`
5. Actualizará Vercel
6. Redesplegará automáticamente

### Opción 2: Manual

#### Paso 1: Obtener nuevo token

1. **Abre la extensión Chrome de Suno**
2. **Abre Chrome DevTools** (F12)
3. **Ve a Network** → Filtra por "suno"
4. **Genera una canción** en la extensión
5. **Busca la request** a `ai.imgkits.com/suno/generate`
6. **Click en Headers**
7. **Copia `authorization`** (sin "Bearer ")

#### Paso 2: Actualizar en Vercel

```bash
cd /Users/nov4-ix/Downloads/SSV-ALFA/apps/the-generator

# Eliminar token viejo
npx vercel env rm SUNO_COOKIE production --yes
npx vercel env rm SUNO_COOKIE preview --yes
npx vercel env rm SUNO_COOKIE development --yes

# Agregar token nuevo
echo "TU_NUEVO_TOKEN_AQUI" | npx vercel env add SUNO_COOKIE production
echo "TU_NUEVO_TOKEN_AQUI" | npx vercel env add SUNO_COOKIE preview
echo "TU_NUEVO_TOKEN_AQUI" | npx vercel env add SUNO_COOKIE development

# Redesplegar
npx vercel --prod
```

#### Paso 3: Actualizar .env.local (opcional, para desarrollo local)

```bash
# Editar el archivo
nano /Users/nov4-ix/Downloads/SSV-ALFA/.env.local

# Reemplazar SUNO_TOKENS con el nuevo token
SUNO_TOKENS="TU_NUEVO_TOKEN_AQUI"
```

---

## 🎯 Verificación

Después de actualizar:

1. **Espera 2-3 minutos** para que termine el deployment
2. **Ve a** https://the-generator.son1kvers3.com
3. **Prueba generar música**
4. ✅ **Debería funcionar sin errores 401**

### Verificar token en Vercel:

```bash
npx vercel env ls | grep SUNO_COOKIE
```

Debe mostrar:
```
SUNO_COOKIE    Encrypted    Production, Preview, Development
```

---

## 📊 Información del Token Actual

```
Token Info:
  Issuer: k6N0drGbGVEcrNgMvm6o6z8C6fJ9BEz4
  Expira: 2025-10-19 23:03:42
  Ahora: 2025-10-22 02:57:20
  Status: ❌ EXPIRADO (hace 2 días, 3 horas)
```

---

## 💡 Prevención Futura

### ¿Cada cuánto expiran los tokens de Suno?

Los tokens JWT de Suno típicamente expiran cada **7-30 días** (depende de la configuración de Suno).

### Cómo saber cuándo expira tu token:

```bash
cd /Users/nov4-ix/Downloads/SSV-ALFA/apps/the-generator

# Ver expiración del token actual
cat /Users/nov4-ix/Downloads/SSV-ALFA/.env.local | grep "SUNO_TOKENS" | tr -d '"' | cut -d'=' -f2 | tr ',' '\n' | head -1 | python3 -c "
import sys, json, base64
from datetime import datetime
token = sys.stdin.read().strip()
parts = token.split('.')
if len(parts) >= 2:
    payload = parts[1] + '=' * (4 - len(parts[1]) % 4)
    decoded = json.loads(base64.urlsafe_b64decode(payload))
    if 'exp' in decoded:
        exp = datetime.fromtimestamp(decoded['exp'])
        print(f'Expira: {exp}')
        print(f'Quedan: {exp - datetime.now()}')
"
```

### Recordatorio:

- 📅 Configura un recordatorio para renovar el token cada **2-3 semanas**
- 💾 Guarda el script `actualizar-token-suno.sh` para facilitar la actualización
- 🔔 Si ves error 401, ejecuta el script inmediatamente

---

## 🆘 Troubleshooting

### Error: "Token no parece JWT válido"

**Asegúrate de:**
- Copiar **solo el token**, sin "Bearer "
- No incluir espacios ni saltos de línea
- El formato debe ser: `xxxxx.yyyyy.zzzzz`

### Error: "Token ya expirado"

- Obtén un **token más reciente** de la extensión Chrome
- Asegúrate de que la extensión esté **actualizada**

### Error: "No se encontró .env.local"

- El script buscará en `/Users/nov4-ix/Downloads/SSV-ALFA/.env.local`
- Si no existe, las variables se actualizarán solo en Vercel (suficiente para producción)

---

## 🎯 TL;DR

```bash
# Ejecutar esto:
cd /Users/nov4-ix/Downloads/SSV-ALFA/apps/the-generator
./actualizar-token-suno.sh

# Seguir las instrucciones del script
# Esperar 2-3 minutos
# Probar en https://the-generator.son1kvers3.com
```

**Eso es todo.** 🎵

---

**Última actualización:** 22 de octubre de 2025  
**Estado:** Token expirado desde el 19 de octubre


