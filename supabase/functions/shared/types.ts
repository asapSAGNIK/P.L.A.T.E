// Shared types for all Supabase Edge Functions

export interface RecipeGenerationRequest {
  ingredients?: string[]
  query?: string
  mode?: 'fridge' | 'explore'
  filters?: {
    cuisine?: string
    diet?: string
    maxTime?: number
    difficulty?: string
    servings?: number
    mealType?: string
  }
}

export interface AIRecipe {
  id: string
  title: string
  description: string
  prep_time_minutes: number
  cook_time_minutes: number
  servings: number
  cuisine: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  source: 'Gemini'
  instructions: string
  ingredients: Array<{
    name: string
    amount?: string
    unit?: string
    required?: boolean
  }> | string[]
  rating: number
}

export interface SaveRecipeRequest {
  title: string
  description?: string
  prep_time_minutes?: number
  cook_time_minutes?: number
  servings?: number
  cuisine?: string
  difficulty?: 'Easy' | 'Medium' | 'Hard'
  source: 'Spoonacular' | 'Gemini' | 'UserGenerated'
  original_recipe_id?: string
  instructions?: string
  ingredients?: any
  rating?: number
}

export interface CommentaryRequest {
  recipeTitle: string
  ingredients: string[]
  instructions: string
  type?: 'commentary' | 'twist'
}

export interface SpoonacularSearchRequest {
  ingredients?: string[]
  query?: string
  filters?: {
    cuisine?: string
    diet?: string
    maxTime?: number
    difficulty?: string
    servings?: number
    mealType?: string
  }
}

export interface RateLimitStatus {
  currentCount: number
  maxRequests: number
  remaining: number
  resetTime: Date
}

export interface ApiResponse<T = any> {
  success?: boolean
  data?: T
  error?: string
  message?: string
}

// CORS headers for all functions
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Common error response helper
export function createErrorResponse(error: unknown, status: number = 500): Response {
  const errorMessage = error instanceof Error ? error.message : 'Internal server error'
  
  return new Response(
    JSON.stringify({ error: errorMessage }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status 
    }
  )
}

// Common success response helper
export function createSuccessResponse<T>(data: T, status: number = 200): Response {
  return new Response(
    JSON.stringify(data),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status 
    }
  )
}

// Authentication helper
export async function authenticateUser(req: Request, supabase: any): Promise<{ user: any } | Response> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return createErrorResponse('Authorization header required', 401)
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  
  if (authError || !user) {
    return createErrorResponse('Invalid or expired token', 401)
  }

  return { user }
}
