# 🛠️ GUÍA DE DESPLIEGUE MANUAL

Si el script automático falla, sigue estos pasos en tu terminal:

## 1. Backend (Railway)

```powershell
cd packages\backend

# 1. Login
railway login

# 2. Vincular proyecto (Selecciona uno existente o crea uno nuevo)
railway link

# 3. Subir
railway up
```

⚠️ **IMPORTANTE:** Cuando termine, Railway te dará una URL (ej: `https://backend-production.up.railway.app`). **CÓPIALA.**

---

## 2. Frontend (Vercel)

```powershell
cd ..\..\apps\the-generator-nextjs

# 1. Login
vercel login

# 2. Vincular
vercel link

# 3. Configurar Variables de Entorno (Solo la primera vez)
vercel env add NEXT_PUBLIC_BACKEND_URL
# Pega la URL de Railway que copiaste antes

# 4. Desplegar a Producción
vercel --prod
```

## 3. Verificar

1. Abre la URL que te de Vercel (ej: `https://the-generator.vercel.app`)
2. Verifica que puedas generar música.
