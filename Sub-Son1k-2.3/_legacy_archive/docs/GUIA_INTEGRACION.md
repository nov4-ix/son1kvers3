# 🔌 GUÍA DE INTEGRACIÓN - Son1kVers3 Components

**Versión:** 1.0  
**Fecha:** 2026-01-07

---

## ✅ **COMPONENTES DISPONIBLES**

### **1. Sistema de Tiers**

```typescript
// packages/tiers/src/components/TierCard.tsx
import { TierCard } from '@son1k/tiers';
import { TierService } from '@son1k/tiers';

// packages/tiers/src/index.ts - Service
const tierService = new TierService('http://localhost:8000');

// Usage
const handleUpgrade = async (tier: TierType) => {
  await tierService.upgradeTier(userId, tier);
};

<TierCard 
  config={TIER_CONFIGS.CREATOR}
  currentTier="FREE"
  onUpgrade={handleUpgrade}
  isPopular={true}
/>
```

### **2. Pricing Page**

```typescript
// apps/web-classic/src/pages/PricingPage.tsx
import { PricingPage } from './pages/PricingPage';

// In your router
<Route path="/pricing" element={<PricingPage userId={user.id} currentTier={user.tier} />} />
```

### **3. useGeneration Hook**

```typescript
// packages/shared-hooks/src/useGeneration.ts
import { useGeneration } from '@son1k/shared-hooks';

function MyComponent() {
  const {
    isGenerating,
    error,
    limits,
    generate,
    canGenerate,
    remaining,
    tier
  } = useGeneration({
    userId: user.id,
    onLimitReached: (limits) => {
      // Show upgrade modal
      setShowUpgradeModal(true);
    },
    onGenerationComplete: (generationId) => {
      // Success! Play audio or show success message
      console.log('Generated:', generationId);
    }
  });

  const handleGenerate = async () => {
    const generationId = await generate(prompt, { quality: 'standard', genre: 'pop' });
    // Returns null if generation failed or limits reached
  };

  return (
    <div>
      <p>You have {remaining} generations left</p>
      <button onClick={handleGenerate} disabled={!canGenerate || isGenerating}>
        Generate
      </button>
      {error && <div>Error: {error}</div>}
    </div>
  );
}
```

### **4. Community Pool**

```typescript
// apps/web-classic/src/pages/CommunityPool.tsx
import { CommunityPool } from './pages/CommunityPool';

// In your router
<Route path="/community-pool" element={<CommunityPool userId={user.id} userTier={user.tier} />} />
```

### **5. Pool Item Card**

```typescript
// packages/community-pool/src/components/PoolItemCard.tsx
import { PoolItemCard } from '@son1k/community-pool/components';

<PoolItemCard
  item={poolItem}
  onPlay={(audioUrl) => playAudio(audioUrl)}
  onLike={(itemId) => likeItem(itemId)}
  isPlaying={currentlyPlaying === poolItem.audio_url}
/>
```

### **6. Contributor Ranking**

```typescript
// packages/community-pool/src/components/ContributorRanking.tsx
import { ContributorRanking } from '@son1k/community-pool/components';

<ContributorRanking currentUserId={user.id} />
```

### **7. Generator Form (with enforcement)**

```typescript
// apps/the-generator/src/components/GeneratorForm.tsx
import { GeneratorForm } from './components/GeneratorForm';

<GeneratorForm 
  userId={user.id}
  onGenerationComplete={(genId) => {
    // Handle completion
    loadGenerationHistory();
  }}
/>
```

---

## 🚀 **FLUJO COMPLETO DE USO**

### **Flujo 1: Usuario FREE genera música**

```
1. User visita /generator
2. GeneratorForm muestra "3 generations remaining"
3. User ingresa prompt y presiona generate
4. useGeneration hook:
   - Verifica límites ANTES de generar
   - Si OK: llama API de generación
   - Registra generación exitosa
   - Intenta contribuir al pool (falla silenciosamente para FREE)
   - Actualiza límites automáticamente
5. UI muestra "2 generations remaining"
6. Cuando llega a 0:
   - Modal de upgrade aparece automáticamente
   - Opción: Upgrade o Claim from Pool
```

### **Flujo 2: Usuario FREE reclama del pool**

```
1. User visita /community-pool
2. Ve grid de tracks disponibles
3. Presiona "Claim Random"
4. useCommunityPool hook:
   - Llama POST /api/community/pool/claim
   - Backend verifica límite diario (3 claims/day)
   - Si OK: retorna track aleatorio
   - Incrementa plays del track
5. Auto-reproduce el track
6. Toast: "🎉 Claimed! 2 claims remaining today"
```

### **Flujo 3: Usuario CREATOR contribuye al pool**

```
1. User genera música (quality: high)
2. useGeneration hook:
   - Registra generación (POST /api/tiers/record-generation)
   - Automático: POST /api/community/contribute
   - Backend: 5% chance → agrega al pool
   - Si contribuyó: actualiza UserPoolStats
3. User ve mensaje: "Contributed to Community Pool (+2 points)"
4. Su ranking actualiza automáticamente
```

### **Flujo 4: Upgrade de tier**

```
1. User presiona "Upgrade to CREATOR"
2. TierService.upgradeTier():
   - POST /api/tiers/checkout
   - Backend: crea Stripe checkout session
   - Redirect a Stripe checkout
3. User completa pago en Stripe
4. Stripe webhook → Backend actualiza user.tier
5. Redirect a success page
6. User ahora ve "50 generations/month"
```

---

## 📦 **DEPENDENCIAS POR PACKAGE**

### **packages/tiers**

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "framer-motion": "^10.0.0"
  }
}
```

### **packages/community-pool**

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "framer-motion": "^10.0.0"
  }
}
```

### **packages/shared-hooks**

```json
{
  "dependencies": {
    "react": "^18.0.0"
  }
}
```

---

## 🔧 **CONFIGURACIÓN REQUERIDA**

### **Environment Variables**

```env
# Frontend (.env)
VITE_API_URL=http://localhost:8000

# Backend (.env)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000
DATABASE_URL=sqlite:///./sql_app.db
```

### **package.json workspace**

```json
{
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "dependencies": {
    "@son1k/tiers": "workspace:*",
    "@son1k/community-pool": "workspace:*",
    "@son1k/shared-hooks": "workspace:*"
  }
}
```

---

## 🎨 **THEMING**

Todos los componentes usan clases de Tailwind con colores custom:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        carbón: '#0A0C10',
        'carbón-dark': '#050608',
        'carbón-light': '#12141A',
        cian: '#00FFE7',
        'cian-light': '#33FFE',
        'cian-dark': '#00CCB8',
        magenta: '#B84DFF',
        'magenta-light': '#C76AFF',
        'magenta-dark': '#9933E6'
      }
    }
  }
}
```

---

## ✅ **CHECKLIST DE INTEGRACIÓN**

### **Para una nueva app:**

- [ ] Instalar packages: `pnpm add @son1k/tiers @son1k/community-pool @son1k/shared-hooks`
- [ ] Configurar `.env` con `VITE_API_URL`
- [ ] Agregar rutas en router
- [ ] Implementar useGeneration en formulario de generación
- [ ] Mostrar PricingPage en `/pricing`
- [ ] Mostrar CommunityPool en `/community-pool`
- [ ] Agregar límites indicator en UI principal
- [ ] Test flujo completo: generate → limit reached → upgrade

### **Para backend:**

- [ ] Inicializar DB: `python -m backend.migrations.init_db`
- [ ] Configurar Stripe keys en `.env`
- [ ] Configurar webhook en Stripe dashboard
- [ ] Crear `stealth_accounts.json` (opcional)
- [ ] Correr servidor: `uvicorn main:app --reload`
- [ ] Test endpoints con curl/Postman

---

## 🚨 **TROUBLESHOOTING**

### **"Failed to fetch user limits"**
- Verificar que backend esté corriendo
- Verificar `VITE_API_URL` en frontend
- Check CORS en backend `main.py`

### **"Checkout creation failed"**
- Verificar `STRIPE_SECRET_KEY` en backend
- Verificar que el `stripe_price_id` exista en Stripe dashboard

### **"Pool is empty"**
- Usuarios pagados deben generar para contribuir
- 5% chance de contribución por generación
- Crear contribuciones manualmente para testing

### **"User not found"**
- Correr `python -m backend.migrations.init_db` para crear usuario de prueba
- O crear usuario manualmente en DB

---

## 📚 **PRÓXIMOS PASOS**

Después de integrar estos componentes:

1. **User Profile & Wall** - Mostrar creaciones del usuario
2. **Sistema ALVAE** - Badges exclusivos
3. **Pixel Companion** - Asistente IA
4. **Ollama Integration** - Lyric generation
5. **Voice Cloning** - Custom voices

---

**Última Actualización:** 2026-01-07  
**Autor:** Antigravity  
**Status:** ✅ Production Ready
