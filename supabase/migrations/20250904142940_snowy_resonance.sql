/*
  # Create subscriptions table

  1. New Tables
    - `subscriptions`
      - `id` (uuid, primary key)
      - `subscriber_id` (uuid) - user who is subscribing
      - `channel_id` (uuid) - user being subscribed to
      - `created_at` (timestamp) - when subscription was created

  2. Security
    - Enable RLS on `subscriptions` table
    - Add policies for subscription management

  3. Constraints
    - Unique constraint on (subscriber_id, channel_id)
    - Prevent self-subscription
*/

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(subscriber_id, channel_id),
  CHECK (subscriber_id != channel_id)
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read all subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own subscriptions"
  ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = subscriber_id);

CREATE POLICY "Users can delete their own subscriptions"
  ON subscriptions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = subscriber_id);

-- Function to update subscriber count
CREATE OR REPLACE FUNCTION update_subscriber_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users 
    SET subscriber_count = subscriber_count + 1, updated_at = now()
    WHERE id = NEW.channel_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users 
    SET subscriber_count = subscriber_count - 1, updated_at = now()
    WHERE id = OLD.channel_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS subscriber_count_trigger ON subscriptions;
CREATE TRIGGER subscriber_count_trigger
  AFTER INSERT OR DELETE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_subscriber_count();

-- Create indexes
CREATE INDEX IF NOT EXISTS subscriptions_subscriber_id_idx ON subscriptions(subscriber_id);
CREATE INDEX IF NOT EXISTS subscriptions_channel_id_idx ON subscriptions(channel_id);