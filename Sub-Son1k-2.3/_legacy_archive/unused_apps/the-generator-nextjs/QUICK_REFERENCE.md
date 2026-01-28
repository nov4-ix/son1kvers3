# 🎵 THE GENERATOR - REFERENCIA RÁPIDA

> Guía de bolsillo para desarrolladores. Para detalles completos ver `DEVELOPER_GUIDE.md`

---

## 🚀 INICIO RÁPIDO

```bash
cd apps/the-generator
npm install
cp env.local.example .env.local
npm run dev
```

---

## 📂 ARCHIVOS CLAVE

```
apps/the-generator/
├── app/api/
│   ├── generate-music/route.ts    ← 🎵 Genera música
│   ├── track-status/route.ts      ← 🔍 Check status
│   └── generate-lyrics/route.ts   ← 📝 Genera letras
├── lib/unified-token-pool.ts      ← 🔑 Pool de tokens (CORE)
└── app/generator/page.tsx         ← 🎨 Frontend
```

---

## 🔑 TOKEN POOL (Uso Básico)

```typescript
import { getUnifiedTokenPool } from '@/lib/unified-token-pool'

// Obtener token
const pool = getUnifiedTokenPool()
const token = await pool.getToken()

// Si token inválido (401), auto-rotar
if (response.status === 401) {
  const newToken = await pool.markInvalidAndRotate(token)
}

// Ver stats
const stats = await pool.getPoolStatus()
// { total: 15, active: 12, healthy: 10 }
```

---

## 🎵 GENERAR MÚSICA

```typescript
// Frontend
const response = await fetch('/api/generate-music', {
  method: 'POST',
  body: JSON.stringify({
    prompt: "Letra en español",
    lyrics: "indie rock, energético",
    voice: "male",
    instrumental: false
  })
})

const { trackId } = await response.json()

// Polling
const checkStatus = async () => {
  const res = await fetch(`/api/track-status?trackId=${trackId}`)
  const data = await res.json()
  
  if (data.status === 'complete') {
    setAudioUrl(data.audioUrl) // ✅ Listo!
  } else {
    setTimeout(checkStatus, 2000) // Continuar
  }
}
```

---

## 📝 GENERAR LETRAS

```typescript
const response = await fetch('/api/generate-lyrics', {
  method: 'POST',
  body: JSON.stringify({
    input: "Una canción de amor triste"
  })
})

const { lyrics } = await response.json()

// Resultado:
// [Verse 1]
// El viento sopla fuerte
// Me lleva lejos de ti
// ...
```

---

## 🗄️ BASE DE DATOS

### Obtener balance de usuario
```sql
SELECT get_user_balance('user-uuid');
-- Retorna: 150 (créditos)
```

### Ver tokens activos
```sql
SELECT * FROM suno_auth_tokens 
WHERE is_active = true 
ORDER BY expires_at DESC;
```

### Agregar token manualmente
```sql
INSERT INTO suno_auth_tokens (token, issuer, expires_at, source)
VALUES (
  'eyJxxx...',
  'issuer-id',
  '2025-12-31T23:59:59Z',
  'manual'
);
```

---

## 🔧 ENDPOINTS API

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/generate-music` | POST | Genera música con Suno |
| `/api/track-status?trackId=xxx` | GET | Consulta estado |
| `/api/generate-lyrics` | POST | Genera letras con IA |
| `/api/pool/stats` | GET | Stats del pool |
| `/api/pool/add` | POST | Agregar token |
| `/api/community/contribute-token` | POST | Contribuir token |

---

## ⚡ POLLING OPTIMIZADO

```typescript
// Intervalos progresivos (2s → 10s)
const getNextInterval = (elapsed: number): number => {
  if (elapsed < 10000) return 2000      // 0-10s
  if (elapsed < 30000) return 3000      // 10-30s
  if (elapsed < 60000) return 5000      // 30-60s
  return 10000                          // 60s+
}
```

**Resultado**: De 150 requests (5 min) → 28 requests (3 min max)

---

## 🎤 LETRAS OPTIMIZADAS

### Reglas
- ✅ Líneas cortas: 6-8 palabras máximo
- ✅ Cantables en 2-3 segundos
- ✅ Validación automática divide líneas largas

### Ejemplo
```
❌ ANTES:
"El viento sopla tan fuerte que me lleva lejos de aquí"

✅ DESPUÉS:
"El viento sopla tan fuerte"
"Me lleva lejos de aquí"
```

---

## 🐛 ERRORES COMUNES

### "No tokens available"
```bash
# Solución: Agregar tokens al pool
# Opción 1: Dashboard admin
# Opción 2: Instalar extensión Chrome
```

### "Token inválido (401)"
```typescript
// Auto-rotación implementada
// Verificar logs para confirmar
```

### "Polling timeout"
```typescript
// Aumentar maxTime si es necesario
const maxTime = 3 * 60 * 1000 // 3 min (default)
```

---

## 🔐 VARIABLES DE ENTORNO

```bash
# .env.local (mínimo requerido)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_KEY=eyJxxx...
GROQ_API_KEY=gsk_xxx...

# Opcional (el pool tiene tokens)
SUNO_COOKIE=eyJxxx...
```

---

## 📊 ESTRUCTURA DE RESPUESTAS

### Suno Generate
```json
{
  "task_id": "002f83u49",
  "response": {
    "data": {
      "taskId": "3b228..."
    }
  },
  "status": "running"
}
```

### Track Status (completo)
```json
{
  "code": 200,
  "data": {
    "callbackType": "complete",
    "data": [
      {
        "id": "3b228...",
        "audio_url": "https://cdn1.suno.ai/3b228.mp3"
      }
    ]
  }
}
```

---

## 🎯 CHECKLIST PRE-COMMIT

- [ ] TypeScript sin errores (`npm run build`)
- [ ] Linter limpio (`npm run lint`)
- [ ] Error handling implementado (try-catch)
- [ ] Logs informativos (console.log con emojis)
- [ ] No hardcodear tokens
- [ ] Usar `getUnifiedTokenPool()` para tokens
- [ ] Polling optimizado (intervalos progresivos)
- [ ] Letras con líneas cortas (6-8 palabras)

---

## 📞 AYUDA

- **Guía completa**: `DEVELOPER_GUIDE.md`
- **Letras**: `LYRICS_OPTIMIZATION.md`
- **Pool tokens**: `GUIA_COMPLETA_UNIFIED_POOL.md`
- **Extensión**: `../../EXTENSION_CHROME_COMPLETADA.md`

---

## 🚀 DEPLOYMENT RÁPIDO

```bash
# Vercel
vercel --prod

# Configurar vars en dashboard
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_KEY
# - GROQ_API_KEY

# Post-deploy
curl https://son1kvers3.com/api/pool/stats
```

---

**Última actualización**: Octubre 2024

