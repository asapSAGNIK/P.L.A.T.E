-- Create recipe generation history table for P.L.A.T.E application
-- This table tracks all AI recipe generations for users, regardless of whether they save them

-- Create enum for generation mode
DO $$ BEGIN
    CREATE TYPE generation_mode_enum AS ENUM ('fridge', 'explore');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Recipe generation history table
CREATE TABLE IF NOT EXISTS recipe_generation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_data JSONB NOT NULL, -- Store the full AI recipe data
  mode generation_mode_enum NOT NULL, -- 'fridge' or 'explore'
  ingredients_used TEXT[], -- Store ingredients that were used for generation
  query_used TEXT, -- Store the query/mood used for generation
  filters JSONB, -- Store any filters applied (time, servings, etc.)
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recipe_generation_history_user_id ON recipe_generation_history (user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_generation_history_generated_at ON recipe_generation_history (generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipe_generation_history_mode ON recipe_generation_history (mode);

-- Create a function to get the last N generated recipes for a user
CREATE OR REPLACE FUNCTION get_user_recipe_generation_history(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  recipe_data JSONB,
  mode generation_mode_enum,
  ingredients_used TEXT[],
  query_used TEXT,
  filters JSONB,
  generated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rgh.id,
    rgh.recipe_data,
    rgh.mode,
    rgh.ingredients_used,
    rgh.query_used,
    rgh.filters,
    rgh.generated_at
  FROM recipe_generation_history rgh
  WHERE rgh.user_id = p_user_id
  ORDER BY rgh.generated_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_recipe_generation_history(UUID, INTEGER) TO authenticated;
GRANT SELECT, INSERT ON recipe_generation_history TO authenticated;
