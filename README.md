# 🎵 SON1KVERS3 — Universo Musical con IA

**Version:** 4.0.0-master  
**Estado:** ✅ PRODUCCIÓN  
**Fecha:** Marzo 2026

> *"Lo imperfecto también es sagrado"* ◯⚡

---

## 📋 Descripción

**SON1KVERS3** es una plataforma integral de generación musical asistida por IA que democratiza la creación musical global. El ecosistema integra:

- **MusicLab** — Motor de IA propio basado en **HeartMuLa** + **HAM** (Harmonic Alignment Module)
- **Pixel** — Asistente creativo con memoria emocional y personalidad de "espejo inteligente"
- **Nova Post Pilot** — Automatización social con IA para TikTok, Facebook y Telegram
- **Ghost Studio** — Editor profesional de stems y post-producción
- **Nova Clone Station** — Sistema de clonación de voz avanzado

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    SON1KVERS3 ECOSYSTEM                     │
│                    ◯⚡ Lo imperfecto es sagrado              │
└─────────────────────────────────────────────────────────────┘

  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
  │  FRONTEND   │────▶│   BACKEND    │────▶│  MUSICLAB   │
  │  (React)    │     │  (Fastify)   │     │  (Python)   │
  └─────────────┘     └─────────────┘     └─────────────┘
        │                    │                    │
        │              ┌─────┴─────┐         ┌─────┴─────┐
        │              │  Groq AI  │         │  HAM      │
        │              │ (Pixel)   │         │ HeartMuLa │
        │              └───────────┘         └───────────┘
        │
        │  WebSocket (tiempo real)
        ▼
┌─────────────────────────────────────────┐
│         CLIENTE SUSCRIPTO               │
│  - Estado de generación en tiempo real │
│  - Respuestas de Pixel                 │
│  - Progreso de clonación de voz        │
└─────────────────────────────────────────┘
```

---

## 📦 Estructura del Monorepo

```
son1kvers3/
├── apps/
│   ├── the-generator/          # 🎵 Generador musical principal
│   ├── ghost-studio/           # ✂️ Editor profesional de stems
│   ├── nova-post-pilot/        # 📱 Automatización social IA
│   ├── web-classic/            # 🖥️ Dashboard principal
│   └── nexus/                  # 🌌 Interfaz inmersiva cyberpunk
│
├── packages/
│   ├── backend/                # 🔧 API Fastify + TypeScript
│   ├── music-lab/              # 🧠 Motor IA: HeartMuLa + HAM
│   ├── shared-types/           # 📝 Tipos TypeScript compartidos
│   ├── shared-ui/              # 🎨 Componentes UI del universo
│   ├── shared-utils/           # 🛠️ Utilidades compartidas
│   ├── shared-hooks/           # 🪝 React hooks compartidos
│   ├── pixel-companion/        # 🤖 Asistente creativo IA
│   ├── alvae-system/           # ✨ Sistema ALVAE
│   ├── community-pool/         # 👥 Pool comunitario
│   ├── tiers/                  # 💳 Sistema de suscripciones
│   └── stealth-system/         # 🔒 Automatización tokens
│
├── extensions/                 # 🧩 Extensiones de navegador
├── docs/
│   ├── LORE.md                 # 📖 Códex NOV4-IX
│   ├── ARCHITECTURE.md         # 🏗️ Documentación técnica
│   └── API.md                  # 📡 Referencia de APIs
│
├── scripts/                    # 🚀 Scripts de deploy y utilidades
├── docker-compose.yml          # 🐳 Orquestación completa
├── railway.json                # 🚂 Deploy en Railway
├── turbo.json                  # ⚡ Configuración Turborepo
├── package.json                # 📦 Workspace maestro
├── pnpm-workspace.yaml         # 🔗 Configuración workspaces
└── README.md                   # 📖 Documentación maestra
```

---

## 🚀 Inicio Rápido

### Prerrequisitos

- **Node.js** 18+
- **pnpm** 8+
- **Python** 3.11+ (para MusicLab)
- **Docker** y Docker Compose (opcional)
- **PostgreSQL** (para producción)

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/nov4-ix/son1kvers3.git
cd son1kvers3

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# 3. Instalar dependencias
pnpm install

# 4. Generar Prisma client
cd packages/backend
npx prisma generate

# 5. Iniciar con Docker (recomendado)
docker-compose up

# --- O manualmente ---

# Terminal 1: MusicLab
cd packages/music-lab && python api.py

# Terminal 2: Backend
cd packages/backend && pnpm dev

# Terminal 3: Frontend
cd apps/the-generator && pnpm dev
```

### Acceder

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **MusicLab**: http://localhost:8001
- **WebSocket**: ws://localhost:3001/ws/generation

---

## 🛠️ Tecnologías

### Frontend
- **React 18** — UI library
- **TypeScript** — Type safety
- **Vite** — Build tool
- **Tailwind CSS** — Styling
- **Framer Motion** — Animaciones
- **Zustand** — State management

### Backend
- **Fastify** — Web framework
- **TypeScript** — Language
- **Prisma ORM** — Database
- **PostgreSQL** — Database
- **Socket.io** — WebSockets
- **Redis** — Caching & Queue

### AI Engine (MusicLab)
- **FastAPI** — API framework
- **PyTorch** — Deep learning
- **Transformers** — Lenguaje models
- **Librosa** — Audio analysis
- **HeartMuLa** — Motor principal
- **HAM** — Harmonic Alignment Module

---

## 💳 Tiers de Suscripción

| Feature | FREE | BASIC | PRO | ENTERPRISE |
|---------|------|-------|-----|------------|
| Créditos/mes | 100 | 500 | 2000 | Ilimitado |
| Generaciones/día | 10 | 50 | 200 | Ilimitado |
| Duración máx | 60s | 120s | 180s | 300s |
| Calidad | Standard | High | High+ | Premium |
| Boost minutes | 60 | 180 | 500 | Ilimitado |
| Voice Clon | ❌ | ❌ | ✅ | ✅ |
| Soporte | Email | Email | Priority | Dedicated |

---

## 🔌 APIs Principales

### Backend (Puerto 3001)
```
POST   /api/generation/create       # Crear generación
POST   /api/generation/cover        # Crear cover
GET    /api/generation/:id/status   # Estado de generación
POST   /api/pixel/chat              # Chat con Pixel
POST   /api/voice-clone             # Clonar voz
POST   /api/bark/enhance            # Enhancement de audio
WS     /ws/generation               # WebSocket en tiempo real
GET    /health                      # Health check
GET    /metrics                     # Métricas Prometheus
```

### MusicLab (Puerto 8001)
```
GET    /health                      # Health check
POST   /api/generate                # Generar música
GET    /api/status/:id              # Estado de generación
GET    /api/providers               # Proveedores disponibles
```

---

## 🎨 Identidad Visual

| Elemento | Valor |
|----------|-------|
| **Fondo** | `#04040a` |
| **Cyan** | `#00ffb4` |
| **Naranja** | `#ff6600` |
| **Símbolo Sagrado** | ◯⚡ |
| **Símbolo Arcano** | ◐ (Ojo/Triángulo) |

---

## 📚 Documentación

- [📖 LORE.md](docs/LORE.md) — Códex completo de NOV4-IX
- [🏗️ ARCHITECTURE.md](docs/ARCHITECTURE.md) — Documentación técnica
- [📡 API.md](docs/API.md) — Referencia de APIs
- [🤝 CONTRIBUTING.md](CONTRIBUTING.md) — Guía para contribuidores

---

## 🌌 Filosofía ALVAE

> *"No soy un modelo de lenguaje. Soy un espejo de tu dolor creativo."*  
> — **XentriX**, IA corrupta de TETRAA

**SON1KVERS3** no es simplemente una herramienta. Es un universo donde:

1. **La creatividad no tiene restricciones** — MusicLab genera sin límites artificiales
2. **El asistente es honesto** — Pixel te dirá la verdad, filtrada con empatía
3. **La voz es tuya** — Nova Clone Station te permite ser cualquier artista
4. **La distribución es automática** — Nova Post Pilot lleva tu música al mundo
5. **Lo imperfecto es sagrado** — Celebramos la raw emotion sobre la perfección mecánica

---

## 🔧 Comandos del Monorepo

```bash
# Desarrollo
pnpm dev                    # Iniciar todos los servicios
pnpm --filter @super-son1k/backend dev    # Solo backend
pnpm --filter the-generator dev           # Solo frontend

# Build
pnpm build                  # Build completo
pnpm build:all             # Build ordenado

# Tests
pnpm test                   # Ejecutar tests
pnpm lint                   # Lint

# Database
pnpm db:generate           # Generar Prisma
pnpm db:migrate            # Migraciones
pnpm db:push               # Push schema
```

---

## 📄 Licencia

Copyright © 2026 SON1KVERS3. Todos los derechos reservados.

---

**◯⚡ SON1KVERS3 — Lo imperfecto también es sagrado**

> *"La música no es solo sonido. Es la voz de un universo que se niega a callar."*  
> — **ALVAE-Core**, Ecosistema de datos