import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://lmdoqtkotwbgbsudreff.supabase.co'
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'SUPABASE_SERVICE_ROLE_KEY not found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Testing database tables...')

    // Test each table
    const results: Record<string, any> = {}

    // Test recipes table
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .limit(1)
      results.recipes = { exists: !error, error: error?.message }
    } catch (err) {
      results.recipes = { exists: false, error: err.message }
    }

    // Test user_saved_recipes table
    try {
      const { data, error } = await supabase
        .from('user_saved_recipes')
        .select('*')
        .limit(1)
      results.user_saved_recipes = { exists: !error, error: error?.message }
    } catch (err) {
      results.user_saved_recipes = { exists: false, error: err.message }
    }

    // Test recipe_generation_history table
    try {
      const { data, error } = await supabase
        .from('recipe_generation_history')
        .select('*')
        .limit(1)
      results.recipe_generation_history = { exists: !error, error: error?.message }
    } catch (err) {
      results.recipe_generation_history = { exists: false, error: err.message }
    }

    // Test user_rate_limits table
    try {
      const { data, error } = await supabase
        .from('user_rate_limits')
        .select('*')
        .limit(1)
      results.user_rate_limits = { exists: !error, error: error?.message }
    } catch (err) {
      results.user_rate_limits = { exists: false, error: err.message }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        results,
        message: 'Database table test completed'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error testing database:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
