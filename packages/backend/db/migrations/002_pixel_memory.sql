-- Pixel AI Conversations
CREATE TABLE IF NOT EXISTS pixel_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  messages JSONB NOT NULL,
  context JSONB,
  app TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para búsqueda rápida por usuario
CREATE INDEX IF NOT EXISTS idx_pixel_conversations_user_id ON pixel_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_pixel_conversations_created_at ON pixel_conversations(created_at DESC);

-- Pixel User Profiles
CREATE TABLE IF NOT EXISTS pixel_user_profiles (
  user_id TEXT PRIMARY KEY,
  preferences JSONB DEFAULT '{
    "defaultMood": "calmo",
    "favoriteApp": "web-classic",
    "codeStyle": "concise",
    "helpLevel": "intermediate"
  }'::jsonb,
  learnings JSONB DEFAULT '{
    "topics": [],
    "skills": [],
    "patterns": {}
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pixel Memory Notes (para /remember command)
CREATE TABLE IF NOT EXISTS pixel_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'note', 'preference', 'learning', 'achievement'
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para búsqueda
CREATE INDEX IF NOT EXISTS idx_pixel_memories_user_id ON pixel_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_pixel_memories_type ON pixel_memories(type);
CREATE INDEX IF NOT EXISTS idx_pixel_memories_created_at ON pixel_memories(created_at DESC);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pixel_conversations_updated_at BEFORE UPDATE ON pixel_conversations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pixel_user_profiles_updated_at BEFORE UPDATE ON pixel_user_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
