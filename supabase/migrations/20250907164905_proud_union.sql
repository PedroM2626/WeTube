/*
  # Add banner_url column to users table

  1. Changes
    - Add `banner_url` column to `users` table for channel banners
    - Column is optional (nullable) with empty string as default

  2. Security
    - No changes to RLS policies needed
    - Users can update their own banner through existing policies
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'banner_url'
  ) THEN
    ALTER TABLE users ADD COLUMN banner_url text DEFAULT '';
  END IF;
END $$;