-- Super-Son1k Database Schema
-- Ejecutar en Supabase SQL Editor: https://supabase.com/project/[id]/sql-editor

-- 1. Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    name TEXT,
    avatar_url TEXT,
    tier TEXT DEFAULT 'FREE',
    subscription_status TEXT DEFAULT 'ACTIVE',
    generations_used INTEGER DEFAULT 0,
    monthly_generations INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de generaciones
CREATE TABLE IF NOT EXISTS generations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    prompt TEXT NOT NULL,
    style TEXT,
    duration INTEGER DEFAULT 60,
    quality TEXT DEFAULT 'standard',
    status TEXT DEFAULT 'PENDING',
    audio_url TEXT,
    generation_task_id TEXT,
    metadata JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Cola de generaciones
CREATE TABLE IF NOT EXISTS generation_queue (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    prompt TEXT NOT NULL,
    type TEXT DEFAULT 'song',
    parameters JSONB NOT NULL,
    status TEXT DEFAULT 'pending',
    position INTEGER DEFAULT 0,
    estimated_wait_time INTEGER DEFAULT 120,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tokens de Suno
CREATE TABLE IF NOT EXISTS suno_tokens (
    id TEXT PRIMARY KEY,
    token TEXT NOT NULL,
    cf_clearance TEXT,
    is_active BOOLEAN DEFAULT true,
    health_score REAL DEFAULT 1.0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Cuentas de Suno vinculadas
CREATE TABLE IF NOT EXISTS linked_suno_accounts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    password_encrypted TEXT,
    is_active BOOLEAN DEFAULT true,
    last_harvest TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_status ON generations(status);
CREATE INDEX IF NOT EXISTS idx_generation_queue_status ON generation_queue(status);
CREATE INDEX IF NOT EXISTS idx_suno_tokens_active ON suno_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_linked_accounts_user ON linked_suno_accounts(user_id);

-- Console output
SELECT '✅ Database schema created!' AS status;
