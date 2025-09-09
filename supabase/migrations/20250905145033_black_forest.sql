/*
  # Adicionar tabela de likes em comentários

  1. Nova Tabela
    - `comment_likes`
      - `id` (uuid, primary key)
      - `comment_id` (uuid, foreign key para comments)
      - `user_id` (uuid, foreign key para users)
      - `is_like` (boolean)
      - `created_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela
    - Adicionar políticas apropriadas

  3. Triggers
    - Atualizar contador de likes nos comentários
*/

CREATE TABLE IF NOT EXISTS comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_like boolean NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comment likes"
  ON comment_likes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own comment likes"
  ON comment_likes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Adicionar coluna dislikes na tabela comments se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comments' AND column_name = 'dislikes'
  ) THEN
    ALTER TABLE comments ADD COLUMN dislikes integer DEFAULT 0;
  END IF;
END $$;

-- Função para atualizar contadores de likes/dislikes nos comentários
CREATE OR REPLACE FUNCTION update_comment_like_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_like THEN
      UPDATE comments SET likes = likes + 1 WHERE id = NEW.comment_id;
    ELSE
      UPDATE comments SET dislikes = dislikes + 1 WHERE id = NEW.comment_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.is_like THEN
      UPDATE comments SET likes = likes - 1 WHERE id = OLD.comment_id;
    ELSE
      UPDATE comments SET dislikes = dislikes - 1 WHERE id = OLD.comment_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_like AND NOT NEW.is_like THEN
      UPDATE comments SET likes = likes - 1, dislikes = dislikes + 1 WHERE id = NEW.comment_id;
    ELSIF NOT OLD.is_like AND NEW.is_like THEN
      UPDATE comments SET likes = likes + 1, dislikes = dislikes - 1 WHERE id = NEW.comment_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comment_like_counts_trigger
  AFTER INSERT OR DELETE OR UPDATE ON comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_comment_like_counts();

CREATE INDEX comment_likes_comment_id_idx ON comment_likes(comment_id);
CREATE INDEX comment_likes_user_id_idx ON comment_likes(user_id);