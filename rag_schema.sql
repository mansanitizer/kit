-- Enable Vector Extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Create User Profiles (Simple Store)
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Ideally references auth.users, but utilizing anon/system ID for now
  summary TEXT,                         -- "Tech PM in Bangalore..."
  traits JSONB DEFAULT '{}',            -- {"diet": "keto", "budget": "tight"}
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create Memory Embeddings (The Brain)
CREATE TABLE IF NOT EXISTS memory_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- Optional reference to user_profiles or auth.users
  content TEXT NOT NULL,                -- "User prefers keto diet"
  embedding VECTOR(1536),               -- Standard OpenAI/OpenRouter dimension
  category TEXT,                        -- 'diet', 'finance', 'work'
  importance FLOAT DEFAULT 0.5,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create Vector Index (Fast Search)
-- IVFFlat is good for speed. Using cosine distance.
CREATE INDEX IF NOT EXISTS memory_embeddings_embedding_idx 
ON memory_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 4. RLS Policies (Permissive for MVP)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_embeddings ENABLE ROW LEVEL SECURITY;

-- Allow everything for anon (adjust when real Auth is added)
CREATE POLICY "Allow all on user_profiles" ON user_profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on memory_embeddings" ON memory_embeddings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
