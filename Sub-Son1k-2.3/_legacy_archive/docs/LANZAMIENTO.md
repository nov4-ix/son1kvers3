 
 
 
   # 🚀 LANZAMIENTO - Sub-Son1k-2.3

## ✅ Verificaciones
- **Lógica de Tokens:** ✅ PASÓ (Test unitario exitoso)
- **Nuevos Componentes:** ✅ Implementados
- **Chrome Extension:** ✅ Creada en `extensions/suno-token-captor`

## 🏁 Pasos para Ejecutar

Como la instalación de dependencias puede tardar un poco, aquí tienes los comandos exactos para levantar todo:

### Terminal 1: Backend (Base de Datos y API)
```powershell
# Iniciar base de datos y backend
cd Sub-Son1k-2.3
cd packages\backend
pnpm dev
```
*Debe salir: `🚀 Backend running on http://localhost:3001`*

### Terminal 2: Frontend (The Generator)
```powershell
# Iniciar la interfaz visual
cd apps\the-generator-nextjs
pnpm dev
```
*Abrir: http://localhost:3002*

### Terminal 3: Extensión (Solo una vez)
1. Ve a `chrome://extensions`
2. Activa "Developer Mode"
3. "Load Unpacked" -> Selecciona `extensions\suno-token-captor`

## 🧪 Cómo probar que funciona
1. Con Terminal 1 y 2 corriendo.
2. Abre `suno.com` y logueate (La extensión capturará el token).
3. Ve a `http://localhost:3002`.
4. Deberías ver tus tokens capturados en la configuración.
5. ¡Escribe un prompt y genera!

## ⚠️ Si la instalación sigue corriendo...
Es normal que `pnpm install` tarde la primera vez. Espera a que termine antes de ejecutar `pnpm dev`.
