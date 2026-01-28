# 🎵 THE GENERATOR - GUÍA COMPLETA PARA DESARROLLADORES

> **Última actualización**: Octubre 2024  
> **Versión**: 2.0 (Unified Token Pool + Chrome Extension)  
> **Estado**: ✅ Producción

---

## 📋 TABLA DE CONTENIDOS

1. [¿Qué es The Generator?](#qué-es-the-generator)
2. [Arquitectura General](#arquitectura-general)
3. [Sistema de Tokens (Unified Pool)](#sistema-de-tokens-unified-pool)
4. [Flujo de Generación de Música](#flujo-de-generación-de-música)
5. [APIs y Endpoints](#apis-y-endpoints)
6. [Base de Datos](#base-de-datos)
7. [Extensión Chrome](#extensión-chrome)
8. [Troubleshooting](#troubleshooting)
9. [Deployment](#deployment)

---

## 🎯 ¿QUÉ ES THE GENERATOR?

**The Generator** es una aplicación web que permite generar música con IA usando Suno API. Es parte del ecosistema Son1KVers3.

### Características Principales

- ✅ **Generación de música con IA** (Suno API)
- ✅ **Letras en español** con traducción automática
- ✅ **Pool comunitario de tokens** (auto-rotación)
- ✅ **Extensión Chrome** para captura automática de tokens
- ✅ **Sistema de tiers** (FREE, PRO, PREMIUM, ENTERPRISE)
- ✅ **Polling optimizado** (~30-60 segundos)
- ✅ **Generación instrumental o con letra**
- ✅ **Selección de género de voz** (male, female, random)

### Stack Tecnológico

```
Frontend:  Next.js 14 + TypeScript + Tailwind CSS
Backend:   Next.js API Routes (serverless)
Database:  Supabase PostgreSQL
AI:        Suno API (música) + Groq/Llama 3.1 (traducción)
State:     Zustand (si se usa)
```

---

## 🏗️ ARQUITECTURA GENERAL

```
┌─────────────────────────────────────────────────────────────┐
│                     THE GENERATOR                            │
│                                                              │
│  ┌──────────────┐     ┌──────────────┐    ┌──────────────┐ │
│  │   Frontend   │────▶│  API Routes  │───▶│  Suno API    │ │
│  │  (Next.js)   │     │  (Backend)   │    │ (ai.imgkits) │ │
│  └──────────────┘     └──────────────┘    └──────────────┘ │
│         │                    │                              │
│         │                    ▼                              │
│         │           ┌──────────────────┐                    │
│         │           │ Unified Pool     │                    │
│         │           │ (Token Manager)  │                    │
│         │           └──────────────────┘                    │
│         │                    │                              │
│         ▼                    ▼                              │
│  ┌──────────────────────────────────────┐                  │
│  │         Supabase PostgreSQL          │                  │
│  │  • suno_auth_tokens                  │                  │
│  │  • credit_transactions               │                  │
│  │  • token_usage_analytics             │                  │
│  └──────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
         ▲
         │
    ┌────────────────┐
    │ Chrome Ext     │ (auto-captura tokens)
    └────────────────┘
```

### Componentes Clave

1. **Frontend** (`app/generator/page.tsx`)
   - Interfaz de usuario
   - Form de generación
   - Polling de status
   - Reproducción de audio

2. **API Routes** (`app/api/`)
   - `generate-music/route.ts`: Inicia generación
   - `track-status/route.ts`: Consulta estado
   - `pool/`: Gestión del pool de tokens
   - `community/`: Sistema comunitario

3. **Unified Token Pool** (`lib/unified-token-pool.ts`)
   - Gestión centralizada de tokens Suno
   - Rotación automática (round-robin)
   - Auto-verificación y limpieza
   - Sincronización con Supabase

4. **Base de Datos** (Supabase)
   - Almacenamiento persistente
   - RLS policies
   - Funciones PL/pgSQL
   - Triggers automáticos

---

## 🔐 SISTEMA DE TOKENS (UNIFIED POOL)

### ¿Qué es el Unified Pool?

Sistema **híbrido** que combina:
- Pool de tokens en Supabase (persistente)
- Rotación automática estilo Chrome Extension
- Auto-mantenimiento y limpieza
- Recolección continua de tokens

### Características

```typescript
// lib/unified-token-pool.ts

class UnifiedTokenPool {
  // CORE
  async getToken(): Promise<string>
  async markInvalidAndRotate(token: string): Promise<string>
  
  // MANAGEMENT
  async addToken(token: string, source: 'manual' | 'api' | 'extension')
  async addTokensBatch(tokens: string[], source)
  
  // STATUS
  async getPoolStatus(): Promise<PoolStatus>
  
  // AUTO-PROCESOS (internos)
  private startAutoSync()        // Cada 5 min
  private startAutoVerification() // Cada 30 min
  private startAutoCleanup()     // Cada 1 hora
}
```

### Rotación Round-Robin

```
Token Pool: [T1, T2, T3, T4, T5]
              ↑
         currentIndex

Llamada 1: T1 → currentIndex = 1
Llamada 2: T2 → currentIndex = 2
Llamada 3: T3 → currentIndex = 3
...
Llamada 5: T5 → currentIndex = 0 (vuelve al inicio)
```

### Metadata de Tokens

```typescript
interface TokenMetadata {
  id: string
  token: string              // JWT completo
  issuer: string             // Issuer del JWT
  expires_at: string         // Fecha de expiración
  is_active: boolean         // ¿Activo?
  usage_count: number        // Cuántas veces usado
  last_used: string          // Última vez usado
  health_status: 'healthy' | 'degraded' | 'expired'
  source: 'manual' | 'api' | 'pool' | 'extension'
  created_at: string
}
```

### Auto-Mantenimiento

#### 1. Auto-Sync (cada 5 min)
```typescript
// Sincroniza tokens desde Supabase
await syncTokensFromDB()
```

#### 2. Auto-Verification (cada 30 min)
```typescript
// Verifica que cada token sea válido
for (const token of activeTokens) {
  const isValid = await verifyToken(token)
  if (!isValid) {
    await markInvalidAndRotate(token)
  }
}
```

#### 3. Auto-Cleanup (cada 1 hora)
```typescript
// Marca tokens expirados como inactivos
UPDATE suno_auth_tokens
SET is_active = false, health_status = 'expired'
WHERE expires_at < NOW()
```

---

## 🎵 FLUJO DE GENERACIÓN DE MÚSICA

### Paso a Paso

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USUARIO ESCRIBE LETRA Y ESTILO                           │
│    Input: prompt (letra en español), lyrics (estilo)        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. FRONTEND ENVÍA A /api/generate-music                     │
│    POST { prompt, lyrics, voice, instrumental }             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. API OBTIENE TOKEN DEL POOL                               │
│    const token = await tokenPool.getToken()                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. TRADUCIR ESTILO A INGLÉS (Groq/Llama)                    │
│    translatedStyle = await translateToEnglish(lyrics)       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. CONSTRUIR PAYLOAD PARA SUNO                              │
│    payload = {                                              │
│      prompt: `[${translatedStyle}]\n\n${prompt}`,          │
│      lyrics: "",                                            │
│      customMode: true,                                      │
│      instrumental: false,                                   │
│      gender: "male"                                         │
│    }                                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. LLAMAR A SUNO API                                         │
│    POST https://ai.imgkits.com/suno/generate                │
│    Authorization: Bearer {token}                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. SUNO DEVUELVE taskId                                      │
│    { task_id: "002f83u49", status: "running" }             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. FRONTEND INICIA POLLING                                   │
│    Intervalos progresivos: 2s → 3s → 5s → 10s              │
│    GET /api/track-status?trackId={task_id}                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. API CONSULTA STATUS EN SUNO                              │
│    GET https://usa.imgkits.com/node-api/suno/               │
│        get_mj_status/{taskId}                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 10. CUANDO callbackType === "complete"                      │
│     Construir URL: https://cdn1.suno.ai/{clipId}.mp3       │
│     Devolver audioUrl al frontend                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 11. FRONTEND REPRODUCE AUDIO                                │
│     <audio src={audioUrl} />                                │
└─────────────────────────────────────────────────────────────┘
```

### Código Simplificado

```typescript
// app/api/generate-music/route.ts
export async function POST(req: NextRequest) {
  const { prompt, lyrics, voice, instrumental } = await req.json()
  
  // 1. Obtener token del pool
  const token = await tokenPool.getToken()
  
  // 2. Traducir estilo a inglés
  const translatedStyle = await translateToEnglish(lyrics)
  
  // 3. Construir payload
  const payload = {
    prompt: `[${translatedStyle}]\n\n${prompt}`,
    lyrics: "",
    customMode: !instrumental,
    instrumental,
    gender: voice
  }
  
  // 4. Llamar a Suno
  const response = await fetch('https://ai.imgkits.com/suno/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'channel': 'node-api'
    },
    body: JSON.stringify(payload)
  })
  
  // 5. Manejar token inválido (401)
  if (response.status === 401) {
    const newToken = await tokenPool.markInvalidAndRotate(token)
    // Reintentar con nuevo token...
  }
  
  // 6. Extraer taskId
  const data = await response.json()
  const taskId = data.task_id
  
  // 7. Devolver taskId al frontend
  return NextResponse.json({ trackId: taskId })
}
```

### Polling Optimizado

```typescript
// app/generator/page.tsx
const pollTrackStatus = async (trackId: string) => {
  const maxTime = 3 * 60 * 1000 // 3 minutos
  let attempts = 0
  
  // Intervalos progresivos
  const getNextInterval = (elapsed: number): number => {
    if (elapsed < 10000) return 2000      // 0-10s: cada 2s
    if (elapsed < 30000) return 3000      // 10-30s: cada 3s
    if (elapsed < 60000) return 5000      // 30-60s: cada 5s
    return 10000                          // 60s+: cada 10s
  }
  
  const checkStatus = async () => {
    const res = await fetch(`/api/track-status?trackId=${trackId}`)
    const data = await res.json()
    
    if (data.status === 'complete' && data.audioUrl) {
      // ✅ Música lista!
      setAudioUrl(data.audioUrl)
      return
    }
    
    // Continuar polling
    const interval = getNextInterval(Date.now() - startTime)
    setTimeout(checkStatus, interval)
  }
  
  checkStatus()
}
```

---

## 🔌 APIS Y ENDPOINTS

### 1. Generate Music

**Endpoint**: `POST /api/generate-music`

**Request**:
```json
{
  "prompt": "Letra de la canción en español",
  "lyrics": "indie rock, upbeat, energético",
  "voice": "male" | "female" | "random",
  "instrumental": false
}
```

**Response**:
```json
{
  "trackId": "002f83u49",
  "status": "processing",
  "message": "Generación iniciada exitosamente"
}
```

**Errores**:
- `400`: Prompt requerido
- `503`: No tokens disponibles
- `500`: Error en Suno API

---

### 2. Track Status

**Endpoint**: `GET /api/track-status?trackId={id}`

**Response (procesando)**:
```json
{
  "trackId": "002f83u49",
  "status": "processing",
  "audioUrl": null,
  "progress": 50
}
```

**Response (completo)**:
```json
{
  "trackId": "002f83u49",
  "status": "complete",
  "audioUrl": "https://cdn1.suno.ai/3b228...mp3",
  "audioUrls": ["https://cdn1.suno.ai/3b228...mp3", "https://cdn1.suno.ai/7f891...mp3"],
  "progress": 100
}
```

**Status posibles**:
- `processing`: Aún generando
- `first_ready`: Primer track listo (optimización)
- `complete`: Todos los tracks listos

---

### 3. Pool Stats

**Endpoint**: `GET /api/pool/stats`

**Response**:
```json
{
  "total": 15,
  "active": 12,
  "expired": 3,
  "healthy": 10,
  "degraded": 2,
  "nextExpiration": "2025-10-15T10:30:00Z",
  "needsRefresh": false
}
```

---

### 4. Add Token

**Endpoint**: `POST /api/pool/add`

**Request**:
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGci...",
  "source": "manual" | "extension"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Token agregado exitosamente"
}
```

---

### 5. Contribute Token (Community)

**Endpoint**: `POST /api/community/contribute-token`

**Request**:
```json
{
  "userId": "uuid-here",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGci..."
}
```

**Response**:
```json
{
  "success": true,
  "credits": 50,
  "message": "Token agregado al pool comunitario. +50 créditos!"
}
```

---

## 💾 BASE DE DATOS

### Estructura

```
Supabase PostgreSQL

├── suno_auth_tokens          (Tabla principal de tokens)
├── credit_transactions       (Sistema de créditos)
├── token_usage_analytics     (Analytics de uso)
├── get_user_balance()        (Función: obtener balance)
├── consume_credits()         (Función: consumir créditos)
├── grant_credits()           (Función: otorgar créditos)
├── get_community_stats()     (Función: stats del pool)
└── contributor_leaderboard   (Vista: top contribuyentes)
```

### Tabla: suno_auth_tokens

```sql
CREATE TABLE suno_auth_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT UNIQUE NOT NULL,
  issuer TEXT,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMPTZ,
  health_status TEXT DEFAULT 'healthy', -- 'healthy', 'degraded', 'expired'
  source TEXT DEFAULT 'manual', -- 'manual', 'api', 'extension'
  owner_user_id UUID REFERENCES auth.users(id),
  is_community BOOLEAN DEFAULT true,
  contribution_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: credit_transactions

```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount INTEGER NOT NULL, -- +50 = ganó, -10 = gastó
  type TEXT NOT NULL, -- 'contribution', 'generation', 'bonus', 'refund', 'purchase'
  description TEXT,
  related_token_id UUID REFERENCES suno_auth_tokens(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: token_usage_analytics

```sql
CREATE TABLE token_usage_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  token_used TEXT, -- Solo primeros 20 chars
  action TEXT DEFAULT 'generation',
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

### Funciones PL/pgSQL

#### get_user_balance(userId)

```sql
SELECT get_user_balance('user-uuid-here');
-- Retorna: 150 (créditos disponibles)
```

#### consume_credits(userId, amount, description)

```sql
SELECT consume_credits(
  'user-uuid',
  10,
  'Generación de música indie rock'
);

-- Retorna:
-- {
--   "success": true,
--   "previous_balance": 150,
--   "new_balance": 140,
--   "consumed": 10
-- }
```

#### grant_credits(userId, amount, type, description, tokenId)

```sql
SELECT grant_credits(
  'user-uuid',
  50,
  'contribution',
  'Token contribuido al pool',
  'token-uuid'
);

-- Retorna:
-- {
--   "success": true,
--   "previous_balance": 100,
--   "new_balance": 150,
--   "granted": 50
-- }
```

#### get_community_stats()

```sql
SELECT get_community_stats();

-- Retorna:
-- {
--   "pool": {
--     "total_tokens": 25,
--     "active_tokens": 18,
--     "inactive_tokens": 7
--   },
--   "community": {
--     "total_contributors": 12,
--     "total_contributions": 35
--   },
--   "usage": {
--     "total_generations": 1247
--   }
-- }
```

### RLS Policies

```sql
-- Usuarios pueden ver sus propios créditos
CREATE POLICY "Users can view own transactions"
ON credit_transactions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Service role tiene acceso completo
CREATE POLICY "Service role full access"
ON suno_auth_tokens
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

---

## 🔧 EXTENSIÓN CHROME

### Ubicación

```
/suno-extension-son1kvers3/
├── manifest.json
├── background.js
├── content-suno.js
├── content-son1k.js
├── popup.html
├── popup.js
└── README.md
```

### Funcionalidad

1. **Auto-creación de cuentas Suno** (background.js)
2. **Captura automática de tokens** (content-suno.js)
3. **Envío de tokens al pool** (background.js → API)
4. **Comunicación con Son1KVers3** (content-son1k.js)

### Flujo

```
Usuario instala extensión
         │
         ▼
background.js detecta instalación
         │
         ▼
Abre suno.com/signup en background
         │
         ▼
content-suno.js inyectado
         │
         ▼
Auto-completa formulario signup
         │
         ▼
Intercepta request con JWT token
         │
         ▼
Envía token a background.js
         │
         ▼
POST /api/community/auto-capture
         │
         ▼
Token agregado al pool ✅
```

### Comunicación con Web App

```typescript
// content-son1k.js (inyectado en son1kvers3.com)
window.addEventListener('message', (event) => {
  if (event.data.type === 'SON1K_REQUEST_USER_INFO') {
    chrome.runtime.sendMessage({
      type: 'GET_USER_INFO'
    }, (response) => {
      window.postMessage({
        type: 'SON1K_USER_INFO',
        userId: response.userId,
        userTier: response.userTier
      }, '*')
    })
  }
})

// Frontend (ExtensionInstaller.tsx)
window.postMessage({
  type: 'SON1K_REQUEST_USER_INFO'
}, '*')

window.addEventListener('message', (event) => {
  if (event.data.type === 'SON1K_USER_INFO') {
    console.log('User:', event.data.userId)
    console.log('Tier:', event.data.userTier)
  }
})
```

---

## 🐛 TROUBLESHOOTING

### Error: "No tokens available"

**Causa**: Pool de tokens vacío

**Solución**:
```sql
-- Ver tokens en DB
SELECT * FROM suno_auth_tokens WHERE is_active = true;

-- Si está vacío, agregar tokens manualmente:
-- 1. Ve al dashboard admin
-- 2. Agrega tokens desde "Pool Management"
-- O instala la extensión Chrome
```

---

### Error: "Token inválido (401)"

**Causa**: Token expirado o revocado

**Solución**:
```typescript
// El sistema auto-rota automáticamente, pero puedes forzar:
const newToken = await tokenPool.markInvalidAndRotate(invalidToken)
```

---

### Error: "Polling timeout (3 minutos)"

**Causa**: Suno API lenta o sobrecargada

**Solución**:
1. Verificar en Suno.com si la generación existe
2. Reintentar
3. Verificar logs en consola

---

### Error: "Audio URL no funciona"

**Causa**: CDN de Suno no disponible o URL mal construida

**Solución**:
```typescript
// Verificar estructura de respuesta
console.log('callbackType:', data.data.callbackType)
console.log('clips:', data.data.data)

// URL correcta debe ser:
// https://cdn1.suno.ai/{clipId}.mp3
```

---

### Error: "GROQ_API_KEY no configurada"

**Causa**: Variable de entorno faltante

**Solución**:
```bash
# En .env.local
GROQ_API_KEY=gsk_xxxxxxxxxxxxx
```

---

## 🚀 DEPLOYMENT

### Requisitos Previos

```bash
# 1. Variables de entorno
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_KEY=eyJxxx...
GROQ_API_KEY=gsk_xxx...
SUNO_COOKIE=eyJ0eXAiOiJKV1QiLCJhbGci... (opcional, el pool tiene tokens)

# 2. Base de datos
# Ejecutar migraciones en Supabase:
# - 001_create_suno_tokens.sql
# - 002_unified_token_pool.sql
# - 003_community_system.sql
```

### Deploy en Vercel

```bash
# 1. Conectar repo
vercel link

# 2. Configurar variables de entorno
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_KEY
vercel env add GROQ_API_KEY

# 3. Deploy
vercel --prod
```

### Deploy en Netlify

```bash
# 1. Build command
npm run build

# 2. Publish directory
.next

# 3. Environment variables
# Agregar en Netlify Dashboard → Site settings → Environment
```

### Post-Deployment Checklist

```bash
# 1. Verificar APIs
curl https://son1kvers3.com/api/pool/stats

# 2. Agregar tokens al pool
# Ir a dashboard admin y agregar tokens manualmente
# O instalar extensión Chrome

# 3. Probar generación
# Ir a https://son1kvers3.com/generator
# Generar una canción de prueba

# 4. Verificar polling
# Consola debe mostrar: "⚡ OPTIMIZADO: Intervalos progresivos"
```

---

## 📚 RECURSOS ADICIONALES

### Documentos Relacionados

- `GUIA_COMPLETA_UNIFIED_POOL.md`: Detalles técnicos del pool
- `OPTIMIZACION_POLLING.md`: Cómo funciona el polling optimizado
- `EXTENSION_CHROME_COMPLETADA.md`: Documentación de la extensión
- `SISTEMA_COMUNITARIO_TOKENS.md`: Sistema de créditos y contribuciones

### APIs Externas

- **Suno API**: `https://ai.imgkits.com/suno/generate`
- **Suno Status**: `https://usa.imgkits.com/node-api/suno/get_mj_status/{taskId}`
- **Groq API**: `https://api.groq.com/openai/v1/chat/completions`

### Contacto

- **Proyecto**: Son1KVers3
- **Repositorio**: `/Users/nov4-ix/Downloads/SSV-ALFA`
- **Actualizado**: Octubre 2024

---

## 🎯 QUICK START (Para Nuevos Desarrolladores)

```bash
# 1. Clonar proyecto
cd /Users/nov4-ix/Downloads/SSV-ALFA/apps/the-generator

# 2. Instalar dependencias
npm install

# 3. Configurar .env.local
cp env.local.example .env.local
# Editar .env.local con tus keys

# 4. Ejecutar migraciones
# Abrir Supabase SQL Editor
# Copiar contenido de database/migrations/*.sql
# Ejecutar en orden: 001 → 002 → 003

# 5. Agregar tokens al pool
# Opción A: Dashboard admin
# Opción B: Instalar extensión Chrome

# 6. Ejecutar en desarrollo
npm run dev

# 7. Abrir navegador
open http://localhost:3000/generator

# 8. Generar música de prueba
# Prompt: "Una canción de rock energético"
# Lyrics: "indie rock, upbeat, electric guitars"
# Voz: male
# Click "Generar"

# 9. Ver logs en consola
# Debe mostrar polling optimizado y audio URL al terminar
```

---

## ✅ CHECKLIST DE COMPRENSIÓN

Después de leer esta guía, deberías poder responder:

- [ ] ¿Qué es el Unified Token Pool y cómo funciona?
- [ ] ¿Cuál es el flujo completo de generación de música?
- [ ] ¿Qué hace la extensión Chrome?
- [ ] ¿Cómo funciona el polling optimizado?
- [ ] ¿Qué endpoints API existen y para qué sirven?
- [ ] ¿Cómo se estructura la base de datos?
- [ ] ¿Cómo agregar tokens al pool?
- [ ] ¿Cómo hacer deployment a producción?
- [ ] ¿Cómo debuggear errores comunes?

Si respondiste SÍ a todas, ¡estás listo para desarrollar! 🚀

---

**Última actualización**: Octubre 2024  
**Autor**: Equipo Son1KVers3  
**Licencia**: Privado

