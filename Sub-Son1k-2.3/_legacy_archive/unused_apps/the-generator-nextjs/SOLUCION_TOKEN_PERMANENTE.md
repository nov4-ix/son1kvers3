# 🔄 SOLUCIÓN: Sistema de Tokens Auto-Renovables para Suno

## 🎯 Problema Actual

**Tokens JWT de Suno expiran cada 6-24 horas** → Requieren actualización manual constante en Vercel.

Tu pool de tokens gestiona rotación DENTRO de la app, pero **NO actualiza automáticamente las variables de entorno**.

---

## ✅ SOLUCIONES DISPONIBLES

### **Opción 1: API Gateway con Token Rotation (RECOMENDADO)**

Usar un servicio intermediario que maneje tokens automáticamente:

#### **A. SunoAPI.com (Servicio de Terceros)**

```env
# En lugar de JWT que expira
SUNO_API_KEY=sk_xxx_permanent_key  # API key permanente
SUNO_API_PROVIDER=sunoapi           # Proveedor: sunoapi.com
```

**Ventajas:**
- ✅ API key **NO expira**
- ✅ Gestión automática de tokens internos
- ✅ Límites según tu plan (Free, Pro, Premium)
- ✅ Documentación clara: https://docs.sunoapi.com
- ✅ Endpoints similares a los que ya usas

**Desventajas:**
- ❌ Costo adicional ($9-29/mes según plan)
- ❌ Dependencia de servicio externo

**Implementación:**
```typescript
// apps/the-generator/lib/suno-api-client.ts
export class SunoAPIClient {
  private apiKey: string
  private baseUrl = 'https://api.sunoapi.com/v1'
  
  constructor() {
    this.apiKey = process.env.SUNO_API_KEY || ''
  }
  
  async generate(params: GenerateParams) {
    const response = await fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })
    
    return response.json()
  }
}
```

---

#### **B. Proxy Propio con Auto-Refresh**

Crear tu propio microservicio que renueve tokens automáticamente.

**Arquitectura:**

```
Frontend → Next.js API → Proxy Service (Railway/Fly.io) → Suno API
                            ↓
                      Supabase DB
                    (Token Storage)
```

**Ventajas:**
- ✅ Control total
- ✅ Sin costos adicionales de terceros
- ✅ Puedes agregar más features

**Desventajas:**
- ❌ Requiere desarrollo adicional
- ❌ Necesitas mantener el servicio

---

### **Opción 2: Sistema de Auto-Renovación en Supabase (NUESTRA SOLUCIÓN)**

Almacenar y renovar tokens automáticamente usando Supabase + Edge Functions.

#### **Cómo funciona:**

1. **Almacenar tokens en Supabase** (no en variables de entorno)
2. **Edge Function** que se ejecuta cada 4 horas para renovar tokens
3. **API endpoint** que siempre usa el token más reciente de la DB

**Ventajas:**
- ✅ Sin servicios externos adicionales
- ✅ Tokens siempre frescos
- ✅ Control total
- ✅ Gratis (usando infraestructura existente)

**Implementación:**

```sql
-- 1. Tabla en Supabase para tokens
CREATE TABLE suno_auth_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT NOT NULL,
  issuer TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_used TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  source TEXT DEFAULT 'manual', -- manual, auto-refresh, api
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para buscar tokens activos no expirados
CREATE INDEX idx_active_tokens ON suno_auth_tokens(is_active, expires_at);

-- 2. Función para obtener el mejor token
CREATE OR REPLACE FUNCTION get_best_suno_token()
RETURNS TEXT AS $$
DECLARE
  best_token TEXT;
BEGIN
  SELECT token INTO best_token
  FROM suno_auth_tokens
  WHERE is_active = true 
    AND expires_at > NOW() + INTERVAL '1 hour'
  ORDER BY expires_at DESC, usage_count ASC
  LIMIT 1;
  
  -- Actualizar uso
  UPDATE suno_auth_tokens
  SET last_used = NOW(), usage_count = usage_count + 1
  WHERE token = best_token;
  
  RETURN best_token;
END;
$$ LANGUAGE plpgsql;
```

```typescript
// apps/the-generator/lib/dynamic-token-manager.ts
import { createClient } from '@supabase/supabase-js'

export class DynamicTokenManager {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY! // Service key con permisos
  )
  
  /**
   * Obtiene el mejor token disponible de la DB
   * NO depende de variables de entorno
   */
  async getBestToken(): Promise<string> {
    const { data, error } = await this.supabase
      .rpc('get_best_suno_token')
    
    if (error || !data) {
      throw new Error('No valid tokens available')
    }
    
    return data
  }
  
  /**
   * Agregar un nuevo token a la DB
   */
  async addToken(token: string): Promise<void> {
    // Decodificar JWT para extraer expiración
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    )
    
    const { error } = await this.supabase
      .from('suno_auth_tokens')
      .insert({
        token,
        issuer: payload.iss,
        expires_at: new Date(payload.exp * 1000).toISOString(),
        is_active: true,
        source: 'api'
      })
    
    if (error) throw error
  }
  
  /**
   * Verificar y desactivar tokens expirados
   */
  async cleanupExpiredTokens(): Promise<void> {
    await this.supabase
      .from('suno_auth_tokens')
      .update({ is_active: false })
      .lt('expires_at', new Date().toISOString())
  }
}
```

```typescript
// apps/the-generator/app/api/generate-music/route.ts
import { DynamicTokenManager } from '@/lib/dynamic-token-manager'

export async function POST(request: NextRequest) {
  try {
    const tokenManager = new DynamicTokenManager()
    
    // ✅ Obtener token dinámicamente de Supabase (NO de env vars)
    const token = await tokenManager.getBestToken()
    
    // Usar token para llamar a Suno
    const sunoResponse = await fetch('https://ai.imgkits.com/suno/generate', {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${token}`,
        // ... otros headers
      },
      body: JSON.stringify(payload)
    })
    
    // Si token inválido (401), marcarlo como inactivo
    if (sunoResponse.status === 401) {
      await tokenManager.markTokenInvalid(token)
      throw new Error('Token expired, please add a new one')
    }
    
    // ... resto del código
  } catch (error) {
    // ...
  }
}
```

```typescript
// apps/the-generator/app/api/tokens/add/route.ts
import { DynamicTokenManager } from '@/lib/dynamic-token-manager'

export async function POST(request: NextRequest) {
  // Endpoint para agregar tokens desde el frontend o webhook
  const { token, adminPassword } = await request.json()
  
  // Validar admin
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const tokenManager = new DynamicTokenManager()
  await tokenManager.addToken(token)
  
  return NextResponse.json({ success: true })
}
```

---

### **Opción 3: Supabase Edge Function para Auto-Refresh (AVANZADO)**

Configurar una Edge Function que se ejecute cada 4 horas y obtenga un nuevo token automáticamente.

```typescript
// supabase/functions/refresh-suno-token/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  try {
    // 1. Obtener nuevo token de Suno (usando credenciales de cuenta premium)
    const newToken = await fetchNewSunoToken()
    
    // 2. Guardar en DB
    await supabase.from('suno_auth_tokens').insert({
      token: newToken,
      expires_at: calculateExpiration(newToken),
      is_active: true,
      source: 'auto-refresh'
    })
    
    // 3. Desactivar tokens viejos
    await supabase
      .from('suno_auth_tokens')
      .update({ is_active: false })
      .lt('expires_at', new Date().toISOString())
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500
    })
  }
})

// Configurar cron job en Supabase para ejecutar cada 4 horas
```

---

## 🎯 RECOMENDACIÓN FINAL

### **Para tu caso (cuenta premium de Suno):**

**Implementar Opción 2: Sistema en Supabase** por estas razones:

1. ✅ **Ya tienes Supabase** configurado
2. ✅ **Ya tienes múltiples tokens** en `.env.local`
3. ✅ **Control total** sin servicios externos
4. ✅ **Gratis** - usa infraestructura existente
5. ✅ **Escalable** - puedes agregar auto-refresh después

### **Plan de Implementación:**

#### **Fase 1: Migrar a DB (1 hora)**
1. Crear tabla `suno_auth_tokens` en Supabase
2. Implementar `DynamicTokenManager`
3. Migrar tokens existentes de `.env.local` a DB
4. Actualizar `/api/generate-music` para usar DB

#### **Fase 2: Dashboard de Gestión (30 min)**
5. Crear endpoint `/api/tokens/add` para agregar tokens
6. Crear UI simple para agregar/ver tokens
7. Agregar endpoint `/api/tokens/status` para monitoring

#### **Fase 3: Auto-Refresh (Opcional, 2 horas)**
8. Implementar Edge Function de auto-refresh
9. Configurar cron job
10. Sistema de notificaciones si todos los tokens expiran

---

## 🚀 ¿Quieres que implemente esto?

Puedo crear:
1. ✅ Scripts SQL para Supabase
2. ✅ `DynamicTokenManager` completo
3. ✅ API endpoints actualizados
4. ✅ Dashboard simple para gestionar tokens
5. ✅ Script de migración de tokens existentes

**¿Procedemos con la implementación?** 🎵

