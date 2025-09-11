import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SaveRecipeRequest {
  title: string
  description?: string
  prep_time_minutes?: number
  cook_time_minutes?: number
  servings?: number
  cuisine?: string
  difficulty?: 'Easy' | 'Medium' | 'Hard'
  source: 'Spoonacular' | 'Gemini' | 'UserGenerated'
  original_recipe_id?: string
  image_url?: string
  instructions?: string
  ingredients?: any
  rating?: number
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
    const recipeData: SaveRecipeRequest = await req.json()
    
    // Validate required fields
    if (!recipeData.title || !recipeData.source) {
      return new Response(
        JSON.stringify({ error: 'Title and source are required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Start a transaction to save recipe and user_saved_recipes
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        title: recipeData.title,
        description: recipeData.description,
        prep_time_minutes: recipeData.prep_time_minutes,
        cook_time_minutes: recipeData.cook_time_minutes,
        servings: recipeData.servings,
        cuisine: recipeData.cuisine,
        difficulty: recipeData.difficulty,
        source: recipeData.source,
        original_recipe_id: recipeData.original_recipe_id,
        instructions: recipeData.instructions,
        ingredients: recipeData.ingredients,
        rating: recipeData.rating || 4.0
      })
      .select()
      .single()

    if (recipeError) {
      console.error('Error saving recipe:', recipeError)
      return new Response(
        JSON.stringify({ error: 'Failed to save recipe' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // Save to user_saved_recipes
    const { data: savedRecipe, error: savedRecipeError } = await supabase
      .from('user_saved_recipes')
      .insert({
        user_id: user.id,
        recipe_id: recipe.id,
        status: 'saved'
      })
      .select(`
        *,
        recipe:recipes(*)
      `)
      .single()

    if (savedRecipeError) {
      console.error('Error saving user recipe:', savedRecipeError)
      // Try to clean up the recipe if user_saved_recipes insert failed
      await supabase.from('recipes').delete().eq('id', recipe.id)
      
      return new Response(
        JSON.stringify({ error: 'Failed to save recipe for user' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        savedRecipe: savedRecipe
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in save-recipe function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
