import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { 
  CommentaryRequest, 
  corsHeaders, 
  createErrorResponse, 
  createSuccessResponse, 
  authenticateUser 
} from '../shared/types.ts'

// Cache for Gemini API responses (in-memory cache)
const geminiCache = new Map<string, { data: any, timestamp: number }>()
const GEMINI_CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

function getGeminiCacheKey(request: CommentaryRequest): string {
  return JSON.stringify({
    recipeTitle: request.recipeTitle,
    ingredients: request.ingredients?.sort(),
    instructions: request.instructions,
    type: request.type
  })
}

function getCachedGeminiResult(cacheKey: string): any | null {
  const cached = geminiCache.get(cacheKey)
  if (cached && (Date.now() - cached.timestamp) < GEMINI_CACHE_DURATION) {
    console.log('Returning cached Gemini result')
    return cached.data
  }
  if (cached) {
    geminiCache.delete(cacheKey) // Remove expired cache
  }
  return null
}

function setCachedGeminiResult(cacheKey: string, data: any): void {
  geminiCache.set(cacheKey, { data, timestamp: Date.now() })
  console.log('Cached Gemini result')
}

async function generateAICommentary(request: CommentaryRequest) {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured')
  }

  const { recipeTitle, ingredients, instructions, type = 'commentary' } = request
  
  // Check cache first
  const cacheKey = getGeminiCacheKey(request)
  const cachedResult = getCachedGeminiResult(cacheKey)
  if (cachedResult) {
    return cachedResult
  }
  
  // Validate input
  if (!recipeTitle || !ingredients || !instructions) {
    throw new Error('Recipe title, ingredients, and instructions are required')
  }

  if (ingredients.length === 0) {
    throw new Error('At least one ingredient is required')
  }

  if (instructions.trim().length < 10) {
    throw new Error('Instructions must be at least 10 characters long')
  }
  
  let prompt = ''
  
  if (type === 'commentary') {
    prompt = `You are Gordon Ramsay. Give a witty, critical, and helpful commentary on this recipe. Keep it entertaining but constructive. Focus on cooking techniques, flavor combinations, and practical improvements.\n\nTitle: ${recipeTitle}\nIngredients: ${ingredients.join(', ')}\nInstructions: ${instructions}\n\nProvide your commentary in 2-3 paragraphs.`
  } else if (type === 'twist') {
    prompt = `You are a creative chef. Suggest 3 creative twists or variations for this recipe to make it more interesting. Each twist should be practical and enhance the original recipe.\n\nTitle: ${recipeTitle}\nIngredients: ${ingredients.join(', ')}\nInstructions: ${instructions}\n\nProvide 3 numbered variations with brief explanations.`
  } else {
    throw new Error('Invalid type. Must be "commentary" or "twist"')
  }

  try {
    console.log('Making Gemini API request for:', type)
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'P.L.A.T.E-App/1.0'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: type === 'commentary' ? 0.8 : 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', response.status, errorText)
      
      if (response.status === 429) {
        throw new Error('Gemini API rate limit exceeded. Please try again later.')
      } else if (response.status === 400) {
        throw new Error('Invalid request to Gemini API. Please check your input.')
      } else if (response.status === 403) {
        throw new Error('Gemini API access denied. Please check your API key.')
      } else {
        throw new Error(`Gemini API error: ${response.status}`)
      }
    }

    const data = await response.json()
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response generated from Gemini API')
    }

    const candidate = data.candidates[0]
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      throw new Error('Invalid response format from Gemini API')
    }

    const aiText = candidate.content.parts[0].text || 'No commentary generated.'
    
    if (aiText.trim().length < 10) {
      throw new Error('Generated commentary is too short')
    }

    const result = {
      [type === 'commentary' ? 'commentary' : 'twists']: aiText.trim()
    }

    // Cache the result
    setCachedGeminiResult(cacheKey, result)
    
    console.log(`Successfully generated ${type} from Gemini API`)
    return result

  } catch (error) {
    console.error('Error generating AI commentary:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to generate AI commentary')
  }
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Authenticate user
    const authResult = await authenticateUser(req, supabase)
    if (authResult instanceof Response) {
      return authResult
    }
    const { user } = authResult

    // Parse request body
    const requestData: CommentaryRequest = await req.json()
    
    // Validate required fields
    if (!requestData.recipeTitle || !requestData.ingredients || !requestData.instructions) {
      return createErrorResponse('Recipe title, ingredients, and instructions are required', 400)
    }

    // Generate AI commentary
    const result = await generateAICommentary(requestData)

    return createSuccessResponse(result)

  } catch (error) {
    console.error('Error in ai-commentary function:', error)
    return createErrorResponse(error)
  }
})
