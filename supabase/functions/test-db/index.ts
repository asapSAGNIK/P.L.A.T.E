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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Test if tables exist by trying to query them
    const tests = {
      recipes: false,
      user_saved_recipes: false,
      recipe_generation_history: false,
      user_rate_limits: false
    }

    try {
      const { data, error } = await supabase.from('recipes').select('count').limit(1)
      tests.recipes = !error
    } catch (e) {
      tests.recipes = false
    }

    try {
      const { data, error } = await supabase.from('user_saved_recipes').select('count').limit(1)
      tests.user_saved_recipes = !error
    } catch (e) {
      tests.user_saved_recipes = false
    }

    try {
      const { data, error } = await supabase.from('recipe_generation_history').select('count').limit(1)
      tests.recipe_generation_history = !error
    } catch (e) {
      tests.recipe_generation_history = false
    }

    try {
      const { data, error } = await supabase.from('user_rate_limits').select('count').limit(1)
      tests.user_rate_limits = !error
    } catch (e) {
      tests.user_rate_limits = false
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        tables: tests,
        message: 'Database table check completed'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in test-db function:', error)
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
