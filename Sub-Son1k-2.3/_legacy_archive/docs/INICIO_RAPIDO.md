# 🚀 SON1KVERS3 v2.3 - INICIO RÁPIDO

## ⚡ Instalación Express

### 1. Instalar Dependencias

```bash
# Instalar todas las dependencias del monorepo
pnpm install

# Instalar dependencias del backend Python
cd backend
pip install -r requirements.txt
cd ..
```

### 2. Configurar Variables de Entorno

```bash
# Copiar template de entorno
cp .env.example .env

# Editar .env con tus claves
# - STRIPE_SECRET_KEY
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
```

### 3. Iniciar Desarrollo

Opción A - Todo junto (Recomendado):
```bash
pnpm dev
```

Opción B - Por separado:
```bash
# Terminal 1: Backend (Puerto 8000)
cd backend
uvicorn main:app --reload --port 8000

# Terminal 2: Frontend (Múltiples puertos)
pnpm dev
```

### 4. Verificar Servicios

- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs (Swagger automático)
- **Web Classic:** http://localhost:3000
- **The Generator:** http://localhost:3001
- **Ghost Studio:** http://localhost:3003
- **Nova Post Pilot:** http://localhost:3004

## 📦 Nuevas Features Implementadas

### Sistema de Tiers ✅
```typescript
import { TierService } from '@son1k/tiers';

const tierService = new TierService('http://localhost:8000');
const limits = await tierService.getUserLimits(userId);

if (limits.canGenerate) {
  // Proceder con generación
} else {
  // Mostrar upgrade prompt
}
```

### Community Pool ✅
```typescript
import { CommunityPoolService } from '@son1k/community-pool';

const poolService = new CommunityPoolService('http://localhost:8000');
const items = await poolService.getPoolContent({ 
  limit: 50, 
  sortBy: 'recent' 
});
```

## 🧪 Testing

### Backend
```bash
cd backend
pytest  # Una vez implementados los tests
```

### Frontend
```bash
pnpm test
```

## 📋 Checklist de Primera Vez

- [ ] Dependencias instaladas (pnpm + pip)
- [ ] Variables de entorno configuradas
- [ ] Backend corriendo en puerto 8000
- [ ] Frontend corriendo en puertos 3000-5173
- [ ] API docs accesibles en /docs
- [ ] Sistema de Tiers visible en Web Classic

## 🐛 Troubleshooting

**Error: Module not found '@son1k/tiers'**
```bash
pnpm install
```

**Error: Python dependencies missing**
```bash
cd backend
pip install -r requirements.txt
```

**Error: Port already in use**
```bash
# Cambiar puerto en vite.config.ts o uvicorn command
uvicorn main:app --reload --port 8001
```

## 📚 Documentación Completa

Ver `ARQUITECTURA_INTEGRACION.md` para arquitectura completa del sistema.

## 🎯 Próximos Pasos

1. ✅ Sistema de Tiers implementado
2. ✅ Community Pool implementado
3. 🔄 Implementar Sistema Stealth
4. 🔄 Integrar Ollama para IA Local
5. 🔄 Integrar Voice Cloning
6. 🔄 Crear Landing Page

---

**Última Actualización:** 2026-01-07  
**Versión:** 2.3.0
