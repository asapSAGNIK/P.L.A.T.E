import { Router, Request, Response } from 'express';
import { authenticateSupabaseToken } from '../middleware/supabase-auth';
import { z } from 'zod';
import logger from '../config/logger';
import axios from 'axios';
import { env } from '../config/env';
import { generateAIRecipes, RecipeGenerationRequest } from '../services/aiRecipeService';

const router = Router();

// Zod schema for request validation
const findByIngredientsSchema = z.object({
  ingredients: z.array(z.string().min(1)).optional(), // Made optional
  query: z.string().min(1).optional(), // Added for explore mode
  filters: z.object({
    cuisine: z.string().optional(),
    diet: z.string().optional(),
    maxTime: z.number().optional(),
    difficulty: z.string().optional(),
    servings: z.number().min(1).optional(),
    mealType: z.string().optional(), // Added mealType
  }).optional(),
});

// POST /recipes/find-by-ingredients - AI GENERATED RECIPES
router.post('/find-by-ingredients', authenticateSupabaseToken, async (req: Request, res: Response) => {
  try {
    const { ingredients, query, filters } = findByIngredientsSchema.parse(req.body);

    // Ensure at least one of ingredients or query is provided
    if (!ingredients && !query) {
      return res.status(400).json({ error: 'Either ingredients or a query must be provided.' });
    }

    logger.info('Starting AI recipe generation', { ingredients, query, filters });

    // Generate AI recipes using the service
    const aiRecipes = await generateAIRecipes({ ingredients, query, filters });

    logger.info('AI recipe generation completed', { 
      generated: aiRecipes.length,
      recipes: aiRecipes.map((r: any) => r.title)
    });

    res.json(aiRecipes);
  } catch (err: any) {
    logger.error('Error in POST /recipes/find-by-ingredients:', err);
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: err.errors });
    }
    if (err.message) {
      return res.status(500).json({ error: err.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Gemini AI Endpoints ---

const geminiCommentarySchema = z.object({
  recipeTitle: z.string().min(1),
  ingredients: z.array(z.string().min(1)),
  instructions: z.string().min(1),
});

router.post('/ai/commentary', authenticateSupabaseToken, async (req: Request, res: Response) => {
  try {
    if (!env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }
    const { recipeTitle, ingredients, instructions } = geminiCommentarySchema.parse(req.body);
    const prompt = `You are Gordon Ramsay. Give a witty, critical, and helpful commentary on this recipe.\nTitle: ${recipeTitle}\nIngredients: ${ingredients.join(', ')}\nInstructions: ${instructions}`;
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        params: { key: env.GEMINI_API_KEY },
      }
    );
    const aiText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No commentary generated.';
    res.json({ commentary: aiText });
  } catch (err) {
    logger.error('Error in POST /recipes/ai/commentary:', err);
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: err.errors });
    }
    if (axios.isAxiosError(err) && err.response) {
      return res.status(err.response.status).json({ error: err.response.data || 'Gemini API error' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

const geminiTwistSchema = z.object({
  recipeTitle: z.string().min(1),
  ingredients: z.array(z.string().min(1)),
  instructions: z.string().min(1),
});

router.post('/ai/twist', authenticateSupabaseToken, async (req: Request, res: Response) => {
  try {
    if (!env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }
    const { recipeTitle, ingredients, instructions } = geminiTwistSchema.parse(req.body);
    const prompt = `You are Gordon Ramsay. Suggest a creative twist or improvement for this recipe.\nTitle: ${recipeTitle}\nIngredients: ${ingredients.join(', ')}\nInstructions: ${instructions}`;
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        params: { key: env.GEMINI_API_KEY },
      }
    );
    const aiText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No twist generated.';
    res.json({ twist: aiText });
  } catch (err) {
    logger.error('Error in POST /recipes/ai/twist:', err);
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: err.errors });
    }
    if (axios.isAxiosError(err) && err.response) {
      return res.status(err.response.status).json({ error: err.response.data || 'Gemini API error' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Debug endpoint to test AI recipe generation without full auth (for testing only)
router.post('/debug/find-recipes', async (req: Request, res: Response) => {
  try {
    console.log('DEBUG: AI Recipe request received:', JSON.stringify(req.body, null, 2));
    
    const { ingredients, query, filters } = findByIngredientsSchema.parse(req.body);

    if (!ingredients && !query) {
      return res.status(400).json({ error: 'Either ingredients or a query must be provided.' });
    }

    if (!env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    console.log('DEBUG: Generating AI recipes with:', { ingredients, query, filters });

    // Generate AI recipes using the service
    const aiRecipes = await generateAIRecipes({ ingredients, query, filters });

    console.log('DEBUG: AI recipes generated:', {
      count: aiRecipes.length,
      recipes: aiRecipes.map((r: any) => ({ title: r.title, ingredients: r.ingredients.length }))
    });

    res.json(aiRecipes);
  } catch (err: any) {
    console.error('DEBUG: AI Recipe generation error:', err);
    logger.error('Error in DEBUG /recipes/debug/find-recipes:', err);
    res.status(500).json({ error: 'Debug AI recipe generation failed', details: err.message });
  }
});

// GET /recipes/:id - Get individual AI recipe details (for AI-generated recipes)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const recipeId = req.params.id;
    
    console.log('DEBUG: Fetching AI recipe details for ID:', recipeId);

    // For AI-generated recipes, we don't have external API details
    // Return a generic response for now
    const aiRecipe = {
      id: recipeId,
      title: 'AI Generated Recipe',
      image: '/placeholder.svg?height=200&width=300&text=AI+Recipe',
      cookingTime: 30,
      difficulty: 'Medium',
      ingredients: ['Ingredient 1', 'Ingredient 2', 'Ingredient 3'],
      description: 'This is an AI-generated recipe. The full details are available in the recipe list.',
      rating: 4,
      servings: 2,
      instructions: 'This is an AI-generated recipe. Please refer to the recipe list for full instructions.',
      isAIGenerated: true
    };

    res.json(aiRecipe);
  } catch (err: any) {
    console.error('DEBUG: AI Recipe details error:', err);
    logger.error('Error in GET /recipes/:id:', err);
    res.status(500).json({ error: 'Failed to fetch AI recipe details', details: err.message });
  }
});

export default router;
