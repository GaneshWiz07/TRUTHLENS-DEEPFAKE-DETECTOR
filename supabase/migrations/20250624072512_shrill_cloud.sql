/*
  # Add advanced analysis features

  1. Schema Updates
    - Update analysis_type constraint to include new types
    - Add indexes for better performance

  2. New Analysis Types
    - 'text' for AI text generation detection
    - 'location' for location verification analysis
*/

-- Update analysis_type constraint to include new types
DO $$
BEGIN
  -- Drop existing constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'analyses' AND constraint_name = 'analyses_analysis_type_check'
  ) THEN
    ALTER TABLE analyses DROP CONSTRAINT analyses_analysis_type_check;
  END IF;

  -- Add new constraint with additional types
  ALTER TABLE analyses ADD CONSTRAINT analyses_analysis_type_check 
  CHECK (analysis_type IN ('media', 'voice', 'combined', 'text', 'location'));
END $$;

-- Create additional indexes for new analysis types
CREATE INDEX IF NOT EXISTS analyses_analysis_type_text_idx ON analyses(analysis_type) WHERE analysis_type = 'text';
CREATE INDEX IF NOT EXISTS analyses_analysis_type_location_idx ON analyses(analysis_type) WHERE analysis_type = 'location';