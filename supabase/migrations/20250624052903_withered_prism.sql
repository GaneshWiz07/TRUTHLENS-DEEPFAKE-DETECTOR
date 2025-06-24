/*
  # Fix API Token Duplicates

  1. Problem
    - Multiple API tokens can exist for the same user
    - Frontend expects only one token per user
    - Database query fails when multiple rows are returned

  2. Solution
    - Remove duplicate API tokens (keep the most recent one)
    - Add unique constraint on user_id column
    - Ensure each user has only one API token

  3. Changes
    - Delete duplicate tokens, keeping the most recent one per user
    - Add unique constraint on user_id in user_api_tokens table
*/

-- First, remove duplicate API tokens, keeping only the most recent one per user
DELETE FROM user_api_tokens 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM user_api_tokens
  ORDER BY user_id, created_at DESC
);

-- Add unique constraint on user_id to prevent future duplicates
ALTER TABLE user_api_tokens 
ADD CONSTRAINT user_api_tokens_user_id_key UNIQUE (user_id);