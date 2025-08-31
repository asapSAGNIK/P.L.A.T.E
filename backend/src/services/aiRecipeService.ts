import axios from 'axios';
import { env } from '../config/env';
import logger from '../config/logger';

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
  image: string;
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
}

/**
 * Generate AI recipe prompt based on ingredients and filters
 */
function generateRecipePrompt(
  ingredients: string[] | undefined, 
  query: string | undefined, 
  filters: RecipeFilters | undefined, 
  recipeNumber: number
): string {
  const basePrompt = `You are a helpful cooking assistant for beginners. Generate a SIMPLE recipe that anyone can make with basic ingredients.

RESPONSE FORMAT (exactly like this):
Title: [Simple Recipe Name]
Description: [Brief description - keep it simple]
Cooking Time: [X] minutes
Difficulty: Easy
Servings: [X]
Ingredients:
- [ingredient with amount]
- [ingredient with amount]
- [ingredient with amount]
Instructions:
1. [First step - very simple]
2. [Second step - very simple]
3. [Third step - very simple]

IMPORTANT RULES FOR FRIDGE MODE:
- ONLY use these additional ingredients: butter, salt, pepper, oil, garlic powder, onion powder, ketchup, mayo, cheese, flour, eggs, milk
- NO complex ingredients like: sriracha, specialty sauces, exotic spices, hard-to-find items
- Keep instructions simple (max 4-5 steps)
- Use basic cooking methods: frying, boiling, simple mixing
- Make it beginner-friendly
- Respect the exact cooking time limit
- Respect the exact serving size

REQUIREMENTS:`;

  let requirements = '';
  
  if (ingredients && ingredients.length > 0) {
    requirements += `\n- Must use these ingredients: ${ingredients.join(', ')}`;
    requirements += `\n- This is FRIDGE MODE - keep it simple and beginner-friendly`;
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

  requirements += `\n\nMake this recipe ${recipeNumber} of 5. Keep it SIMPLE and BEGINNER-FRIENDLY. No complex techniques or ingredients.`;

  return basePrompt + requirements;
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
      logger.warn('Failed to parse recipe components from AI response', { recipeNumber });
      return null;
    }

    // Clean and process ingredients
    const ingredientsText = ingredientsMatch[1].trim();
    let ingredientsList = ingredientsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.match(/^[-•*]\s*$/))
      .map(line => line.replace(/^[-•*]\s*/, ''));

    // Filter out complex ingredients for fridge mode
    const allowedIngredients = [
      'butter', 'salt', 'pepper', 'oil', 'garlic powder', 'onion powder', 
      'ketchup', 'mayo', 'mayonnaise', 'cheese', 'flour', 'eggs', 'milk',
      'water', 'sugar', 'brown sugar', 'honey', 'lemon', 'onion', 'garlic',
      'tomato', 'lettuce', 'carrot', 'potato', 'rice', 'pasta', 'bread',
      'chicken', 'beef', 'pork', 'fish', 'shrimp', 'bacon', 'ham'
    ];

    ingredientsList = ingredientsList.filter(ingredient => {
      const ingredientLower = ingredient.toLowerCase();
      return allowedIngredients.some(allowed => ingredientLower.includes(allowed)) ||
             // Allow the original ingredients provided by user
             (ingredients && ingredients.some(userIngredient => 
               ingredientLower.includes(userIngredient.toLowerCase())
             ));
    });

    // Clean and process instructions
    const instructionsText = instructionsMatch[1].trim();
    let instructionsList = instructionsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.match(/^[-•*]\s*$/))
      .map(line => line.replace(/^[-•*]\s*/, ''))
      // Remove any leading numbers and dots (like "1. ", "2. ", etc.)
      .map(line => line.replace(/^\d+\.\s*/, ''));

    // Limit instructions to max 5 steps for simplicity
    if (instructionsList.length > 5) {
      instructionsList = instructionsList.slice(0, 5);
    }

    return {
      id: `ai-${Date.now()}-${recipeNumber}`,
      title: titleMatch[1].trim(),
      image: `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(titleMatch[1].trim())}`,
      cookingTime: cookingTimeMatch ? parseInt(cookingTimeMatch[1]) : 30,
      difficulty: difficultyMatch ? difficultyMatch[1] : 'Medium',
      ingredients: ingredientsList,
      description: descriptionMatch ? descriptionMatch[1].trim() : 'A delicious AI-generated recipe',
      rating: 4, // Default rating for AI recipes
      servings: servingsMatch ? parseInt(servingsMatch[1]) : (filters?.servings || 2),
      instructions: instructionsList.join('\n'),
      isAIGenerated: true
    };
  } catch (error) {
    logger.error('Error parsing AI recipe', { error, recipeNumber });
    return null;
  }
}

/**
 * Generate a single AI recipe
 */
async function generateSingleRecipe(
  ingredients: string[] | undefined,
  query: string | undefined,
  filters: RecipeFilters | undefined,
  recipeNumber: number
): Promise<AIRecipe | null> {
  try {
    const recipePrompt = generateRecipePrompt(ingredients, query, filters, recipeNumber);
    
    logger.info('Generating AI recipe', { recipeNumber, ingredients, filters });
    
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent',
      {
        contents: [{ parts: [{ text: recipePrompt }] }],
      },
      {
        params: { key: env.GEMINI_API_KEY },
        timeout: 30000
      }
    );

    const aiText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiText) {
      logger.warn('No AI text generated', { recipeNumber });
      return null;
    }

    const parsedRecipe = parseAIRecipe(aiText, recipeNumber, ingredients, filters);
    if (parsedRecipe) {
      logger.info('Successfully generated AI recipe', { 
        recipeNumber, 
        title: parsedRecipe.title,
        ingredientsCount: parsedRecipe.ingredients.length 
      });
    }

    return parsedRecipe;
  } catch (error) {
    logger.error('Error generating single recipe', { error, recipeNumber });
    return null;
  }
}

/**
 * Generate multiple AI recipes
 */
export async function generateAIRecipes(request: RecipeGenerationRequest): Promise<AIRecipe[]> {
  const { ingredients, query, filters } = request;
  
  if (!ingredients && !query) {
    throw new Error('Either ingredients or a query must be provided.');
  }

  if (!env.GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  logger.info('Starting AI recipe generation', { ingredients, query, filters });

  const numberOfRecipes = 2;
  const aiRecipes: AIRecipe[] = [];

  // Generate recipes sequentially to avoid rate limiting
  for (let i = 0; i < numberOfRecipes; i++) {
    try {
      const recipe = await generateSingleRecipe(ingredients, query, filters, i + 1);
      if (recipe) {
        aiRecipes.push(recipe);
      }
      
      // Add longer delay between requests to avoid rate limiting
      if (i < numberOfRecipes - 1) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (error: any) {
      logger.error(`Error generating recipe ${i + 1}`, { error });
      
      // If we hit rate limit, try to generate at least one recipe
      if (error.response?.status === 429 && aiRecipes.length === 0) {
        logger.warn('Rate limit hit, trying one more time with longer delay');
        await new Promise(resolve => setTimeout(resolve, 10000));
        try {
          const fallbackRecipe = await generateSingleRecipe(ingredients, query, filters, 1);
          if (fallbackRecipe) {
            aiRecipes.push(fallbackRecipe);
          }
        } catch (fallbackError) {
          logger.error('Fallback recipe generation also failed', { fallbackError });
        }
      }
      // Continue with other recipes even if one fails
    }
  }

  logger.info('AI recipe generation completed', { 
    requested: numberOfRecipes, 
    generated: aiRecipes.length 
  });

  if (aiRecipes.length === 0) {
    throw new Error('Failed to generate any recipes. Please try again.');
  }

  return aiRecipes;
}
