-- Fix recipe_generation_history table schema
-- Add missing columns that the code expects

ALTER TABLE recipe_generation_history 
ADD COLUMN IF NOT EXISTS recipe_data JSONB,
ADD COLUMN IF NOT EXISTS ingredients_used JSONB,
ADD COLUMN IF NOT EXISTS query_used TEXT,
ADD COLUMN IF NOT EXISTS generated_at TIMESTAMP WITH TIME ZONE;

-- Update existing records to have proper structure
-- This is a one-time migration for existing data
UPDATE recipe_generation_history 
SET 
  ingredients_used = ingredients,
  query_used = query,
  generated_at = created_at
WHERE ingredients_used IS NULL;
