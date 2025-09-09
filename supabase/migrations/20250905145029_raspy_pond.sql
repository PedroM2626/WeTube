/*
  # Adicionar tabela de posts da comunidade

  1. Nova Tabela
    - `community_posts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key para users)
      - `content` (text)
      - `image_url` (text, opcional)
      - `likes` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela
    - Adicionar políticas apropriadas
*/

CREATE TABLE IF NOT EXISTS community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  image_url text DEFAULT '',
  likes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read community posts"
  ON community_posts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own community posts"
  ON community_posts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX community_posts_user_id_idx ON community_posts(user_id);
CREATE INDEX community_posts_created_at_idx ON community_posts(created_at DESC);