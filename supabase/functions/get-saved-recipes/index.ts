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
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://lmdoqtkotwbgbsudreff.supabase.co'
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  
  if (!supabaseServiceKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY not found in environment variables')
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
  
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
      console.error('Authentication error:', authError)
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token', details: authError?.message }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    console.log('User authenticated:', user.id)

    // Get query parameters
    const url = new URL(req.url)
    const status = url.searchParams.get('status') || 'saved'
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    console.log('Querying saved recipes for user:', user.id, 'status:', status);
    
    // First, let's check if the tables exist
    console.log('Checking if user_saved_recipes table exists...')
    const { data: tableCheck, error: tableError } = await supabase
      .from('user_saved_recipes')
      .select('*')
      .limit(1)
    
    if (tableError) {
      console.error('Table check error:', tableError)
      return new Response(
        JSON.stringify({ 
          error: 'Database table error', 
          details: tableError.message,
          code: tableError.code,
          hint: tableError.hint
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }
    
    console.log('Table exists, proceeding with query...')
    
    // Get user's saved recipes with recipe details
    const { data: savedRecipes, error } = await supabase
      .from('user_saved_recipes')
      .select(`
        id,
        user_id,
        recipe_id,
        status,
        notes,
        rating,
        last_cooked_at,
        created_at,
        updated_at,
        recipe:recipes(
          id,
          title,
          description,
          prep_time_minutes,
          cook_time_minutes,
          servings,
          cuisine,
          difficulty,
          source,
          original_recipe_id,
          instructions,
          ingredients,
          rating,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    console.log('Query result:', { savedRecipes, error });

    if (error) {
      console.error('Error fetching saved recipes:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch saved recipes', 
          details: error.message,
          code: error.code 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('user_saved_recipes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', status)

    if (countError) {
      console.error('Error getting count:', countError)
    }

    return new Response(
      JSON.stringify({ 
        savedRecipes: savedRecipes || [],
        totalCount: count || 0,
        hasMore: (offset + limit) < (count || 0)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in get-saved-recipes function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
