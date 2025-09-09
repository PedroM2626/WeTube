/*
  # Create videos table

  1. New Tables
    - `videos`
      - `id` (uuid, primary key)
      - `title` (text) - video title
      - `description` (text) - video description
      - `video_url` (text) - URL to video file
      - `thumbnail_url` (text) - URL to thumbnail image
      - `user_id` (uuid) - foreign key to users table
      - `views` (integer) - view count
      - `likes` (integer) - like count
      - `dislikes` (integer) - dislike count
      - `duration` (text) - video duration
      - `created_at` (timestamp) - when video was created
      - `updated_at` (timestamp) - when video was last updated

  2. Security
    - Enable RLS on `videos` table
    - Add policy for users to read all videos
    - Add policy for users to insert their own videos
    - Add policy for users to update their own videos
    - Add policy for users to delete their own videos

  3. Indexes
    - Index on user_id for faster queries
    - Index on created_at for sorting
    - Index on title for search
*/

CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  video_url text NOT NULL,
  thumbnail_url text NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  views integer DEFAULT 0,
  likes integer DEFAULT 0,
  dislikes integer DEFAULT 0,
  duration text DEFAULT '0:00',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can read videos"
  ON videos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own videos"
  ON videos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos"
  ON videos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos"
  ON videos
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update video count
CREATE OR REPLACE FUNCTION update_user_video_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users 
    SET video_count = video_count + 1, updated_at = now()
    WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users 
    SET video_count = video_count - 1, updated_at = now()
    WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
DROP TRIGGER IF EXISTS video_count_trigger ON videos;
CREATE TRIGGER video_count_trigger
  AFTER INSERT OR DELETE ON videos
  FOR EACH ROW EXECUTE FUNCTION update_user_video_count();

-- Create indexes
CREATE INDEX IF NOT EXISTS videos_user_id_idx ON videos(user_id);
CREATE INDEX IF NOT EXISTS videos_created_at_idx ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS videos_title_idx ON videos USING gin(to_tsvector('portuguese', title));
CREATE INDEX IF NOT EXISTS videos_description_idx ON videos USING gin(to_tsvector('portuguese', description));