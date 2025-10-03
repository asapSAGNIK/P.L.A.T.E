import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export interface CompatibilityAnalysis {
  level: 'excellent' | 'good' | 'limited' | 'incompatible' | 'insufficient'
  message: string
  suggestions: string[]
  score: number
  categories: {
    proteins: string[]
    vegetables: string[]
    fruits: string[]
    grains: string[]
    dairy: string[]
    spices: string[]
    oils: string[]
  }
}

export interface IngredientCompatibilityRequest {
  ingredients: string[]
  userId?: string
}

/**
 * Classify ingredient using AI
 */
async function classifyIngredient(ingredient: string): Promise<string> {
  try {
    const prompt = `Classify this ingredient: "${ingredient}" into one of these categories:
- protein (meat, fish, eggs, dairy, legumes)
- vegetable (leafy greens, root vegetables, etc.)
- fruit (sweet, citrus, berries, etc.)
- grain (rice, wheat, oats, etc.)
- spice (herbs, seasonings, condiments)
- oil (cooking oils, fats)
- other (nuts, seeds, etc.)

Return only the category name.`;

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
            temperature: 0.3,
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 50,
          }
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const category = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase();
    
    // Fallback classification if AI fails
    return category || classifyIngredientFallback(ingredient);
  } catch (error) {
    console.warn('AI classification failed, using fallback:', error);
    return classifyIngredientFallback(ingredient);
  }
}

/**
 * Fallback ingredient classification
 */
function classifyIngredientFallback(ingredient: string): string {
  const ing = ingredient.toLowerCase();
  
  if (/(chicken|beef|pork|fish|salmon|tofu|eggs|lentils|beans|turkey|lamb)/.test(ing)) {
    return 'protein';
  }
  if (/(onion|garlic|tomato|potato|carrot|broccoli|spinach|lettuce|bell pepper|cucumber|mushroom)/.test(ing)) {
    return 'vegetable';
  }
  if (/(apple|banana|orange|lemon|lime|strawberry|blueberry|mango|pineapple|grape)/.test(ing)) {
    return 'fruit';
  }
  if (/(rice|pasta|bread|flour|oats|quinoa|barley|couscous)/.test(ing)) {
    return 'grain';
  }
  if (/(milk|cheese|yogurt|butter|cream|sour cream)/.test(ing)) {
    return 'dairy';
  }
  if (/(salt|pepper|cumin|paprika|oregano|thyme|basil|cinnamon|nutmeg|ginger)/.test(ing)) {
    return 'spice';
  }
  if (/(olive oil|vegetable oil|canola oil|coconut oil)/.test(ing)) {
    return 'oil';
  }
  
  return 'other';
}

/**
 * Analyze ingredient compatibility
 */
async function analyzeIngredientCompatibility(ingredients: string[]): Promise<CompatibilityAnalysis> {
  // Check minimum requirements
  if (ingredients.length < 3) {
    return {
      level: 'insufficient',
      message: ingredients.length === 0 
        ? 'Add at least 3 ingredients to get started! 🥘'
        : `Add ${3 - ingredients.length} more ingredient${3 - ingredients.length > 1 ? 's' : ''} for better recipe variety! 💡`,
      suggestions: ['Add a protein source', 'Add vegetables', 'Add grains or carbs'],
      score: 0,
      categories: {
        proteins: [],
        vegetables: [],
        fruits: [],
        grains: [],
        dairy: [],
        spices: [],
        oils: []
      }
    };
  }

  // Classify all ingredients
  const categories = {
    proteins: [] as string[],
    vegetables: [] as string[],
    fruits: [] as string[],
    grains: [] as string[],
    dairy: [] as string[],
    spices: [] as string[],
    oils: [] as string[]
  };

  for (const ingredient of ingredients) {
    const category = await classifyIngredient(ingredient);
    if (categories[category as keyof typeof categories]) {
      categories[category as keyof typeof categories].push(ingredient);
    }
  }

  // Calculate compatibility score
  let score = 0;
  const categoryCount = Object.values(categories).filter(cat => cat.length > 0).length;
  
  // Base score from category diversity
  score += categoryCount * 15;
  
  // Bonus for having essential categories
  if (categories.proteins.length > 0) score += 10;
  if (categories.vegetables.length > 0) score += 10;
  if (categories.grains.length > 0) score += 10;
  if (categories.spices.length > 0) score += 5;
  if (categories.oils.length > 0) score += 5;

  // Check for incompatible combinations
  const hasIncompatibleCombination = checkIncompatibleCombinations(categories);
  
  if (hasIncompatibleCombination) {
    return {
      level: 'incompatible',
      message: "These ingredients don't work well together. Maybe ask a friend or neighbor for these items:",
      suggestions: generateIncompatibleSuggestions(categories),
      score: Math.max(0, score - 30),
      categories
    };
  }

  // Determine compatibility level
  let level: CompatibilityAnalysis['level'];
  let message: string;
  let suggestions: string[] = [];

  if (score >= 80) {
    level = 'excellent';
    message = '🎉 Perfect! I can create multiple recipe combinations with these ingredients:';
  } else if (score >= 60) {
    level = 'good';
    message = '👍 Great ingredient selection! I can create two delicious recipes with these:';
  } else if (score >= 40) {
    level = 'limited';
    message = 'Good start! Adding a few more ingredients will help me create two different recipes:';
    suggestions = generateLimitedSuggestions(categories);
  } else {
    level = 'limited';
    message = 'Add more ingredients for better recipe variety:';
    suggestions = generateLimitedSuggestions(categories);
  }

  return {
    level,
    message,
    suggestions,
    score,
    categories
  };
}

/**
 * Check for incompatible ingredient combinations
 */
function checkIncompatibleCombinations(categories: any): boolean {
  // Check for sweet + savory conflicts
  const hasFruits = categories.fruits.length > 0;
  const hasProteins = categories.proteins.length > 0;
  const hasVegetables = categories.vegetables.length > 0;
  
  // If only fruits + proteins/vegetables with no other categories, likely incompatible
  if (hasFruits && (hasProteins || hasVegetables) && 
      categories.grains.length === 0 && categories.dairy.length === 0 && categories.spices.length === 0) {
    return true;
  }
  
  // Check for very limited combinations
  if (categories.fruits.length > 0 && categories.proteins.length > 0 && 
      categories.vegetables.length === 0 && categories.grains.length === 0) {
    return true;
  }
  
  return false;
}

/**
 * Generate suggestions for incompatible ingredients
 */
function generateIncompatibleSuggestions(categories: any): string[] {
  const suggestions: string[] = [];
  
  if (categories.fruits.length > 0 && categories.proteins.length > 0) {
    suggestions.push('Try separating sweet and savory ingredients');
    suggestions.push('Add grains (rice, bread, pasta) to balance flavors');
    suggestions.push('Include dairy (milk, cheese, yogurt) for creaminess');
  } else {
    suggestions.push('Add more ingredient variety');
    suggestions.push('Include basic seasonings (salt, pepper, oil)');
    suggestions.push('Add vegetables for nutritional balance');
  }
  
  return suggestions.slice(0, 3);
}

/**
 * Generate suggestions for limited ingredients
 */
function generateLimitedSuggestions(categories: any): string[] {
  const suggestions: string[] = [];
  
  if (categories.proteins.length === 0) {
    suggestions.push('Add a protein (chicken, eggs, tofu, lentils)');
  }
  if (categories.vegetables.length === 0) {
    suggestions.push('Add vegetables (onion, garlic, tomato, spinach)');
  }
  if (categories.grains.length === 0) {
    suggestions.push('Add grains (rice, pasta, bread)');
  }
  if (categories.spices.length === 0) {
    suggestions.push('Add seasonings (salt, pepper, oil)');
  }
  
  return suggestions.slice(0, 3);
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
    console.log('Verifying token for ingredient compatibility analysis...')
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
    const requestData: IngredientCompatibilityRequest = await req.json()
    
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

    console.log('Analyzing ingredient compatibility:', requestData.ingredients)

    // Analyze ingredient compatibility
    const analysis = await analyzeIngredientCompatibility(requestData.ingredients)

    console.log('Compatibility analysis completed:', {
      level: analysis.level,
      score: analysis.score,
      categoryCount: Object.values(analysis.categories).filter(cat => cat.length > 0).length
    })

    return new Response(
      JSON.stringify({ 
        analysis,
        userId: user.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in ingredient-compatibility function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})






