"use client"

import { supabaseAPI } from './supabase/api'

// Types for fallback recipes
export interface FallbackRecipe {
  id: string
  title: string
  description: string
  ingredients: string[] | { name: string; required: boolean }[]
  requiredIngredients: string[]
  cookingTime: number
  difficulty: 'Easy' | 'Medium' | 'Hard'
  servings: number
  instructions: string
  isFallback: true
  userIngredients: string[]
  compatibility: string
}

export interface FallbackSuggestion {
  recipes: FallbackRecipe[]
  message: string
  suggestions: string[]
}

// Common easy-to-find ingredients for fallbacks
const COMMON_PANTRY_ITEMS = {
  grains: ['rice', 'pasta', 'bread', 'flour', 'oats'],
  proteins: ['eggs', 'chicken', 'canned tuna', 'lentils', 'tofu'],
  vegetables: ['onion', 'garlic', 'tomato', 'potato', 'carrot', 'spinach'],
  dairy: ['milk', 'cheese', 'yogurt', 'butter'],
  spices: ['salt', 'pepper', 'cumin', 'paprika', 'oregano', 'thyme'],
  oils: ['vegetable oil', 'olive oil'],
  sweeteners: ['sugar', 'honey'],
  liquids: ['water', 'broth']
}

// Pre-defined fallback recipe templates
const FALLBACK_TEMPLATES = {
  protein: {
    title: "Simple Protein Rice Bowl",
    baseIngredients: ['rice', 'onion', 'garlic', 'oil', 'salt', 'pepper'],
    cookingTime: 25,
    difficulty: 'Easy' as const,
    template: (protein: string) => `
Rinse 1 cup rice under cold water. In a pot, bring 2 cups water to boil. Add rice, reduce heat to low, cover and simmer 18-20 minutes until water is absorbed.

While rice cooks, heat 1 tbsp oil in a pan over medium heat. Add 1 chopped onion and 2 minced garlic cloves. Cook 3-4 minutes until softened.

Add ${protein} to the pan. Season with salt and pepper. Cook according to protein type:
- Ground meat: Cook 5-7 minutes until browned
- Chicken pieces: Cook 8-10 minutes until cooked through
- Eggs: Scramble for 2-3 minutes
- Tofu: Cook 5 minutes until golden

Serve protein mixture over rice. Makes 2 servings.`
  },

  vegetable: {
    title: "Simple Vegetable Stir-Fry",
    baseIngredients: ['rice', 'onion', 'garlic', 'soy sauce', 'oil', 'salt', 'pepper'],
    cookingTime: 20,
    difficulty: 'Easy' as const,
    template: (vegetables: string[]) => `
Cook 1 cup rice according to package directions (usually 2 cups water, bring to boil, simmer 18 minutes covered).

While rice cooks, heat 1 tbsp oil in a large pan over medium-high heat. Add 1 chopped onion and 2 minced garlic cloves. Cook 2-3 minutes.

Add your vegetables: ${vegetables.join(', ')}. Stir-fry for 5-7 minutes until tender-crisp.

Add 2 tbsp soy sauce (or substitute with salt if unavailable). Toss to combine.

Serve over rice. Makes 2 servings.`
  },

  fruit: {
    title: "Simple Fruit Smoothie",
    baseIngredients: ['milk', 'honey', 'yogurt'],
    cookingTime: 5,
    difficulty: 'Easy' as const,
    template: (fruits: string[]) => `
Wash and prepare your fruits: ${fruits.join(', ')}.

Add to blender: ${fruits.join(', ')}, 1 cup milk, 1 cup yogurt, 2 tbsp honey.

Blend on high speed for 1-2 minutes until smooth and creamy.

Pour into glasses and serve immediately. Makes 2 servings.`
  },

  egg: {
    title: "Simple Egg Scramble",
    baseIngredients: ['eggs', 'milk', 'butter', 'salt', 'pepper', 'bread'],
    cookingTime: 10,
    difficulty: 'Easy' as const,
    template: (additions: string[]) => `
Crack 4 eggs into a bowl. Add 2 tbsp milk, salt, and pepper. Whisk until well combined.

Heat 1 tbsp butter in a pan over medium heat. Add egg mixture.

${additions.length > 0 ? `Add your ingredients: ${additions.join(', ')}. ` : ''}Cook, stirring gently, for 3-4 minutes until eggs are set but still soft.

Serve with toast or bread. Makes 2 servings.`
  }
}

/**
 * Generate fallback recipes for incompatible ingredients
 */
export async function generateFallbackRecipes(
  userIngredients: string[],
  compatibilityReason: string
): Promise<FallbackSuggestion> {
  try {
    // Use Edge Function for fallback recipes
    const result = await supabaseAPI.generateFallbackRecipes(userIngredients, compatibilityReason)
    return result.result

  } catch (error) {
    console.error('Error generating fallback recipes:', error)

    // Ultimate fallback - use template system
    const analysis = getBasicIngredientAnalysis(userIngredients)
    const templateFallbacks = generateTemplateFallbackRecipes(userIngredients, analysis)

    return {
      recipes: templateFallbacks,
      message: "Here are some simple recipes using your ingredients with common pantry items:",
      suggestions: ['Add basic spices', 'Include vegetables', 'Add a protein source']
    }
  }
}

/**
 * Analyze user ingredients to determine fallback strategy
 */
async function analyzeIngredientsForFallback(ingredients: string[]): Promise<{
  hasProtein: boolean
  hasVegetables: boolean
  hasFruits: boolean
  hasEggs: boolean
  hasGrains: boolean
  proteins: string[]
  vegetables: string[]
  fruits: string[]
  eggs: string[]
  grains: string[]
}> {
  const proteins: string[] = []
  const vegetables: string[] = []
  const fruits: string[] = []
  const eggs: string[] = []
  const grains: string[] = []

  for (const ingredient of ingredients) {
    try {
      // Use existing classification service
      const { classifyIngredient } = await import('./ingredient-compatibility')
      const analysis = await classifyIngredient(ingredient)

      switch (analysis.category) {
        case 'protein':
          proteins.push(ingredient)
          break
        case 'vegetable':
          vegetables.push(ingredient)
          break
        case 'fruit':
          fruits.push(ingredient)
          break
        case 'grain':
          grains.push(ingredient)
          break
        default:
          if (ingredient.toLowerCase().includes('egg')) {
            eggs.push(ingredient)
          }
      }
    } catch {
      // Fallback classification
      const ing = ingredient.toLowerCase()
      if (/(chicken|beef|pork|fish|tofu|lentils|beans)/.test(ing)) {
        proteins.push(ingredient)
      } else if (/(onion|garlic|tomato|potato|carrot|spinach)/.test(ing)) {
        vegetables.push(ingredient)
      } else if (/(apple|banana|orange|strawberry|mango)/.test(ing)) {
        fruits.push(ingredient)
      } else if (/(rice|pasta|bread)/.test(ing)) {
        grains.push(ingredient)
      } else if (/(egg)/.test(ing)) {
        eggs.push(ingredient)
      }
    }
  }

  return {
    hasProtein: proteins.length > 0,
    hasVegetables: vegetables.length > 0,
    hasFruits: fruits.length > 0,
    hasEggs: eggs.length > 0,
    hasGrains: grains.length > 0,
    proteins,
    vegetables,
    fruits,
    eggs,
    grains
  }
}


/**
 * Generate template-based fallback recipes
 */
function generateTemplateFallbackRecipes(
  userIngredients: string[],
  analysis: any
): FallbackRecipe[] {
  const recipes: FallbackRecipe[] = []

  // Strategy 1: Use available proteins
  if (analysis.hasProtein && analysis.proteins.length > 0) {
    const template = FALLBACK_TEMPLATES.protein
    // Process ingredients to mark required ones
    const proteinIngredients = [...analysis.proteins, ...template.baseIngredients].map(ing => {
      const ingLower = ing.toLowerCase().trim();
      const userIngredientsLower = userIngredients.map((ui: string) => ui.toLowerCase().trim());

      const isUserProvided = userIngredientsLower.some(userIng =>
        ingLower.includes(userIng) || userIng.includes(ingLower)
      );

      return {
        name: ing,
        required: !isUserProvided
      };
    });

    recipes.push({
      id: `fallback-template-protein-${Date.now()}`,
      title: template.title,
      description: `A simple, satisfying meal using your ${analysis.proteins[0]} with basic pantry staples.`,
      ingredients: proteinIngredients,
      requiredIngredients: template.baseIngredients.filter(item => !userIngredients.includes(item)),
      cookingTime: template.cookingTime,
      difficulty: template.difficulty,
      servings: 2,
      instructions: template.template(analysis.proteins[0]),
      isFallback: true as const,
      userIngredients,
      compatibility: 'Uses your protein with rice base'
    })
  }

  // Strategy 2: Use available vegetables
  if (analysis.hasVegetables && analysis.vegetables.length > 0 && recipes.length < 2) {
    const template = FALLBACK_TEMPLATES.vegetable
    // Process ingredients to mark required ones
    const veggieIngredients = [...analysis.vegetables, ...template.baseIngredients].map(ing => {
      const ingLower = ing.toLowerCase().trim();
      const userIngredientsLower = userIngredients.map((ui: string) => ui.toLowerCase().trim());

      const isUserProvided = userIngredientsLower.some(userIng =>
        ingLower.includes(userIng) || userIng.includes(ingLower)
      );

      return {
        name: ing,
        required: !isUserProvided
      };
    });

    recipes.push({
      id: `fallback-template-veggie-${Date.now()}`,
      title: template.title,
      description: `A fresh, healthy stir-fry using your vegetables with rice.`,
      ingredients: veggieIngredients,
      requiredIngredients: template.baseIngredients.filter(item => !userIngredients.includes(item)),
      cookingTime: template.cookingTime,
      difficulty: template.difficulty,
      servings: 2,
      instructions: template.template(analysis.vegetables),
      isFallback: true as const,
      userIngredients,
      compatibility: 'Uses your vegetables with rice base'
    })
  }

  // Strategy 3: Use available fruits
  if (analysis.hasFruits && analysis.fruits.length > 0 && recipes.length < 2) {
    const template = FALLBACK_TEMPLATES.fruit
    // Process ingredients to mark required ones
    const fruitIngredients = [...analysis.fruits, ...template.baseIngredients].map(ing => {
      const ingLower = ing.toLowerCase().trim();
      const userIngredientsLower = userIngredients.map((ui: string) => ui.toLowerCase().trim());

      const isUserProvided = userIngredientsLower.some(userIng =>
        ingLower.includes(userIng) || userIng.includes(ingLower)
      );

      return {
        name: ing,
        required: !isUserProvided
      };
    });

    recipes.push({
      id: `fallback-template-fruit-${Date.now()}`,
      title: template.title,
      description: `A refreshing smoothie using your fruits with dairy.`,
      ingredients: fruitIngredients,
      requiredIngredients: template.baseIngredients.filter(item => !userIngredients.includes(item)),
      cookingTime: template.cookingTime,
      difficulty: template.difficulty,
      servings: 2,
      instructions: template.template(analysis.fruits),
      isFallback: true as const,
      userIngredients,
      compatibility: 'Uses your fruits in a smoothie'
    })
  }

  // Strategy 4: Egg-based recipe
  if (analysis.hasEggs && analysis.eggs.length > 0 && recipes.length < 2) {
    const template = FALLBACK_TEMPLATES.egg
    const additions = [...analysis.vegetables, ...analysis.proteins].slice(0, 2)

    // Process ingredients to mark required ones
    const eggIngredients = [...analysis.eggs, ...template.baseIngredients, ...additions].map(ing => {
      const ingLower = ing.toLowerCase().trim();
      const userIngredientsLower = userIngredients.map((ui: string) => ui.toLowerCase().trim());

      const isUserProvided = userIngredientsLower.some(userIng =>
        ingLower.includes(userIng) || userIng.includes(ingLower)
      );

      return {
        name: ing,
        required: !isUserProvided
      };
    });

    recipes.push({
      id: `fallback-template-egg-${Date.now()}`,
      title: template.title,
      description: `A quick egg dish using your eggs and available ingredients.`,
      ingredients: eggIngredients,
      requiredIngredients: template.baseIngredients.filter(item => !userIngredients.includes(item)),
      cookingTime: template.cookingTime,
      difficulty: template.difficulty,
      servings: 2,
      instructions: template.template(additions),
      isFallback: true as const,
      userIngredients,
      compatibility: 'Uses your eggs with simple additions'
    })
  }

  // Ensure we have at least 2 recipes
  if (recipes.length === 0) {
    // Ultimate fallback: Simple rice dish
    const riceIngredients = [...userIngredients, 'rice', 'salt', 'pepper', 'oil'].map(ing => {
      const ingLower = ing.toLowerCase().trim();
      const userIngredientsLower = userIngredients.map((ui: string) => ui.toLowerCase().trim());

      const isUserProvided = userIngredientsLower.some(userIng =>
        ingLower.includes(userIng) || userIng.includes(ingLower)
      );

      return {
        name: ing,
        required: !isUserProvided
      };
    });

    recipes.push({
      id: `fallback-basic-1-${Date.now()}`,
      title: "Simple Rice Bowl",
      description: "A basic rice dish with your ingredients and simple seasonings.",
      ingredients: riceIngredients,
      requiredIngredients: ['rice', 'salt', 'pepper', 'oil'].filter(item => !userIngredients.includes(item)),
      cookingTime: 25,
      difficulty: 'Easy',
      servings: 2,
      instructions: `Rinse 1 cup rice. Add 2 cups water, bring to boil, reduce heat, cover and simmer 18 minutes.

While rice cooks, prepare your ingredients: ${userIngredients.join(', ')}

Heat oil in pan, add your ingredients and seasonings. Cook 5-7 minutes.

Serve over rice.`,
      isFallback: true as const,
      userIngredients,
      compatibility: 'Basic rice bowl with your ingredients'
    })

    // Second fallback: Simple soup
    const soupIngredients = [...userIngredients, 'water', 'salt', 'pepper'].map(ing => {
      const ingLower = ing.toLowerCase().trim();
      const userIngredientsLower = userIngredients.map((ui: string) => ui.toLowerCase().trim());

      const isUserProvided = userIngredientsLower.some(userIng =>
        ingLower.includes(userIng) || userIng.includes(ingLower)
      );

      return {
        name: ing,
        required: !isUserProvided
      };
    });

    recipes.push({
      id: `fallback-basic-2-${Date.now()}`,
      title: "Simple Vegetable Soup",
      description: "A comforting soup using your ingredients with broth.",
      ingredients: soupIngredients,
      requiredIngredients: ['water'].filter(item => !userIngredients.includes(item)),
      cookingTime: 20,
      difficulty: 'Easy',
      servings: 2,
      instructions: `Chop your ingredients: ${userIngredients.join(', ')}

Add to pot with 4 cups water. Bring to boil, then simmer 15 minutes.

Season with salt and pepper to taste.

Blend if desired for creamy texture.`,
      isFallback: true as const,
      userIngredients,
      compatibility: 'Simple soup with your ingredients'
    })
  }

  return recipes.slice(0, 2) // Return max 2 recipes
}

/**
 * Generate helpful suggestions for improving ingredient compatibility
 */
function generateSmartSuggestions(
  userIngredients: string[],
  analysis: any
): string[] {
  const suggestions: string[] = []

  if (!analysis.hasProtein) {
    suggestions.push('Add a protein (chicken, eggs, tofu, lentils)')
  }

  if (!analysis.hasVegetables) {
    suggestions.push('Add vegetables (onion, garlic, tomato, spinach)')
  }

  if (!analysis.hasGrains) {
    suggestions.push('Add grains (rice, pasta, bread)')
  }

  if (userIngredients.length < 5) {
    suggestions.push('Add more ingredients for better recipe variety')
  }

  // Add some general helpful suggestions
  if (suggestions.length < 3) {
    suggestions.push('Try adding basic seasonings (salt, pepper, oil)')
    suggestions.push('Include dairy (milk, cheese, yogurt) for creaminess')
  }

  return suggestions.slice(0, 3)
}

/**
 * Generate appropriate fallback message
 */
function getFallbackMessage(ingredients: string[], reason: string): string {
  if (reason.includes('sweet') && reason.includes('savory')) {
    return "Your ingredients have conflicting flavor profiles. Here are some practical recipes using what you have:"
  }

  if (ingredients.length <= 3) {
    return "With limited ingredients, here are some simple recipes that make the most of what you have:"
  }

  return "These ingredients don't work perfectly together. Here are some practical alternatives using easily available items:"
}

/**
 * Basic ingredient analysis for when AI fails
 */
function getBasicIngredientAnalysis(ingredients: string[]): any {
  const hasProtein = ingredients.some(ing => /(chicken|beef|pork|fish|tofu|eggs|lentils)/.test(ing.toLowerCase()))
  const hasVegetables = ingredients.some(ing => /(onion|garlic|tomato|potato|carrot)/.test(ing.toLowerCase()))
  const hasFruits = ingredients.some(ing => /(apple|banana|orange|strawberry)/.test(ing.toLowerCase()))
  const hasEggs = ingredients.some(ing => /egg/.test(ing.toLowerCase()))

  return {
    hasProtein,
    hasVegetables,
    hasFruits,
    hasEggs,
    proteins: ingredients.filter(ing => /(chicken|beef|pork|fish|tofu|eggs|lentils)/.test(ing.toLowerCase())),
    vegetables: ingredients.filter(ing => /(onion|garlic|tomato|potato|carrot)/.test(ing.toLowerCase())),
    fruits: ingredients.filter(ing => /(apple|banana|orange|strawberry)/.test(ing.toLowerCase())),
    eggs: ingredients.filter(ing => /egg/.test(ing.toLowerCase()))
  }
}
