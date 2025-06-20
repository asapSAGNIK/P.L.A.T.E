import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { z } from 'zod';
import logger from '../config/logger';
import axios from 'axios';
import { env } from '../config/env';

const router = Router();

// Zod schema for request validation
const findByIngredientsSchema = z.object({
  ingredients: z.array(z.string().min(1)),
  filters: z.object({
    cuisine: z.string().optional(),
    diet: z.string().optional(),
    maxTime: z.number().optional(),
    difficulty: z.string().optional(),
  }).optional(),
});

// POST /recipes/find-by-ingredients
router.post('/find-by-ingredients', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { ingredients, filters } = findByIngredientsSchema.parse(req.body);
    if (!env.SPOONACULAR_API_KEY) {
      return res.status(500).json({ error: 'Spoonacular API key not configured' });
    }
    // Build Spoonacular API query
    const params: any = {
      ingredients: ingredients.join(','),
      number: 10,
      ranking: 1,
      ignorePantry: true,
      apiKey: env.SPOONACULAR_API_KEY,
    };
    if (filters?.cuisine) params.cuisine = filters.cuisine;
    if (filters?.diet) params.diet = filters.diet;
    if (filters?.maxTime) params.maxReadyTime = filters.maxTime;
    // Note: Spoonacular does not support difficulty directly

    // Call Spoonacular API
    const spoonacularUrl = 'https://api.spoonacular.com/recipes/findByIngredients';
    const response = await axios.get(spoonacularUrl, { params });
    // Optionally, fetch more details for each recipe (not done here for speed)
    res.json({ recipes: response.data });
  } catch (err: any) {
    logger.error('Error in POST /recipes/find-by-ingredients:', err);
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: err.errors });
    }
    if (err.response) {
      return res.status(err.response.status).json({ error: err.response.data || 'Spoonacular API error' });
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

router.post('/ai/commentary', authenticateToken, async (req: Request, res: Response) => {
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

router.post('/ai/twist', authenticateToken, async (req: Request, res: Response) => {
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

export default router; 