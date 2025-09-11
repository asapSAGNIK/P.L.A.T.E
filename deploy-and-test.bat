@echo off
REM Comprehensive deployment and testing script for P.L.A.T.E Supabase migration

echo 🚀 P.L.A.T.E Supabase Migration - Deployment and Testing Script
echo ================================================================

REM Step 1: Check prerequisites
echo.
echo 📋 Step 1: Checking prerequisites...
npx supabase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Supabase CLI is not available. Installing...
    npm install supabase --save-dev
)

REM Step 2: Deploy Edge Functions
echo.
echo 📦 Step 2: Deploying Edge Functions...
call supabase\deploy.bat
if %errorlevel% neq 0 (
    echo ❌ Edge Functions deployment failed
    exit /b 1
)

REM Step 3: Test Edge Functions
echo.
echo 🧪 Step 3: Testing Edge Functions...
node test-edge-functions.js
if %errorlevel% neq 0 (
    echo ❌ Edge Functions test failed
    exit /b 1
)

REM Step 4: Test Frontend Integration
echo.
echo 🔧 Step 4: Testing Frontend Integration...
node debug-frontend-integration.js
if %errorlevel% neq 0 (
    echo ❌ Frontend integration test failed
    exit /b 1
)

REM Step 5: Start development server
echo.
echo 🌐 Step 5: Starting development server...
echo.
echo ✅ All tests passed! Starting Next.js development server...
echo.
echo 📋 Next steps:
echo 1. Open http://localhost:3000 in your browser
echo 2. Log in to test the application
echo 3. Try generating recipes, saving recipes, and viewing history
echo 4. Check browser console for any errors
echo 5. If everything works, remove the backend directory
echo.
echo 🚀 Starting Next.js development server...
npm run dev
