-- Remove Foreign Key Constraint on user_profiles.user_id
-- We need to do this because we are creating specific row entries for anonymous users
ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;
