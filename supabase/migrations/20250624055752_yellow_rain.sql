/*
  # Fix delete functionality by updating RLS policies

  1. Policy Updates
    - Update existing policies to properly handle DELETE operations
    - Add explicit DELETE policies for analyses table
    - Ensure proper user authentication checks

  2. Security
    - Maintain data security while allowing proper delete operations
    - Use proper auth.uid() checks for delete operations
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can read own analyses" ON analyses;
DROP POLICY IF EXISTS "Users can create own analyses" ON analyses;

-- Create comprehensive policies for all operations
CREATE POLICY "Users can read own analyses"
  ON analyses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own analyses"
  ON analyses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses"
  ON analyses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
  ON analyses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Ensure the table has RLS enabled
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;