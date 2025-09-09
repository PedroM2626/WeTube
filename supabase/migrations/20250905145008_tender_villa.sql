/*
  # Adicionar tabelas de playlists

  1. Novas Tabelas
    - `playlists`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `user_id` (uuid, foreign key para users)
      - `visibility` (enum: public, private, unlisted)
      - `thumbnail_url` (text)
      - `video_count` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `playlist_videos`
      - `id` (uuid, primary key)
      - `playlist_id` (uuid, foreign key para playlists)
      - `video_id` (uuid, foreign key para videos)
      - `position` (integer)
      - `added_at` (timestamp)

  2. Segurança
    - Habilitar RLS nas tabelas
    - Adicionar políticas apropriadas
*/

-- Criar enum para visibilidade
DO $$ BEGIN
  CREATE TYPE playlist_visibility AS ENUM ('public', 'private', 'unlisted');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tabela de playlists
CREATE TABLE IF NOT EXISTS playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  visibility playlist_visibility DEFAULT 'public',
  thumbnail_url text DEFAULT '',
  video_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de vídeos da playlist
CREATE TABLE IF NOT EXISTS playlist_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  added_at timestamptz DEFAULT now(),
  UNIQUE(playlist_id, video_id)
);

-- Habilitar RLS
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_videos ENABLE ROW LEVEL SECURITY;

-- Políticas para playlists
CREATE POLICY "Users can read public playlists"
  ON playlists
  FOR SELECT
  TO authenticated
  USING (visibility = 'public' OR auth.uid() = user_id);

CREATE POLICY "Users can manage their own playlists"
  ON playlists
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para playlist_videos
CREATE POLICY "Users can read playlist videos"
  ON playlist_videos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = playlist_videos.playlist_id 
      AND (playlists.visibility = 'public' OR playlists.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage their own playlist videos"
  ON playlist_videos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = playlist_videos.playlist_id 
      AND playlists.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = playlist_videos.playlist_id 
      AND playlists.user_id = auth.uid()
    )
  );

-- Índices
CREATE INDEX playlists_user_id_idx ON playlists(user_id);
CREATE INDEX playlists_visibility_idx ON playlists(visibility);
CREATE INDEX playlist_videos_playlist_id_idx ON playlist_videos(playlist_id);
CREATE INDEX playlist_videos_video_id_idx ON playlist_videos(video_id);
CREATE INDEX playlist_videos_position_idx ON playlist_videos(playlist_id, position);

-- Função para atualizar contador de vídeos na playlist
CREATE OR REPLACE FUNCTION update_playlist_video_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE playlists 
    SET video_count = video_count + 1,
        updated_at = now()
    WHERE id = NEW.playlist_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE playlists 
    SET video_count = video_count - 1,
        updated_at = now()
    WHERE id = OLD.playlist_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar contador
CREATE TRIGGER playlist_video_count_trigger
  AFTER INSERT OR DELETE ON playlist_videos
  FOR EACH ROW EXECUTE FUNCTION update_playlist_video_count();