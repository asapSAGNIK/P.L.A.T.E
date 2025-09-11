@echo off
REM Supabase Edge Functions Deployment Script for Windows
REM This script deploys all Edge Functions to Supabase

echo 🚀 Starting Supabase Edge Functions deployment...

REM Check if Supabase CLI is available via npx
npx supabase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Supabase CLI is not available. Please install it first:
    echo npm install supabase --save-dev
    exit /b 1
)

REM Check if user is logged in
npx supabase projects list >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Please login to Supabase first:
    echo npx supabase login
    exit /b 1
)

REM Deploy all Edge Functions
echo 📦 Deploying Edge Functions...

set functions=generate-recipes save-recipe get-saved-recipes remove-recipe check-rate-limit get-recipe-history spoonacular-search ai-commentary

for %%f in (%functions%) do (
    echo Deploying %%f...
    npx supabase functions deploy %%f
    if %errorlevel% equ 0 (
        echo ✅ %%f deployed successfully
    ) else (
        echo ❌ Failed to deploy %%f
        exit /b 1
    )
)

echo 🎉 All Edge Functions deployed successfully!
echo.
echo 📋 Next steps:
echo 1. Set up environment variables in Supabase dashboard:
echo    - GEMINI_API_KEY
echo    - SPOONACULAR_API_KEY
echo 2. Update your frontend to use the new Edge Functions
echo 3. Test the functions to ensure they work correctly
