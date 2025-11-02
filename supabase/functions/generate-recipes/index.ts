/// <reference path="../deno.d.ts" />
// deno-lint-ignore-file no-explicit-any
// TypeScript in-editor resolution for remote modules is provided via ../deno.d.ts
// @ts-ignore URL import types are provided via deno.d.ts for editors
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore URL import types are provided via deno.d.ts for editors
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export interface RecipeFilters {
  cuisine?: string;
  diet?: string;
  maxTime?: number;
  difficulty?: string;
  servings?: number;
  mealType?: string;
}

export interface AIRecipe {
  id: string;
  title: string;
  cookingTime: number;
  difficulty: string;
  ingredients: string[];
  description: string;
  rating: number;
  servings: number;
  instructions: string;
  isAIGenerated: boolean;
}

export interface RecipeGenerationRequest {
  ingredients?: string[];
  query?: string;
  filters?: RecipeFilters;
  mode?: 'fridge' | 'explore'; // Added mode parameter
}

/**
 * Generate AI recipe prompt based on ingredients and filters
 */
function generateRecipePrompt(
  ingredients: string[] | undefined, 
  query: string | undefined, 
  filters: RecipeFilters | undefined, 
  recipeNumber: number,
  mode: 'fridge' | 'explore' = 'fridge' // Added mode parameter
): string {
  const isFridgeMode = mode === 'fridge';
  
  const basePrompt = isFridgeMode 
    ? `You are a helpful cooking assistant for beginners. Generate a SIMPLE recipe that anyone can make with basic ingredients.`
    : `You are a creative and experienced chef. Generate a sophisticated and delicious recipe that showcases culinary expertise and creativity.`;
    
  // Determine difficulty based on recipe number, not mode
  const targetDifficulty = recipeNumber === 1 ? 'Easy' : (Math.random() > 0.5 ? 'Medium' : 'Hard');
  const isFirstRecipe = recipeNumber === 1;
  
  const formatPrompt = `RESPONSE FORMAT (exactly like this):
Title: [Recipe Name]
Description: [Brief description]
Cooking Time: [X] minutes
Difficulty: ${targetDifficulty}
Servings: [X]
Ingredients:
- [ingredient with amount]
- [ingredient with amount]
- [ingredient with amount]
Instructions:
1. [First step]
2. [Second step]
3. [Third step]

CRITICAL FORMATTING RULES:
- NO markdown formatting (no **, no *, no #, no _)
- NO bold text, italics, or special formatting
- Use plain text only
- Instructions should be simple numbered steps without any formatting`;

  // Create difficulty-specific rules that override mode rules
  const difficultyRules = isFirstRecipe 
    ? `IMPORTANT RULES FOR EASY RECIPE (Recipe ${recipeNumber}):
- ONLY use basic, common ingredients: butter, salt, pepper, oil, garlic powder, onion powder, ketchup, mayo, cheese, flour, eggs, milk
- NO complex ingredients like: sriracha, specialty sauces, exotic spices, hard-to-find items
- Keep instructions simple (max 4-5 steps)
- Use basic cooking methods: frying, boiling, simple mixing, basic baking
- Make it beginner-friendly and foolproof
- Use simple techniques that anyone can master
- CRITICAL: Assume all ingredients are RAW/UNCOOKED unless user specifies otherwise (e.g., "cooked rice", "steamed chicken")
- Provide DETAILED cooking instructions for raw ingredients (e.g., "Rinse 1 cup rice, add 2 cups water, bring to boil, reduce heat, cover and simmer 15-18 minutes until water is absorbed", "Season chicken with salt and pepper, heat oil in pan, cook 6-8 minutes per side until internal temperature reaches 165°F")
- FORMATTING: Use plain text only - NO markdown formatting (no **, no *, no #, no _)
- Respect the exact cooking time limit
- Respect the exact serving size`
    : `IMPORTANT RULES FOR ${targetDifficulty.toUpperCase()} RECIPE (Recipe ${recipeNumber}):
- Be creative and adventurous with ingredients and techniques
- Use a variety of spices, herbs, and flavor profiles
- Include interesting cooking methods and techniques
- Make recipes that are restaurant-quality and impressive
- Feel free to use specialty ingredients and complex flavors
- Instructions can be more detailed (5-8 steps for Medium, 6-10 steps for Hard)
- Focus on taste, presentation, and culinary excellence
- ${targetDifficulty === 'Hard' ? 'Include advanced techniques like: searing, braising, complex layering, or multi-step preparations' : 'Use intermediate techniques like: sautéing, roasting, or flavor layering'}
- CRITICAL: Assume all ingredients are RAW/UNCOOKED unless user specifies otherwise (e.g., "cooked rice", "steamed chicken")
- Provide DETAILED cooking instructions for raw ingredients with proper techniques (e.g., "Rinse 1 cup rice, add 2 cups water, bring to boil, reduce heat, cover and simmer 15-18 minutes until water is absorbed", "Season chicken with salt and pepper, heat oil in pan, cook 6-8 minutes per side until internal temperature reaches 165°F")
- FORMATTING: Use plain text only - NO markdown formatting (no **, no *, no #, no _)
- Respect the exact cooking time limit
- Respect the exact serving size`;

  // Phase 2: Enhanced mode context for smart grouping
  const modeContext = isFridgeMode
    ? `\n\nMODE CONTEXT (Fridge Mode): You have these specific ingredients to work with: ${ingredients?.join(', ') || 'none provided'}. Create a recipe using ONLY these ingredients (or reasonable substitutions). Focus on practical, delicious combinations that highlight these available ingredients.`
    : `\n\nMODE CONTEXT (Explore Mode): You have access to a full pantry, so be creative and adventurous.`;

  const modeRules = difficultyRules + modeContext;

  let requirements = '';
  
  if (ingredients && ingredients.length > 0) {
    // Implement tiered ingredient constraint system
    const basicSeasonings = ['salt', 'pepper', 'oil', 'butter', 'water'];
    const commonPantryItems = ['flour', 'milk', 'sugar', 'garlic', 'onion', 'lemon', 'honey'];
    
    let ingredientConstraint = '';
    if (ingredients.length >= 4) {
      // Rich ingredient set - strict constraint
      ingredientConstraint = `ONLY use these ingredients: ${ingredients.join(', ')}. You may add basic seasonings: ${basicSeasonings.join(', ')}. NO other ingredients allowed. IMPORTANT: Assume all ingredients are RAW/UNCOOKED unless explicitly stated (e.g., "cooked rice", "steamed chicken"). Provide DETAILED step-by-step cooking instructions for raw ingredients - never say "cook according to package directions" or "cook until done". Be specific with times, temperatures, and techniques. FORMATTING: Use plain text only - NO markdown formatting (no **, no *, no #, no _).`;
    } else if (ingredients.length >= 2) {
      // Moderate ingredient set - allow some pantry items
      ingredientConstraint = `PRIMARY ingredients: ${ingredients.join(', ')}. You may also use: ${commonPantryItems.join(', ')} and basic seasonings: ${basicSeasonings.join(', ')}. IMPORTANT: Assume all ingredients are RAW/UNCOOKED unless explicitly stated (e.g., "cooked rice", "steamed chicken"). Provide DETAILED step-by-step cooking instructions for raw ingredients - never say "cook according to package directions" or "cook until done". Be specific with times, temperatures, and techniques. FORMATTING: Use plain text only - NO markdown formatting (no **, no *, no #, no _).`;
    } else {
      // Limited ingredient set - be more flexible
      ingredientConstraint = `Must include: ${ingredients.join(', ')}. You may use common pantry items and basic seasonings to complete the recipe. IMPORTANT: Assume all ingredients are RAW/UNCOOKED unless explicitly stated (e.g., "cooked rice", "steamed chicken"). Provide DETAILED step-by-step cooking instructions for raw ingredients - never say "cook according to package directions" or "cook until done". Be specific with times, temperatures, and techniques. FORMATTING: Use plain text only - NO markdown formatting (no **, no *, no #, no _).`;
    }
    
    requirements += `\n- ${ingredientConstraint}`;
    
    if (isFridgeMode) {
      requirements += `\n- This is FRIDGE MODE - work within ingredient constraints, keep it simple and keep it practical`;
    } else {
      requirements += `\n- This is EXPLORE MODE - be creative and sophisticated`;
    }
  }
  
  if (query) {
    requirements += `\n- Recipe theme: ${query}`;
  }
  
  if (filters) {
    if (filters.maxTime) {
      requirements += `\n- Maximum cooking time: ${filters.maxTime} minutes (STRICT LIMIT)`;
    }
    if (filters.servings) {
      requirements += `\n- Servings: ${filters.servings} (EXACT)`;
    }
    if (filters.cuisine) {
      requirements += `\n- Cuisine style: ${filters.cuisine}`;
    }
    if (filters.diet) {
      requirements += `\n- Dietary requirement: ${filters.diet}`;
    }
    if (filters.mealType) {
      requirements += `\n- Meal type: ${filters.mealType}`;
    }
  }

  // Add variety based on recipe number with specific cooking methods
  const varietyInstructions = recipeNumber === 1 
    ? `Make this the FIRST recipe - focus on classic, comforting flavors. Use simple techniques like: stir-frying, basic mixing, or simple assembly. Consider making it a traditional, familiar dish.`
    : `Make this the SECOND recipe - focus on creative, innovative flavors. Use different techniques like: scrambling, folding, rolling, or layering. Consider making it a fusion dish or with a unique presentation.`;

  // Add specific variety prompts based on common ingredients
  let ingredientVarietyPrompt = '';
  if (ingredients && ingredients.length > 0) {
    const ingredientStr = ingredients.join(', ').toLowerCase();
    
    if (ingredientStr.includes('bread')) {
      ingredientVarietyPrompt = recipeNumber === 1 
        ? `\n\nSPECIFIC VARIETY FOR BREAD: Make this a traditional sandwich or toast. Focus on classic fillings and simple assembly. Consider making it a simple sandwich, toast, or basic bread-based dish.`
        : `\n\nSPECIFIC VARIETY FOR BREAD: Make this a creative fusion dish. Consider making it a quesadilla-style, pizza-style, deconstructed bowl, or a completely different format like a salad with bread croutons, or a bread-based casserole. Use different cooking methods like toasting, grilling, or baking.`;
    }
    
    if (ingredientStr.includes('rotis')) {
      ingredientVarietyPrompt = recipeNumber === 1 
        ? `\n\nSPECIFIC VARIETY FOR ROTI: Make this a traditional wrap or roll. Focus on classic fillings and simple assembly. Consider making it a simple stuffed roti or basic wrap.`
        : `\n\nSPECIFIC VARIETY FOR ROTI: Make this a creative fusion dish. Consider making it a quesadilla-style, pizza-style, deconstructed bowl, or a completely different format like a salad with roti croutons, or a roti-based casserole. Use different cooking methods like toasting, grilling, or baking.`;
    }
    
    if (ingredientStr.includes('eggs')) {
      ingredientVarietyPrompt += recipeNumber === 1 
        ? `\n\nEGG VARIETY: Use eggs as the main protein - scrambled, fried, or boiled.`
        : `\n\nEGG VARIETY: Use eggs creatively - as a binding agent, in a sauce, or as a topping. Consider different textures like runny, set, or mixed.`;
    }
    
    // Add variety for limited ingredient scenarios
    if (ingredients && ingredients.length <= 3) {
      ingredientVarietyPrompt += recipeNumber === 1 
        ? `\n\nLIMITED INGREDIENTS: With few ingredients, focus on technique and presentation. Make this a simple, classic preparation.`
        : `\n\nLIMITED INGREDIENTS: With few ingredients, get creative with presentation and cooking methods. Consider deconstructed versions, different textures, or fusion approaches.`;
    }
  }
  
  const modeSpecificInstruction = isFirstRecipe 
    ? `\n\nMake this recipe ${recipeNumber} of 2. This is the EASY recipe - keep it SIMPLE and BEGINNER-FRIENDLY. No complex techniques or ingredients. ${varietyInstructions}${ingredientVarietyPrompt}\n\nCRITICAL: This must be COMPLETELY DIFFERENT from the other recipe. Use different cooking methods, different ingredient combinations, and different presentation styles. If the other recipe is a wrap, make this a bowl, salad, or different format.`
    : `\n\nMake this recipe ${recipeNumber} of 2. This is the ${targetDifficulty.toUpperCase()} recipe - be CREATIVE and SOPHISTICATED. Showcase culinary expertise and make it restaurant-quality. ${varietyInstructions}${ingredientVarietyPrompt}\n\nCRITICAL: This must be COMPLETELY DIFFERENT from the other recipe. Use different cooking methods, different ingredient combinations, and different presentation styles. If the other recipe is a wrap, make this a bowl, salad, or different format.`;

  return basePrompt + '\n\n' + formatPrompt + '\n\n' + modeRules + '\n\nREQUIREMENTS:' + requirements + modeSpecificInstruction;
}

/**
 * Parse AI recipe response into structured data
 */
function parseAIRecipe(
  aiText: string, 
  recipeNumber: number, 
  ingredients: string[] | undefined, 
  filters: RecipeFilters | undefined
): AIRecipe | null {
  try {
    // Extract recipe components using regex
    const titleMatch = aiText.match(/Title:\s*(.+)/i);
    const descriptionMatch = aiText.match(/Description:\s*(.+)/i);
    const cookingTimeMatch = aiText.match(/Cooking Time:\s*(\d+)/i);
    const difficultyMatch = aiText.match(/Difficulty:\s*(Easy|Medium|Hard)/i);
    const servingsMatch = aiText.match(/Servings:\s*(\d+)/i);
    const ingredientsMatch = aiText.match(/Ingredients:\s*([\s\S]*?)(?=Instructions:|$)/i);
    const instructionsMatch = aiText.match(/Instructions:\s*([\s\S]*?)$/i);

    if (!titleMatch || !ingredientsMatch || !instructionsMatch) {
      console.warn('Failed to parse recipe components from AI response', { recipeNumber });
      return null;
    }

    // Clean and process ingredients
    const ingredientsText = ingredientsMatch[1].trim();
    let ingredientsList = ingredientsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.match(/^[-•*]\s*$/))
      .map(line => line.replace(/^[-•*]\s*/, ''));

    // Post-generation validation with tiered ingredient system
    const basicSeasonings = ['salt', 'pepper', 'oil', 'butter', 'water'];
    const commonPantryItems = ['flour', 'milk', 'sugar', 'garlic', 'onion', 'lemon', 'honey'];
    
    // Determine allowed ingredients based on user input richness
    let allowedIngredients = [...basicSeasonings];
    if (ingredients && ingredients.length > 0) {
      if (ingredients.length >= 4) {
        // Rich set - only user ingredients + basic seasonings
        allowedIngredients = [...ingredients, ...basicSeasonings];
      } else if (ingredients.length >= 2) {
        // Moderate set - user ingredients + pantry items + seasonings
        allowedIngredients = [...ingredients, ...commonPantryItems, ...basicSeasonings];
      } else {
        // Limited set - user ingredients + common items + seasonings
        allowedIngredients = [...ingredients, ...commonPantryItems, ...basicSeasonings];
      }
    }

    // Validate ingredients against allowed list (for fridge mode)
    const isFridgeMode = (ingredients && ingredients.length > 0);
    if (isFridgeMode) {
        const hasUnauthorizedIngredients = ingredientsList.some(ingredient => {
            const ingredientLower = ingredient.toLowerCase();
            return !allowedIngredients.some(allowed => 
                ingredientLower.includes(allowed.toLowerCase())
            );
        });
        
        if (hasUnauthorizedIngredients) {
            console.warn('Recipe contains unauthorized ingredients, will be filtered:', {
                recipeNumber,
                userIngredients: ingredients,
                generatedIngredients: ingredientsList,
                allowedIngredients
            });
            
            // Filter out unauthorized ingredients
            ingredientsList = ingredientsList.filter(ingredient => {
                const ingredientLower = ingredient.toLowerCase();
                return allowedIngredients.some(allowed => 
                    ingredientLower.includes(allowed.toLowerCase())
                );
            });
        }
    }

    // Clean and process instructions
    const instructionsText = instructionsMatch[1].trim();
    let instructionsList = instructionsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.match(/^[-•*]\s*$/))
      .map(line => line.replace(/^[-•*]\s*/, ''))
      // Remove any leading numbers and dots (like "1. ", "2. ", etc.)
      .map(line => line.replace(/^\d+\.\s*/, ''));

    // Limit instructions based on difficulty (Easy: max 5, Medium: max 8, Hard: max 10)
    const maxInstructions = recipeNumber === 1 ? 5 : (Math.random() > 0.5 ? 8 : 10); 
    if (instructionsList.length > maxInstructions) {
      instructionsList = instructionsList.slice(0, maxInstructions);
    }

    // Determine difficulty based on recipe number if not parsed correctly
    const parsedDifficulty = difficultyMatch ? difficultyMatch[1] : null;
    const fallbackDifficulty = recipeNumber === 1 ? 'Easy' : (Math.random() > 0.5 ? 'Medium' : 'Hard');
    const finalDifficulty = parsedDifficulty || fallbackDifficulty;

    return {
      id: `ai-${Date.now()}-${recipeNumber}-${Math.random().toString(36).substr(2, 9)}`,
      title: titleMatch[1].trim(),
      cookingTime: cookingTimeMatch ? parseInt(cookingTimeMatch[1]) : 30,
      difficulty: finalDifficulty,
      ingredients: ingredientsList,
      description: descriptionMatch ? descriptionMatch[1].trim() : 'A delicious AI-generated recipe',
      rating: 4, // Default rating for AI recipes
      servings: servingsMatch ? parseInt(servingsMatch[1]) : (filters?.servings || 2),
      instructions: instructionsList.join('\n'),
      isAIGenerated: true
    };
  } catch (error) {
    console.error('Error parsing AI recipe', { error, recipeNumber });
    return null;
  }
}

// Cache for AI recipe generation (in-memory cache)
const recipeCache = new Map<string, { data: any, timestamp: number }>()
const RECIPE_CACHE_DURATION = 15 * 60 * 1000 // 15 minutes

function getRecipeCacheKey(request: RecipeGenerationRequest): string {
  return JSON.stringify({
    ingredients: request.ingredients?.sort(),
    query: request.query,
    mode: request.mode,
    filters: request.filters
  })
}

function getCachedRecipeResult(cacheKey: string): any | null {
  const cached = recipeCache.get(cacheKey)
  if (cached && (Date.now() - cached.timestamp) < RECIPE_CACHE_DURATION) {
    console.log('Returning cached AI recipe result')
    return cached.data
  }
  if (cached) {
    recipeCache.delete(cacheKey) // Remove expired cache
  }
  return null
}

function setCachedRecipeResult(cacheKey: string, data: any): void {
  recipeCache.set(cacheKey, { data, timestamp: Date.now() })
  console.log('Cached AI recipe result')
}

async function saveRecipeGenerationHistory(
  supabase: any,
  userId: string,
  recipes: AIRecipe[],
  mode: string,
  ingredients?: string[],
  query?: string,
  filters?: any
) {
  try {
    // Create one history entry per generated recipe
    const historyEntries = recipes.map(recipe => ({
      user_id: userId,
      recipe_data: recipe,  // Save the full recipe object
      mode,
      ingredients_used: ingredients || [],  // Use correct field name
      query_used: query || null,            // Use correct field name
      filters: filters || null,
      generated_at: new Date().toISOString()
    }))

    const { data, error } = await supabase
      .from('recipe_generation_history')
      .insert(historyEntries)
      .select()

    if (error) {
      console.error('Error saving recipe generation history:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error saving recipe generation history:', error)
    return { success: false, error: 'Failed to save recipe generation history' }
  }
}

async function incrementRateLimit(supabase: any, userId: string) {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const { error } = await supabase.rpc('increment_rate_limit', {
      p_user_id: userId,
      p_type: 'recipe_generation'
    })

    if (error) {
      console.error('Error incrementing rate limit:', error)
    }
  } catch (error) {
    console.error('Error incrementing rate limit:', error)
  }
}

async function getUserRateLimitStatus(supabase: any, userId: string) {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('user_rate_limits')
      .select('recipe_generations')
      .eq('user_id', userId)
      .eq('date', today)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error getting rate limit status:', error)
      return { currentCount: 0, maxRequests: 20, remaining: 20 }
    }

    const currentCount = data?.recipe_generations || 0
    const maxRequests = 20
    const remaining = Math.max(0, maxRequests - currentCount)

    return { currentCount, maxRequests, remaining }
  } catch (error) {
    console.error('Error getting rate limit status:', error)
    return { currentCount: 0, maxRequests: 20, remaining: 20 }
  }
}

/**
 * Robust Model Management System
 * Provides fallback chain and validation for Gemini models
 */
const VALID_GEMINI_MODELS = [
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-pro',
  'gemini-1.5-pro-latest', // Deprecated but handled gracefully
] as const;

/**
 * Get model name with fallback chain
 * Backward compatible: respects GEMINI_MODEL env var, falls back to valid defaults
 */
function getGeminiModel(): string {
  // Priority 1: User-defined model from environment (backward compatible)
  const envModel = Deno.env.get('GEMINI_MODEL');
  if (envModel) {
    // Validate env model is in fallback chain
    if (VALID_GEMINI_MODELS.includes(envModel as any)) {
      console.log('Using configured model from environment:', envModel);
      return envModel;
    } else {
      console.warn('Configured model not in supported list, using fallback chain:', envModel);
    }
  }

  // Priority 2: Default fallback chain (most capable to fastest)
  const fallbackChain = [
    'gemini-2.5-pro',      // Primary: Most capable (latest)
    'gemini-2.5-flash',    // Secondary: Fast and capable
    'gemini-1.5-pro',       // Tertiary: Fallback to 1.5 if 2.5 unavailable
    'gemini-1.5-flash',    // Quaternary: Fast fallback
  ];

  // For now, return primary model (can be enhanced with availability checking)
  const selectedModel = fallbackChain[0];
  console.log('Using default model with fallback chain available:', selectedModel);
  return selectedModel;
}

/**
 * Create a fetch request with timeout protection
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = 60000 // 60 seconds default
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

/**
 * Retry function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000,
  context: string = 'operation'
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on certain errors (4xx client errors except 429)
      if (error.message && error.message.includes('Gemini API error:')) {
        const statusMatch = error.message.match(/Gemini API error: (\d+)/);
        if (statusMatch) {
          const statusCode = parseInt(statusMatch[1]);
          // Don't retry on 4xx errors (except 429 rate limit)
          if (statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
            console.error(`${context} failed with client error, not retrying:`, statusCode);
            throw error;
          }
        }
      }
      
      if (attempt < maxRetries) {
        const delayMs = initialDelayMs * Math.pow(2, attempt);
        console.warn(`${context} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delayMs}ms...`, error.message);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        console.error(`${context} failed after ${maxRetries + 1} attempts`);
      }
    }
  }
  
  throw lastError || new Error(`${context} failed after ${maxRetries + 1} attempts`);
}

/**
 * Call Gemini API with robust error handling, retry logic, and timeout protection
 */
async function callGeminiAPI(
  prompt: string,
  modelName: string,
  retryAttempt: number = 0
): Promise<{ text: string; model: string }> {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }

  const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${geminiApiKey}`;
  
  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.8,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    }
  };

  const requestOptions: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'P.L.A.T.E-App/1.0'
    },
    body: JSON.stringify(requestBody),
  };

  try {
    // Use fetchWithTimeout for timeout protection (60 seconds)
    const response = await fetchWithTimeout(url, requestOptions, 60000);
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      // Handle 404 - model not found (try fallback)
      if (response.status === 404) {
        const fallbackChain = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'];
        const currentIndex = fallbackChain.indexOf(modelName);
        
        if (currentIndex >= 0 && currentIndex < fallbackChain.length - 1) {
          const nextModel = fallbackChain[currentIndex + 1];
          console.warn(`Model ${modelName} not found (404), trying fallback: ${nextModel}`);
          return await callGeminiAPI(prompt, nextModel, retryAttempt + 1);
        }
        
        // Last resort - return error with available models
        const availableModels = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'];
        throw new Error(`Model ${modelName} not found. Available models: ${availableModels.join(', ')}`);
      }

      // Log detailed error info
      console.error('Gemini API error:', response.status, errorText);
      console.error('Gemini API request details:', {
        url,
        model: modelName,
        hasApiKey: !!geminiApiKey,
        apiKeyLength: geminiApiKey?.length || 0,
        requestMethod: 'POST',
        contentType: 'application/json',
        statusCode: response.status
      });

      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) {
      throw new Error('No text generated from Gemini API');
    }

    return { text: aiText, model: modelName };
  } catch (error: any) {
    // If timeout or network error, and we have retries left, retry with same model
    if (retryAttempt < 2 && (
      error.message?.includes('timeout') ||
      error.message?.includes('network') ||
      error.name === 'AbortError'
    )) {
      const delayMs = 2000 * (retryAttempt + 1); // 2s, 4s
      console.warn(`Request failed (attempt ${retryAttempt + 1}), retrying in ${delayMs}ms...`, error.message);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return await callGeminiAPI(prompt, modelName, retryAttempt + 1);
    }

    throw error;
  }
}

async function generateSingleRecipe(
  ingredients: string[] | undefined,
  query: string | undefined,
  filters: RecipeFilters | undefined,
  recipeNumber: number,
  mode: 'fridge' | 'explore' = 'fridge' // Default to fridge mode
): Promise<AIRecipe | null> {
  try {
    const recipePrompt = generateRecipePrompt(ingredients, query, filters, recipeNumber, mode);
    
    console.log('Generating AI recipe', { recipeNumber, ingredients, filters, mode });
    console.log('Gemini API call starting', {
      hasApiKey: !!Deno.env.get('GEMINI_API_KEY'),
      apiKeyLength: Deno.env.get('GEMINI_API_KEY')?.length || 0,
      promptLength: recipePrompt.length
    });
    
    // Use robust model selection with fallback chain
    const modelName = getGeminiModel();
    console.log('Gemini model selected:', modelName);
    
    // Use robust API call with timeout, retry, and fallback support
    const result = await retryWithBackoff(
      () => callGeminiAPI(recipePrompt, modelName),
      2, // Max 2 retries (3 total attempts)
      2000, // Initial 2 second delay
      `Recipe generation ${recipeNumber}`
    );

    const aiText = result.text;
    const usedModel = result.model;

    if (!aiText) {
      console.warn('No AI text generated', { recipeNumber, model: usedModel });
      return null;
    }

    console.log('AI response received', { 
      recipeNumber, 
      model: usedModel,
      textLength: aiText.length 
    });

    const parsedRecipe = parseAIRecipe(aiText, recipeNumber, ingredients, filters);
    if (parsedRecipe) {
      console.log('Successfully generated AI recipe', {
        recipeNumber,
        title: parsedRecipe.title,
        ingredientsCount: parsedRecipe.ingredients.length,
        mode,
        model: usedModel
      });
    }

    return parsedRecipe;
  } catch (error: any) {
    console.error('Error generating single recipe', {
      error: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      recipeNumber,
      stack: error.stack
    });
    return null;
  }
}

/**
 * Generate multiple AI recipes
 */
export async function generateAIRecipes(request: RecipeGenerationRequest): Promise<AIRecipe[]> {
  const { ingredients, query, filters, mode = 'fridge' } = request;
  
  // Check cache first
  const cacheKey = getRecipeCacheKey(request);
  const cachedResult = getCachedRecipeResult(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }
  
  // Get Gemini API key from environment
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }

  // Validate input
  if (!ingredients && !query) {
    throw new Error('Either ingredients or query must be provided.');
  }

  if (mode === 'fridge' && (!ingredients || ingredients.length === 0)) {
    throw new Error('Ingredients are required for fridge mode.');
  }

  if (mode === 'explore' && (!query || query.trim().length === 0)) {
    throw new Error('Query is required for explore mode.');
  }

  // Pre-generation validation for ingredient constraints
  if (mode === 'fridge' && ingredients && ingredients.length < 2) {
    console.warn('Limited ingredients provided for fridge mode:', ingredients);
    // Don't throw error, but log warning for monitoring
  }

  console.log('Starting AI recipe generation', { ingredients, query, filters, mode });

  const numberOfRecipes = 2;
  const aiRecipes: AIRecipe[] = [];

  // Phase 2: Smart ingredient grouping for fridge mode
  let ingredientGroups: string[][] = [];

  if (mode === 'fridge' && ingredients && ingredients.length > 0) {
    // Simple, reliable grouping logic - ensure we always get 2 groups for 3+ ingredients
    if (ingredients.length >= 4) {
      // For 4+ ingredients, create balanced groups
      const midPoint = Math.ceil(ingredients.length / 2);
      ingredientGroups = [
        ingredients.slice(0, midPoint),
        ingredients.slice(midPoint)
      ];
      console.log('Balanced grouping for 4+ ingredients:', {
        group1: ingredientGroups[0],
        group2: ingredientGroups[1]
      });
    } else if (ingredients.length === 3) {
      // For 3 ingredients, use first 2 for one recipe, all 3 for another
      ingredientGroups = [
        ingredients.slice(0, 2),
        ingredients
      ];
      console.log('3-ingredient grouping:', {
        group1: ingredientGroups[0],
        group2: ingredientGroups[1]
      });
    } else {
      // For 2 or fewer, use all ingredients for both recipes (will create variety through prompts)
      ingredientGroups = [ingredients, ingredients];
      console.log('Limited ingredients - using all for both recipes');
    }
  } else {
    // For explore mode or no ingredients
    if (mode === 'explore') {
      // Explore mode can work with just a query, create empty ingredient groups
      ingredientGroups = [[], []]; // Two empty groups for two recipes
    } else {
      ingredientGroups = ingredients ? [ingredients] : [];
    }
  }

  // Generate recipes using smart ingredient groups
  for (let i = 0; i < Math.min(numberOfRecipes, ingredientGroups.length); i++) {
    try {
      const groupIngredients = ingredientGroups[i];
      const recipe = await generateSingleRecipe(groupIngredients, query, filters, i + 1, mode);

      if (recipe) {
        // Mark AI-added ingredients as required
        const userIngredients = ingredients || [];
        const userIngredientsLower = userIngredients.map(ing => ing.toLowerCase().trim());

        // Process ingredients to mark required ones
        const processedIngredients = recipe.ingredients.map((ing: string) => {
          const ingLower = typeof ing === 'string' ? ing.toLowerCase().trim() : '';

          // Check if this ingredient was provided by user
          const isUserProvided = userIngredientsLower.some(userIng =>
            ingLower.includes(userIng) || userIng.includes(ingLower)
          );

          return {
            name: ing,
            required: !isUserProvided
          };
        });

        // Update recipe with processed ingredients
        recipe.ingredients = processedIngredients as any;
      }

      if (recipe) {
        // Check if this recipe is a duplicate or too similar
        const isDuplicate = aiRecipes.some(existingRecipe => {
          const titleMatch = existingRecipe.title.toLowerCase() === recipe.title.toLowerCase();
          const similarWords = ['cheesy', 'cheese', 'simple', 'easy', 'quick'];
          const hasSimilarWords = similarWords.some(word => 
            existingRecipe.title.toLowerCase().includes(word) && recipe.title.toLowerCase().includes(word)
          );
          return titleMatch || hasSimilarWords;
        });
        
        if (!isDuplicate) {
          aiRecipes.push(recipe);
        } else {
          console.warn('Duplicate or similar recipe detected, skipping', {
            title: recipe.title,
            existingTitles: aiRecipes.map(r => r.title)
          });
          // Try to generate a different recipe with more specific variety instructions
          const alternativeRecipe = await generateSingleRecipe(groupIngredients, query, filters, i + 1, mode);
          if (alternativeRecipe && !aiRecipes.some(r => {
            const titleMatch = r.title.toLowerCase() === alternativeRecipe.title.toLowerCase();
            const similarWords = ['cheesy', 'cheese', 'simple', 'easy', 'quick'];
            const hasSimilarWords = similarWords.some(word => 
              r.title.toLowerCase().includes(word) && alternativeRecipe.title.toLowerCase().includes(word)
            );
            return titleMatch || hasSimilarWords;
          })) {
            aiRecipes.push(alternativeRecipe);
          }
        }
      }
      
      // Add longer delay between requests to avoid rate limiting
      if (i < numberOfRecipes - 1) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (error: any) {
      console.error(`Error generating recipe ${i + 1}`, { error });
      
      // Enhanced retry logic for various error types
      if (aiRecipes.length === 0) {
        console.warn('No recipes generated yet, attempting fallback generation');
        await new Promise(resolve => setTimeout(resolve, 5000));
        try {
          const fallbackRecipe = await generateSingleRecipe(ingredients, query, filters, 1, mode);
          if (fallbackRecipe) {
            aiRecipes.push(fallbackRecipe);
            console.log('✅ Fallback recipe generated successfully');
          }
        } catch (fallbackError) {
          console.error('Fallback recipe generation also failed', { fallbackError });
        }
      }
      // Continue with other recipes even if one fails
    }
  }

  console.log('AI recipe generation completed', {
    requested: numberOfRecipes,
    generated: aiRecipes.length,
    mode
  });

  if (aiRecipes.length === 0) {
    // Provide a fallback error message based on the mode
    const fallbackMessage = mode === 'fridge' 
      ? 'Unable to generate recipes at the moment. Please try again later or check your ingredients.'
      : 'Unable to generate recipes at the moment. Please try again later or try a different mood.';
    
    throw new Error(fallbackMessage);
  }

  // Cache the result
  setCachedRecipeResult(cacheKey, aiRecipes);
  
  return aiRecipes;
}

serve(async (req: Request) => {
  console.log('=== EDGE FUNCTION STARTED ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  const headersObj = Object.fromEntries(req.headers as any as Iterable<[string, string]>);
  console.log('Request headers:', headersObj);
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting main request processing...');
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
  
  console.log('Environment variables check passed');
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  console.log('Supabase client created successfully');

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
    console.log('Verifying token for user authentication...')
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
    const requestData: RecipeGenerationRequest = await req.json()
    
    // Validate request
    if (!requestData.ingredients && !requestData.query) {
      return new Response(
        JSON.stringify({ error: 'Either ingredients or a query must be provided' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Check rate limit
    const rateLimitStatus = await getUserRateLimitStatus(supabase, user.id)
    if (rateLimitStatus.remaining <= 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          rateLimit: rateLimitStatus
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429 
        }
      )
    }

    // Generate AI recipes
    const aiRecipes = await generateAIRecipes(requestData)

    // Save recipe generation history
    await saveRecipeGenerationHistory(
      supabase,
      user.id,
      aiRecipes,
      requestData.mode || 'fridge',
      requestData.ingredients,
      requestData.query,
      requestData.filters
    )

    // Increment rate limit
    await incrementRateLimit(supabase, user.id)

    // Get updated rate limit status
    const updatedRateLimitStatus = await getUserRateLimitStatus(supabase, user.id)

    return new Response(
      JSON.stringify({ 
        recipes: aiRecipes,
        rateLimit: updatedRateLimitStatus
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error: any) {
    console.error('Error in generate-recipes function:', error)
    console.error('Error stack:', error?.stack)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return new Response(
      JSON.stringify({ 
        error: (error && error.message) || 'Internal server error',
        details: (error && error.stack) || 'No stack trace available',
        errorType: typeof error,
        errorData: error
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

