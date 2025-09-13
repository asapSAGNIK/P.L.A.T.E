"use client"

import { supabaseAPI } from './supabase/api'
import { generateFallbackRecipes, FallbackRecipe } from './fallback-recipes'
import { generateSmartSuggestions, SmartSuggestion } from './smart-suggestions'
import { compatibilityCache, ingredientCache, suggestionCache, performanceMonitor } from './advanced-cache'
import { abTesting, featureFlags, analyticsTracker } from './ab-testing'

// Core Types
export type IngredientCategory =
  | 'protein'
  | 'vegetable'
  | 'fruit'
  | 'grain'
  | 'spice'
  | 'dairy'
  | 'dessert'
  | 'other'

export type FlavorProfile =
  | 'savory'
  | 'sweet'
  | 'neutral'
  | 'mixed'

export type TemperatureProfile =
  | 'hot'
  | 'cold'
  | 'room'
  | 'any'

export type CompatibilityLevel =
  | 'excellent'
  | 'good'
  | 'limited'
  | 'incompatible'
  | 'insufficient'

export interface IngredientProfile {
  category: IngredientCategory
  flavor: FlavorProfile
  temperature: TemperatureProfile
  commonPairings: string[]
}

export interface IngredientAnalysis {
  ingredient: string
  category: IngredientCategory
  flavor: FlavorProfile
  temperature: TemperatureProfile
  confidence: number
  commonPairings: string[]
}

export interface RecipeGroup {
  name: string
  ingredients: string[]
  flavor: FlavorProfile
  temperature: TemperatureProfile
  suggestedRecipes?: string[]
}

export interface CompatibilityAnalysis {
  level: CompatibilityLevel
  score: number
  message: string
  reasons: string[]
  suggestions: string[]
  groupings?: IngredientGroup[]
}

export interface IngredientGroup {
  ingredients: string[]
  type: 'main' | 'side' | 'dessert'
  compatibilityScore: number
  suggestedRecipes: string[]
}

export interface RecipeGenerationGroups {
  groups: IngredientGroup[]
  compatibility: CompatibilityLevel
  message: string
  suggestions: string[]
  smartSuggestions?: SmartSuggestion[]
  fallbackRecipes?: FallbackRecipe[]
  fallbackMessage?: string
}

// Helper function for common pairings
function getCommonPairings(category: IngredientCategory): string[] {
  const pairings: { [key in IngredientCategory]: string[] } = {
    protein: ['onion', 'garlic', 'tomato', 'herbs'],
    vegetable: ['onion', 'garlic', 'oil', 'salt'],
    fruit: ['sugar', 'lemon', 'milk', 'yogurt'],
    grain: ['butter', 'salt', 'oil', 'herbs'],
    spice: ['oil', 'salt', 'garlic', 'onion'],
    dairy: ['salt', 'pepper', 'herbs', 'bread'],
    dessert: ['sugar', 'milk', 'butter', 'flour'],
    other: ['salt', 'oil', 'garlic', 'onion']
  }
  return pairings[category] || []
}

/**
 * Classify ingredient using Edge Function
 */
export async function classifyIngredient(ingredient: string): Promise<IngredientAnalysis> {
  const cacheKey = `ingredient:${ingredient.toLowerCase().trim()}`

  // Check advanced cache first
  const cached = await ingredientCache.get(cacheKey)
  if (cached) {
    return cached
  }

  // Performance monitoring
  return await performanceMonitor.timeExecution(`classify_ingredient`, async () => {
    try {
      // Use Edge Function for ingredient analysis
      const result = await supabaseAPI.analyzeIngredientCompatibility([ingredient])
      const categories = result.analysis.categories
      
      // Determine category from Edge Function result
      let category: IngredientCategory = 'other'
      if (categories.proteins.length > 0) category = 'protein'
      else if (categories.vegetables.length > 0) category = 'vegetable'
      else if (categories.fruits.length > 0) category = 'fruit'
      else if (categories.grains.length > 0) category = 'grain'
      else if (categories.spices.length > 0) category = 'spice'
      else if (categories.dairy.length > 0) category = 'dairy'
      
      const analysis: IngredientAnalysis = {
        ingredient,
        category,
        flavor: category === 'fruit' ? 'sweet' : category === 'spice' ? 'neutral' : 'savory',
        temperature: category === 'fruit' ? 'cold' : 'hot',
        confidence: 0.8,
        commonPairings: getCommonPairings(category)
      }

      // Cache the result with advanced caching
      ingredientCache.set(cacheKey, analysis, {
        tags: ['ingredient', 'classification', category],
        ttl: 30 * 60 * 1000 // 30 minutes
      } as any)

      return analysis
    } catch (error: any) {
      console.warn('Edge Function classification failed, using fallback:', error)
      return classifyIngredientFallback(ingredient)
    }
  })
}

/**
 * Fallback ingredient classification
 */
function classifyIngredientFallback(ingredient: string): IngredientAnalysis {
  const ing = ingredient.toLowerCase()
  
  let category: IngredientCategory = 'other'
  let flavor: FlavorProfile = 'neutral'
  let temperature: TemperatureProfile = 'room'

  if (/(chicken|beef|pork|fish|salmon|tofu|eggs|lentils|beans|turkey|lamb)/.test(ing)) {
    category = 'protein'
    flavor = 'savory'
    temperature = 'hot'
  } else if (/(onion|garlic|tomato|potato|carrot|broccoli|spinach|lettuce|bell pepper|cucumber|mushroom)/.test(ing)) {
    category = 'vegetable'
    flavor = 'savory'
    temperature = 'hot'
  } else if (/(apple|banana|orange|lemon|lime|strawberry|blueberry|mango|pineapple|grape)/.test(ing)) {
    category = 'fruit'
    flavor = 'sweet'
    temperature = 'cold'
  } else if (/(rice|pasta|bread|flour|oats|quinoa|barley|couscous)/.test(ing)) {
    category = 'grain'
    flavor = 'neutral'
    temperature = 'hot'
  } else if (/(milk|cheese|yogurt|butter|cream|sour cream)/.test(ing)) {
    category = 'dairy'
    flavor = 'neutral'
    temperature = 'cold'
  } else if (/(salt|pepper|cumin|paprika|oregano|thyme|basil|cinnamon|nutmeg|ginger)/.test(ing)) {
    category = 'spice'
    flavor = 'neutral'
    temperature = 'room'
  }

  return {
    ingredient,
    category,
    flavor,
    temperature,
    confidence: 0.6,
    commonPairings: getCommonPairings(category)
  }
}

/**
 * Comprehensive compatibility analysis using Edge Function
 */
export async function analyzeIngredientCompatibility(
  ingredients: string[],
  userId?: string
): Promise<CompatibilityAnalysis> {
  const cacheKey = `compatibility:${ingredients.sort().join(',')}`

  // Check advanced cache
  const cached = await compatibilityCache.get(cacheKey)
  if (cached) {
    return cached
  }

  // Performance monitoring
  return await performanceMonitor.timeExecution(`compatibility_analysis`, async () => {
    try {
      // Use Edge Function for compatibility analysis
      const result = await supabaseAPI.analyzeIngredientCompatibility(ingredients)
      const analysis = result.analysis

      // Convert Edge Function result to our format
      const compatibilityAnalysis: CompatibilityAnalysis = {
        level: analysis.level,
        score: analysis.score,
        message: analysis.message,
        reasons: [analysis.message],
        suggestions: analysis.suggestions
      }

      // Cache the result
      compatibilityCache.set(cacheKey, compatibilityAnalysis, {
        tags: ['compatibility', analysis.level],
        ttl: 20 * 60 * 1000 // 20 minutes
      } as any)

      return compatibilityAnalysis
    } catch (error: any) {
      console.error('Error in compatibility analysis:', error)

      // Fallback analysis when Edge Function fails
      const fallbackAnalysis: CompatibilityAnalysis = {
        level: ingredients.length >= 4 ? 'good' : ingredients.length >= 3 ? 'limited' : 'insufficient',
        score: Math.min(60, ingredients.length * 15),
        message: ingredients.length < 3 
          ? 'Add more ingredients for better recipe variety'
          : 'Using basic compatibility analysis',
        reasons: ['Fallback analysis due to service unavailability'],
        suggestions: ['Add vegetables for nutrition', 'Add grains for substance', 'Add spices for flavor']
      }

      // Cache fallback result with shorter TTL
      compatibilityCache.set(cacheKey, fallbackAnalysis, {
        tags: ['compatibility', 'fallback'],
        ttl: 5 * 60 * 1000 // 5 minutes for fallback
      } as any)

      return fallbackAnalysis
    }
  })
}

/**
 * Generate recipe groups based on ingredient compatibility
 */
export async function generateRecipeGroups(
  ingredients: string[],
  compatibility: CompatibilityAnalysis
): Promise<IngredientGroup[]> {
  // If incompatible, return empty groups
  if (compatibility.level === 'incompatible') {
    return []
  }

  // If insufficient ingredients, return empty groups
  if (compatibility.level === 'insufficient') {
    return []
  }

  // For limited compatibility, try to create basic groups
  if (compatibility.level === 'limited') {
    return generateFallbackGroups(ingredients)
  }

  // For good/excellent compatibility, create smart groups
  try {
    // Use Edge Function for smart suggestions to get recipe groups
    const result = await supabaseAPI.generateSmartSuggestions(ingredients, compatibility.level)
    
    // Create basic groups from the suggestions
    const groups: IngredientGroup[] = []
    
    // Group 1: Use first 3-4 ingredients
    if (ingredients.length >= 3) {
      groups.push({
        ingredients: ingredients.slice(0, Math.min(4, ingredients.length)),
        type: 'main',
        compatibilityScore: compatibility.score,
        suggestedRecipes: ['Main Dish Recipe']
      })
    }
    
    // Group 2: Use remaining ingredients if available
    if (ingredients.length >= 6) {
      groups.push({
        ingredients: ingredients.slice(4, Math.min(8, ingredients.length)),
        type: 'side',
        compatibilityScore: compatibility.score - 10,
        suggestedRecipes: ['Side Dish Recipe']
      })
    }

    return groups

  } catch (error) {
    console.error('Error generating recipe groups:', error)
    return generateFallbackGroups(ingredients)
  }
}

function generateFallbackGroups(ingredients: string[]): IngredientGroup[] {
  const groups: IngredientGroup[] = []
  
  // Simple grouping logic
  const proteins = ingredients.filter(ing => /(chicken|beef|pork|fish|tofu|eggs|lentils)/.test(ing.toLowerCase()))
  const vegetables = ingredients.filter(ing => /(onion|garlic|tomato|potato|carrot)/.test(ing.toLowerCase()))
  const grains = ingredients.filter(ing => /(rice|pasta|bread)/.test(ing.toLowerCase()))
  const fruits = ingredients.filter(ing => /(apple|banana|orange|strawberry)/.test(ing.toLowerCase()))

  // Create savory group
  if (proteins.length > 0 || vegetables.length > 0) {
    const savoryIngredients = [...proteins, ...vegetables, ...grains].slice(0, 4)
    if (savoryIngredients.length >= 3) {
      groups.push({
        ingredients: savoryIngredients,
        type: 'main',
        compatibilityScore: 70,
        suggestedRecipes: ['Simple Stir-fry', 'One-pot Meal']
      })
    }
  }

  // Create sweet group if fruits present
  if (fruits.length > 0) {
    const sweetIngredients = [...fruits, 'milk', 'sugar'].filter(ing => 
      ingredients.includes(ing) || ['milk', 'sugar'].includes(ing)
    ).slice(0, 4)
    if (sweetIngredients.length >= 2) {
      groups.push({
        ingredients: sweetIngredients,
        type: 'dessert',
        compatibilityScore: 60,
        suggestedRecipes: ['Fruit Smoothie', 'Simple Dessert']
      })
    }
  }

  return groups
}

/**
 * Main function to get comprehensive recipe generation guidance
 */
export async function getRecipeGenerationGuidance(
  ingredients: string[],
  userId?: string
): Promise<RecipeGenerationGroups> {
  
  if (!ingredients || ingredients.length === 0) {
    return {
      groups: [],
      compatibility: 'insufficient',
      message: 'No ingredients provided',
      suggestions: ['Add some ingredients to get started']
    }
  }

  if (ingredients.length < 3) {
    return {
      groups: [],
      compatibility: 'insufficient',
      message: 'Need at least 3 ingredients for recipe generation',
      suggestions: ['Add more ingredients for better results']
    }
  }

  try {
    // Get comprehensive analysis with user context
    const compatibility = await analyzeIngredientCompatibility(ingredients, userId)

    // Generate smart suggestions for all compatibility levels
    const smartSuggestionsResult = await generateSmartSuggestions(ingredients, compatibility.level)

    if (compatibility.level === 'incompatible') {
      // Generate fallback recipes for incompatible ingredients
      try {
        const fallbackData = await generateFallbackRecipes(ingredients, compatibility.message)

        return {
          groups: [],
          compatibility: compatibility.level,
          message: compatibility.message,
          suggestions: compatibility.suggestions,
          smartSuggestions: smartSuggestionsResult.suggestions,
          fallbackRecipes: fallbackData.recipes,
          fallbackMessage: fallbackData.message
        }
      } catch (fallbackError) {
        console.error('Fallback recipe generation failed:', fallbackError)

        return {
          groups: [],
          compatibility: compatibility.level,
          message: compatibility.message,
          suggestions: compatibility.suggestions,
          smartSuggestions: smartSuggestionsResult.suggestions,
          fallbackRecipes: [],
          fallbackMessage: "Unable to generate fallback recipes at this time."
        }
      }
    }

    // Generate groups for compatible ingredients
    const groups = await generateRecipeGroups(ingredients, compatibility)

    return {
      groups,
      compatibility: compatibility.level,
      message: compatibility.message,
      suggestions: compatibility.suggestions,
      smartSuggestions: smartSuggestionsResult.suggestions
    }

  } catch (error) {
    console.error('Error in recipe generation guidance:', error)

    // Ultimate fallback
    return {
      groups: [{
        ingredients: ingredients.slice(0, Math.min(4, ingredients.length)),
        type: 'main',
        compatibilityScore: 60,
        suggestedRecipes: ['Basic Recipe']
      }],
      compatibility: 'limited',
      message: 'Using fallback grouping due to analysis error',
      suggestions: ['Try adding more common ingredients'],
      smartSuggestions: []
    }
  }
}
