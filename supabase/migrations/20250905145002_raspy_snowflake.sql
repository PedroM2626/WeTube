/*
  # Adicionar tabela watch_later

  1. Nova Tabela
    - `watch_later`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key para users)
      - `video_id` (uuid, foreign key para videos)
      - `created_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `watch_later`
    - Adicionar políticas para usuários gerenciarem sua própria lista
*/

CREATE TABLE IF NOT EXISTS watch_later (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, video_id)
);

ALTER TABLE watch_later ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own watch later list"
  ON watch_later
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX watch_later_user_id_idx ON watch_later(user_id);
CREATE INDEX watch_later_video_id_idx ON watch_later(video_id);