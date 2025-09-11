#!/bin/bash

# Supabase Edge Functions Deployment Script
# This script deploys all Edge Functions to Supabase

echo "🚀 Starting Supabase Edge Functions deployment..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if user is logged in
if ! supabase projects list &> /dev/null; then
    echo "❌ Please login to Supabase first:"
    echo "supabase login"
    exit 1
fi

# Deploy all Edge Functions
echo "📦 Deploying Edge Functions..."

functions=(
    "generate-recipes"
    "save-recipe"
    "get-saved-recipes"
    "remove-recipe"
    "check-rate-limit"
    "get-recipe-history"
    "spoonacular-search"
    "ai-commentary"
)

for func in "${functions[@]}"; do
    echo "Deploying $func..."
    supabase functions deploy $func
    if [ $? -eq 0 ]; then
        echo "✅ $func deployed successfully"
    else
        echo "❌ Failed to deploy $func"
        exit 1
    fi
done

echo "🎉 All Edge Functions deployed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Set up environment variables in Supabase dashboard:"
echo "   - GEMINI_API_KEY"
echo "   - SPOONACULAR_API_KEY"
echo "2. Update your frontend to use the new Edge Functions"
echo "3. Test the functions to ensure they work correctly"
