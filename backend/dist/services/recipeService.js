"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveRecipeForUser = saveRecipeForUser;
exports.getUserSavedRecipes = getUserSavedRecipes;
exports.removeSavedRecipe = removeSavedRecipe;
exports.checkIfRecipeSaved = checkIfRecipeSaved;
exports.convertAIRecipeToSaveRequest = convertAIRecipeToSaveRequest;
const supabase_js_1 = require("@supabase/supabase-js");
const env_1 = require("../config/env");
const logger_1 = __importDefault(require("../config/logger"));
// Create Supabase client
const supabase = (0, supabase_js_1.createClient)(env_1.env.SUPABASE_URL, env_1.env.SUPABASE_SERVICE_ROLE_KEY);
/**
 * Save a recipe for a user
 */
async function saveRecipeForUser(userId, recipeData) {
    try {
        logger_1.default.info('Saving recipe for user', {
            userId,
            recipeTitle: recipeData.title,
            source: recipeData.source,
            originalRecipeId: recipeData.original_recipe_id
        });
        // Validate required fields
        if (!recipeData.title || !recipeData.source) {
            logger_1.default.error('Missing required fields', { recipeData });
            return { success: false, error: 'Missing required fields: title and source are required' };
        }
        // Prepare recipe data for database insertion
        const dbRecipeData = {
            ...recipeData,
            // Ensure ingredients is properly formatted as JSONB
            ingredients: Array.isArray(recipeData.ingredients)
                ? recipeData.ingredients
                : (typeof recipeData.ingredients === 'string'
                    ? JSON.parse(recipeData.ingredients)
                    : recipeData.ingredients),
            // Ensure rating is a number
            rating: typeof recipeData.rating === 'number' ? recipeData.rating : 4.0
        };
        // First, check if recipe already exists
        let recipeId;
        if (recipeData.original_recipe_id) {
            // Check if recipe with this original_recipe_id already exists
            const { data: existingRecipe, error: findError } = await supabase
                .from('recipes')
                .select('id')
                .eq('original_recipe_id', recipeData.original_recipe_id)
                .single();
            if (findError && findError.code !== 'PGRST116') {
                logger_1.default.error('Error finding existing recipe', {
                    error: findError,
                    originalRecipeId: recipeData.original_recipe_id
                });
                return { success: false, error: 'Failed to check for existing recipe' };
            }
            if (existingRecipe) {
                recipeId = existingRecipe.id;
                logger_1.default.info('Using existing recipe', { recipeId, originalRecipeId: recipeData.original_recipe_id });
            }
            else {
                // Create new recipe
                const { data: newRecipe, error: createError } = await supabase
                    .from('recipes')
                    .insert(dbRecipeData)
                    .select('id')
                    .single();
                if (createError) {
                    logger_1.default.error('Error creating recipe', {
                        error: createError,
                        recipeData: dbRecipeData,
                        originalRecipeId: recipeData.original_recipe_id
                    });
                    return { success: false, error: `Failed to create recipe: ${createError.message}` };
                }
                recipeId = newRecipe.id;
                logger_1.default.info('Created new recipe', { recipeId, originalRecipeId: recipeData.original_recipe_id });
            }
        }
        else {
            // Create new recipe without original_recipe_id
            const { data: newRecipe, error: createError } = await supabase
                .from('recipes')
                .insert(dbRecipeData)
                .select('id')
                .single();
            if (createError) {
                logger_1.default.error('Error creating recipe', {
                    error: createError,
                    recipeData: dbRecipeData
                });
                return { success: false, error: `Failed to create recipe: ${createError.message}` };
            }
            recipeId = newRecipe.id;
            logger_1.default.info('Created new recipe', { recipeId });
        }
        // Check if user has already saved this recipe
        const { data: existingSaved, error: checkError } = await supabase
            .from('user_saved_recipes')
            .select('id')
            .eq('user_id', userId)
            .eq('recipe_id', recipeId)
            .maybeSingle(); // Use maybeSingle instead of single to handle no results gracefully
        if (checkError) {
            logger_1.default.error('Error checking existing saved recipe', { error: checkError });
            return { success: false, error: 'Failed to check existing saved recipe' };
        }
        if (existingSaved) {
            logger_1.default.info('Recipe already saved by user', { userId, recipeId });
            return { success: true, recipeId };
        }
        // Save recipe for user
        const { data: savedRecipe, error: saveError } = await supabase
            .from('user_saved_recipes')
            .insert({
            user_id: userId,
            recipe_id: recipeId,
            status: 'saved'
        })
            .select('id')
            .single();
        if (saveError) {
            // Handle unique constraint violation (user already saved this recipe)
            if (saveError.code === '23505') {
                logger_1.default.info('Recipe already saved by user (unique constraint)', { userId, recipeId });
                return { success: true, recipeId };
            }
            logger_1.default.error('Error saving recipe for user', { error: saveError });
            return { success: false, error: 'Failed to save recipe' };
        }
        logger_1.default.info('Successfully saved recipe for user', { userId, recipeId, savedRecipeId: savedRecipe.id });
        return { success: true, recipeId };
    }
    catch (error) {
        logger_1.default.error('Unexpected error saving recipe', { error, userId });
        return { success: false, error: 'Unexpected error occurred' };
    }
}
/**
 * Get user's saved recipes
 */
async function getUserSavedRecipes(userId) {
    try {
        logger_1.default.info('Fetching saved recipes for user', { userId });
        const { data: savedRecipes, error } = await supabase
            .from('user_saved_recipes')
            .select(`
        id,
        user_id,
        recipe_id,
        status,
        notes,
        rating,
        last_cooked_at,
        created_at,
        updated_at,
        recipe:recipes(
          id,
          title,
          description,
          prep_time_minutes,
          cook_time_minutes,
          servings,
          cuisine,
          difficulty,
          source,
          instructions,
          ingredients,
          rating,
          created_at
        )
      `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) {
            logger_1.default.error('Error fetching saved recipes', { error, userId });
            return { success: false, error: 'Failed to fetch saved recipes' };
        }
        // Transform the data to match SavedRecipe interface
        const transformedRecipes = (savedRecipes || []).map((item) => ({
            ...item,
            recipe: Array.isArray(item.recipe) ? item.recipe[0] : item.recipe
        }));
        logger_1.default.info('Successfully fetched saved recipes', { userId, count: transformedRecipes.length });
        return { success: true, recipes: transformedRecipes };
    }
    catch (error) {
        logger_1.default.error('Unexpected error fetching saved recipes', { error, userId });
        return { success: false, error: 'Unexpected error occurred' };
    }
}
/**
 * Remove a saved recipe for a user
 */
async function removeSavedRecipe(userId, recipeId) {
    try {
        logger_1.default.info('Removing saved recipe for user', { userId, recipeId });
        const { error } = await supabase
            .from('user_saved_recipes')
            .delete()
            .eq('user_id', userId)
            .eq('recipe_id', recipeId);
        if (error) {
            logger_1.default.error('Error removing saved recipe', { error, userId, recipeId });
            return { success: false, error: 'Failed to remove saved recipe' };
        }
        logger_1.default.info('Successfully removed saved recipe', { userId, recipeId });
        return { success: true };
    }
    catch (error) {
        logger_1.default.error('Unexpected error removing saved recipe', { error, userId, recipeId });
        return { success: false, error: 'Unexpected error occurred' };
    }
}
/**
 * Check if a recipe is saved by a user
 */
async function checkIfRecipeSaved(userId, recipeId) {
    try {
        const { data, error } = await supabase
            .from('user_saved_recipes')
            .select('id')
            .eq('user_id', userId)
            .eq('recipe_id', recipeId)
            .single();
        if (error && error.code !== 'PGRST116') {
            logger_1.default.error('Error checking if recipe is saved', { error, userId, recipeId });
            return { success: false, error: 'Failed to check recipe status' };
        }
        return { success: true, isSaved: !!data };
    }
    catch (error) {
        logger_1.default.error('Unexpected error checking recipe status', { error, userId, recipeId });
        return { success: false, error: 'Unexpected error occurred' };
    }
}
/**
 * Convert AIRecipe to SaveRecipeRequest format
 */
function convertAIRecipeToSaveRequest(aiRecipe) {
    return {
        title: aiRecipe.title,
        description: aiRecipe.description,
        prep_time_minutes: undefined, // AI recipes don't separate prep/cook time
        cook_time_minutes: aiRecipe.cookingTime,
        servings: aiRecipe.servings,
        cuisine: undefined, // Not provided in AI recipes
        difficulty: aiRecipe.difficulty,
        source: 'Gemini',
        original_recipe_id: aiRecipe.id, // Use AI recipe ID as original_recipe_id
        instructions: aiRecipe.instructions,
        ingredients: aiRecipe.ingredients,
        rating: aiRecipe.rating
    };
}
//# sourceMappingURL=recipeService.js.map