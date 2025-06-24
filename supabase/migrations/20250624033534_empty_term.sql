/*
  # Create analyses table for deepfake detection results

  1. New Tables
    - `analyses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `file_name` (text)
      - `file_type` (text)
      - `file_size` (integer)
      - `result` (text, 'real' or 'deepfake')
      - `confidence` (integer, 0-100)
      - `issues_detected` (text array)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `analyses` table
    - Add policy for users to read their own analyses
    - Add policy for users to create their own analyses
*/

CREATE TABLE IF NOT EXISTS analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  result text NOT NULL CHECK (result IN ('real', 'deepfake')),
  confidence integer NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  issues_detected text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

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

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS analyses_user_id_created_at_idx 
  ON analyses(user_id, created_at DESC);