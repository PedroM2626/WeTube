/*
  # Adicionar visibilidade aos vídeos

  1. Alterações na tabela videos
    - Adicionar coluna `visibility` (enum: public, private, unlisted)

  2. Atualizar políticas de segurança
*/

-- Criar enum para visibilidade de vídeos se não existir
DO $$ BEGIN
  CREATE TYPE video_visibility AS ENUM ('public', 'private', 'unlisted');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Adicionar coluna visibility se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'videos' AND column_name = 'visibility'
  ) THEN
    ALTER TABLE videos ADD COLUMN visibility video_visibility DEFAULT 'public';
  END IF;
END $$;

-- Atualizar política de leitura de vídeos
DROP POLICY IF EXISTS "Anyone can read videos" ON videos;

CREATE POLICY "Users can read public and unlisted videos, and their own videos"
  ON videos
  FOR SELECT
  TO authenticated
  USING (
    visibility = 'public' 
    OR visibility = 'unlisted' 
    OR auth.uid() = user_id
  );

CREATE INDEX IF NOT EXISTS videos_visibility_idx ON videos(visibility);