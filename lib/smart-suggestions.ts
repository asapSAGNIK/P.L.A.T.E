"use client"

import { supabaseAPI } from './supabase/api'
import { suggestionCache, performanceMonitor } from './advanced-cache'

// Types for smart suggestions
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

// Flavor profiles and their complementary ingredients
const FLAVOR_PROFILES = {
  savory: {
    keyIngredients: ['salt', 'pepper', 'garlic', 'onion', 'soy sauce'],
    complementary: ['thyme', 'rosemary', 'basil', 'oregano', 'cumin']
  },
  sweet: {
    keyIngredients: ['sugar', 'honey', 'cinnamon', 'vanilla', 'chocolate'],
    complementary: ['butter', 'cream', 'milk', 'nuts', 'fruits']
  },
  spicy: {
    keyIngredients: ['chili', 'cumin', 'paprika', 'ginger', 'cayenne'],
    complementary: ['garlic', 'onion', 'tomato', 'coconut milk', 'yogurt']
  },
  fresh: {
    keyIngredients: ['lemon', 'lime', 'herbs', 'vinegar', 'olive oil'],
    complementary: ['fish', 'chicken', 'vegetables', 'cheese', 'bread']
  }
}

/**
 * Generate smart ingredient suggestions based on current ingredients
 */
export async function generateSmartSuggestions(
  ingredients: string[],
  compatibilityLevel?: string
): Promise<SuggestionResult> {
  const cacheKey = `suggestions:${ingredients.sort().join(',')}:${compatibilityLevel || 'unknown'}`

  // Check advanced cache first
  const cached = await suggestionCache.get(cacheKey)
  if (cached) {
    return cached
  }

  // Performance monitoring
  return await performanceMonitor.timeExecution(`smart_suggestions`, async () => {
    try {
      // Use Edge Function for smart suggestions
      const result = await supabaseAPI.generateSmartSuggestions(ingredients, compatibilityLevel)
      
      // Cache the result with advanced caching
      suggestionCache.set(cacheKey, result.result, {
        tags: ['suggestions', `compatibility_${compatibilityLevel}`, `ingredients_${ingredients.length}`],
        ttl: 20 * 60 * 1000 // 20 minutes
      })

      return result.result

    } catch (error) {
      console.error('Error generating smart suggestions:', error)

      // Fallback to rule-based suggestions only
      const analysis = analyzeIngredients(ingredients)
      const ruleBasedSuggestions = generateRuleBasedSuggestions(analysis)

      const fallbackResult: SuggestionResult = {
        suggestions: ruleBasedSuggestions.slice(0, 5),
        analysis,
        overallScore: 60,
        message: "Here are some suggestions to improve your ingredient combination:"
      }

      // Cache fallback result
      suggestionCache.set(cacheKey, fallbackResult, {
        tags: ['suggestions', 'fallback'],
        ttl: 10 * 60 * 1000 // 10 minutes for fallback
      })

      return fallbackResult
    }
  })
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

/**
 * Get quick suggestions for limited ingredient scenarios
 */
export function getQuickSuggestions(ingredients: string[]): string[] {
  const analysis = analyzeIngredients(ingredients)
  const suggestions: string[] = []

  if (!analysis.hasProtein) {
    suggestions.push('Add a protein source (chicken, eggs, tofu)')
  }

  if (!analysis.hasVegetables) {
    suggestions.push('Add vegetables (onion, garlic, tomato)')
  }

  if (!analysis.hasSpices) {
    suggestions.push('Add basic seasonings (salt, pepper, oil)')
  }

  if (ingredients.length < 4) {
    suggestions.push('Add more ingredients for variety')
  }

  return suggestions.slice(0, 3)
}

/**
 * Suggest ingredient replacements for incompatible combinations
 */
export function suggestReplacements(problemIngredient: string): string[] {
  const replacements: { [key: string]: string[] } = {
    'chocolate': ['cocoa powder', 'carob', 'sweet potato'],
    'fish': ['chicken', 'tofu', 'beans'],
    'pork': ['chicken', 'turkey', 'beef'],
    'beef': ['chicken', 'lentils', 'mushrooms'],
    'spinach': ['kale', 'lettuce', 'broccoli'],
    'cinnamon': ['nutmeg', 'cardamom', 'vanilla']
  }

  return replacements[problemIngredient.toLowerCase()] || []
}
