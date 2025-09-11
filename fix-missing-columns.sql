-- Fix missing columns in user_saved_recipes table
-- This script adds the missing columns that the Edge Function expects

-- =====================================================
-- STEP 1: Add missing columns to user_saved_recipes
-- =====================================================

-- Add notes column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_saved_recipes' 
        AND column_name = 'notes'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE user_saved_recipes ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column to user_saved_recipes table';
    ELSE
        RAISE NOTICE 'Notes column already exists in user_saved_recipes table';
    END IF;
END $$;

-- Add rating column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_saved_recipes' 
        AND column_name = 'rating'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE user_saved_recipes ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5);
        RAISE NOTICE 'Added rating column to user_saved_recipes table';
    ELSE
        RAISE NOTICE 'Rating column already exists in user_saved_recipes table';
    END IF;
END $$;

-- Add last_cooked_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_saved_recipes' 
        AND column_name = 'last_cooked_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE user_saved_recipes ADD COLUMN last_cooked_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added last_cooked_at column to user_saved_recipes table';
    ELSE
        RAISE NOTICE 'Last_cooked_at column already exists in user_saved_recipes table';
    END IF;
END $$;

-- =====================================================
-- STEP 2: Verify all columns exist
-- =====================================================

-- Check the current structure of user_saved_recipes table
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_saved_recipes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- STEP 3: Test the Edge Function query
-- =====================================================

-- Test if we can query the table with all required columns
-- This will help verify the schema is correct
SELECT 
    'user_saved_recipes table structure verification' as test_name,
    CASE 
        WHEN COUNT(*) = 9 THEN '✅ All required columns exist'
        ELSE '❌ Missing columns: ' || (9 - COUNT(*))::text
    END as result
FROM information_schema.columns 
WHERE table_name = 'user_saved_recipes' 
AND table_schema = 'public'
AND column_name IN (
    'id', 'user_id', 'recipe_id', 'status', 'notes', 
    'rating', 'last_cooked_at', 'created_at', 'updated_at'
);

-- =====================================================
-- STEP 4: Success message
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Missing Columns Fix Completed!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '✅ Added missing columns to user_saved_recipes';
    RAISE NOTICE '✅ Schema should now match Edge Function expectations';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Your get-saved-recipes Edge Function should now work!';
    RAISE NOTICE '=====================================================';
END $$;
