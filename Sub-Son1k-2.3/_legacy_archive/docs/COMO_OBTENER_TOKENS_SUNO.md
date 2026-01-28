# 🎵 GUÍA: Obtener Tokens de Suno

## 📋 Método 1: Manual (6 pasos - 2 minutos)

### Paso 1: Ir a Suno.com
✅ **COMPLETADO** - Ya tenemos la página abierta en el navegador

La página muestra:
- Botones "Sign In" y "Sign Up" arriba a la derecha
- Campo de texto para crear canciones
- Diseño oscuro con el eslogan "Make any song you can imagine"

### Paso 2: Iniciar Sesión
1. Click en **"Sign In"** (esquina superior derecha)
2. Ingresa tus credenciales de Suno
3. Si no tienes cuenta, usa **"Sign Up"** para crear una

### Paso 3: Espera a estar logueado
Una vez dentro verás:
- Tu perfil/avatar en la esquina
- Opciones de "Create" disponibles
- Dashboard con tus creaciones

### Paso 4: Abrir DevTools
Opciones para abrir DevTools:
- **Mac**: `Cmd + Option + I`
- **Windows/Linux**: `F12` o `Ctrl + Shift + I`
- **Menú**: Click derecho → "Inspect" o "Inspeccionar"

### Paso 5: Ir a Application/Storage
En DevTools:
1. Click en la pestaña **"Application"** (o **"Almacenamiento"** si está en español)
2. En el panel izquierdo, expande **"Cookies"**
3. Click en `https://suno.com`

### Paso 6: Copiar el Token
Busca UNA de estas cookies (depende de la implementación):

**Opción A: `__session`**
- Nombre: `__session`
- Valor: String largo (JWT token)
- Copia el **Value** completo

**Opción B: `clerk_token`** o `__clerk_db_jwt`
- Busca cookies que contengan "clerk"
- Copia el **Value** completo

**Opción C: Authorization Header**
1. Ve a Network tab
2. Refresh la página (F5)
3. Click en cualquier request a `suno.com/api`
4. En Headers, busca `Authorization: Bearer xxx`
5. Copia el token después de "Bearer "

### ✅ Verificar que el Token es Válido
El token debe:
- Ser un string largo (100+ caracteres)
- Generalmente empieza con `ey` si es JWT
- O ser un ID alfanumérico si es session ID

---

## 📋 Método 2: Script Automático (Recomendado)

Si tienes problemas encontrando el token manualmente, usa este script:

### Opción A: Desde DevTools Console

1. **Abrir Console** en DevTools (pestaña Console)
2. **Pegar este script**:

```javascript
// Script para extraer tokens de Suno
(function() {
    console.log("🔍 Buscando tokens de Suno...\n");
    
    // 1. Buscar en cookies
    const cookies = document.cookie.split(';');
    const relevantCookies = cookies.filter(c => 
        c.includes('session') || 
        c.includes('clerk') || 
        c.includes('token') ||
        c.includes('auth')
    );
    
    if (relevantCookies.length > 0) {
        console.log("✅ Cookies encontradas:");
        relevantCookies.forEach(cookie => {
            const [name, value] = cookie.trim().split('=');
            console.log(`  📍 ${name}`);
            console.log(`     Valor: ${value.substring(0, 50)}...`);
        });
    }
    
    // 2. Buscar en localStorage
    console.log("\n🔍 Buscando en localStorage...");
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.includes('clerk') || key.includes('auth') || key.includes('token')) {
            console.log(`  📍 ${key}`);
            const value = localStorage.getItem(key);
            console.log(`     Valor: ${value.substring(0, 50)}...`);
        }
    }
    
    // 3. Buscar en sessionStorage
    console.log("\n🔍 Buscando en sessionStorage...");
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key.includes('clerk') || key.includes('auth') || key.includes('token')) {
            console.log(`  📍 ${key}`);
            const value = sessionStorage.getItem(key);
            console.log(`     Valor: ${value.substring(0, 50)}...`);
        }
    }
    
    console.log("\n✅ Busca el valor más largo arriba. Ese es probablemente tu token.");
    console.log("💡 Copia el valor COMPLETO (no solo los primeros 50 caracteres)");
})();
```

3. **Presiona Enter**
4. **Copia el token** que se muestre en la consola

### Opción B: Network Inspector

1. Abre **Network tab** en DevTools
2. Filtra por **Fetch/XHR**
3. Haz algo en Suno (ej: click en "Create")
4. Busca requests a `suno.com/api/`
5. Click en el request
6. Ve a **Headers** → **Request Headers**
7. Busca `Authorization: Bearer XXXXX`
8. Copia el token después de "Bearer "

---

## 🎯 Formato Final

Una vez tengas el token, debe verse así:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbHZlemx1...
```

O así:

```
sess_2bXyZ9kQ3mN4pL6rT8vW1cD5fH7jK0gS...
```

**Características del token válido:**
- ✅ Largo (100-500 caracteres)
- ✅ Sin espacios
- ✅ Alfanumérico con puntos o guiones
- ✅ Si es JWT: empieza con `ey`

---

## 💾 Guardar el Token

1. **Copia el token completo**
2. **Guárdalo temporalmente** en un archivo de texto
3. **Lo usarás** cuando ejecutes `./railway-setup.sh`

Si tienes **múltiples cuentas/tokens**:
```
token1,token2,token3
```
Separa con comas, sin espacios.

---

## ❓ Troubleshooting

**No veo cookies:**
- Asegúrate de estar logueado
- Refresh la página (F5)
- Intenta logout y login de nuevo

**Token no funciona:**
- Verifica que copiaste TODO el valor
- Sin espacios al inicio/final
- Prueba con otra cookie/método

**¿Cuánto dura el token?**
- Los JWT tokens expiran (24h-30 días)
- Session tokens pueden durar más
- Si falla después, vuelve a obtener uno nuevo

---

## 🚀 Siguiente Paso

Una vez tengas el token:
```bash
./railway-setup.sh
```

Cuando pregunte por `SUNO_TOKENS`, pega tu token.

---

**Estado**: Esperando que inicies sesión en Suno para obtener el token...
