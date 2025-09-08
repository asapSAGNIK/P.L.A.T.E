"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_auth_1 = require("../middleware/supabase-auth");
const rateLimit_1 = require("../middleware/rateLimit");
const zod_1 = require("zod");
const logger_1 = __importDefault(require("../config/logger"));
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
const aiRecipeService_1 = require("../services/aiRecipeService");
const recipeService_1 = require("../services/recipeService");
const supabase_js_1 = require("@supabase/supabase-js");
// Create Supabase client
const supabase = (0, supabase_js_1.createClient)(env_1.env.SUPABASE_URL, env_1.env.SUPABASE_SERVICE_ROLE_KEY);
const router = (0, express_1.Router)();
// Zod schema for request validation
const findByIngredientsSchema = zod_1.z.object({
    ingredients: zod_1.z.array(zod_1.z.string().min(1)).optional(), // Made optional
    query: zod_1.z.string().min(1).optional(), // Added for explore mode
    mode: zod_1.z.enum(['fridge', 'explore']).optional().default('fridge'), // Add mode parameter
    filters: zod_1.z.object({
        cuisine: zod_1.z.string().optional(),
        diet: zod_1.z.string().optional(),
        maxTime: zod_1.z.number().optional(),
        difficulty: zod_1.z.string().optional(),
        servings: zod_1.z.number().min(1).optional(),
        mealType: zod_1.z.string().optional(), // Added mealType
    }).optional(),
});
// Zod schema for save recipe validation
const saveRecipeSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required'),
    description: zod_1.z.string().optional(),
    prep_time_minutes: zod_1.z.number().optional(),
    cook_time_minutes: zod_1.z.number().optional(),
    servings: zod_1.z.number().min(1).optional(),
    cuisine: zod_1.z.string().optional(),
    difficulty: zod_1.z.enum(['Easy', 'Medium', 'Hard']).optional(),
    source: zod_1.z.enum(['Spoonacular', 'Gemini', 'UserGenerated']),
    original_recipe_id: zod_1.z.string().optional(),
    instructions: zod_1.z.string().optional(),
    ingredients: zod_1.z.union([zod_1.z.array(zod_1.z.string()), zod_1.z.string()]).optional(), // Can be array or JSON string
    rating: zod_1.z.number().min(1).max(5).optional(),
});
// POST /recipes/find-by-ingredients - AI GENERATED RECIPES with Rate Limiting
router.post('/find-by-ingredients', supabase_auth_1.authenticateSupabaseToken, ...(0, rateLimit_1.enforceRateLimit)({ maxRequestsPerDay: 20 }), // 20 requests per day
async (req, res) => {
    try {
        const { ingredients, query, filters, mode } = findByIngredientsSchema.parse(req.body);
        // Ensure at least one of ingredients or query is provided
        if (!ingredients && !query) {
            return res.status(400).json({ error: 'Either ingredients or a query must be provided.' });
        }
        logger_1.default.info('Starting AI recipe generation', {
            ingredients,
            query,
            filters,
            mode,
            userId: req.user?.userId,
            rateLimitRemaining: req.rateLimit?.remaining
        });
        // Generate AI recipes using the service
        const aiRecipes = await (0, aiRecipeService_1.generateAIRecipes)({ ingredients, query, filters, mode });
        // Save recipe generation history and get recipes with database IDs
        let finalRecipes = aiRecipes;
        if (aiRecipes.length > 0) {
            const { saveRecipeGenerationHistory } = await Promise.resolve().then(() => __importStar(require('../services/recipeHistoryService')));
            const historyResult = await saveRecipeGenerationHistory({
                userId: req.user.userId,
                recipes: aiRecipes,
                mode,
                ingredients,
                query,
                filters
            });
            // Use recipes with database IDs if available
            if (historyResult.success && historyResult.recipes) {
                finalRecipes = historyResult.recipes;
            }
        }
        // Get current rate limit status after increment
        const { getUserRateLimitStatus } = await Promise.resolve().then(() => __importStar(require('../services/rateLimitService')));
        const currentRateLimit = await getUserRateLimitStatus(req.user.userId);
        logger_1.default.info('AI recipe generation completed', {
            generated: finalRecipes.length,
            recipes: finalRecipes.map((r) => r.title),
            mode,
            userId: req.user?.userId,
            oldRateLimitRemaining: req.rateLimit?.remaining,
            newRateLimitRemaining: currentRateLimit.remaining
        });
        // Include rate limit info in response
        const response = {
            recipes: finalRecipes,
            rateLimit: {
                remaining: currentRateLimit.remaining,
                resetTime: currentRateLimit.resetTime.toISOString(),
                limit: currentRateLimit.maxRequests
            }
        };
        res.json(response);
    }
    catch (err) {
        logger_1.default.error('Error in POST /recipes/find-by-ingredients:', err);
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: err.errors });
        }
        if (err.message) {
            return res.status(500).json({ error: err.message });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});
// --- Gemini AI Endpoints ---
const geminiCommentarySchema = zod_1.z.object({
    recipeTitle: zod_1.z.string().min(1),
    ingredients: zod_1.z.array(zod_1.z.string().min(1)),
    instructions: zod_1.z.string().min(1),
});
router.post('/ai/commentary', supabase_auth_1.authenticateSupabaseToken, async (req, res) => {
    try {
        if (!env_1.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Gemini API key not configured' });
        }
        const { recipeTitle, ingredients, instructions } = geminiCommentarySchema.parse(req.body);
        const prompt = `You are Gordon Ramsay. Give a witty, critical, and helpful commentary on this recipe.\nTitle: ${recipeTitle}\nIngredients: ${ingredients.join(', ')}\nInstructions: ${instructions}`;
        const response = await axios_1.default.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
            contents: [{ parts: [{ text: prompt }] }],
        }, {
            params: { key: env_1.env.GEMINI_API_KEY },
        });
        const aiText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No commentary generated.';
        res.json({ commentary: aiText });
    }
    catch (err) {
        logger_1.default.error('Error in POST /recipes/ai/commentary:', err);
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: err.errors });
        }
        if (axios_1.default.isAxiosError(err) && err.response) {
            return res.status(err.response.status).json({ error: err.response.data || 'Gemini API error' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});
const geminiTwistSchema = zod_1.z.object({
    recipeTitle: zod_1.z.string().min(1),
    ingredients: zod_1.z.array(zod_1.z.string().min(1)),
    instructions: zod_1.z.string().min(1),
});
router.post('/ai/twist', supabase_auth_1.authenticateSupabaseToken, async (req, res) => {
    try {
        if (!env_1.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Gemini API key not configured' });
        }
        const { recipeTitle, ingredients, instructions } = geminiTwistSchema.parse(req.body);
        const prompt = `You are Gordon Ramsay. Suggest a creative twist or improvement for this recipe.\nTitle: ${recipeTitle}\nIngredients: ${ingredients.join(', ')}\nInstructions: ${instructions}`;
        const response = await axios_1.default.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
            contents: [{ parts: [{ text: prompt }] }],
        }, {
            params: { key: env_1.env.GEMINI_API_KEY },
        });
        const aiText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No twist generated.';
        res.json({ twist: aiText });
    }
    catch (err) {
        logger_1.default.error('Error in POST /recipes/ai/twist:', err);
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: err.errors });
        }
        if (axios_1.default.isAxiosError(err) && err.response) {
            return res.status(err.response.status).json({ error: err.response.data || 'Gemini API error' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Debug endpoint to test AI recipe generation without full auth (for testing only)
router.post('/debug/find-recipes', async (req, res) => {
    try {
        console.log('DEBUG: AI Recipe request received:', JSON.stringify(req.body, null, 2));
        const { ingredients, query, filters } = findByIngredientsSchema.parse(req.body);
        if (!ingredients && !query) {
            return res.status(400).json({ error: 'Either ingredients or a query must be provided.' });
        }
        if (!env_1.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Gemini API key not configured' });
        }
        console.log('DEBUG: Generating AI recipes with:', { ingredients, query, filters });
        // Generate AI recipes using the service
        const aiRecipes = await (0, aiRecipeService_1.generateAIRecipes)({ ingredients, query, filters });
        console.log('DEBUG: AI recipes generated:', {
            count: aiRecipes.length,
            recipes: aiRecipes.map((r) => ({ title: r.title, ingredients: r.ingredients.length }))
        });
        res.json(aiRecipes);
    }
    catch (err) {
        console.error('DEBUG: AI Recipe generation error:', err);
        logger_1.default.error('Error in DEBUG /recipes/debug/find-recipes:', err);
        res.status(500).json({ error: 'Debug AI recipe generation failed', details: err.message });
    }
});
// --- Recipe Saving Endpoints ---
// POST /recipes/save - Save a recipe for the user
router.post('/save', supabase_auth_1.authenticateSupabaseToken, async (req, res) => {
    try {
        if (!req.user?.userId) {
            logger_1.default.warn('Unauthenticated save recipe attempt');
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Validate request body using Zod schema
        const validationResult = saveRecipeSchema.safeParse(req.body);
        if (!validationResult.success) {
            logger_1.default.warn('Invalid recipe data format', {
                errors: validationResult.error.errors,
                userId: req.user.userId
            });
            return res.status(400).json({
                error: 'Invalid recipe data format',
                details: validationResult.error.errors
            });
        }
        const recipeData = validationResult.data;
        logger_1.default.info('Saving recipe for user', {
            userId: req.user.userId,
            recipeTitle: recipeData.title,
            source: recipeData.source,
            hasIngredients: !!recipeData.ingredients,
            ingredientsCount: Array.isArray(recipeData.ingredients) ? recipeData.ingredients.length : 'not array'
        });
        const result = await (0, recipeService_1.saveRecipeForUser)(req.user.userId, recipeData);
        if (!result.success) {
            logger_1.default.error('Failed to save recipe', {
                userId: req.user.userId,
                error: result.error,
                recipeTitle: recipeData.title
            });
            return res.status(500).json({ error: result.error });
        }
        logger_1.default.info('Successfully saved recipe', {
            userId: req.user.userId,
            recipeId: result.recipeId,
            recipeTitle: recipeData.title
        });
        res.json({
            success: true,
            message: 'Recipe saved successfully',
            recipeId: result.recipeId
        });
    }
    catch (err) {
        logger_1.default.error('Unexpected error in POST /recipes/save:', {
            error: err.message,
            stack: err.stack,
            userId: req.user?.userId,
            recipeData: req.body
        });
        res.status(500).json({ error: 'Internal server error occurred while saving recipe' });
    }
});
// GET /recipes/history - Get user's recipe generation history
router.get('/history', supabase_auth_1.authenticateSupabaseToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        logger_1.default.info('Fetching recipe generation history', {
            userId: req.user?.userId,
            limit
        });
        const { getUserRecipeGenerationHistory } = await Promise.resolve().then(() => __importStar(require('../services/recipeHistoryService')));
        const result = await getUserRecipeGenerationHistory(req.user.userId, limit);
        if (!result.success) {
            logger_1.default.error('Failed to fetch recipe generation history', {
                error: result.error,
                userId: req.user?.userId
            });
            return res.status(500).json({ error: result.error || 'Failed to fetch recipe history' });
        }
        logger_1.default.info('Successfully fetched recipe generation history', {
            userId: req.user?.userId,
            count: result.history?.length || 0
        });
        res.json(result.history || []);
    }
    catch (err) {
        logger_1.default.error('Error fetching recipe generation history', {
            error: err.message,
            userId: req.user?.userId
        });
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /recipes/saved - Get user's saved recipes
router.get('/saved', supabase_auth_1.authenticateSupabaseToken, async (req, res) => {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        logger_1.default.info('Fetching saved recipes for user', { userId: req.user.userId });
        const result = await (0, recipeService_1.getUserSavedRecipes)(req.user.userId);
        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }
        res.json(result.recipes || []);
    }
    catch (err) {
        logger_1.default.error('Error in GET /recipes/saved:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /recipes/:id - Get individual recipe details
router.get('/:id', async (req, res) => {
    try {
        const recipeId = req.params.id;
        logger_1.default.info('Fetching recipe details', { recipeId });
        // First try to find the recipe in the saved recipes table
        const { data: savedRecipe, error: savedError } = await supabase
            .from('recipes')
            .select('*')
            .eq('id', recipeId)
            .single();
        if (savedRecipe && !savedError) {
            // Recipe found in saved recipes - return it with proper formatting
            const formattedRecipe = {
                id: savedRecipe.id,
                title: savedRecipe.title,
                description: savedRecipe.description,
                cookingTime: savedRecipe.cook_time_minutes || 30,
                difficulty: savedRecipe.difficulty || 'Medium',
                rating: savedRecipe.rating || 4,
                servings: savedRecipe.servings || 2,
                ingredients: Array.isArray(savedRecipe.ingredients) ? savedRecipe.ingredients : [],
                instructions: savedRecipe.instructions || 'No instructions available',
                image: savedRecipe.image_url || '/placeholder.svg?height=200&width=300&text=Recipe',
                isAIGenerated: savedRecipe.source === 'Gemini'
            };
            logger_1.default.info('Successfully fetched saved recipe from database', { recipeId, title: savedRecipe.title });
            return res.json(formattedRecipe);
        }
        // If not found in saved recipes, try to find in recipe generation history by database ID
        const { data: historyEntries, error: historyError } = await supabase
            .from('recipe_generation_history')
            .select('*')
            .eq('id', recipeId)
            .single();
        if (historyEntries && !historyError) {
            // Recipe found in generation history by database ID - return it with proper formatting
            const recipeData = historyEntries.recipe_data;
            const formattedRecipe = {
                id: historyEntries.id,
                title: recipeData.title,
                description: recipeData.description,
                cookingTime: recipeData.cookingTime || 30,
                difficulty: recipeData.difficulty || 'Medium',
                rating: recipeData.rating || 4,
                servings: recipeData.servings || 2,
                ingredients: recipeData.ingredients || [],
                instructions: recipeData.instructions || 'No instructions available',
                image: recipeData.image || '/placeholder.svg?height=200&width=300&text=AI+Recipe',
                isAIGenerated: true,
                mode: historyEntries.mode,
                generatedAt: historyEntries.generated_at
            };
            logger_1.default.info('Successfully fetched AI recipe from generation history by database ID', { recipeId, title: recipeData.title });
            return res.json(formattedRecipe);
        }
        // If not found by database ID, try to find by original recipe ID in recipe_data
        // This handles cases where the frontend is using the original AI-generated recipe ID
        const { data: historyByOriginalId, error: historyByOriginalIdError } = await supabase
            .from('recipe_generation_history')
            .select('*')
            .contains('recipe_data', { id: recipeId })
            .single();
        if (historyByOriginalId && !historyByOriginalIdError) {
            // Recipe found in generation history by original recipe ID - return it with proper formatting
            const recipeData = historyByOriginalId.recipe_data;
            const formattedRecipe = {
                id: historyByOriginalId.id, // Use the database ID as the primary ID
                originalId: recipeData.id, // Keep the original ID for reference
                title: recipeData.title,
                description: recipeData.description,
                cookingTime: recipeData.cookingTime || 30,
                difficulty: recipeData.difficulty || 'Medium',
                rating: recipeData.rating || 4,
                servings: recipeData.servings || 2,
                ingredients: recipeData.ingredients || [],
                instructions: recipeData.instructions || 'No instructions available',
                image: recipeData.image || '/placeholder.svg?height=200&width=300&text=AI+Recipe',
                isAIGenerated: true,
                mode: historyByOriginalId.mode,
                generatedAt: historyByOriginalId.generated_at
            };
            logger_1.default.info('Successfully fetched AI recipe from generation history by original recipe ID', {
                recipeId,
                databaseId: historyByOriginalId.id,
                title: recipeData.title
            });
            return res.json(formattedRecipe);
        }
        // Recipe not found anywhere
        logger_1.default.warn('Recipe not found in database or generation history', { recipeId });
        return res.status(404).json({ error: 'Recipe not found' });
    }
    catch (err) {
        logger_1.default.error('Error in GET /recipes/:id:', err);
        res.status(500).json({ error: 'Failed to fetch recipe details', details: err.message });
    }
});
// DELETE /recipes/saved/:recipeId - Remove saved recipe
router.delete('/saved/:recipeId', supabase_auth_1.authenticateSupabaseToken, async (req, res) => {
    try {
        const { recipeId } = req.params;
        if (!req.user?.userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        logger_1.default.info('Removing saved recipe for user', { userId: req.user.userId, recipeId });
        const result = await (0, recipeService_1.removeSavedRecipe)(req.user.userId, recipeId);
        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }
        res.json({
            success: true,
            message: 'Recipe removed from saved recipes'
        });
    }
    catch (err) {
        logger_1.default.error('Error in DELETE /recipes/saved/:recipeId:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /recipes/saved/check/:recipeId - Check if recipe is saved
router.get('/saved/check/:recipeId', supabase_auth_1.authenticateSupabaseToken, async (req, res) => {
    try {
        const { recipeId } = req.params;
        if (!req.user?.userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const result = await (0, recipeService_1.checkIfRecipeSaved)(req.user.userId, recipeId);
        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }
        res.json({
            isSaved: result.isSaved || false
        });
    }
    catch (err) {
        logger_1.default.error('Error in GET /recipes/saved/check/:recipeId:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /recipes/history/cleanup - Manually trigger cleanup of old recipe history
router.post('/history/cleanup', supabase_auth_1.authenticateSupabaseToken, async (req, res) => {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const maxRecipes = parseInt(req.body.maxRecipes) || 10;
        logger_1.default.info('Manual cleanup requested', {
            userId: req.user.userId,
            maxRecipes
        });
        const { cleanupOldRecipeHistory } = await Promise.resolve().then(() => __importStar(require('../services/recipeHistoryService')));
        const result = await cleanupOldRecipeHistory(req.user.userId, maxRecipes);
        if (!result.success) {
            logger_1.default.error('Failed to cleanup recipe history', {
                error: result.error,
                userId: req.user.userId
            });
            return res.status(500).json({ error: result.error || 'Failed to cleanup recipe history' });
        }
        logger_1.default.info('Successfully completed manual cleanup', {
            userId: req.user.userId,
            deletedCount: result.deletedCount
        });
        res.json({
            success: true,
            message: 'Recipe history cleanup completed',
            deletedCount: result.deletedCount || 0
        });
    }
    catch (err) {
        logger_1.default.error('Error in POST /recipes/history/cleanup:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=recipes.js.map