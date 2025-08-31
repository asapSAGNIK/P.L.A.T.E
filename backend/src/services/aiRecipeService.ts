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

  const formatPrompt = `RESPONSE FORMAT (exactly like this):
Title: [${isFridgeMode ? 'Simple' : 'Creative'} Recipe Name]
Description: [Brief description - ${isFridgeMode ? 'keep it simple' : 'make it enticing'}]
Cooking Time: [X] minutes
Difficulty: ${isFridgeMode ? 'Easy' : 'Medium'}
Servings: [X]
Ingredients:
- [ingredient with amount]
- [ingredient with amount]
- [ingredient with amount]
Instructions:
1. [First step - ${isFridgeMode ? 'very simple' : 'detailed and clear'}]
2. [Second step - ${isFridgeMode ? 'very simple' : 'detailed and clear'}]
3. [Third step - ${isFridgeMode ? 'very simple' : 'detailed and clear'}]`;

  const modeRules = isFridgeMode 
    ? `IMPORTANT RULES FOR FRIDGE MODE:
- ONLY use these additional ingredients: butter, salt, pepper, oil, garlic powder, onion powder, ketchup, mayo, cheese, flour, eggs, milk
- NO complex ingredients like: sriracha, specialty sauces, exotic spices, hard-to-find items
- Keep instructions simple (max 4-5 steps)
- Use basic cooking methods: frying, boiling, simple mixing
- Make it beginner-friendly
- Respect the exact cooking time limit
- Respect the exact serving size`
    : `IMPORTANT RULES FOR EXPLORE MODE:
- Be creative and adventurous with ingredients and techniques
- Use a variety of spices, herbs, and flavor profiles
- Include interesting cooking methods and techniques
- Make recipes that are restaurant-quality and impressive
- Feel free to use specialty ingredients and complex flavors
- Instructions can be more detailed (5-8 steps)
- Focus on taste, presentation, and culinary excellence
- Respect the exact cooking time limit
- Respect the exact serving size`;

  let requirements = '';
  
  if (ingredients && ingredients.length > 0) {
    requirements += `\n- Must use these ingredients: ${ingredients.join(', ')}`;
    if (isFridgeMode) {
      requirements += `\n- This is FRIDGE MODE - keep it simple and beginner-friendly`;
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

  // Add variety based on recipe number
  const varietyInstructions = recipeNumber === 1 
    ? "Make this the FIRST recipe - focus on classic, comforting flavors and simple techniques."
    : "Make this the SECOND recipe - focus on creative, innovative flavors and slightly more adventurous techniques.";

  const modeSpecificInstruction = isFridgeMode 
    ? `\n\nMake this recipe ${recipeNumber} of 2. Keep it SIMPLE and BEGINNER-FRIENDLY. No complex techniques or ingredients. ${varietyInstructions} IMPORTANT: Make this recipe COMPLETELY DIFFERENT from any other recipe you might generate. Use different ingredients, cooking methods, and flavor profiles.`
    : `\n\nMake this recipe ${recipeNumber} of 2. Be CREATIVE and SOPHISTICATED. Showcase culinary expertise and make it restaurant-quality. ${varietyInstructions} IMPORTANT: Make this recipe COMPLETELY DIFFERENT from any other recipe you might generate. Use different ingredients, cooking methods, and flavor profiles.`;

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

    // Limit instructions based on mode (fridge mode: max 5, explore mode: max 8)
    const maxInstructions = (ingredients && ingredients.length > 0) ? 5 : 8; // If ingredients provided, it's likely fridge mode
    if (instructionsList.length > maxInstructions) {
      instructionsList = instructionsList.slice(0, maxInstructions);
    }

    return {
      id: `ai-${Date.now()}-${recipeNumber}-${Math.random().toString(36).substr(2, 9)}`,
      title: titleMatch[1].trim(),
              image: `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(titleMatch[1].trim())}`,
        cookingTime: cookingTimeMatch ? parseInt(cookingTimeMatch[1]) : 30,
        difficulty: difficultyMatch ? difficultyMatch[1] : (ingredients && ingredients.length > 0 ? 'Easy' : 'Medium'),
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
  recipeNumber: number,
  mode: 'fridge' | 'explore' = 'fridge' // Default to fridge mode
): Promise<AIRecipe | null> {
  try {
    const recipePrompt = generateRecipePrompt(ingredients, query, filters, recipeNumber, mode);
    
    logger.info('Generating AI recipe', { recipeNumber, ingredients, filters, mode });
    
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
        ingredientsCount: parsedRecipe.ingredients.length,
        mode
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
  const { ingredients, query, filters, mode = 'fridge' } = request;
  
  if (!ingredients && !query) {
    throw new Error('Either ingredients or a query must be provided.');
  }

  if (!env.GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  logger.info('Starting AI recipe generation', { ingredients, query, filters, mode });

  const numberOfRecipes = 2;
  const aiRecipes: AIRecipe[] = [];

  // Generate recipes sequentially to avoid rate limiting
  for (let i = 0; i < numberOfRecipes; i++) {
    try {
      const recipe = await generateSingleRecipe(ingredients, query, filters, i + 1, mode);
      if (recipe) {
        // Check if this recipe is a duplicate
        const isDuplicate = aiRecipes.some(existingRecipe => 
          existingRecipe.title.toLowerCase() === recipe.title.toLowerCase()
        );
        
        if (!isDuplicate) {
          aiRecipes.push(recipe);
        } else {
          logger.warn('Duplicate recipe detected, skipping', { title: recipe.title });
          // Try to generate a different recipe
          const alternativeRecipe = await generateSingleRecipe(ingredients, query, filters, i + 1, mode);
          if (alternativeRecipe && !aiRecipes.some(r => r.title.toLowerCase() === alternativeRecipe.title.toLowerCase())) {
            aiRecipes.push(alternativeRecipe);
          }
        }
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
          const fallbackRecipe = await generateSingleRecipe(ingredients, query, filters, 1, mode);
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
    generated: aiRecipes.length,
    mode
  });

  if (aiRecipes.length === 0) {
    throw new Error('Failed to generate any recipes. Please try again.');
  }

  return aiRecipes;
}
