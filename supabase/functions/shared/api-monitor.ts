// External API monitoring and rate limiting utilities

export interface ApiUsage {
  apiName: string
  requestCount: number
  lastRequest: Date
  rateLimitRemaining?: number
  rateLimitReset?: Date
}

// In-memory storage for API usage tracking
const apiUsage = new Map<string, ApiUsage>()

// Rate limits for external APIs
const RATE_LIMITS = {
  spoonacular: {
    requestsPerMinute: 5,
    requestsPerDay: 150
  },
  gemini: {
    requestsPerMinute: 15,
    requestsPerDay: 1000
  }
}

export function trackApiUsage(apiName: string, userId: string): boolean {
  const key = `${apiName}:${userId}`
  const now = new Date()
  
  const usage = apiUsage.get(key) || {
    apiName,
    requestCount: 0,
    lastRequest: now
  }

  // Check rate limits
  const limits = RATE_LIMITS[apiName as keyof typeof RATE_LIMITS]
  if (!limits) {
    console.warn(`No rate limits defined for API: ${apiName}`)
    return true
  }

  // Reset daily counter if it's a new day
  const lastRequestDate = new Date(usage.lastRequest)
  const today = new Date()
  if (lastRequestDate.toDateString() !== today.toDateString()) {
    usage.requestCount = 0
  }

  // Check daily limit
  if (usage.requestCount >= limits.requestsPerDay) {
    console.warn(`Daily rate limit exceeded for ${apiName}: ${usage.requestCount}/${limits.requestsPerDay}`)
    return false
  }

  // Check minute limit (simplified - in production, use a more sophisticated approach)
  const timeDiff = now.getTime() - usage.lastRequest.getTime()
  if (timeDiff < 60000 && usage.requestCount > 0) { // Less than 1 minute
    const requestsInLastMinute = Math.floor(usage.requestCount / Math.ceil(timeDiff / 60000))
    if (requestsInLastMinute >= limits.requestsPerMinute) {
      console.warn(`Minute rate limit exceeded for ${apiName}`)
      return false
    }
  }

  // Update usage
  usage.requestCount++
  usage.lastRequest = now
  apiUsage.set(key, usage)

  console.log(`API usage tracked: ${apiName} - ${usage.requestCount}/${limits.requestsPerDay} daily requests`)
  return true
}

export function getApiUsage(apiName: string, userId: string): ApiUsage | null {
  const key = `${apiName}:${userId}`
  return apiUsage.get(key) || null
}

export function getRemainingRequests(apiName: string, userId: string): number {
  const usage = getApiUsage(apiName, userId)
  if (!usage) return RATE_LIMITS[apiName as keyof typeof RATE_LIMITS]?.requestsPerDay || 0
  
  const limits = RATE_LIMITS[apiName as keyof typeof RATE_LIMITS]
  if (!limits) return 0

  // Reset daily counter if it's a new day
  const lastRequestDate = new Date(usage.lastRequest)
  const today = new Date()
  if (lastRequestDate.toDateString() !== today.toDateString()) {
    return limits.requestsPerDay
  }

  return Math.max(0, limits.requestsPerDay - usage.requestCount)
}

export function createApiErrorResponse(apiName: string, error: any): Response {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  let status = 500
  let message = 'Internal server error'

  if (error instanceof Error) {
    message = error.message
    
    if (message.includes('rate limit')) {
      status = 429
    } else if (message.includes('quota')) {
      status = 402
    } else if (message.includes('access denied') || message.includes('API key')) {
      status = 403
    } else if (message.includes('invalid request')) {
      status = 400
    }
  }

  return new Response(
    JSON.stringify({ 
      error: message,
      api: apiName,
      timestamp: new Date().toISOString()
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status 
    }
  )
}

export function logApiRequest(apiName: string, endpoint: string, userId: string, success: boolean, duration?: number) {
  const logData = {
    api: apiName,
    endpoint,
    userId,
    success,
    duration,
    timestamp: new Date().toISOString()
  }

  if (success) {
    console.log(`API request successful:`, logData)
  } else {
    console.error(`API request failed:`, logData)
  }
}

// Cleanup old usage data (call periodically)
export function cleanupOldUsageData() {
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  for (const [key, usage] of apiUsage.entries()) {
    if (usage.lastRequest < oneDayAgo) {
      apiUsage.delete(key)
    }
  }
}
