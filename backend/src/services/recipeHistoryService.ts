import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import logger from '../config/logger';
import { AIRecipe } from './aiRecipeService';

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

export interface RecipeGenerationHistoryEntry {
  id: string;
  recipe_data: AIRecipe;
  mode: 'fridge' | 'explore';
  ingredients_used: string[];
  query_used?: string;
  filters?: any;
  generated_at: string;
}

export interface SaveGenerationHistoryRequest {
  userId: string;
  recipes: AIRecipe[];
  mode: 'fridge' | 'explore';
  ingredients?: string[];
  query?: string;
  filters?: any;
}

export interface SaveGenerationHistoryResponse {
  success: boolean;
  recipes?: AIRecipe[];
  error?: string;
}

/**
 * Save recipe generation history for a user with rolling history (max 10 recipes)
 */
export async function saveRecipeGenerationHistory(
  request: SaveGenerationHistoryRequest
): Promise<SaveGenerationHistoryResponse> {
  try {
    const { userId, recipes, mode, ingredients, query, filters } = request;
    const MAX_RECIPES = 10; // Keep only last 10 recipes (5 generations × 2 recipes each)

    logger.info('Saving recipe generation history with rolling cleanup', { 
      userId, 
      recipeCount: recipes.length, 
      mode,
      ingredients,
      query 
    });

    // Prepare history entries for each generated recipe
    const historyEntries = recipes.map(recipe => ({
      user_id: userId,
      recipe_data: recipe,
      mode,
      ingredients_used: ingredients || [],
      query_used: query || null,
      filters: filters || null,
      generated_at: new Date().toISOString()
    }));

    // Insert all history entries and get the IDs back
    const { data: insertedEntries, error } = await supabase
      .from('recipe_generation_history')
      .insert(historyEntries)
      .select('id, recipe_data');

    if (error) {
      logger.error('Error saving recipe generation history', { 
        error: error.message, 
        userId, 
        recipeCount: recipes.length 
      });
      return { success: false, error: `Failed to save generation history: ${error.message}` };
    }

    // After inserting new recipes, check if we need to clean up old ones
    const { data: allUserRecipes, error: countError } = await supabase
      .from('recipe_generation_history')
      .select('id, generated_at')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false });

    if (countError) {
      logger.error('Error checking recipe count for cleanup', { 
        error: countError.message, 
        userId 
      });
      // Don't fail the operation, just log the error
    } else if (allUserRecipes && allUserRecipes.length > MAX_RECIPES) {
      // Get the oldest recipes to delete (keep only the newest MAX_RECIPES)
      const recipesToDelete = allUserRecipes.slice(MAX_RECIPES);
      const idsToDelete = recipesToDelete.map(recipe => recipe.id);

      logger.info('Cleaning up old recipe history', { 
        userId, 
        totalRecipes: allUserRecipes.length,
        recipesToDelete: idsToDelete.length,
        keepingNewest: MAX_RECIPES
      });

      // Delete the oldest recipes
      const { error: deleteError } = await supabase
        .from('recipe_generation_history')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        logger.error('Error cleaning up old recipe history', { 
          error: deleteError.message, 
          userId,
          idsToDelete 
        });
        // Don't fail the operation, just log the error
      } else {
        logger.info('Successfully cleaned up old recipe history', { 
          userId, 
          deletedCount: idsToDelete.length,
          remainingCount: MAX_RECIPES
        });
      }
    }

    logger.info('Successfully saved recipe generation history with rolling cleanup', { 
      userId, 
      recipeCount: recipes.length, 
      mode,
      insertedIds: insertedEntries?.map(entry => entry.id)
    });

    // Return the recipes with their new database IDs
    const recipesWithDbIds = recipes.map((recipe, index) => ({
      ...recipe,
      id: insertedEntries?.[index]?.id || recipe.id // Use database ID if available, fallback to original
    }));

    return { success: true, recipes: recipesWithDbIds };
  } catch (error: any) {
    logger.error('Unexpected error saving recipe generation history', { 
      error: error?.message || 'Unknown error', 
      userId: request.userId,
      stack: error?.stack 
    });
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Get the last 10 generated recipes for a user (rolling history)
 */
export async function getUserRecipeGenerationHistory(
  userId: string,
  limit: number = 10
): Promise<{ success: boolean; history?: RecipeGenerationHistoryEntry[]; error?: string }> {
  try {
    logger.info('Fetching recipe generation history (rolling history)', { userId, limit });

    // Always fetch the latest recipes (rolling history maintains max 10)
    const { data, error } = await supabase
      .from('recipe_generation_history')
      .select('*')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Error fetching recipe generation history', { 
        error: error.message, 
        userId 
      });
      return { success: false, error: `Failed to fetch generation history: ${error.message}` };
    }

    // Transform the data to match our interface
    const history: RecipeGenerationHistoryEntry[] = (data || []).map(entry => ({
      id: entry.id,
      recipe_data: entry.recipe_data || {},
      mode: entry.mode || 'fridge',
      ingredients_used: entry.ingredients_used || [],
      query_used: entry.query_used || null,
      filters: entry.filters || null,
      generated_at: entry.generated_at || new Date().toISOString()
    }));

    logger.info('Successfully fetched recipe generation history (rolling history)', { 
      userId, 
      count: history.length,
      maxAllowed: 10
    });

    return { success: true, history };
  } catch (error: any) {
    logger.error('Unexpected error fetching recipe generation history', { 
      error: error?.message || 'Unknown error', 
      userId,
      stack: error?.stack 
    });
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Get recipe generation statistics for a user
 */
export async function getUserRecipeGenerationStats(
  userId: string
): Promise<{ success: boolean; stats?: any; error?: string }> {
  try {
    logger.info('Fetching recipe generation stats', { userId });

    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from('recipe_generation_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      logger.error('Error fetching total count', { error: countError.message, userId });
      return { success: false, error: `Failed to fetch stats: ${countError.message}` };
    }

    // Get count by mode
    const { data: modeData, error: modeError } = await supabase
      .from('recipe_generation_history')
      .select('mode')
      .eq('user_id', userId);

    if (modeError) {
      logger.error('Error fetching mode data', { error: modeError.message, userId });
      return { success: false, error: `Failed to fetch mode stats: ${modeError.message}` };
    }

    const modeStats = modeData.reduce((acc: any, entry) => {
      acc[entry.mode] = (acc[entry.mode] || 0) + 1;
      return acc;
    }, {});

    const stats = {
      total_generated: totalCount || 0,
      by_mode: modeStats,
      fridge_count: modeStats.fridge || 0,
      explore_count: modeStats.explore || 0,
      max_allowed: 10, // Rolling history limit
      is_rolling_history: true
    };

    logger.info('Successfully fetched recipe generation stats', { userId, stats });

    return { success: true, stats };
  } catch (error: any) {
    logger.error('Unexpected error fetching recipe generation stats', { 
      error: error?.message || 'Unknown error', 
      userId,
      stack: error?.stack 
    });
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Manually clean up old recipe history for a user (utility function)
 * This can be called independently if needed
 */
export async function cleanupOldRecipeHistory(
  userId: string,
  maxRecipes: number = 10
): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  try {
    logger.info('Manually cleaning up old recipe history', { userId, maxRecipes });

    // Get all user recipes ordered by generation date (newest first)
    const { data: allUserRecipes, error: fetchError } = await supabase
      .from('recipe_generation_history')
      .select('id, generated_at')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false });

    if (fetchError) {
      logger.error('Error fetching recipes for cleanup', { 
        error: fetchError.message, 
        userId 
      });
      return { success: false, error: `Failed to fetch recipes for cleanup: ${fetchError.message}` };
    }

    if (!allUserRecipes || allUserRecipes.length <= maxRecipes) {
      logger.info('No cleanup needed', { 
        userId, 
        currentCount: allUserRecipes?.length || 0,
        maxAllowed: maxRecipes 
      });
      return { success: true, deletedCount: 0 };
    }

    // Get the oldest recipes to delete (keep only the newest maxRecipes)
    const recipesToDelete = allUserRecipes.slice(maxRecipes);
    const idsToDelete = recipesToDelete.map(recipe => recipe.id);

    logger.info('Cleaning up old recipe history', { 
      userId, 
      totalRecipes: allUserRecipes.length,
      recipesToDelete: idsToDelete.length,
      keepingNewest: maxRecipes
    });

    // Delete the oldest recipes
    const { error: deleteError } = await supabase
      .from('recipe_generation_history')
      .delete()
      .in('id', idsToDelete);

    if (deleteError) {
      logger.error('Error cleaning up old recipe history', { 
        error: deleteError.message, 
        userId,
        idsToDelete 
      });
      return { success: false, error: `Failed to delete old recipes: ${deleteError.message}` };
    }

    logger.info('Successfully cleaned up old recipe history', { 
      userId, 
      deletedCount: idsToDelete.length,
      remainingCount: maxRecipes
    });

    return { success: true, deletedCount: idsToDelete.length };
  } catch (error: any) {
    logger.error('Unexpected error cleaning up recipe history', { 
      error: error?.message || 'Unknown error', 
      userId,
      stack: error?.stack 
    });
    return { success: false, error: 'Unexpected error occurred' };
  }
}
