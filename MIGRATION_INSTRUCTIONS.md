# Database Migration Instructions

## 🎯 Fix the Missing Status Column Issue

The error you're seeing is because the `user_saved_recipes` table is missing the `status` column that the Edge Function expects.

## 📋 Step-by-Step Instructions

### Step 1: Open Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `lmdoqtkotwbgbsudreff`
3. Navigate to **SQL Editor** (in the left sidebar)

### Step 2: Apply the Migration
1. Click **"New Query"** in the SQL Editor
2. Copy the entire contents of `apply-migration.sql` file
3. Paste it into the SQL Editor
4. Click **"Run"** to execute the migration

### Step 3: Verify the Migration
After running the migration, you should see:
- ✅ Success messages in the output
- ✅ Verification queries showing the tables and columns
- ✅ The `status` column should now exist in `user_saved_recipes`

### Step 4: Test the Edge Function
1. Go back to your application
2. Try loading the Saved Recipes page
3. The 500 error should be resolved

## 🔍 What This Migration Does

1. **Adds the missing `status` column** to `user_saved_recipes` table
2. **Creates all required tables** if they don't exist
3. **Sets up proper RLS policies** for security
4. **Creates required database functions** for the Edge Functions
5. **Grants necessary permissions** for the application to work

## 🚨 Important Notes

- This migration is **safe to run multiple times** (it uses `IF NOT EXISTS` and `IF EXISTS` checks)
- It will **not delete any existing data**
- It will **only add missing columns and tables**
- The migration includes **verification queries** to confirm everything worked

## 🐛 If Something Goes Wrong

If you encounter any errors during the migration:

1. **Check the error message** in the SQL Editor output
2. **Most common issues**:
   - Permission errors (make sure you're using the service role key)
   - Table already exists (this is normal, the migration handles it)
   - Column already exists (this is normal, the migration handles it)

3. **If you get permission errors**:
   - Make sure you're logged in as the project owner
   - Try running the migration in smaller chunks

## ✅ Success Indicators

After running the migration, you should see:
- No error messages in the SQL Editor
- Success messages like "Added status column to user_saved_recipes table"
- Verification queries showing all tables and columns exist
- Your Saved Recipes page should work without the 500 error

## 🎉 Next Steps

Once the migration is complete:
1. Test the Saved Recipes page in your application
2. Test the Cooking History page
3. Test Recipe Generation
4. If everything works, you can remove the backend directory

---

**Ready to apply the migration? Copy the contents of `apply-migration.sql` and run it in your Supabase SQL Editor!**
