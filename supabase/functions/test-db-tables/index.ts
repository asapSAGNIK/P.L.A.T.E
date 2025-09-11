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
    console.log('=== TESTING DATABASE TABLES ===')
    
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
    
    // Test each table
    const tables = [
      'recipes',
      'user_saved_recipes', 
      'recipe_generation_history',
      'user_rate_limits'
    ]
    
    const results: any = {}
    
    for (const table of tables) {
      try {
        console.log(`Testing table: ${table}`)
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          console.error(`Error testing ${table}:`, error)
          results[table] = { exists: false, error: error.message }
        } else {
          console.log(`${table} exists and accessible`)
          results[table] = { exists: true, count: data?.length || 0 }
        }
      } catch (err) {
        console.error(`Exception testing ${table}:`, err)
        results[table] = { exists: false, error: err.message }
      }
    }
    
    return new Response(
      JSON.stringify({ 
        message: 'Database table test completed',
        tables: results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in test-db-tables function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
