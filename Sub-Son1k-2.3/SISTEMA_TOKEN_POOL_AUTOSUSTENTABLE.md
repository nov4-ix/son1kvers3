# 🔄 SISTEMA TOKEN POOL AUTOSUSTENTABLE - DOCUMENTACIÓN

## ✅ ESTADO: IMPLEMENTADO Y OPERATIVO

El sistema de token pool autosustentable está **completamente implementado** y funcionando. Este documento explica cómo funciona y cómo está integrado.

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### Componentes Principales

1. **StealthTokenGenerator** (`packages/backend/src/services/StealthTokenGenerator.ts`)
   - Genera cuentas Suno automáticamente
   - Captura tokens de las sesiones
   - Guarda tokens en **TokenPool** (sistema principal) y **Token** (legacy)

2. **TokenPoolService** (`packages/backend/src/services/tokenPoolService.ts`)
   - Gestiona el pool de tokens con selección inteligente
   - Monitorea salud de tokens
   - Selecciona tokens óptimos basado en:
     - Health score (40%)
     - Response time (30%)
     - Success rate (20%)
     - Current usage (10%)

3. **MusicGenerationService** (`packages/backend/src/services/musicGenerationService.ts`)
   - Usa `TokenPoolService` para obtener tokens
   - Fallback a `TokenManager` si TokenPool está vacío
   - Actualiza salud de tokens después de cada uso

4. **TokenHarvester** (`packages/backend/src/services/TokenHarvester.ts`)
   - Recolecta tokens de cuentas vinculadas manualmente
   - Complementa el sistema Stealth

---

## 🔄 FLUJO DE FUNCIONAMIENTO

### 1. Inicialización (al arrancar el servidor)

```typescript
// En index.ts
const stealthGen = getStealthGenerator();
await stealthGen.start();
```

**Qué hace:**
- Verifica si hay menos de 10 tokens en el pool
- Si está vacío, genera 10 cuentas iniciales
- Inicia ciclo de harvesting (cada 5 minutos)
- Inicia ciclo de generación de nuevas cuentas (cada 24 horas)

### 2. Generación de Cuentas Stealth

**Proceso:**
1. Genera email temporal (usa `CATCH_ALL_EMAIL_DOMAIN` o API de email temporal)
2. Crea cuenta en Suno usando Puppeteer (modo stealth)
3. Captura tokens de la sesión
4. **Guarda tokens en TokenPool** (sistema autosustentable)
5. También guarda en Token (legacy, para compatibilidad)

### 3. Harvesting Automático

**Cada 5 minutos:**
- Revisa todas las cuentas stealth activas
- Restaura sesiones desde cookies guardadas
- Captura nuevos tokens
- **Agrega tokens al TokenPool**

### 4. Generación de Música

**Cuando un usuario solicita generación:**
1. `MusicGenerationService` llama a `TokenPoolService.selectOptimalToken()`
2. `TokenPoolService` selecciona el mejor token disponible
3. Se usa el token para la generación
4. Se actualiza la salud del token después del uso

---

## 📊 ALMACENAMIENTO DE TOKENS

### TokenPool (Sistema Principal)
- **Tabla:** `token_pool`
- **Campos clave:**
  - `encryptedToken`: Token encriptado (AES-256-CBC)
  - `healthScore`: Puntuación de salud (0-100)
  - `successCount` / `failureCount`: Estadísticas
  - `avgResponseTime`: Tiempo promedio de respuesta
  - `dailyLimit` / `currentDailyUsage`: Límites diarios
  - `tier`: Tier del token (free, basic, pro, enterprise)
  - `priority`: Prioridad en el pool (0-10)

### Token (Legacy)
- **Tabla:** `tokens`
- Se mantiene para compatibilidad
- Los tokens stealth también se guardan aquí

---

## 🔐 ENCRIPTACIÓN

### Tokens en TokenPool
```typescript
// Encriptación: AES-256-CBC
const encrypted = encryptTokenForPool(token);
// Formato: "iv:encrypted"
```

### Tokens en Token (Legacy)
```typescript
// Encriptación: Base64 (menos seguro, legacy)
const encrypted = Buffer.from(token).toString('base64');
```

---

## ⚙️ VARIABLES DE ENTORNO NECESARIAS

```bash
# Opcional pero recomendado
ENCRYPTION_KEY=hex_key_64_chars  # Para encriptar passwords de cuentas stealth
CATCH_ALL_EMAIL_DOMAIN=tu-dominio.com  # Para emails catch-all
TOKEN_ENCRYPTION_KEY=secret-key  # Para encriptar tokens en TokenPool

# Ya configuradas en env.ts
NEURAL_ENGINE_POLLING_URL=https://api.suno.ai  # Opcional
NEURAL_ENGINE_API_URL=https://api.suno.ai  # Opcional
```

---

## 📈 MÉTRICAS Y MONITOREO

### Stats del Sistema Stealth
```typescript
const stats = await stealthGen.getStats();
// Retorna:
// - totalStealthAccounts: Número de cuentas activas
// - tokensInPool: Tokens en TokenPool
// - tokensLegacy: Tokens en tabla Token (legacy)
// - activeBrowsers: Navegadores activos
// - systemStatus: 'operational' | 'initializing'
```

### Health del TokenPool
```typescript
const health = await tokenPoolService.getPoolHealth();
// Retorna:
// - status: 'operational' | 'degraded'
// - health_score: Porcentaje de tokens saludables
// - active_tokens: Tokens activos
// - queue_depth: Profundidad de cola
// - avg_wait_time: Tiempo promedio de espera
```

---

## 🔧 CONFIGURACIÓN

### Intervalos (en StealthTokenGenerator)
- **Harvesting:** Cada 5 minutos (`harvestInterval`)
- **Generación de cuentas:** Cada 24 horas (`generationInterval`)
- **Pool inicial:** 10 cuentas si está vacío

### Límites de Tokens
- **Daily Limit:** 50 generaciones por token (configurable)
- **Health Threshold:** Tokens con health < 30 se desactivan automáticamente
- **Priority:** Tokens stealth tienen prioridad 2 (media)

---

## ✅ VERIFICACIÓN DE FUNCIONAMIENTO

### 1. Verificar que el sistema esté iniciado
```bash
# Buscar en logs del servidor:
🕵️ Iniciando Sistema Stealth...
✅ Sistema Stealth completamente operativo
```

### 2. Verificar tokens en pool
```sql
SELECT COUNT(*) FROM token_pool WHERE source = 'stealth_auto' AND isActive = true;
```

### 3. Verificar cuentas stealth
```sql
SELECT COUNT(*) FROM "StealthAccount" WHERE isActive = true;
```

### 4. Probar generación
```bash
# Hacer una petición de generación y verificar que use tokens del pool
POST /api/generation/create
```

---

## 🐛 TROUBLESHOOTING

### Problema: No se generan tokens
**Solución:**
1. Verificar que `CATCH_ALL_EMAIL_DOMAIN` esté configurado O que la API de email temporal funcione
2. Verificar logs de errores en la generación de cuentas
3. Verificar que Puppeteer pueda acceder a Suno

### Problema: Tokens no se agregan al TokenPool
**Solución:**
1. Verificar que no haya errores de duplicados (token único)
2. Verificar que `TOKEN_ENCRYPTION_KEY` esté configurado
3. Revisar logs: `✅ Token agregado al TokenPool`

### Problema: Generación falla con "No available tokens"
**Solución:**
1. Verificar que haya tokens en TokenPool: `SELECT COUNT(*) FROM token_pool WHERE isActive = true`
2. Verificar que los tokens tengan `healthScore >= 50`
3. El sistema tiene fallback a TokenManager si TokenPool está vacío

---

## 🚀 MEJORAS FUTURAS

1. **Migración de tokens legacy:** Migrar tokens de tabla `Token` a `TokenPool`
2. **Health checks automáticos:** Verificar salud de tokens periódicamente
3. **Rotación de tokens:** Reemplazar tokens con baja salud automáticamente
4. **Métricas avanzadas:** Dashboard de monitoreo del sistema

---

## 📝 NOTAS IMPORTANTES

- ✅ El sistema está **completamente operativo**
- ✅ Los tokens se guardan en **ambas tablas** (TokenPool y Token) para compatibilidad
- ✅ El sistema tiene **fallback automático** si TokenPool está vacío
- ✅ La generación musical **usa TokenPoolService** cuando está disponible
- ✅ El sistema es **autosustentable** - genera tokens automáticamente

---

**Última actualización:** 27 de Enero, 2026  
**Estado:** ✅ OPERATIVO Y LISTO PARA PRODUCCIÓN
