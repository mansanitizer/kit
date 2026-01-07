-- Create Interactions Table (Missing from previous runs)
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- Nullable for anonymous users
  tool_slug TEXT NOT NULL,
  input_data JSONB NOT NULL,   -- Match EVE.md
  output_data JSONB NOT NULL,  -- Match EVE.md
  created_at TIMESTAMP DEFAULT NOW()
);

-- "Nuclear" RLS Policy - Open to world for MVP
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Insert" ON interactions;
DROP POLICY IF EXISTS "Public Select" ON interactions;

CREATE POLICY "Public Insert" ON interactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Select" ON interactions FOR SELECT USING (true);
