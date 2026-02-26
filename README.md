# 🎵 Son1kvers3 - Plataforma de Generación Musical con IA

**Versión:** 3.0.0  
**Estado:** ✅ PRODUCCIÓN  
**Fecha:** Febrero 2026

---

## 📋 Descripción

Son1kvers3 es una plataforma integral de generación musical asistida por IA que permite crear música única a partir de prompts textuales utilizando **MusicLab** - nuestro motor propio de IA basado en **HeartMuLa** y **HAM** (Harmonic Alignment Module).

### Características Principales

- 🎼 **MusicLab (Motor Principal)**: Generación musical con IA propia usando HeartMuLa + HAM
- 🔄 **Suno API (Fallback)**: Solo se usa si MusicLab no está disponible
- 👤 **Sistema de Usuarios**: Autenticación con Supabase, tiers de suscripción
- 💳 **Sistema de Créditos**: Credits + Boost con gamificación
- 📊 **Dashboard Multi-Aplicación**: Varias apps integradas en un ecosistema
- 🔐 **WebSocket en Tiempo Real**: Updates live durante la generación
- 📱 **Interfaz Moderna**: React + Vite + Tailwind CSS

---

## 🏗️ Arquitectura

```
son1kvers3/
├── music-lab/                      # 🎵 MOTOR PRINCIPAL DE IA
│   ├── api.py                      # API FastAPI de MusicLab
│   ├── main.py                     # Entry point original
│   ├── orchestration/               # HAM (Harmonic Alignment Module)
│   │   ├── engine.py              # Motor de orquestación
│   │   ├── ham.py                 # Módulo de alineación armónica
│   │   └── prompt_builder.py      # Constructor de prompts
│   ├── generators/                 # Generadores de audio
│   │   └── heartmula_generator.py # HeartMuLa Generator
│   └── config.py                   # Configuración
│
├── apps/                           # Frontend Applications
│   ├── the-generator/              # Generador musical principal (React + Vite)
│   ├── ghost-studio/               # Studio creativo visual
│   ├── nova-post-pilot/            # Sistema de posting/social
│   └── web-classic/                # Dashboard principal
│
├── packages/                       # Paquetes Compartidos
│   ├── backend/                    # API Principal (Fastify + TypeScript)
│   ├── shared-types/               # Tipos TypeScript compartidos
│   ├── shared-ui/                  # Componentes UI compartidos
│   ├── shared-utils/               # Utilidades compartidas
│   ├── shared-services/            # Servicios compartidos
│   ├── shared-hooks/              # React hooks compartidos
│   ├── stealth-system/            # Sistema de generación automática de tokens
│   ├── analytics/                 # Sistema de analíticas
│   └── tiers/                     # Sistema de tiers/suscripciones
│
└── extensions/                    # Extensiones del navegador
```

---

## 🔄 Pipeline de Generación Musical

```
┌─────────────────────────────────────────────────────────────┐
│                    SON1KVERS3 PIPELINE                      │
└─────────────────────────────────────────────────────────────┘

  USUARIO
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND (Puerto 5173)                                     │
│  - Prompt + Genre + Mood + Duration                         │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND API (Puerto 3001)                                  │
│  - Valida créditos/tier                                     │
│  - Orquestra generación                                     │
│  - WebSocket updates                                        │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│              MUSIC LAB (Puerto 8001) ◄── MOTOR PRINCIPAL    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ HeartMuLa + HAM (Harmonic Alignment Module)         │   │
│  │ - Prompt enhancement                                │   │
│  │ - Genre/mood analysis                               │   │
│  │ - Harmonic structure generation                     │   │
│  │ - Audio synthesis                                  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
     │
     │ (Fallback si MusicLab falla)
     ▼
┌─────────────────────────────────────────────────────────────┐
│              SUNO API (Puerto 8000) ◄── FALLBACK           │
│  - Solo se usa si MusicLab no está disponible              │
│  - Mantenido por compatibilidad                            │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
  RESULTADO
```

---

## 🚀 Inicio Rápido

### Prerrequisitos

- **Node.js** 18+
- **pnpm** (recomendado) o npm
- **Python** 3.11+ (para MusicLab)
- **PostgreSQL** (para producción)
- **PyTorch** (para MusicLab - opcional, modo simulación disponible)

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/nov4-ix/son1kvers3.git
cd son1kvers3

# 2. Instalar dependencias Node.js
pnpm install

# 3. Instalar dependencias Python (para MusicLab)
cd music-lab
pip install -r requirements.txt

# 4. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus configuraciones

# 5. Iniciar MusicLab (Puerto 8001)
cd music-lab
python api.py

# 6. En otra terminal, iniciar el backend (Puerto 3001)
cd packages/backend
pnpm dev

# 7. En otra terminal, iniciar el frontend (Puerto 5173)
cd apps/the-generator
pnpm dev
```

### Configuración de Variables de Entorno

#### MusicLab (`music-lab/.env`)

```env
# Modo: production | simulation
MUSIC_LAB_MODE=production

# Puerto
PORT=8001
```

#### Backend (`packages/backend/.env`)

```env
# Base de datos
DATABASE_URL="postgresql://user:password@localhost:5432/son1kvers3"

# Redis (opcional)
REDIS_URL="redis://localhost:6379"

# MusicLab (Motor Principal)
MUSIC_LAB_URL=http://localhost:8001
ENABLE_MUSIC_LAB=true

# Suno (Fallback - ya no requerido)
SUNO_API_URL=http://localhost:8000
ENABLE_SUNO_FALLBACK=false

# Supabase
SUPABASE_URL="https://tu-proyecto.supabase.co"
SUPABASE_ANON_KEY="tu-anon-key"

# Stripe (pagos)
STRIPE_SECRET_KEY="sk_live_..."
```

#### Frontend (`apps/the-generator/.env`)

```env
VITE_API_URL=http://localhost:3001
VITE_MUSIC_LAB_URL=http://localhost:8001
```

---

## 📖 Uso de la Aplicación

### 1. Acceder al Generador

```
http://localhost:5173
```

### 2. Crear Cuenta

- Regístrate con email/password o usa OAuth (Google, GitHub)
- El tier FREE incluye 100 créditos iniciales

### 3. Generar Música

1. Escribe un prompt creativo (ej: "Una sinfonía que narre el viaje de una estrella fugaz")
2. Ajusta las "Perillas Literarias":
   - **Intensidad Creativa** (0.0-1.0): Baja = Tradicional, Alta = Experimental
   - **Profundidad Emocional** (0.0-1.0): Baja = Superficial, Alta = Profunda
   - **Nivel Experimental** (0.0-1.0): Baja = Convencional, Alta = Avant-garde
   - **Estilo Narrativo** (0.0-1.0): Baja = Abstracto, Alta = Cinematográfico
3. Opcional: Genera letras con IA
4. Clic en "Generar Música Creativa"
5. Espera la generación (30-120 segundos)
6. Descarga o comparte tu track

### 4. Sistema de Créditos

- **Generación**: 5 créditos por canción
- **Cover**: 10 créditos
- **Boost**: Usa boost minutes para prioridad alta
- **Ganar créditos**: Dailies, referrals, logros

---

## 🔧 Desarrollo

### Estructura de Comandos

```bash
# MusicLab
cd music-lab
python api.py              # Iniciar API

# Backend
cd packages/backend
pnpm dev                   # Desarrollo con hot-reload
pnpm build                 # Build de producción
pnpm start                 # Iniciar producción

# Frontend
cd apps/the-generator
pnpm dev                   # Desarrollo
pnpm build                 # Build producción
pnpm preview               # Preview build
```

### Tests

```bash
# Backend tests
cd packages/backend
pnpm test
pnpm test:watch
```

---

## 🏢 Tiers de Suscripción

| Feature | FREE | BASIC | PRO | ENTERPRISE |
|---------|------|-------|-----|------------|
| Créditos/mes | 100 | 500 | 2000 | Ilimitado |
| Generaciones/día | 10 | 50 | 200 | Ilimitado |
| Duración máx | 60s | 120s | 180s | 300s |
| Calidad | Standard | High | High+ | Premium |
| Boost minutes | 60 | 180 | 500 | Ilimitado |
| Soporte | Email | Email | Priority | Dedicated |

---

## 📊 APIs Principales

### MusicLab

```
GET  /health
POST /api/generate
GET  /api/status/{id}
GET  /api/providers
```

### Generación (Backend)

```
POST /api/generation/create
POST /api/generation/cover
GET  /api/generation/:id/status
```

### WebSocket

```
WS /ws/generation
```

Suscribete a generación:
```json
{"type": "subscribe", "generationId": "tu-id"}
```

---

## 🛠️ Tecnologías

### MusicLab (Python)
- **FastAPI** - API framework
- **PyTorch** - Deep learning
- **Transformers** - Modelos de lenguaje
- **Librosa** - Análisis de audio

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Zustand** - State management

### Backend
- **Fastify** - Web framework
- **TypeScript** - Language
- **Prisma ORM** - Database
- **PostgreSQL** - Database
- **Socket.io** - WebSockets

---

## ⚠️ Notas Importantes

1. **MusicLab es el motor principal** - Suno es solo fallback
2. **Modo simulación** - para testing sin GPU
3. ** AvailablePuerto 8001** - Music estar corriendoLab debe
4. **Puerto 3001** - Backend API
5. **Puerto 5173**---

## 📄 - Frontend

 © 2026 Licencia

Copyright Son1kvers3. Todos los derechos reservados.

---

**🎵 Creando música con IA, sin límites.**
