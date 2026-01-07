-- Remove Foreign Key Constraint on interactions.user_id
-- This allows us to store random session UUIDs for anonymous users
ALTER TABLE interactions
DROP CONSTRAINT IF EXISTS interactions_user_id_fkey;
