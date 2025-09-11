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

    console.log('Checking database structure...')

    // Check if tables exist
    const tablesToCheck = ['recipes', 'user_saved_recipes', 'recipe_generation_history', 'user_rate_limits']
    const tableStatus: Record<string, boolean> = {}

    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`Table ${table}: ERROR - ${error.message}`)
          tableStatus[table] = false
        } else {
          console.log(`Table ${table}: EXISTS`)
          tableStatus[table] = true
        }
      } catch (err) {
        console.log(`Table ${table}: ERROR - ${err}`)
        tableStatus[table] = false
      }
    }

    // Check if RPC functions exist
    const rpcFunctionsToCheck = ['increment_rate_limit']
    const rpcStatus: Record<string, boolean> = {}

    for (const rpc of rpcFunctionsToCheck) {
      try {
        const { data, error } = await supabase
          .rpc(rpc, { p_user_id: 'test', p_type: 'test' })
        
        if (error) {
          console.log(`RPC ${rpc}: ERROR - ${error.message}`)
          rpcStatus[rpc] = false
        } else {
          console.log(`RPC ${rpc}: EXISTS`)
          rpcStatus[rpc] = true
        }
      } catch (err) {
        console.log(`RPC ${rpc}: ERROR - ${err}`)
        rpcStatus[rpc] = false
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        tables: tableStatus,
        rpcFunctions: rpcStatus,
        message: 'Database structure check completed'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error checking database structure:', error)
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
