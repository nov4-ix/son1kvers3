# 🧪 GUÍA DE PRUEBA END-TO-END

**Fecha**: 2025-11-19  
**Deployment**: Production (Vercel)

---

## 📋 CHECKLIST DE PRUEBAS

### ✅ PASO 1: Web Classic - Homepage

**URL**: https://web-classic-39ufz7qmu-son1kvers3s-projects-c805d053.vercel.app

**Qué verificar**:
```
[ ] Página carga sin errores
[ ] Header muestra "XENTRIC CORP" (NO "SON1KVERS3")
[ ] Diseño corporativo: fondo blanco, texto gris oscuro
[ ] Navegación visible con botones:
    [ ] Generator
    [ ] AI Assistant
    [ ] Pricing
[ ] Contenido principal muestra "Audio Technology Solutions"
[ ] Footer presente
```

**Screenshot sugerido**: `1-web-classic-homepage.png`

---

### ✅ PASO 2: Easter Egg - Transición

**Acción**: Presiona `Cmd + Option + H` (Mac) o `Ctrl + Alt + H` (Windows)

**Qué verificar**:
```
[ ] Al presionar la combinación, inicia animación
[ ] Fase 1: Screen shake (temblor de pantalla)
[ ] Fase 2: Blinding whiteout (destello blanco)
[ ] Fase 3: Energy burst (ráfagas de energía)
[ ] Duración total: ~3-4 segundos
[ ] Redirección automática a Nexus Visual
```

**Screenshots sugeridos**:
- `2-easter-egg-shake.png` (captura durante shake)
- `3-easter-egg-whiteout.png` (captura durante whiteout)

---

### ✅ PASO 3: Nexus Visual - Arrival

**URL esperada**: https://nexus-visual-am0iwec7d-son1kvers3s-projects-c805d053.vercel.app

**Qué verificar**:
```
[ ] Página carga después de transición
[ ] **Matrix Rain**: Caracteres cayendo en el fondo
[ ] Tema oscuro/cyberpunk
[ ] Logo o título "SON1KVERS3" visible
[ ] Sidebar con navegación:
    [ ] Dashboard
    [ ] Studio
    [ ] Codex
[ ] Botón "Access Codex" visible
[ ] Selector de idioma (ES/EN) visible
```

**Screenshot sugerido**: `4-nexus-visual-landing.png`

---

### ✅ PASO 4: Codex Viewer

**Acción**: Click en "Access Codex"

**Qué verificar**:
```
[ ] Se abre vista del Codex
[ ] Título: "MAESTRO 2.1 - ATLAS PRIMARIO"
[ ] Secciones expandibles visibles:
    [ ] La Vibración Eterna
    [ ] Atlas Visual Clasificado
    [ ] Guía Operativa
    [ ] Anexos Técnicos
[ ] Click en una sección la expande
[ ] Contenido del lore se muestra
[ ] Animaciones suaves al expandir/contraer
```

**Screenshots sugeridos**:
- `5-codex-closed.png` (vista inicial)
- `6-codex-expanded.png` (con una sección expandida)

---

### ✅ PASO 5: Cambio de Idioma

**Acción**: Click en selector de idioma (ES ↔ EN)

**Qué verificar**:
```
[ ] Selector visible en header
[ ] Click cambia idioma
[ ] Textos de UI se actualizan:
    [ ] Botones
    [ ] Títulos de secciones
    [ ] Navegación
[ ] Cambio es instantáneo
```

**Screenshot sugerido**: `7-language-switch.png`

---

### ✅ PASO 6: Ghost Studio (DAW)

**Acción**: Navega a "Studio" en sidebar

**Qué verificar**:
```
[ ] Vista del DAW carga
[ ] Timeline horizontal visible
[ ] Controles de reproducción:
    [ ] Play/Pause
    [ ] Stop
    [ ] Record
[ ] Track lanes visibles
[ ] Controles de volumen/pan por track
[ ] Plugin rack visible
```

**Screenshot sugerido**: `8-ghost-studio.png`

---

### ✅ PASO 7: Volver a Web Classic - The Generator

**Acción**: Navega de vuelta a Web Classic → Generator

**Qué verificar**:
```
[ ] Página "The Generator" carga
[ ] **Control Literario**: 6 knobs ajustables:
    [ ] Intensidad Emocional
    [ ] Estilo Poético
    [ ] Complejidad de Rimas
    [ ] Profundidad Narrativa
    [ ] Estilo de Lenguaje
    [ ] Intensidad del Tema
[ ] Área de input para letra
[ ] Botón "Generar Letra"
[ ] Área de input para estilo musical
[ ] Botón "Prompt Creativo"
[ ] Configuración de voz (Hombre/Mujer/Random/Dueto)
[ ] Toggle "Instrumental"
[ ] Botón principal "The Generator"
```

**Screenshot sugerido**: `9-the-generator.png`

---

### ✅ PASO 8: Probar Groq AI - Generación de Letra

**Acción**: 
1. Escribe en "Letra": "amor perdido en la ciudad"
2. Ajusta knobs a tu gusto
3. Click "Generar Letra"

**Qué verificar**:
```
[ ] Botón muestra "Generando..." con spinner
[ ] Después de 2-5 segundos, letra aparece
[ ] Letra tiene formato correcto:
    [Verse 1]
    líneas de letra...
    [Chorus]
    líneas de letra...
    etc.
[ ] Toast de éxito: "Letra generada con Groq AI!"
[ ] Si falla, muestra error claro
```

**Screenshot sugerido**: `10-lyrics-generated.png`

---

### ✅ PASO 9: Probar Groq AI - Prompt Musical

**Acción**:
1. Escribe en "Estilo": "pop melancólico con guitarra acústica"
2. Click "Prompt Creativo"

**Qué verificar**:
```
[ ] Botón muestra "Generando..."
[ ] Después de 2-3 segundos, prompt aparece en el textarea
[ ] Prompt es descriptivo y musical
[ ] Formato correcto: "[género], [tempo], [instrumentos], [mood]"
[ ] Máximo 180 caracteres
[ ] Toast: "Prompt musical generado con Groq AI!"
```

**Screenshot sugerido**: `11-prompt-generated.png`

---

### ✅ PASO 10: Pixel AI Chat

**Acción**: Click en "AI Assistant"

**Qué verificar**:
```
[ ] Modal de chat se abre
[ ] Avatar de Pixel AI visible
[ ] Input de mensaje disponible
[ ] Escribe: "Hola, ¿qué puedes hacer?"
[ ] Envía mensaje
[ ] Pixel AI responde en 2-5 segundos
[ ] Respuesta tiene personalidad de Pixel
[ ] Menciona capacidades (música, creatividad, etc.)
```

**Screenshots sugeridos**:
- `12-pixel-chat-open.png`
- `13-pixel-response.png`

---

### ⚠️ PASO 11: Generación de Música (Esperado: Falla)

**Acción**: En The Generator, click "The Generator" (botón principal)

**Qué verificar**:
```
[ ] Botón click funciona
[ ] Muestra "Generando..." con progreso
[ ] EXPECTATIVA: Falla porque backend no está deployed
[ ] Error esperado: "Backend error" o similar
[ ] Error se muestra claramente al usuario
```

**Screenshot sugerido**: `14-music-gen-error.png`

---

## 📊 RESUMEN DE RESULTADOS

Después de completar todas las pruebas, llena esto:

```
✅ Funciona Correctamente:
- [ ] Web Classic carga
- [ ] Diseño corporativo correcto
- [ ] Easter Egg funciona
- [ ] Nexus Visual carga
- [ ] Matrix Rain se ve
- [ ] Codex Viewer funciona
- [ ] Cambio de idioma funciona
- [ ] Ghost Studio carga
- [ ] Generación de letra (Groq) funciona
- [ ] Generación de prompt (Groq) funciona
- [ ] Pixel Gemini Chat funciona

❌ No Funciona (Esperado sin backend):
- [ ] Generación de música

🐛 Bugs Encontrados:
- [Lista aquí cualquier bug inesperado]

📝 Notas Adicionales:
- [Observaciones, mejoras sugeridas, etc.]
```

---

## 🚀 PRÓXIMO PASO DESPUÉS DE PRUEBAS

Si todo lo anterior funciona correctamente:
1. Deploy backend en Railway
2. Actualizar BACKEND_URL en Vercel
3. Probar generación de música end-to-end

---

**Happy Testing!** 🧪✨
