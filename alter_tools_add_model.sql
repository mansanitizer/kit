-- Add 'model' column to tools table
ALTER TABLE tools 
ADD COLUMN model TEXT NOT NULL DEFAULT 'google/gemini-2.0-flash-lite-001';

-- Comment explaining the column
COMMENT ON COLUMN tools.model IS 'The OpenRouter model ID to use for this tool (e.g., google/gemini-2.0-flash-lite-001, openai/gpt-4o)';
