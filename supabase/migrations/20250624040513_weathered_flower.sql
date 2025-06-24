/*
  # Update analyses table for new features

  1. Schema Updates
    - Add analysis_type column for different analysis types
    - Add text_content column for combined analysis
    - Add explanation_data column for AI explanations
    - Add report_id column for PDF reports and sharing

  2. Security
    - Maintain existing RLS policies
    - Ensure new columns are properly secured
*/

-- Add new columns to analyses table
DO $$
BEGIN
  -- Add analysis_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'analyses' AND column_name = 'analysis_type'
  ) THEN
    ALTER TABLE analyses ADD COLUMN analysis_type text DEFAULT 'media';
  END IF;

  -- Add text_content column for combined analysis
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'analyses' AND column_name = 'text_content'
  ) THEN
    ALTER TABLE analyses ADD COLUMN text_content text;
  END IF;

  -- Add explanation_data column for AI explanations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'analyses' AND column_name = 'explanation_data'
  ) THEN
    ALTER TABLE analyses ADD COLUMN explanation_data jsonb;
  END IF;

  -- Add report_id column for PDF reports and sharing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'analyses' AND column_name = 'report_id'
  ) THEN
    ALTER TABLE analyses ADD COLUMN report_id text;
  END IF;
END $$;

-- Add constraint for analysis_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'analyses' AND constraint_name = 'analyses_analysis_type_check'
  ) THEN
    ALTER TABLE analyses ADD CONSTRAINT analyses_analysis_type_check 
    CHECK (analysis_type IN ('media', 'voice', 'combined'));
  END IF;
END $$;

-- Create index for report_id for faster lookups
CREATE INDEX IF NOT EXISTS analyses_report_id_idx ON analyses(report_id) WHERE report_id IS NOT NULL;

-- Create index for analysis_type
CREATE INDEX IF NOT EXISTS analyses_analysis_type_idx ON analyses(analysis_type);