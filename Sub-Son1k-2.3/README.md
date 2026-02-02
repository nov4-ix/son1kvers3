# 🎵 Son1kvers3 - Plataforma de Generación Musical con IA

**Versión:** 2.3.0  
**Estado:** ✅ PRODUCCIÓN  
**Fecha:** Febrero 2026

---

## 📋 Descripción

Son1kvers3 es una plataforma integral de generación musical asistida por IA que permite crear música única a partir de prompts textuales utilizando tecnología de IA avanzada.

### Características Principales

- 🎼 **Generación Musical IA**: Crea música original a partir de descripciones textuales
- 🔄 **Sistema de Tokens Autosustentable**: Generación automática de tokens Suno
- 👤 **Sistema de Usuarios**: Autenticación con Supabase, tiers de suscripción
- 💳 **Sistema de Créditos**: Credits + Boost con gamificación
- 📊 **Dashboard Multi-Aplicación**: Varias apps integradas en un ecosistema
- 🔐 **WebSocket en Tiempo Real**: Updates live durante la generación
- 📱 **Interfaz Moderna**: React + Vite + Tailwind CSS

---

## 🏗️ Arquitectura

```
son1kvers3/
├── apps/                          # Frontend Applications
│   ├── the-generator/             # Generador musical principal (React + Vite)
│   ├── ghost-studio/              # Studio creativo visual
│   ├── nova-post-pilot/           # Sistema de posting/social
│   └── web-classic/               # Dashboard principal
├── packages/                      # Paquetes Compartidos
│   ├── backend/                   # API Principal (Fastify + TypeScript)
│   ├── shared-types/              # Tipos TypeScript compartidos
│   ├── shared-ui/                 # Componentes UI compartidos
│   ├── shared-utils/              # Utilidades compartidas
│   ├── shared-services/           # Servicios compartidos
│   ├── shared-hooks/              # React hooks compartidos
│   ├── stealth-system/            # Sistema de generación automática de tokens
│   ├── analytics/                 # Sistema de analíticas
│   └── tiers/                     # Sistema de tiers/suscripciones
├── extensions/                    # Extensiones del navegador
└── server/                        # Servidor legacy
```

---

## 🚀 Inicio Rápido

### Prerrequisitos

- **Node.js** 18+ 
- **pnpm** (recomendado) o npm
- **PostgreSQL** (para producción)
- **Redis** (opcional, para colas BullMQ)

### Instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd Sub-Son1k-2.3

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus configuraciones

# 4. Generar cliente Prisma
cd packages/backend
npx prisma generate

# 5. Ejecutar migraciones de base de datos
npx prisma migrate dev

# 6. Iniciar el backend
cd packages/backend
pnpm dev

# 7. En otra terminal, iniciar el frontend
cd apps/the-generator
pnpm dev
```

### Configuración de Variables de Entorno

#### Backend (`packages/backend/.env.local`)

```env
# Base de datos
DATABASE_URL="postgresql://user:password@localhost:5432/son1kvers3"

# Redis (opcional)
REDIS_URL="redis://localhost:6379"

# Supabase
SUPABASE_URL="https://tu-proyecto.supabase.co"
SUPABASE_ANON_KEY="tu-anon-key"
SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key"

# Stripe (pagos)
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Encriptación (generar claves seguras)
ENCRYPTION_KEY="clave-hex-64-caracteres"
TOKEN_ENCRYPTION_KEY="otra-clave-segura"

# Email catch-all (para Stealth Token Generator)
CATCH_ALL_EMAIL_DOMAIN="tu-dominio.com"

# API URLs
GENERATION_API_URL="https://ai.imgkits.com/suno"
GENERATION_POLLING_URL="https://usa.imgkits.com/node-api/suno"
```

#### Frontend (`apps/the-generator/.env.local`)

```env
VITE_BACKEND_URL="http://localhost:3001"
VITE_SUPABASE_URL="https://tu-proyecto.supabase.co"
VITE_SUPABASE_ANON_KEY="tu-anon-key"
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
# Backend
cd packages/backend
pnpm dev              # Desarrollo con hot-reload
pnpm build            # Build de producción
pnpm start            # Iniciar producción
pnpm db:generate      # Generar cliente Prisma
pnpm db:migrate       # Migraciones DB
pnpm db:push          # Push schema a DB
pnpm db:studio        # Abrir Prisma Studio
pnpm lint             # Linting

# Frontend
cd apps/the-generator
pnpm dev              # Desarrollo
pnpm build            # Build producción
pnpm preview          # Preview build
```

### Tests

```bash
# Backend tests
cd packages/backend
pnpm test             # Ejecutar tests
pnpm test:watch       # Tests en watch mode
pnpm test:coverage    # Coverage report
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

## 🔐 Sistema de Tokens Autosustentable

El sistema incluye un **Stealth Token Generator** que:

1. **Genera cuentas Suno automáticamente** cada 24 horas (3-5 cuentas)
2. **Harvest tokens** cada 5 minutos de cuentas activas
3. **Guarda tokens** en `TokenPool` con health tracking
4. **Prioriza tokens** por health score, response time, success rate
5. **Auto-desactiva** tokens con health < 30%

### Monitoreo

```bash
# Ver estado del token pool
curl http://localhost:3001/api/tokens/pool/health
```

---

## 📊 APIs Principales

### Generación

```
POST /api/generation/create
POST /api/generation/cover
GET  /api/generation/:id/status
```

### Tokens

```
GET  /api/tokens/pool/health
GET  /api/tokens/pool/stats
POST /api/tokens/add
```

### Usuario

```
POST /api/auth/register
POST /api/auth/login
GET  /api/user/profile
GET  /api/user/credits
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

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Zustand** - State management
- **React Hook Form** - Forms
- **Zod** - Validation
- **Supabase** - Auth & Database

### Backend
- **Fastify** - Web framework
- **TypeScript** - Language
- **Prisma ORM** - Database
- **PostgreSQL** - Database
- **Redis/BullMQ** - Job queues
- **Puppeteer** - Browser automation
- **Socket.io** - WebSockets
- **Stripe/PayPal** - Payments

---

## 📝 Documentación Adicional

- [README_DEPLOY.md](README_DEPLOY.md) - Guía de deployment
- [SISTEMA_TOKEN_POOL_AUTOSUSTENTABLE.md](SISTEMA_TOKEN_POOL_AUTOSUSTENTABLE.md) - Sistema de tokens
- [WINDOWS_SETUP.md](WINDOWS_SETUP.md) - Setup en Windows
- [docs/](docs/) - Documentación adicional

---

## ⚠️ Notas Importantes

1. **Primera Ejecución**: El sistema generará 10 cuentas iniciales (30-60 minutos)
2. **Email Provider**: Configurar `CATCH_ALL_EMAIL_DOMAIN` para mejor confiabilidad
3. **Encriptación**: Las claves deben ser hex de 64 caracteres mínimo
4. **Producción**: Usar valores reales en producción, no fallbacks

---

## 📄 Licencia

Copyright © 2026 Son1kvers3. Todos los derechos reservados.

---

**🎵 Creando música con IA, sin límites.**
