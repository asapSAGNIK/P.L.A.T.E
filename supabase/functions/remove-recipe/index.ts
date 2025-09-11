import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const { recipeId } = await req.json()
    
    if (!recipeId) {
      return new Response(
        JSON.stringify({ error: 'Recipe ID is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Check if this is an AI-generated recipe (starts with "ai-")
    if (recipeId.startsWith('ai-')) {
      console.log('Removing AI-generated recipe from history:', recipeId)
      console.log('User ID:', user.id)
      
      // For AI recipes, we need to remove them from recipe_generation_history
      // First, get all history entries for this user
      const { data: historyEntries, error: historyError } = await supabase
        .from('recipe_generation_history')
        .select('id, recipe_data')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      console.log('History entries found:', historyEntries?.length || 0)
      console.log('History error:', historyError)

      if (historyError) {
        console.error('Error fetching recipe history:', historyError)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch recipe history', details: historyError.message }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        )
      }

      // Find and remove the specific recipe from the history entries
      let recipeFound = false
      console.log('Searching for recipe in history entries...')
      
      for (const entry of historyEntries || []) {
        console.log('Checking entry:', entry.id, 'recipe_data:', entry.recipe_data)
        
        if (entry.recipe_data && entry.recipe_data.id === recipeId) {
          console.log('Found recipe to delete:', entry.recipe_data.id)
          
          // For AI recipes, recipe_data is a single object, not an array
          // So we need to delete the entire history entry
          const { error: deleteError } = await supabase
            .from('recipe_generation_history')
            .delete()
            .eq('id', entry.id)

          if (deleteError) {
            console.error('Error deleting recipe history entry:', deleteError)
            return new Response(
              JSON.stringify({ error: 'Failed to remove AI recipe from history', details: deleteError.message }),
              { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500 
              }
            )
          }
          
          recipeFound = true
          console.log('Successfully deleted recipe history entry')
          break
        }
      }

      if (!recipeFound) {
        return new Response(
          JSON.stringify({ error: 'AI recipe not found in history' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404 
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'AI recipe removed from history'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    } else {
      // For regular saved recipes, remove from user_saved_recipes table
      console.log('Removing saved recipe:', recipeId)
      
      const { error: deleteError } = await supabase
        .from('user_saved_recipes')
        .delete()
        .eq('user_id', user.id)
        .eq('recipe_id', recipeId)

      if (deleteError) {
        console.error('Error removing saved recipe:', deleteError)
        return new Response(
          JSON.stringify({ error: 'Failed to remove saved recipe' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Recipe removed from saved recipes'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

  } catch (error) {
    console.error('Error in remove-recipe function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
