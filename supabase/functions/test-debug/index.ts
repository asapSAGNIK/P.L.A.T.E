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
    console.log('=== DEBUG TEST FUNCTION ===')
    
    // Test environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    const spoonacularApiKey = Deno.env.get('SPOONACULAR_API_KEY')
    
    console.log('SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET')
    console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'NOT SET')
    console.log('GEMINI_API_KEY:', geminiApiKey ? 'SET' : 'NOT SET')
    console.log('SPOONACULAR_API_KEY:', spoonacularApiKey ? 'SET' : 'NOT SET')
    
    // Test Supabase client creation
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      console.log('Supabase client created successfully')
      
      // Test auth
      const authHeader = req.headers.get('Authorization')
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)
        console.log('Auth test:', authError ? `ERROR: ${authError.message}` : `SUCCESS: User ${user?.id}`)
      } else {
        console.log('No auth header provided')
      }
    } else {
      console.log('Cannot create Supabase client - missing environment variables')
    }
    
    return new Response(
      JSON.stringify({ 
        message: 'Debug test completed',
        env: {
          supabaseUrl: supabaseUrl ? 'SET' : 'NOT SET',
          supabaseServiceKey: supabaseServiceKey ? 'SET' : 'NOT SET',
          geminiApiKey: geminiApiKey ? 'SET' : 'NOT SET',
          spoonacularApiKey: spoonacularApiKey ? 'SET' : 'NOT SET'
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in debug function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
