-- Recycle Bin Table
CREATE TABLE IF NOT EXISTS recycle_bin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_id TEXT NOT NULL, -- UUID or Slug
    item_type TEXT NOT NULL CHECK (item_type IN ('tool', 'file', 'interaction')),
    display_text TEXT NOT NULL, -- Name or Title for display
    data JSONB NOT NULL, -- Full backup of the deleted record
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE recycle_bin ENABLE ROW LEVEL SECURITY;

-- Public Access for MVP (To accept anonymous deletions)
CREATE POLICY "Public All" ON recycle_bin FOR ALL USING (true) WITH CHECK (true);
