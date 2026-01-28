# ========================================
# Super-Son1k-2.3 Environment Configuration Template
# ========================================
# INSTRUCCIONES: Copia este archivo y crea tu propio .env (no versionado)
# 
# Comando rápido:
# copy ENV_CONFIG_TEMPLATE.md .env
# (o en Linux/Mac: cp ENV_CONFIG_TEMPLATE.md .env)
# ========================================

# ============ DATABASE ============
# IMPORTANTE: Configura tu base de datos PostgreSQL aquí
# Opción 1: Supabase (RECOMENDADO - Gratis)
# Ejemplo: postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
#
# Opción 2: PostgreSQL Local
# Ejemplo: postgresql://postgres:password@localhost:5432/super_son1k
#
DATABASE_URL="postgresql://postgres:password@localhost:5432/super_son1k"

# ============ REDIS ============
# Para caché y sesiones (opcional para desarrollo local)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ============ JWT & SECURITY ============
JWT_SECRET="super-secret-jwt-key-change-in-production-12345"
JWT_EXPIRES_IN=7d
BACKEND_SECRET="backend-secret-key-change-in-production-67890"

# ============ SUNO API ============
# CRITICO: Necesitas obtener estas cookies de tu cuenta de Suno
# Formato: __session=sess_xxxxxxx; cf_clearance=xxxxxxx
# 
# Cómo obtenerlas:
# 1. Abre https://app.suno.ai en Chrome
# 2. Inicia sesión
# 3. F12 -> Application -> Cookies -> Copia __session y cf_clearance
# 4. Pega aquí en formato: __session=XXX; cf_clearance=YYY
#
# Puedes agregar múltiples tokens separados por comas para redundancia:
# SUNO_COOKIES="token1,token2,token3"
#
SUNO_COOKIES="__session=TU_SESSION_AQUI; cf_clearance=TU_CLEARANCE_AQUI"

# URLs de Suno (No cambiar a menos que sepas lo que haces)
SUNO_API_URL=https://studio-api.suno.ai
SUNO_POLLING_URL=https://studio-api.suno.ai

# ============ SUPABASE ============
# Para autenticación y almacenamiento
# Consigue gratis en: https://supabase.com
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui

# ============ SERVER CONFIG ============
PORT=3001
HOST=0.0.0.0
NODE_ENV=development
LOG_LEVEL=info

# Frontend URLs (para CORS)
FRONTEND_URL=http://localhost:3000,http://localhost:3002,http://localhost:3003

# ============ RATE LIMITING ============
GLOBAL_RATE_LIMIT_MAX=100
GLOBAL_RATE_LIMIT_WINDOW_MS=60000

# ============ FILE UPLOAD ============
MAX_FILE_SIZE=52428800
UPLOAD_DIR=./uploads

# ============ STRIPE (OPCIONAL) ============
# Para pagos - Configura solo si necesitas monetización
STRIPE_SECRET_KEY=sk_test_tu-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_tu-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_tu-webhook-secret

# ============ ANALYTICS (OPCIONAL) ============
# PostHog para analytics
POSTHOG_API_KEY=tu-posthog-api-key
POSTHOG_HOST=https://app.posthog.com

# Sentry para error tracking
SENTRY_DSN=tu-sentry-dsn

# ============ CACHE CONFIG ============
CACHE_TTL_DEFAULT=3600
CACHE_TTL_TOKENS=300
CACHE_TTL_USER_DATA=1800
CACHE_TTL_GENERATION_RESULTS=3600
CACHE_TTL_ANALYTICS=900
CACHE_TTL_TEMPLATES=7200

# ============ SECURITY ============
BCRYPT_ROUNDS=12
CORS_ORIGIN=http://localhost:3000
