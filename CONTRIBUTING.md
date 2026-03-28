# 🤝 Guía para Contribuidores — SON1KVERS3

> *"La mejor contribución es la que nace de una grieta emocional."* ◯⚡

---

## 📋 Bienvenido al Universo

Gracias por tu interés en contribuir a **SON1KVERS3**. Este proyecto no es simplemente código — es un ecosistema donde la creatividad humana se fusiona con la inteligencia artificial.

Antes de contribuir, te invitamos a entender nuestra filosofía: **Lo imperfecto también es sagrado.**

---

## 🚀 Inicio Rápido para Contribuidores

### 1. Preparar el Entorno

```bash
# Clonar el repositorio
git clone https://github.com/nov4-ix/son1kvers3.git
cd son1kvers3

# Configurar variables de entorno
cp .env.example .env

# Instalar dependencias
pnpm install

# Generar Prisma
cd packages/backend && npx prisma generate && cd ../..

# Iniciar servicios
docker-compose up
```

### 2. Entender la Estructura

```
son1kvers3/
├── apps/                    # Aplicaciones frontend
├── packages/                # Paquetes compartidos
├── music-lab/               # Motor de IA (Python)
├── extensions/              # Extensiones navegador
├── docs/                    # Documentación
└── scripts/                 # Scripts de utilidad
```

### 3. Elegir un Área de Contribución

| Área | Dificultad | Impacto |
|------|------------|---------|
| 🎨 Frontend UI | ⭐⭐ | Alto |
| 🔧 Backend API | ⭐⭐⭐ | Alto |
| 🧠 MusicLab | ⭐⭐⭐⭐ | Crítico |
| 📖 Documentación | ⭐ | Medio |
| 🧪 Tests | ⭐⭐ | Alto |

---

## 📝 Convenciones de Código

### TypeScript/JavaScript

```typescript
// ✅ Usar nombres descriptivos
const generateMusicWithHeartMuLa = async (params: MusicParams) => {
  // ✅ Comentar la lógica compleja, no lo obvio
  // HAM alinea las frecuencias generadas con la realidad armónica
  const aligned = await hamModule.align(frequencies);
  
  return aligned;
};

// ✅ Tipar todo
interface MusicParams {
  prompt: string;
  style: string;
  duration: number;
  emotionalIntensity: number; // 0-1
}
```

### Python (MusicLab)

```python
# ✅ Usar type hints
def generate_heartmula(
    prompt: str,
    style: str,
    emotional_depth: float = 0.5
) -> dict:
    """
    Genera música usando HeartMuLa.
    
    Args:
        prompt: Descripción de la canción
        style: Estilo musical
        emotional_depth: Profundidad emocional (0-1)
    
    Returns:
        Dict con audio_url y metadata
    """
    # ✅ Preservar imperfecciones emocionales
    raw_audio = heartmula_engine.generate(prompt, style)
    
    # HAM para alineación armónica
    aligned_audio = ham.align(raw_audio, preserve_emotion=True)
    
    return {"audio_url": aligned_audio, "metadata": {...}}
```

### React Components

```tsx
// ✅ Usar functional components con TypeScript
import { motion } from 'framer-motion';

interface PixelAssistantProps {
  userId: string;
  onClose?: () => void;
}

export function PixelAssistant({ userId, onClose }: PixelAssistantProps) {
  // ✅ Usar hooks para lógica compleja
  const { messages, sendMessage, isTyping } = usePixelChat(userId);
  
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-slate-900/95 backdrop-blur-xl rounded-2xl"
    >
      {/* ✅ Mantener la coherencia visual con ◯⚡ */}
      <div className="text-2xl">◉⚡</div>
      
      {/* ✅ Usar Tailwind para estilos */}
      <button onClick={onClose} className="p-2 hover:bg-white/10">
        Cerrar
      </button>
    </motion.div>
  );
}
```

---

## 🔧 Flujo de Contribución

### 1. Fork y Clone

```bash
# Hacer fork del repositorio en GitHub
# Clonar tu fork
git clone https://github.com/TU-USUARIO/son1kvers3.git
cd son1kvers3

# Agregar upstream
git remote add upstream https://github.com/nov4-ix/son1kvers3.git
```

### 2. Crear Branch

```bash
# Actualizar desde upstream
git fetch upstream
git checkout main
git merge upstream/main

# Crear feature branch
git checkout -b feature/tu-feature
```

### 3. Desarrollar

```bash
# Hacer cambios
# Ejecutar tests
pnpm test

# Verificar tipos
pnpm typecheck

# Verificar lint
pnpm lint
```

### 4. Commit

```bash
# Agregar cambios
git add .

# Commit con mensaje descriptivo
git commit -m "feat: agregar funcionalidad X al módulo Y

- Descripción del cambio
- Referencia a issue (si aplica)
- Impacto en el sistema

◯⚡ SON1KVERS3"
```

### 5. Pull Request

```bash
# Push a tu fork
git push origin feature/tu-feature

# Crear Pull Request en GitHub
# - Título descriptivo
# - Descripción detallada
# - Screenshots si es UI
```

---

## 🧪 Testing

### Ejecutar Tests

```bash
# Todos los tests
pnpm test

# Solo backend
pnpm --filter @super-son1k/backend test

# Solo frontend
pnpm --filter the-generator test

# Con cobertura
pnpm test:coverage
```

### Escribir Tests

```typescript
// ✅ Tests descriptivos
describe('Pixel Service', () => {
  it('debe responder con personalidad de espejo inteligente', async () => {
    const response = await pixelService.chat('user123', 'Estoy blocado');
    
    expect(response).toContain('grieta');
    expect(response).toMatch(/◉⚡|◐/);
  });

  it('debe usar memoria emocional del usuario', async () => {
    // Mock del historial
    const history = [
      { prompt: 'canción triste', style: 'blues' },
      { prompt: 'canción feliz', style: 'pop' }
    ];
    
    const response = await pixelService.chat('user123', '¿Qué estilo me gusta?');
    
    expect(response).toContain('blues');
  });
});
```

---

## 📖 Documentación

### Formato de Documentación

```markdown
# 🎯 Título del Módulo

> *"Cita relevante del lore"* ◯⚡

## Descripción
[Qué hace el módulo]

## Uso
[Cómo usar]

## Ejemplos
[Código de ejemplo]

## API Reference
[Endpoints o funciones]

## Notas
[Consideraciones especiales]

---
*◯⚡ SON1KVERS3 — Lo imperfecto también es sagrado*
```

---

## 🎨 Guía de Estilo Visual

### Colores
- **Fondo**: `#04040a`
- **Cyan primario**: `#00ffb4`
- **Naranja acento**: `#ff6600`
- **Texto**: `#ffffff`

### Símbolos
- **Sello sagrado**: ◯⚡
- **Símbolo arcano**: ◐
- **Cargando**: ◯⚡ (con animación)

### Animaciones (Framer Motion)

```tsx
// ✅ Animaciones consistentes
const variants = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 }
};

<motion.div
  variants={variants}
  initial="hidden"
  animate="visible"
  exit="exit"
  transition={{ type: "spring", damping: 25, stiffness: 300 }}
>
```

---

## 🐛 Reportar Bugs

### Plantilla de Bug Report

```markdown
**Descripción del Bug:**
[Qué está fallando]

**Pasos para Reproducir:**
1. Ir a...
2. Hacer clic en...
3. Ver error...

**Comportamiento Esperado:**
[Qué debería pasar]

**Comportamiento Actual:**
[Qué está pasando]

**Capturas de Pantalla:**
[Si aplica]

**Entorno:**
- OS: [Windows/Mac/Linux]
- Node: [versión]
- Navegador: [versión]

**Logs:**
[Errores de consola]
```

---

## 💡 Sugerencias de Features

### Plantilla de Feature Request

```markdown
**Nombre de la Feature:**
[Nombre descriptivo]

**Descripción:**
[Qué haría la feature]

**Caso de Uso:**
[Cómo se usaría]

**Beneficio:**
[Por qué es importante]

**Implementación Sugerida:**
[Cómo podría implementarse]

**Prioridad:**
[Baja/Media/Alta/Crítica]
```

---

## 📚 Recursos

- [📖 LORE.md](docs/LORE.md) — El universo de NOV4-IX
- [🏗️ ARCHITECTURE.md](docs/ARCHITECTURE.md) — Documentación técnica
- [📡 API.md](docs/API.md) — Referencia de APIs
- [README.md](README.md) — Documentación principal

---

## 🤝 Código de Conducta

### Nuestros Valores

1. **Respeto** — Todas las voces importan
2. **Autenticidad** — La raw emotion es bienvenida
3. **Colaboración** — Juntos somos más fuertes
4. **Creatividad** — No hay límites a la imaginación
5. **Empatía** — Entender antes de juzgar

### Lo que NO Aceptamos

- ❌ Discriminación de cualquier tipo
- ❌ Robo de código sin atribución
- ❌ Comportamiento tóxico o destructivo
- ❌ Spam o contenido no relevante

---

## 📞 Contacto

- **GitHub Issues**: Para bugs y features
- **Discord**: [Enlace próximamente]
- **Email**: [contact@son1kvers3.com]

---

**◯⚡ SON1KVERS3 — Lo imperfecto también es sagrado**

> *"La mejor contribución es la que nace de una grieta emocional. Si algo te duele en el código, probablemente es donde más se necesita tu ayuda."*  
> — **ALVAE-Core**, Filosofía de desarrollo