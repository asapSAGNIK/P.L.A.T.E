import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getUserRateLimitStatus(supabase: any, userId: string) {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('user_rate_limits')
      .select('request_count')
      .eq('user_id', userId)
      .eq('request_date', today)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error getting rate limit status:', error)
      return { currentCount: 0, maxRequests: 20, remaining: 20, resetTime: new Date() }
    }

    const currentCount = data?.request_count || 0
    const maxRequests = 20
    const remaining = Math.max(0, maxRequests - currentCount)
    
    // Calculate reset time (next day at midnight)
    const resetTime = new Date()
    resetTime.setDate(resetTime.getDate() + 1)
    resetTime.setHours(0, 0, 0, 0)

    return { currentCount, maxRequests, remaining, resetTime }
  } catch (error) {
    console.error('Error getting rate limit status:', error)
    return { currentCount: 0, maxRequests: 20, remaining: 20, resetTime: new Date() }
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

    // Get rate limit status
    const rateLimitStatus = await getUserRateLimitStatus(supabase, user.id)

    return new Response(
      JSON.stringify({
        currentCount: rateLimitStatus.currentCount,
        maxRequests: rateLimitStatus.maxRequests,
        remaining: rateLimitStatus.remaining,
        resetTime: rateLimitStatus.resetTime.toISOString(),
        percentageUsed: Math.round((rateLimitStatus.currentCount / rateLimitStatus.maxRequests) * 100)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in check-rate-limit function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
