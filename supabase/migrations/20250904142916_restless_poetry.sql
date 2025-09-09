/*
  # Create video likes table

  1. New Tables
    - `video_likes`
      - `id` (uuid, primary key)
      - `video_id` (uuid) - foreign key to videos table
      - `user_id` (uuid) - foreign key to users table
      - `is_like` (boolean) - true for like, false for dislike
      - `created_at` (timestamp) - when like was created

  2. Security
    - Enable RLS on `video_likes` table
    - Add policy for users to read all likes
    - Add policy for users to insert their own likes
    - Add policy for users to update their own likes
    - Add policy for users to delete their own likes

  3. Constraints
    - Unique constraint on (video_id, user_id) to prevent duplicate likes

  4. Functions
    - Function to update video like/dislike counts
*/

CREATE TABLE IF NOT EXISTS video_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_like boolean NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(video_id, user_id)
);

-- Enable RLS
ALTER TABLE video_likes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can read video likes"
  ON video_likes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own likes"
  ON video_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own likes"
  ON video_likes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON video_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update video like counts
CREATE OR REPLACE FUNCTION update_video_like_counts()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE videos 
    SET 
      likes = (
        SELECT COUNT(*) 
        FROM video_likes 
        WHERE video_id = NEW.video_id AND is_like = true
      ),
      dislikes = (
        SELECT COUNT(*) 
        FROM video_likes 
        WHERE video_id = NEW.video_id AND is_like = false
      ),
      updated_at = now()
    WHERE id = NEW.video_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE videos 
    SET 
      likes = (
        SELECT COUNT(*) 
        FROM video_likes 
        WHERE video_id = OLD.video_id AND is_like = true
      ),
      dislikes = (
        SELECT COUNT(*) 
        FROM video_likes 
        WHERE video_id = OLD.video_id AND is_like = false
      ),
      updated_at = now()
    WHERE id = OLD.video_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
DROP TRIGGER IF EXISTS video_like_counts_trigger ON video_likes;
CREATE TRIGGER video_like_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON video_likes
  FOR EACH ROW EXECUTE FUNCTION update_video_like_counts();

-- Create indexes
CREATE INDEX IF NOT EXISTS video_likes_video_id_idx ON video_likes(video_id);
CREATE INDEX IF NOT EXISTS video_likes_user_id_idx ON video_likes(user_id);