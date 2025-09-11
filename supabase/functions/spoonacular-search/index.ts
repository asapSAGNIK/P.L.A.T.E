import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SpoonacularSearchRequest {
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

// Cache for Spoonacular API responses (in-memory cache)
const cache = new Map<string, { data: any, timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

function getCacheKey(request: SpoonacularSearchRequest): string {
  return JSON.stringify({
    ingredients: request.ingredients?.sort(),
    query: request.query,
    filters: request.filters
  })
}

function getCachedResult(cacheKey: string): any | null {
  const cached = cache.get(cacheKey)
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log('Returning cached Spoonacular result')
    return cached.data
  }
  if (cached) {
    cache.delete(cacheKey) // Remove expired cache
  }
  return null
}

function setCachedResult(cacheKey: string, data: any): void {
  cache.set(cacheKey, { data, timestamp: Date.now() })
  console.log('Cached Spoonacular result')
}

async function searchSpoonacularRecipes(request: SpoonacularSearchRequest) {
  const spoonacularApiKey = Deno.env.get('SPOONACULAR_API_KEY')
  if (!spoonacularApiKey) {
    throw new Error('Spoonacular API key not configured')
  }

  // Check cache first
  const cacheKey = getCacheKey(request)
  const cachedResult = getCachedResult(cacheKey)
  if (cachedResult) {
    return cachedResult
  }

  const { ingredients, query, filters } = request
  let searchUrl = 'https://api.spoonacular.com/recipes/complexSearch'
  const params = new URLSearchParams()

  // Set API key
  params.append('apiKey', spoonacularApiKey)
  params.append('number', '10') // Limit to 10 results
  params.append('addRecipeInformation', 'true')
  params.append('fillIngredients', 'true')

  // Add search parameters
  if (ingredients && ingredients.length > 0) {
    params.append('includeIngredients', ingredients.join(','))
  }
  
  if (query) {
    params.append('query', query)
  }

  // Add filters
  if (filters) {
    if (filters.cuisine) params.append('cuisine', filters.cuisine)
    if (filters.diet) params.append('diet', filters.diet)
    if (filters.maxTime) params.append('maxReadyTime', filters.maxTime.toString())
    if (filters.servings) params.append('servings', filters.servings.toString())
    if (filters.mealType) params.append('type', filters.mealType)
  }

  searchUrl += '?' + params.toString()

  try {
    console.log('Making Spoonacular API request:', searchUrl.replace(spoonacularApiKey, '***'))
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'P.L.A.T.E-App/1.0'
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Spoonacular API error:', response.status, errorText)
      
      if (response.status === 429) {
        throw new Error('Spoonacular API rate limit exceeded. Please try again later.')
      } else if (response.status === 402) {
        throw new Error('Spoonacular API quota exceeded. Please contact support.')
      } else {
        throw new Error(`Spoonacular API error: ${response.status}`)
      }
    }

    const data = await response.json()
    
    if (!data.results || !Array.isArray(data.results)) {
      throw new Error('Invalid response format from Spoonacular API')
    }
    
    // Transform Spoonacular response to our format
    const transformedRecipes = data.results.map((recipe: any) => ({
      id: `spoonacular-${recipe.id}`,
      title: recipe.title || 'Untitled Recipe',
      description: recipe.summary?.replace(/<[^>]*>/g, '') || '',
      prep_time_minutes: recipe.preparationMinutes || 0,
      cook_time_minutes: recipe.cookingMinutes || 0,
      servings: recipe.servings || 4,
      cuisine: recipe.cuisines?.[0] || 'International',
      difficulty: recipe.dishTypes?.[0] || 'Medium',
      source: 'Spoonacular',
      original_recipe_id: recipe.id.toString(),
      instructions: recipe.analyzedInstructions?.[0]?.steps?.map((step: any) => step.step).join('\n') || '',
      ingredients: recipe.extendedIngredients?.map((ing: any) => ({
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit
      })) || [],
      rating: recipe.spoonacularScore ? (recipe.spoonacularScore / 20) : 4.0 // Convert to 5-point scale
    }))

    // Cache the result
    setCachedResult(cacheKey, transformedRecipes)
    
    console.log(`Successfully retrieved ${transformedRecipes.length} recipes from Spoonacular`)
    return transformedRecipes

  } catch (error) {
    console.error('Error searching Spoonacular recipes:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to search recipes from Spoonacular')
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    // Verify the JWT token and get user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    // Parse request body
    const requestData: SpoonacularSearchRequest = await req.json()
    
    // Validate request
    if (!requestData.ingredients && !requestData.query) {
      return new Response(
        JSON.stringify({ error: 'Either ingredients or a query must be provided' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Search Spoonacular recipes
    const recipes = await searchSpoonacularRecipes(requestData)

    return new Response(
      JSON.stringify({ 
        recipes: recipes
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in spoonacular-search function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
