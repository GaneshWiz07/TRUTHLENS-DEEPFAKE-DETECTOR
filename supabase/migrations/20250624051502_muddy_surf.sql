/*
  # Create user API tokens table

  1. New Tables
    - `user_api_tokens`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `token` (text, unique)
      - `created_at` (timestamp)
      - `last_used` (timestamp)

  2. Security
    - Enable RLS on `user_api_tokens` table
    - Add policy for users to manage their own tokens
*/

CREATE TABLE IF NOT EXISTS user_api_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_used timestamptz
);

ALTER TABLE user_api_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own API tokens"
  ON user_api_tokens
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS user_api_tokens_token_idx ON user_api_tokens(token);
CREATE INDEX IF NOT EXISTS user_api_tokens_user_id_idx ON user_api_tokens(user_id);