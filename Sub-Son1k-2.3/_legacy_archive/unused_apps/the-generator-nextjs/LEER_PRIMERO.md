# 🚨 THE GENERATOR - LEER PRIMERO

> **Estado:** El código está perfecto, pero necesitas configurar 1 variable de entorno

---

## ⚡ SOLUCIÓN RÁPIDA (5 minutos)

### 🎯 Paso 1: Obtener tu Token de Suno

1. **Abre la extensión Chrome de Suno**
2. **Abre Chrome DevTools** (F12 o clic derecho → "Inspeccionar")
3. **Ve a la pestaña "Network"**
4. **Genera una canción** en la extensión
5. **Busca la request** que va a `ai.imgkits.com/suno/generate`
6. **Click en esa request** → Pestaña "Headers"
7. **Copia el valor** del header `authorization`
8. **Elimina la parte "Bearer "** al inicio, solo copia el token JWT

**Se verá así:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

### 🎯 Paso 2: Configurar en Vercel

**Opción A - Dashboard Web (Más fácil):**

1. Ve a https://vercel.com/dashboard
2. Click en el proyecto **"the-generator"**
3. **Settings** → **Environment Variables**
4. Click **"Add New"**
5. Ingresa:
   - **Name:** `SUNO_COOKIE`
   - **Value:** [Pega tu token aquí]
   - **Environments:** ✅ Production ✅ Preview ✅ Development
6. Click **"Save"**
7. Ve a **"Deployments"** → Click en el último → Menú (3 puntos) → **"Redeploy"**

**Opción B - Script Automático:**

```bash
cd /Users/nov4-ix/Downloads/SSV-ALFA/apps/the-generator
./setup-env.sh
```

El script te guiará paso a paso.

### 🎯 Paso 3: Verificar

1. Espera a que termine el deployment (~2 min)
2. Ve a https://the-generator.son1kvers3.com
3. Genera letra → Genera prompt → **Genera música**
4. ✅ **¡Debería funcionar!**

---

## 🆘 ¿Necesitas Ayuda?

### Si sigue sin funcionar:

1. **Verifica que agregaste la variable en el proyecto correcto** ("the-generator")
2. **Asegúrate de haber redesplegado** después de agregar la variable
3. **Espera 2-3 minutos** para que el deployment termine
4. **Refresca el navegador** con fuerza (Cmd+Shift+R o Ctrl+Shift+R)

### Para más detalles:

- 📖 **ENV_SETUP_GUIDE.md** - Guía completa con capturas
- 🔍 **DIAGNOSIS_AND_FIX.md** - Detalles técnicos
- 📋 **RESUMEN_REVISION_COMPLETA.md** - Qué se revisó

---

## 🎯 TL;DR

1. Obtén tu token de Suno desde Chrome DevTools
2. Agrégalo en Vercel como variable `SUNO_COOKIE`
3. Redeployas
4. ¡Listo!

**El código está perfecto, solo falta esa configuración.**

---

## 📞 Soporte Técnico

Si después de seguir estos pasos sigue sin funcionar:

1. Corre: `npx vercel env ls` y verifica que aparezca `SUNO_COOKIE`
2. Ve a Vercel Dashboard → Deployments → Functions → Ver logs
3. Busca el error específico en los logs

---

**¿Dudas?** Lee **ENV_SETUP_GUIDE.md** para una guía paso a paso con más detalles.


