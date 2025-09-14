import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export interface SmartSuggestion {
  type: 'add' | 'remove' | 'replace' | 'complement'
  ingredient: string
  reason: string
  priority: 'high' | 'medium' | 'low'
  category?: string
  alternatives?: string[]
}

export interface IngredientAnalysis {
  hasProtein: boolean
  hasVegetables: boolean
  hasFruits: boolean
  hasGrains: boolean
  hasDairy: boolean
  hasSpices: boolean
  hasOils: boolean
  proteins: string[]
  vegetables: string[]
  fruits: string[]
  grains: string[]
  dairy: string[]
  spices: string[]
  oils: string[]
}

export interface SuggestionResult {
  suggestions: SmartSuggestion[]
  analysis: IngredientAnalysis
  overallScore: number
  message: string
}

export interface SmartSuggestionsRequest {
  ingredients: string[]
  compatibilityLevel?: string
  userId?: string
}

// Common ingredient categories and their typical pairings
const INGREDIENT_CATEGORIES = {
  proteins: ['chicken', 'beef', 'pork', 'fish', 'salmon', 'tofu', 'eggs', 'lentils', 'beans', 'turkey', 'lamb'],
  vegetables: ['onion', 'garlic', 'tomato', 'potato', 'carrot', 'broccoli', 'spinach', 'lettuce', 'bell pepper', 'cucumber', 'mushroom'],
  fruits: ['apple', 'banana', 'orange', 'lemon', 'lime', 'strawberry', 'blueberry', 'mango', 'pineapple', 'grape'],
  grains: ['rice', 'pasta', 'bread', 'flour', 'oats', 'quinoa', 'barley', 'couscous'],
  dairy: ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'sour cream'],
  spices: ['salt', 'pepper', 'cumin', 'paprika', 'oregano', 'thyme', 'basil', 'cinnamon', 'nutmeg', 'ginger'],
  oils: ['olive oil', 'vegetable oil', 'canola oil', 'coconut oil']
}

/**
 * Analyze ingredients and categorize them
 */
function analyzeIngredients(ingredients: string[]): IngredientAnalysis {
  const analysis: IngredientAnalysis = {
    hasProtein: false,
    hasVegetables: false,
    hasFruits: false,
    hasGrains: false,
    hasDairy: false,
    hasSpices: false,
    hasOils: false,
    proteins: [],
    vegetables: [],
    fruits: [],
    grains: [],
    dairy: [],
    spices: [],
    oils: []
  }

  for (const ingredient of ingredients) {
    const ing = ingredient.toLowerCase().trim()

    // Check each category
    if (INGREDIENT_CATEGORIES.proteins.some(p => ing.includes(p))) {
      analysis.hasProtein = true
      analysis.proteins.push(ingredient)
    }
    if (INGREDIENT_CATEGORIES.vegetables.some(v => ing.includes(v))) {
      analysis.hasVegetables = true
      analysis.vegetables.push(ingredient)
    }
    if (INGREDIENT_CATEGORIES.fruits.some(f => ing.includes(f))) {
      analysis.hasFruits = true
      analysis.fruits.push(ingredient)
    }
    if (INGREDIENT_CATEGORIES.grains.some(g => ing.includes(g))) {
      analysis.hasGrains = true
      analysis.grains.push(ingredient)
    }
    if (INGREDIENT_CATEGORIES.dairy.some(d => ing.includes(d))) {
      analysis.hasDairy = true
      analysis.dairy.push(ingredient)
    }
    if (INGREDIENT_CATEGORIES.spices.some(s => ing.includes(s))) {
      analysis.hasSpices = true
      analysis.spices.push(ingredient)
    }
    if (INGREDIENT_CATEGORIES.oils.some(o => ing.includes(o))) {
      analysis.hasOils = true
      analysis.oils.push(ingredient)
    }
  }

  return analysis
}

/**
 * Generate AI-powered suggestions
 */
async function generateAISuggestions(
  ingredients: string[],
  analysis: IngredientAnalysis,
  compatibilityLevel?: string
): Promise<SmartSuggestion[]> {
  try {
    const prompt = `Given these ingredients: ${ingredients.join(', ')}

Analysis:
- Proteins: ${analysis.proteins.join(', ') || 'none'}
- Vegetables: ${analysis.vegetables.join(', ') || 'none'}
- Fruits: ${analysis.fruits.join(', ') || 'none'}
- Grains: ${analysis.grains.join(', ') || 'none'}
- Dairy: ${analysis.dairy.join(', ') || 'none'}
- Spices: ${analysis.spices.join(', ') || 'none'}
- Oils: ${analysis.oils.join(', ') || 'none'}

Compatibility level: ${compatibilityLevel || 'unknown'}

Suggest 3-5 specific ingredients to add that would significantly improve this combination. Focus on:
1. Missing essential categories (protein, vegetables, grains)
2. Flavor enhancement and balance
3. Practical, easily available ingredients
4. Complementary flavors and textures

Return JSON array with this structure:
[{
  "type": "add",
  "ingredient": "garlic",
  "reason": "Enhances flavor and works well with existing vegetables",
  "priority": "high",
  "category": "vegetable",
  "alternatives": ["onion", "shallots"]
}]

Be specific and practical. Consider cultural and regional preferences.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${Deno.env.get('GEMINI_API_KEY')}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'P.L.A.T.E-App/1.0'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!aiText) {
      throw new Error('No response from Gemini API')
    }

    const aiSuggestions = JSON.parse(aiText)

    return aiSuggestions.map((suggestion: any) => ({
      type: suggestion.type || 'add',
      ingredient: suggestion.ingredient,
      reason: suggestion.reason,
      priority: suggestion.priority || 'medium',
      category: suggestion.category,
      alternatives: suggestion.alternatives || []
    }))

  } catch (error) {
    console.error('AI suggestion generation failed:', error)
    return []
  }
}

/**
 * Generate rule-based suggestions as fallback
 */
function generateRuleBasedSuggestions(analysis: IngredientAnalysis): SmartSuggestion[] {
  const suggestions: SmartSuggestion[] = []

  // Essential missing categories
  if (!analysis.hasProtein) {
    suggestions.push({
      type: 'add',
      ingredient: 'chicken',
      reason: 'Adds protein for a complete, satisfying meal',
      priority: 'high',
      category: 'protein',
      alternatives: ['eggs', 'tofu', 'lentils', 'canned tuna']
    })
  }

  if (!analysis.hasVegetables) {
    suggestions.push({
      type: 'add',
      ingredient: 'onion',
      reason: 'Provides flavor base and nutritional balance',
      priority: 'high',
      category: 'vegetable',
      alternatives: ['garlic', 'tomato', 'carrot', 'spinach']
    })
  }

  if (!analysis.hasGrains && analysis.proteins.length > 0) {
    suggestions.push({
      type: 'add',
      ingredient: 'rice',
      reason: 'Creates a complete meal with your protein',
      priority: 'high',
      category: 'grain',
      alternatives: ['pasta', 'bread', 'potatoes']
    })
  }

  // Flavor enhancement
  if (!analysis.hasSpices && analysis.vegetables.length > 0) {
    suggestions.push({
      type: 'add',
      ingredient: 'salt and pepper',
      reason: 'Essential seasonings to enhance vegetable flavors',
      priority: 'high',
      category: 'spice'
    })
  }

  if (!analysis.hasOils && (analysis.proteins.length > 0 || analysis.vegetables.length > 0)) {
    suggestions.push({
      type: 'add',
      ingredient: 'vegetable oil',
      reason: 'Needed for cooking proteins and vegetables',
      priority: 'medium',
      category: 'oil',
      alternatives: ['olive oil', 'butter']
    })
  }

  // Balance suggestions
  if (analysis.fruits.length > 0 && !analysis.hasDairy) {
    suggestions.push({
      type: 'add',
      ingredient: 'milk',
      reason: 'Creates a delicious smoothie with your fruits',
      priority: 'medium',
      category: 'dairy',
      alternatives: ['yogurt', 'juice']
    })
  }

  return suggestions
}

/**
 * Prioritize suggestions based on impact and current analysis
 */
function prioritizeSuggestions(
  suggestions: SmartSuggestion[],
  analysis: IngredientAnalysis
): SmartSuggestion[] {
  return suggestions
    .map(suggestion => {
      let priorityScore = 0

      // High priority for essential missing categories
      if ((suggestion.category === 'protein' && !analysis.hasProtein) ||
          (suggestion.category === 'vegetable' && !analysis.hasVegetables) ||
          (suggestion.category === 'grain' && !analysis.hasGrains)) {
        priorityScore += 3
      }

      // Medium priority for flavor enhancement
      if (suggestion.category === 'spice' || suggestion.category === 'oil') {
        priorityScore += 2
      }

      // Low priority for complementary items
      if (suggestion.category === 'dairy' || suggestion.category === 'fruit') {
        priorityScore += 1
      }

      return { ...suggestion, priorityScore }
    })
    .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
    .map(({ priorityScore, ...suggestion }) => suggestion)
}

/**
 * Calculate overall score for ingredient combination
 */
function calculateOverallScore(
  analysis: IngredientAnalysis,
  suggestions: SmartSuggestion[]
): number {
  let score = 50 // Base score

  // Category completeness bonus
  const categories = [
    analysis.hasProtein,
    analysis.hasVegetables,
    analysis.hasGrains,
    analysis.hasSpices,
    analysis.hasOils
  ]

  const categoryScore = categories.filter(Boolean).length * 15
  score += categoryScore

  // High-priority suggestions penalty
  const highPrioritySuggestions = suggestions.filter(s => s.priority === 'high').length
  score -= highPrioritySuggestions * 10

  // Balance bonus
  if (analysis.hasProtein && (analysis.hasVegetables || analysis.hasGrains)) {
    score += 10
  }

  return Math.max(0, Math.min(100, score))
}

/**
 * Generate overall message based on analysis
 */
function generateOverallMessage(
  analysis: IngredientAnalysis,
  score: number,
  compatibilityLevel?: string
): string {
  if (score >= 80) {
    return "Excellent combination! You have a well-balanced set of ingredients."
  }

  if (score >= 60) {
    return "Good foundation! A few additions could make this even better."
  }

  if (compatibilityLevel === 'incompatible') {
    return "These ingredients don't work well together. Here are some suggestions to improve compatibility:"
  }

  return "Your ingredient combination could be enhanced. Here are some practical suggestions:"
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
    console.log('Verifying token for smart suggestions...')
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
    
    console.log('User authenticated successfully:', user.id)

    // Parse request body
    const requestData: SmartSuggestionsRequest = await req.json()
    
    // Validate request
    if (!requestData.ingredients || !Array.isArray(requestData.ingredients)) {
      return new Response(
        JSON.stringify({ error: 'Ingredients array is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    console.log('Generating smart suggestions for:', requestData.ingredients)

    try {
      // Analyze current ingredients
      const analysis = analyzeIngredients(requestData.ingredients)

      // Get AI-powered suggestions
      const aiSuggestions = await generateAISuggestions(requestData.ingredients, analysis, requestData.compatibilityLevel)

      // Combine with rule-based suggestions
      const ruleBasedSuggestions = generateRuleBasedSuggestions(analysis)

      // Merge and prioritize suggestions
      const allSuggestions = [...aiSuggestions, ...ruleBasedSuggestions]
      const prioritizedSuggestions = prioritizeSuggestions(allSuggestions, analysis)

      // Calculate overall score
      const overallScore = calculateOverallScore(analysis, prioritizedSuggestions)

      const result: SuggestionResult = {
        suggestions: prioritizedSuggestions.slice(0, 5), // Top 5 suggestions
        analysis,
        overallScore,
        message: generateOverallMessage(analysis, overallScore, requestData.compatibilityLevel)
      }

      console.log('Smart suggestions generated successfully:', {
        suggestionCount: result.suggestions.length,
        overallScore: result.overallScore
      })

      return new Response(
        JSON.stringify({ 
          result,
          userId: user.id
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )

    } catch (error) {
      console.error('Error generating smart suggestions:', error)

      // Fallback to rule-based suggestions only
      const analysis = analyzeIngredients(requestData.ingredients)
      const ruleBasedSuggestions = generateRuleBasedSuggestions(analysis)

      const fallbackResult: SuggestionResult = {
        suggestions: ruleBasedSuggestions.slice(0, 5),
        analysis,
        overallScore: 60,
        message: "Here are some suggestions to improve your ingredient combination:"
      }

      console.log('Using fallback suggestions:', {
        suggestionCount: fallbackResult.suggestions.length
      })

      return new Response(
        JSON.stringify({ 
          result: fallbackResult,
          userId: user.id
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

  } catch (error) {
    console.error('Error in smart-suggestions function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

