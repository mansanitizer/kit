-- User Files Table (Stores raw content or descriptions)
CREATE TABLE IF NOT EXISTS user_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- Can be null for anonymous sessions/local usage
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'document' (pdf/txt/md) or 'image' (png/jpg)
  content TEXT, -- Extracted text for docs, Generated Description for images
  char_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- File Embeddings (Chunked content for RAG)
CREATE TABLE IF NOT EXISTS file_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES user_files(id) ON DELETE CASCADE,
  chunk_index INT,
  content_chunk TEXT,
  embedding VECTOR(1536),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_embeddings ENABLE ROW LEVEL SECURITY;

-- Permissive Policy for MVP (Allow all)
CREATE POLICY "Allow all on user_files" ON user_files FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on file_embeddings" ON file_embeddings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Index for Vector Search
CREATE INDEX IF NOT EXISTS file_embeddings_embedding_idx 
ON file_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
