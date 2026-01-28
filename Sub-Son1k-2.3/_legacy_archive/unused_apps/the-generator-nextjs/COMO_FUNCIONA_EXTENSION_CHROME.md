# 🔍 CÓMO FUNCIONA LA EXTENSIÓN CHROME DE SUNO

## 🎯 Descubrimiento Clave

La extensión Chrome **NO genera música directamente**. En su lugar:

### **Flujo Real:**

```
Usuario → Extensión Chrome → Guarda datos en storage
                           ↓
                    Abre página web (music-generator.html)
                           ↓
              Página web lee datos del storage
                           ↓
              Página web llama a Suno API
                           ↓
              Página web hace polling
                           ↓
              Página web muestra resultado
```

**La extensión solo:**
1. ✅ Recopila datos del usuario (letra, estilo, etc.)
2. ✅ Guarda datos en `chrome.storage.local`
3. ✅ Abre una página web (`music-generator.html`)
4. ✅ La página web hace TODO el trabajo pesado

**La página web:**
1. ✅ Lee datos del storage
2. ✅ Llama a Suno API con el token
3. ✅ Hace polling cada 2-3 segundos
4. ✅ Muestra el resultado (audio player)

---

## 🔄 Sistema de Auto-Renovación de Tokens

La extensión incluye un **sistema inteligente** de gestión de tokens:

### **Características:**

#### **1. Múltiples Tokens de Respaldo**
```javascript
const BACKUP_TOKENS = [
  'token_1_aqui',
  'token_2_aqui', 
  'token_3_aqui',
  'token_4_aqui'
];
```

#### **2. Verificación Automática Cada 30 Minutos**
```javascript
const RENEWAL_CONFIG = {
  checkInterval: 30 * 60 * 1000, // 30 minutos
  warningThreshold: 2 * 60 * 60 * 1000, // Advertir 2 horas antes
  autoRenewal: true,
  tokenIndex: 0
};
```

#### **3. Rotación Automática de Tokens**
```javascript
function rotateToken() {
  // Si un token falla, cambia automáticamente al siguiente
  if (BACKUP_TOKENS.length > 1) {
    RENEWAL_CONFIG.tokenIndex = (RENEWAL_CONFIG.tokenIndex + 1) % BACKUP_TOKENS.length;
    return BACKUP_TOKENS[RENEWAL_CONFIG.tokenIndex];
  }
  return getValidToken();
}
```

#### **4. Verificación Silenciosa**
```javascript
async function checkTokenSilently(token) {
  // Verifica sin mostrar UI
  // Envía request de prueba a Suno
  // Retorna true/false según resultado
}
```

#### **5. Fallback Automático**
```javascript
function startAutoRenewal() {
  setInterval(async () => {
    const isValid = await checkTokenSilently(currentToken);
    
    if (!isValid) {
      // Token inválido, rotar automáticamente
      const newToken = rotateToken();
      updateTokenStatus('🔄 Renovando token automáticamente...');
    }
  }, RENEWAL_CONFIG.checkInterval);
}
```

---

## 🎯 SOLUCIÓN PARA THE GENERATOR

### **Opción 1: Replicar Sistema de la Extensión (RECOMENDADO)**

Implementar el **mismo sistema de rotación** pero en el backend:

```typescript
// apps/the-generator/lib/token-rotation-manager.ts
export class TokenRotationManager {
  private tokens: string[] = []
  private currentIndex: number = 0
  private lastCheck: number = 0
  private checkInterval: number = 30 * 60 * 1000 // 30 min
  
  constructor() {
    // Cargar tokens de Supabase al iniciar
    this.loadTokensFromDB()
    
    // Iniciar verificación automática
    this.startAutoCheck()
  }
  
  /**
   * Cargar tokens desde Supabase
   */
  async loadTokensFromDB() {
    const { data } = await supabase
      .from('suno_auth_tokens')
      .select('token')
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
    
    this.tokens = data?.map(t => t.token) || []
  }
  
  /**
   * Obtener token actual (rotación round-robin)
   */
  async getCurrentToken(): Promise<string> {
    if (this.tokens.length === 0) {
      await this.loadTokensFromDB()
    }
    
    if (this.tokens.length === 0) {
      throw new Error('No valid tokens available')
    }
    
    return this.tokens[this.currentIndex]
  }
  
  /**
   * Rotar al siguiente token
   */
  async rotateToNext(): Promise<string> {
    this.currentIndex = (this.currentIndex + 1) % this.tokens.length
    return this.getCurrentToken()
  }
  
  /**
   * Marcar token como inválido y rotar
   */
  async markInvalidAndRotate(invalidToken: string): Promise<string> {
    // Marcar en DB como inactivo
    await supabase
      .from('suno_auth_tokens')
      .update({ is_active: false })
      .eq('token', invalidToken)
    
    // Remover de la lista local
    this.tokens = this.tokens.filter(t => t !== invalidToken)
    
    // Rotar al siguiente
    return this.rotateToNext()
  }
  
  /**
   * Verificación automática cada 30 min
   */
  private startAutoCheck() {
    setInterval(async () => {
      // Recargar tokens de DB
      await this.loadTokensFromDB()
      
      // Verificar token actual
      const currentToken = await this.getCurrentToken()
      const isValid = await this.verifyToken(currentToken)
      
      if (!isValid) {
        console.log('🔄 Token inválido, rotando...')
        await this.rotateToNext()
      }
    }, this.checkInterval)
  }
  
  /**
   * Verificar si un token es válido
   */
  private async verifyToken(token: string): Promise<boolean> {
    try {
      const response = await fetch('https://ai.imgkits.com/suno/generate', {
        method: 'POST',
        headers: {
          'authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'channel': 'node-api'
        },
        body: JSON.stringify({
          title: 'test',
          style: 'test', 
          lyrics: 'test',
          prompt: 'test',
          customMode: false,
          instrumental: true,
          duration: 10
        })
      })
      
      return response.ok || response.status !== 401
    } catch {
      return false
    }
  }
}

// Singleton global
let rotationManager: TokenRotationManager | null = null

export function getRotationManager(): TokenRotationManager {
  if (!rotationManager) {
    rotationManager = new TokenRotationManager()
  }
  return rotationManager
}
```

```typescript
// apps/the-generator/app/api/generate-music/route.ts
import { getRotationManager } from '@/lib/token-rotation-manager'

export async function POST(request: NextRequest) {
  try {
    const rotationManager = getRotationManager()
    
    // ✅ Obtener token del sistema de rotación
    let token = await rotationManager.getCurrentToken()
    
    // Llamar a Suno
    const sunoResponse = await fetch('https://ai.imgkits.com/suno/generate', {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${token}`,
        // ... otros headers
      },
      body: JSON.stringify(payload)
    })
    
    // Si token inválido (401), rotar y reintentar
    if (sunoResponse.status === 401) {
      console.log('❌ Token inválido, rotando...')
      token = await rotationManager.markInvalidAndRotate(token)
      
      // Reintentar con nuevo token
      const retryResponse = await fetch('https://ai.imgkits.com/suno/generate', {
        method: 'POST',
        headers: {
          'authorization': `Bearer ${token}`,
          // ... otros headers
        },
        body: JSON.stringify(payload)
      })
      
      // ... procesar respuesta
    }
    
    // ... resto del código
  } catch (error) {
    // ...
  }
}
```

---

### **Opción 2: Integrar con la Extensión Existente**

Usar la extensión Chrome como "proveedor de tokens":

```typescript
// apps/the-generator/lib/extension-token-provider.ts
export class ExtensionTokenProvider {
  /**
   * Obtener token desde la extensión Chrome
   * (Requiere que el usuario tenga la extensión instalada)
   */
  async getTokenFromExtension(): Promise<string> {
    // La extensión expone tokens via chrome.storage.local
    // o mediante un mensaje
    return new Promise((resolve, reject) => {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage(
          'extension_id_aqui',
          { action: 'getToken' },
          (response) => {
            if (response?.token) {
              resolve(response.token)
            } else {
              reject(new Error('No token from extension'))
            }
          }
        )
      } else {
        reject(new Error('Chrome extension not available'))
      }
    })
  }
}
```

---

## 🎯 RECOMENDACIÓN FINAL

### **Implementar Opción 1: TokenRotationManager + Supabase**

**¿Por qué?**

1. ✅ **Independiente** - No requiere extensión Chrome
2. ✅ **Automático** - Rotación cada 30 minutos
3. ✅ **Resiliente** - Si un token falla, usa el siguiente
4. ✅ **Escalable** - Puedes agregar más tokens dinámicamente
5. ✅ **Ya tienes 4 tokens** en `.env.local` listos para migrar

**Flujo:**

```
1. Migrar 4 tokens de .env.local → Supabase DB
2. TokenRotationManager lee tokens de DB
3. API usa TokenRotationManager.getCurrentToken()
4. Si token falla (401) → Rota automáticamente
5. Verificación cada 30 min → Recarga tokens de DB
6. Usuario puede agregar tokens desde UI → Sin redeploy
```

---

## 🚀 ¿Quieres que implemente esto?

Puedo crear en **30-45 minutos**:

1. ✅ **TokenRotationManager** completo
2. ✅ **API actualizada** para usar rotación
3. ✅ **Script de migración** de tus 4 tokens a Supabase
4. ✅ **UI para agregar tokens** sin redeploy
5. ✅ **Auto-verificación** cada 30 min

**Resultado:**
- ✅ Nunca más actualizar env vars manualmente
- ✅ Sistema rota automáticamente entre tokens
- ✅ Si un token expira, usa el siguiente
- ✅ Puedes agregar tokens nuevos desde el browser

**¿Procedemos con la implementación?** 🎵

