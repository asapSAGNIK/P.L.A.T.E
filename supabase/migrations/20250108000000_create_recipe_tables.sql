-- Create recipe tables
CREATE TABLE IF NOT EXISTS recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  servings INTEGER,
  cuisine TEXT,
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  source TEXT CHECK (source IN ('Spoonacular', 'Gemini', 'UserGenerated')),
  original_recipe_id TEXT,
  image_url TEXT,
  instructions TEXT,
  ingredients JSONB,
  rating DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_saved_recipes table
CREATE TABLE IF NOT EXISTS user_saved_recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'saved' CHECK (status IN ('saved', 'cooked', 'favorite')),
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  last_cooked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, recipe_id)
);

-- Create recipe_generation_history table
CREATE TABLE IF NOT EXISTS recipe_generation_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('fridge', 'explore')),
  ingredients JSONB,
  query TEXT,
  filters JSONB,
  generated_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_rate_limits table
CREATE TABLE IF NOT EXISTS user_rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  recipe_generations INTEGER DEFAULT 0,
  spoonacular_searches INTEGER DEFAULT 0,
  ai_commentaries INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_saved_recipes_user_id ON user_saved_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_recipes_recipe_id ON user_saved_recipes(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_generation_history_user_id ON recipe_generation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rate_limits_user_id ON user_rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rate_limits_date ON user_rate_limits(date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_saved_recipes_updated_at BEFORE UPDATE ON user_saved_recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_rate_limits_updated_at BEFORE UPDATE ON user_rate_limits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_generation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rate_limits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Recipes: public read access
CREATE POLICY "Recipes are publicly readable" ON recipes
  FOR SELECT USING (true);

-- User saved recipes: users can only access their own
CREATE POLICY "Users can view their own saved recipes" ON user_saved_recipes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved recipes" ON user_saved_recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved recipes" ON user_saved_recipes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved recipes" ON user_saved_recipes
  FOR DELETE USING (auth.uid() = user_id);

-- Recipe generation history: users can only access their own
CREATE POLICY "Users can view their own recipe generation history" ON recipe_generation_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recipe generation history" ON recipe_generation_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User rate limits: users can only access their own
CREATE POLICY "Users can view their own rate limits" ON user_rate_limits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rate limits" ON user_rate_limits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rate limits" ON user_rate_limits
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RPC functions
CREATE OR REPLACE FUNCTION get_user_recipe_generation_history(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  mode TEXT,
  ingredients JSONB,
  query TEXT,
  filters JSONB,
  generated_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rgh.id,
    rgh.mode,
    rgh.ingredients,
    rgh.query,
    rgh.filters,
    rgh.generated_count,
    rgh.created_at
  FROM recipe_generation_history rgh
  WHERE rgh.user_id = p_user_id
  ORDER BY rgh.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create increment rate limit function
CREATE OR REPLACE FUNCTION increment_rate_limit(
  p_user_id UUID,
  p_type TEXT
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  INSERT INTO user_rate_limits (user_id, date)
  VALUES (p_user_id, CURRENT_DATE)
  ON CONFLICT (user_id, date) DO UPDATE SET
    recipe_generations = CASE 
      WHEN p_type = 'recipe_generation' THEN user_rate_limits.recipe_generations + 1
      ELSE user_rate_limits.recipe_generations
    END,
    spoonacular_searches = CASE 
      WHEN p_type = 'spoonacular_search' THEN user_rate_limits.spoonacular_searches + 1
      ELSE user_rate_limits.spoonacular_searches
    END,
    ai_commentaries = CASE 
      WHEN p_type = 'ai_commentary' THEN user_rate_limits.ai_commentaries + 1
      ELSE user_rate_limits.ai_commentaries
    END,
    updated_at = NOW()
  RETURNING json_build_object(
    'recipe_generations', recipe_generations,
    'spoonacular_searches', spoonacular_searches,
    'ai_commentaries', ai_commentaries,
    'date', date
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
