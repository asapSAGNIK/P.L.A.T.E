-- Create database tables and RLS policies for P.L.A.T.E app

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own saved recipes" ON user_saved_recipes;
DROP POLICY IF EXISTS "Users can insert their own saved recipes" ON user_saved_recipes;
DROP POLICY IF EXISTS "Users can update their own saved recipes" ON user_saved_recipes;
DROP POLICY IF EXISTS "Users can delete their own saved recipes" ON user_saved_recipes;

DROP POLICY IF EXISTS "Users can view their own recipe generation history" ON recipe_generation_history;
DROP POLICY IF EXISTS "Users can insert their own recipe generation history" ON recipe_generation_history;

DROP POLICY IF EXISTS "Users can view their own rate limits" ON user_rate_limits;
DROP POLICY IF EXISTS "Users can insert their own rate limits" ON user_rate_limits;
DROP POLICY IF EXISTS "Users can update their own rate limits" ON user_rate_limits;

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    prep_time_minutes INTEGER,
    cook_time_minutes INTEGER,
    servings INTEGER,
    cuisine TEXT,
    difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    source TEXT NOT NULL CHECK (source IN ('Spoonacular', 'Gemini', 'UserGenerated')),
    original_recipe_id TEXT,
    instructions TEXT,
    ingredients JSONB,
    rating DECIMAL(3,2) DEFAULT 4.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_saved_recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'saved' CHECK (status IN ('saved', 'cooked', 'favorite')),
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    last_cooked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, recipe_id)
);

CREATE TABLE IF NOT EXISTS recipe_generation_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mode TEXT NOT NULL CHECK (mode IN ('fridge', 'search', 'random')),
    ingredients JSONB,
    query TEXT,
    filters JSONB,
    generated_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_generations INTEGER NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Enable RLS on all tables
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_generation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rate_limits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_saved_recipes
CREATE POLICY "Users can view their own saved recipes" ON user_saved_recipes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved recipes" ON user_saved_recipes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved recipes" ON user_saved_recipes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved recipes" ON user_saved_recipes
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for recipe_generation_history
CREATE POLICY "Users can view their own recipe generation history" ON recipe_generation_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recipe generation history" ON recipe_generation_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_rate_limits
CREATE POLICY "Users can view their own rate limits" ON user_rate_limits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rate limits" ON user_rate_limits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rate limits" ON user_rate_limits
    FOR UPDATE USING (auth.uid() = user_id);

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS increment_rate_limit(UUID, TEXT);

-- Create RPC function for rate limiting
CREATE OR REPLACE FUNCTION increment_rate_limit(p_user_id UUID, p_type TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_rate_limits (user_id, recipe_generations, date)
    VALUES (p_user_id, 1, CURRENT_DATE)
    ON CONFLICT (user_id, date)
    DO UPDATE SET 
        recipe_generations = user_rate_limits.recipe_generations + 1,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_rate_limit(UUID, TEXT) TO anon, authenticated;
