-- Create recipe management tables for P.L.A.T.E application
-- This migration creates the necessary tables for saving AI-generated and other recipes

-- Create enums for recipe management (only if they don't exist)
DO $$ BEGIN
    CREATE TYPE recipe_source_enum AS ENUM ('Spoonacular', 'Gemini', 'UserGenerated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE recipe_difficulty_enum AS ENUM ('Easy', 'Medium', 'Hard');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Main recipes table to store all recipes (AI-generated, Spoonacular, user-created)
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  servings INTEGER,
  cuisine TEXT,
  difficulty recipe_difficulty_enum,
  source recipe_source_enum NOT NULL,
  original_recipe_id TEXT, -- For external recipes (Spoonacular)
  image_url TEXT,
  instructions TEXT,
  ingredients JSONB, -- Store ingredients as JSON for flexibility
  rating DECIMAL(3,2) DEFAULT 4.0, -- Default rating for recipes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User saved recipes junction table
CREATE TABLE IF NOT EXISTS user_saved_recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'saved', -- 'saved', 'cooked', 'favorite'
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  last_cooked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, recipe_id) -- A user can save a recipe only once
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recipes_title ON recipes (title);
CREATE INDEX IF NOT EXISTS idx_recipes_source ON recipes (source);
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes (difficulty);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes (created_at);

CREATE INDEX IF NOT EXISTS idx_user_saved_recipes_user_id ON user_saved_recipes (user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_recipes_recipe_id ON user_saved_recipes (recipe_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_recipes_status ON user_saved_recipes (status);
CREATE INDEX IF NOT EXISTS idx_user_saved_recipes_created_at ON user_saved_recipes (created_at);

-- Enable Row Level Security
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_recipes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recipes table
-- Anyone can view recipes (public read)
CREATE POLICY "Anyone can view recipes" ON recipes 
  FOR SELECT USING (true);

-- Authenticated users can insert recipes
CREATE POLICY "Authenticated users can insert recipes" ON recipes 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Authenticated users can update recipes they created (if needed)
CREATE POLICY "Authenticated users can update recipes" ON recipes 
  FOR UPDATE USING (auth.role() = 'authenticated');

-- RLS Policies for user_saved_recipes table
-- Users can view their own saved recipes
CREATE POLICY "Users can view their own saved recipes" ON user_saved_recipes 
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own saved recipes
CREATE POLICY "Users can insert their own saved recipes" ON user_saved_recipes 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own saved recipes
CREATE POLICY "Users can update their own saved recipes" ON user_saved_recipes 
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own saved recipes
CREATE POLICY "Users can delete their own saved recipes" ON user_saved_recipes 
  FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT ON recipes TO authenticated;
GRANT INSERT ON recipes TO authenticated;
GRANT UPDATE ON recipes TO authenticated;

GRANT SELECT ON user_saved_recipes TO authenticated;
GRANT INSERT ON user_saved_recipes TO authenticated;
GRANT UPDATE ON user_saved_recipes TO authenticated;
GRANT DELETE ON user_saved_recipes TO authenticated;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_saved_recipes_updated_at BEFORE UPDATE ON user_saved_recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();