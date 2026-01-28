# ⚙️ CONFIGURACIÓN POST-DESPLIEGUE (CRÍTICO)

¡El código está arriba! Pero para que funcione, necesitas configurar las "Variables de Entorno" en la nube.

## 1. Configurar Railway (Backend)
1. Ve a tu dashboard en [railway.app](https://railway.app).
2. Entra a tu proyecto -> Click en el servicio del backend.
3. Pestaña **"Variables"**.
4. Agrega estas variables (copia los valores de tu `.env` local):
   - `SUNO_COOKIES`: (Tus cookies de Suno)
   - `JWT_SECRET`: (Tu secreto)
   - `DATABASE_URL`: (Ya debería estar automática)
   - `NIXPACKS_PLAN`: `none` (Opcional, a veces ayuda con el build)

## 2. Configurar Vercel (Frontend)
1. Ve a [vercel.com](https://vercel.com) -> Tu proyecto `the-generator`.
2. **Settings** -> **Environment Variables**.
3. Agrega:
   - `NEXT_PUBLIC_BACKEND_URL`: `https://TU-URL-DE-RAILWAY.app` (Sin barra al final)

## 3. Redeploy
Una vez guardadas las variables:
- **Railway:** Se redeploya solo (o dale a "Redeploy").
- **Vercel:** Ve a **Deployments** -> **Redeploy**.

---
**¿Cómo sé si funciona?**
Entra a tu URL de Vercel. Si no ves errores rojos y puedes generar música, ¡felicidades! 🎵
