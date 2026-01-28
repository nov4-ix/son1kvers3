# 🔧 Guía de Configuración de Variables de Entorno - The Generator

## ⚠️ PROBLEMA ACTUAL

El generador de música **NO FUNCIONA** porque faltan las variables de entorno en Vercel.

Error actual: `SUNO_COOKIE no configurada`

---

## 📋 VARIABLES REQUERIDAS

### 1. **SUNO_COOKIE** (OBLIGATORIO)
- **Qué es:** Tu Bearer token de autenticación de Suno
- **Formato:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (JWT token)
- **Dónde obtenerlo:**
  1. Instala la extensión Chrome de Suno
  2. Abre Chrome DevTools (F12)
  3. Ve a la pestaña "Network"
  4. Genera una canción en la extensión
  5. Busca la request a `ai.imgkits.com/suno/generate`
  6. Copia el valor del header `authorization` (sin el "Bearer ")

### 2. **GROQ_API_KEY** (OPCIONAL)
- **Qué es:** API key de Groq para traducción de estilos musicales
- **Formato:** `gsk_...`
- **Dónde obtenerlo:**
  1. Ve a https://console.groq.com/keys
  2. Crea una cuenta gratis
  3. Genera una API key
- **Nota:** Si no se configura, la herramienta seguirá funcionando pero sin traducción automática

---

## 🚀 CÓMO CONFIGURAR EN VERCEL

### Opción 1: Desde el Dashboard de Vercel (RECOMENDADO)

1. Ve a https://vercel.com/dashboard
2. Selecciona el proyecto **"the-generator"**
3. Ve a **Settings** → **Environment Variables**
4. Agrega las siguientes variables:

   **Variable 1:**
   - **Name:** `SUNO_COOKIE`
   - **Value:** [Tu Bearer token de Suno]
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development

   **Variable 2:**
   - **Name:** `GROQ_API_KEY`
   - **Value:** [Tu API key de Groq]
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development

5. Click en **Save**
6. **IMPORTANTE:** Ve a **Deployments** → Click en los 3 puntos del último deployment → **Redeploy**

### Opción 2: Desde la CLI (Alternativa)

```bash
cd /Users/nov4-ix/Downloads/SSV-ALFA/apps/the-generator

# Agregar SUNO_COOKIE
npx vercel env add SUNO_COOKIE production
# Pega tu token cuando te lo pida

npx vercel env add SUNO_COOKIE preview
# Pega tu token cuando te lo pida

npx vercel env add SUNO_COOKIE development
# Pega tu token cuando te lo pida

# Agregar GROQ_API_KEY (opcional)
npx vercel env add GROQ_API_KEY production
npx vercel env add GROQ_API_KEY preview
npx vercel env add GROQ_API_KEY development

# Redesplegar
npx vercel --prod
```

---

## ✅ VERIFICAR QUE FUNCIONA

Después de configurar las variables y redesplegar:

1. Ve a https://the-generator.son1kvers3.com
2. Genera una letra
3. Genera un prompt musical
4. Click en "Generar Música"
5. **Debería funcionar sin errores**

### Si sigue sin funcionar:

1. Verifica que las variables estén en el proyecto correcto ("the-generator")
2. Asegúrate de haber redesplegado después de agregar las variables
3. Revisa los logs en Vercel Dashboard → Deployments → Click en el deployment → Functions

---

## 🔍 DEBUGGING

### Ver variables configuradas:
```bash
cd /Users/nov4-ix/Downloads/SSV-ALFA/apps/the-generator
npx vercel env ls
```

### Ver logs del deployment:
1. Ve a Vercel Dashboard
2. Click en el proyecto "the-generator"
3. Ve a "Deployments"
4. Click en el último deployment
5. Ve a "Functions" → Click en cualquier función → Ver logs

---

## 📝 NOTAS IMPORTANTES

1. **NO commitees archivos `.env.local`** al repositorio (ya está en .gitignore)
2. **El token de Suno expira** cada cierto tiempo, deberás actualizarlo periódicamente
3. **Si cambias las variables en Vercel**, siempre **REDEPLOYAS** para que surtan efecto
4. **Las variables de entorno NO se leen en tiempo real**, necesitas un nuevo deployment

---

## 🆘 SOLUCIÓN RÁPIDA SI TIENES PRISA

Si necesitas que funcione YA y tienes el token:

```bash
cd /Users/nov4-ix/Downloads/SSV-ALFA/apps/the-generator

# Crear archivo .env.local LOCAL (solo para desarrollo)
echo "SUNO_COOKIE=TU_TOKEN_AQUI" > .env.local
echo "GROQ_API_KEY=TU_GROQ_KEY_AQUI" >> .env.local

# Probar localmente
npm run dev
```

**Pero DEBES configurarlo en Vercel para producción.**


