# Supabase Edge Functions for P.L.A.T.E

This directory contains all the Supabase Edge Functions that replace the Express.js backend functionality.

## Structure

```
supabase/
├── functions/
│   ├── generate-recipes/          # AI recipe generation using Gemini
│   ├── save-recipe/              # Save recipes to user collection
│   ├── get-saved-recipes/        # Retrieve user's saved recipes
│   ├── remove-recipe/            # Remove recipes from user collection
│   ├── check-rate-limit/         # Check user rate limit status
│   ├── get-recipe-history/       # Get user's recipe generation history
│   ├── spoonacular-search/       # Search recipes using Spoonacular API
│   └── ai-commentary/            # Generate AI commentary and twists
├── config.toml                   # Supabase configuration
├── deploy.sh                     # Linux/Mac deployment script
├── deploy.bat                    # Windows deployment script
└── README.md                     # This file
```

## Setup

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Link to your project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### 4. Set Environment Variables

In your Supabase dashboard, go to Settings > Edge Functions and set these secrets:

- `GEMINI_API_KEY` - Your Google Gemini API key
- `SPOONACULAR_API_KEY` - Your Spoonacular API key

### 5. Deploy Functions

**Linux/Mac:**
```bash
./deploy.sh
```

**Windows:**
```cmd
deploy.bat
```

**Manual deployment:**
```bash
supabase functions deploy generate-recipes
supabase functions deploy save-recipe
supabase functions deploy get-saved-recipes
supabase functions deploy remove-recipe
supabase functions deploy check-rate-limit
supabase functions deploy get-recipe-history
supabase functions deploy spoonacular-search
supabase functions deploy ai-commentary
```

## Functions Overview

### generate-recipes
- **Purpose**: Generate AI recipes using Gemini API
- **Input**: Recipe generation request with ingredients/query and filters
- **Output**: Array of AI-generated recipes with rate limit info
- **Rate Limiting**: 20 requests per day per user

### save-recipe
- **Purpose**: Save a recipe to user's collection
- **Input**: Recipe data
- **Output**: Saved recipe with user association

### get-saved-recipes
- **Purpose**: Retrieve user's saved recipes
- **Input**: Status filter, pagination parameters
- **Output**: Paginated list of saved recipes

### remove-recipe
- **Purpose**: Remove a recipe from user's collection
- **Input**: Recipe ID
- **Output**: Success confirmation

### check-rate-limit
- **Purpose**: Check user's current rate limit status
- **Input**: None (uses authenticated user)
- **Output**: Rate limit information

### get-recipe-history
- **Purpose**: Get user's recipe generation history
- **Input**: Limit parameter
- **Output**: Array of historical recipe generations

### spoonacular-search
- **Purpose**: Search recipes using Spoonacular API
- **Input**: Search parameters (ingredients, query, filters)
- **Output**: Array of Spoonacular recipes

### ai-commentary
- **Purpose**: Generate AI commentary or recipe twists
- **Input**: Recipe details and type (commentary/twist)
- **Output**: AI-generated commentary or twists

## Frontend Integration

The frontend uses the `SupabaseAPI` class in `lib/supabase/api.ts` which provides:

1. **Backward Compatibility**: Automatically falls back to the old backend if Edge Functions fail
2. **Environment Toggle**: Use `NEXT_PUBLIC_USE_EDGE_FUNCTIONS=true` to enable Edge Functions
3. **Consistent Interface**: Same API interface regardless of backend implementation

## Testing

### Local Testing

```bash
# Start Supabase locally
supabase start

# Test a function locally
supabase functions serve generate-recipes --env-file .env.local
```

### Production Testing

After deployment, test the functions using the Supabase dashboard or your frontend application.

## Monitoring

Monitor your Edge Functions in the Supabase dashboard:
- Go to Edge Functions section
- View logs and metrics
- Set up alerts for errors

## TypeScript Setup

### Understanding TypeScript Errors

The TypeScript errors you see in your IDE are **normal and expected** when developing Supabase Edge Functions. See [TYPESCRIPT_SETUP.md](./functions/TYPESCRIPT_SETUP.md) for detailed explanation.

**Quick Summary:**
- Edge Functions run on Deno, not Node.js
- Your IDE's TypeScript is configured for Node.js
- The errors are cosmetic only - functions work perfectly in production
- Deno runtime understands the code correctly

### Recommended Approach

1. **Ignore the TypeScript errors** - they don't affect functionality
2. **Focus on business logic** - the functions will work when deployed
3. **Use the shared types** in `functions/shared/types.ts` for consistency
4. **Test functions locally** using Supabase CLI

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Ensure the JWT token is valid and not expired
2. **Rate Limit Errors**: Check if user has exceeded daily limits
3. **API Key Errors**: Verify environment variables are set correctly
4. **CORS Errors**: Check that CORS headers are properly configured
5. **TypeScript Errors**: These are normal - see TypeScript Setup section above

### Debug Mode

Enable debug logging by setting the log level in your Supabase project settings.

## Migration Notes

- All functions maintain the same API interface as the original backend
- Rate limiting is preserved using the existing database functions
- Authentication uses Supabase JWT tokens
- Error handling includes proper HTTP status codes
- CORS is configured for frontend integration

## Performance Considerations

- Edge Functions run closer to users for better latency
- Database queries use existing indexes and RLS policies
- Rate limiting prevents abuse
- Caching can be implemented for frequently accessed data
