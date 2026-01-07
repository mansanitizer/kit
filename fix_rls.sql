-- Allow anonymous inserts into interactions table
-- Since we are currently running without full User Auth, we need to allow the API (using ANON key) to log interactions.

ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they conflict
DROP POLICY IF EXISTS "Enable insert for anon and authenticated users" ON interactions;
DROP POLICY IF EXISTS "Enable read for anon and authenticated users" ON interactions;

-- Allow insert for everyone
CREATE POLICY "Enable insert for anon and authenticated users"
ON interactions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow select for everyone
CREATE POLICY "Enable read for anon and authenticated users"
ON interactions
FOR SELECT
TO anon, authenticated
USING (true);
