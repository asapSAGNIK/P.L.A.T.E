-- P.L.A.T.E Database Migration Script
-- This script fixes the schema mismatch issues identified in the logs
-- Run this in your Supabase SQL Editor

-- =====================================================
-- STEP 1: Add missing status column to user_saved_recipes
-- =====================================================

-- Check if status column exists, if not add it
DO $$ 
BEGIN
    -- Check if the status column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_saved_recipes' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) THEN
        -- Add the status column
        ALTER TABLE user_saved_recipes 
        ADD COLUMN status TEXT NOT NULL DEFAULT 'saved' 
        CHECK (status IN ('saved', 'cooked', 'favorite'));
        
        RAISE NOTICE 'Added status column to user_saved_recipes table';
    ELSE
        RAISE NOTICE 'Status column already exists in user_saved_recipes table';
    END IF;
END $$;

-- =====================================================
-- STEP 2: Ensure all required tables exist with correct structure
-- =====================================================

-- Create recipes table if it doesn't exist
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

-- Create user_saved_recipes table if it doesn't exist (with all columns)
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

-- Create recipe_generation_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS recipe_generation_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_data JSONB NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('fridge', 'explore')),
    ingredients_used TEXT[],
    query_used TEXT,
    filters JSONB,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_rate_limits table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_generations INTEGER NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- =====================================================
-- STEP 3: Create indexes for better performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_saved_recipes_user_id ON user_saved_recipes (user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_recipes_status ON user_saved_recipes (status);
CREATE INDEX IF NOT EXISTS idx_recipe_generation_history_user_id ON recipe_generation_history (user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_generation_history_generated_at ON recipe_generation_history (generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_rate_limits_user_id ON user_rate_limits (user_id);

-- =====================================================
-- STEP 4: Enable RLS on all tables
-- =====================================================

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_generation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rate_limits ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: Create/Update RLS policies
-- =====================================================

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

DROP POLICY IF EXISTS "Recipes are publicly readable" ON recipes;

-- Create RLS policies for recipes (public read access)
CREATE POLICY "Recipes are publicly readable" ON recipes
    FOR SELECT USING (true);

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

-- =====================================================
-- STEP 6: Create/Update required functions
-- =====================================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_user_recipe_generation_history(UUID, INTEGER);
DROP FUNCTION IF EXISTS increment_rate_limit(UUID, TEXT);
DROP FUNCTION IF EXISTS get_user_rate_limit_status(UUID);

-- Create RPC function for getting recipe generation history
CREATE OR REPLACE FUNCTION get_user_recipe_generation_history(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    recipe_data JSONB,
    mode TEXT,
    ingredients_used TEXT[],
    query_used TEXT,
    filters JSONB,
    generated_at TIMESTAMP WITH TIME ZONE
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

-- Create function to get user rate limit status
CREATE OR REPLACE FUNCTION get_user_rate_limit_status(p_user_id UUID)
RETURNS TABLE (
    remaining INTEGER,
    total INTEGER,
    reset_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        GREATEST(0, 20 - COALESCE(SUM(recipe_generations), 0))::INTEGER as remaining,
        20::INTEGER as total,
        CURRENT_DATE as reset_date
    FROM user_rate_limits
    WHERE user_id = p_user_id AND date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 7: Grant necessary permissions
-- =====================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_recipe_generation_history(UUID, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_rate_limit(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_rate_limit_status(UUID) TO anon, authenticated;

-- =====================================================
-- STEP 8: Verification queries
-- =====================================================

-- Verify the status column exists
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_saved_recipes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verify all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('recipes', 'user_saved_recipes', 'recipe_generation_history', 'user_rate_limits')
ORDER BY table_name;

-- Verify functions exist
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_user_recipe_generation_history', 'increment_rate_limit', 'get_user_rate_limit_status')
ORDER BY routine_name;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'P.L.A.T.E Database Migration Completed Successfully!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '✅ Added missing status column to user_saved_recipes';
    RAISE NOTICE '✅ Created/verified all required tables';
    RAISE NOTICE '✅ Created/updated all RLS policies';
    RAISE NOTICE '✅ Created/updated all required functions';
    RAISE NOTICE '✅ Granted all necessary permissions';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Your get-saved-recipes Edge Function should now work!';
    RAISE NOTICE '=====================================================';
END $$;
