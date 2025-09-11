import { createClient } from './client'

export interface RecipeGenerationRequest {
  ingredients?: string[]
  query?: string
  mode?: 'fridge' | 'explore'
  filters?: {
    cuisine?: string
    diet?: string
    maxTime?: number
    difficulty?: string
    servings?: number
    mealType?: string
  }
}

export interface SaveRecipeRequest {
  title: string
  description?: string
  prep_time_minutes?: number
  cook_time_minutes?: number
  servings?: number
  cuisine?: string
  difficulty?: 'Easy' | 'Medium' | 'Hard'
  source: 'Spoonacular' | 'Gemini' | 'UserGenerated'
  original_recipe_id?: string
  image_url?: string
  instructions?: string
  ingredients?: any
  rating?: number
}

export interface CommentaryRequest {
  recipeTitle: string
  ingredients: string[]
  instructions: string
  type?: 'commentary' | 'twist'
}

export class SupabaseAPI {
  private supabase = createClient()
  
  constructor() {
    console.log('🔧 SupabaseAPI: Using Supabase Edge Functions only')
  }

  /**
   * Generate AI recipes using Supabase Edge Functions
   */
  async generateRecipes(data: RecipeGenerationRequest) {
    console.log('🔧 SupabaseAPI: Generating recipes via Edge Function...', data);
    
    try {
      const { data: result, error } = await this.supabase.functions.invoke('generate-recipes', {
        body: data
      })
      if (error) {
        console.error('❌ Edge Function error:', error);
        throw error;
      }
      console.log('✅ SupabaseAPI: Recipes generated successfully:', result);
      return result
    } catch (error: any) {
      console.error('❌ SupabaseAPI: Failed to generate recipes:', error);
      throw new Error(`Failed to generate recipes: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Save a recipe to user's collection
   */
  async saveRecipe(recipe: SaveRecipeRequest) {
    try {
      console.log('🔧 SupabaseAPI: Saving recipe via Edge Function...');
      const { data: result, error } = await this.supabase.functions.invoke('save-recipe', {
        body: recipe
      })
      if (error) {
        console.error('❌ Edge Function error:', error);
        throw error;
      }
      console.log('✅ SupabaseAPI: Recipe saved successfully:', result);
      return result
    } catch (error: any) {
      console.error('❌ SupabaseAPI: Failed to save recipe:', error);
      throw new Error(`Failed to save recipe: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Get user's saved recipes
   */
  async getSavedRecipes(status: string = 'saved', limit: number = 50, offset: number = 0) {
    try {
      console.log('🔧 SupabaseAPI: Getting saved recipes via Edge Function...');
      const { data: result, error } = await this.supabase.functions.invoke('get-saved-recipes', {
        body: { status, limit, offset }
      })
      if (error) {
        console.error('❌ Edge Function error:', error);
        throw error;
      }
      console.log('✅ SupabaseAPI: Saved recipes retrieved successfully:', result);
      return result
    } catch (error: any) {
      console.error('❌ SupabaseAPI: Failed to get saved recipes:', error);
      throw new Error(`Failed to get saved recipes: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Remove a recipe from user's collection
   */
  async removeRecipe(recipeId: string) {
    try {
      console.log('🔧 SupabaseAPI: Removing recipe via Edge Function...');
      const { data: result, error } = await this.supabase.functions.invoke('remove-recipe', {
        body: { recipeId }
      })
      if (error) {
        console.error('❌ Edge Function error:', error);
        throw error;
      }
      console.log('✅ SupabaseAPI: Recipe removed successfully:', result);
      return result
    } catch (error: any) {
      console.error('❌ SupabaseAPI: Failed to remove recipe:', error);
      throw new Error(`Failed to remove recipe: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Check if a recipe is saved by the current user
   */
  async checkIfRecipeIsSaved(recipeId: string): Promise<boolean> {
    try {
      console.log('🔧 SupabaseAPI: Checking if recipe is saved...');
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        console.log('🔧 SupabaseAPI: No user found');
        return false;
      }

      const { count, error } = await this.supabase
        .from('user_saved_recipes')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('recipe_id', recipeId);

      if (error) {
        console.error('❌ SupabaseAPI: Error checking saved recipe:', error);
        throw error;
      }
      
      const isSaved = (count || 0) > 0;
      console.log('✅ SupabaseAPI: Recipe saved status checked:', isSaved);
      return isSaved;
    } catch (error: any) {
      console.error('❌ SupabaseAPI: Failed to check if recipe is saved:', error);
      return false;
    }
  }

  /**
   * Check user's rate limit status
   */
  async checkRateLimit() {
    try {
      console.log('🔧 SupabaseAPI: Checking rate limit via Edge Function...');
      const { data: result, error } = await this.supabase.functions.invoke('check-rate-limit')
      if (error) {
        console.error('❌ Edge Function error:', error);
        throw error;
      }
      console.log('✅ SupabaseAPI: Rate limit checked successfully:', result);
      return result
    } catch (error: any) {
      console.error('❌ SupabaseAPI: Failed to check rate limit:', error);
      throw new Error(`Failed to check rate limit: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Get a single recipe by its ID
   */
  async getRecipeDetails(recipeId: string) {
    try {
      console.log('🔧 SupabaseAPI: Getting recipe details from database...', recipeId);
      
      // Check if this is an AI-generated recipe ID (starts with "ai-")
      if (recipeId.startsWith('ai-')) {
        console.log('🔧 SupabaseAPI: Detected AI-generated recipe, checking history...');
        
        // Get current user to filter history
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Query recipe_generation_history for AI recipes
        const { data: historyEntries, error: historyError } = await this.supabase
          .from('recipe_generation_history')
          .select('recipe_data')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (historyError) {
          console.error('❌ SupabaseAPI: Error fetching recipe history:', historyError);
          throw historyError;
        }

        // Find the recipe with matching ID in the history
        for (const entry of historyEntries || []) {
          if (entry.recipe_data && entry.recipe_data.id === recipeId) {
            const recipe = entry.recipe_data;
            console.log('✅ SupabaseAPI: AI recipe found in history:', recipe.title);
            
            // Transform AI recipe format to match database format
            return {
              id: recipe.id,
              title: recipe.title,
              description: recipe.description,
              prep_time_minutes: 0, // AI recipes don't have separate prep time
              cook_time_minutes: recipe.cookingTime,
              servings: recipe.servings,
              cuisine: 'AI Generated',
              difficulty: recipe.difficulty,
              source: 'Gemini',
              instructions: recipe.instructions,
              ingredients: recipe.ingredients,
              rating: recipe.rating
            };
          }
        }
        
        console.log('🔧 SupabaseAPI: AI recipe not found in history:', recipeId);
        return null;
      } else {
        // Regular UUID - query the recipes table
        console.log('🔧 SupabaseAPI: Detected UUID recipe, checking recipes table...');
        const { data: recipe, error } = await this.supabase
          .from('recipes')
          .select(`
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
            rating
          `)
          .eq('id', recipeId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') { // No rows found
            console.log('🔧 SupabaseAPI: Recipe not found:', recipeId);
            return null; // Recipe not found
          }
          console.error('❌ SupabaseAPI: Error fetching recipe details:', error);
          throw error;
        }
        console.log('✅ SupabaseAPI: Recipe details retrieved successfully:', recipe);
        return recipe;
      }
    } catch (error: any) {
      console.error('❌ SupabaseAPI: Failed to get recipe details:', error);
      throw new Error(`Failed to get recipe details: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Get user's recipe generation history
   */
  async getRecipeHistory(limit: number = 10) {
    try {
      console.log('🔧 SupabaseAPI: Getting recipe history via Edge Function...');
      const { data: result, error } = await this.supabase.functions.invoke('get-recipe-history', {
        body: { limit }
      })
      if (error) {
        console.error('Edge Function error:', error);
        throw error;
      }
      console.log('🔧 SupabaseAPI: Recipe history retrieved successfully:', result);
      return result
    } catch (error: any) {
      console.error('❌ SupabaseAPI: Failed to get recipe history:', error);
      throw new Error(`Failed to load recipe history: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Search recipes using Spoonacular API
   */
  async searchSpoonacularRecipes(data: RecipeGenerationRequest) {
    try {
      console.log('🔧 SupabaseAPI: Searching Spoonacular recipes via Edge Function...');
      const { data: result, error } = await this.supabase.functions.invoke('spoonacular-search', {
        body: data
      })
      if (error) {
        console.error('❌ Edge Function error:', error);
        throw error;
      }
      console.log('✅ SupabaseAPI: Spoonacular recipes retrieved successfully:', result);
      return result
    } catch (error: any) {
      console.error('❌ SupabaseAPI: Failed to search Spoonacular recipes:', error);
      throw new Error(`Failed to search recipes: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Generate AI commentary or twists
   */
  async generateAICommentary(data: CommentaryRequest) {
    try {
      console.log('🔧 SupabaseAPI: Generating AI commentary via Edge Function...');
      const { data: result, error } = await this.supabase.functions.invoke('ai-commentary', {
        body: data
      })
      if (error) {
        console.error('❌ Edge Function error:', error);
        throw error;
      }
      console.log('✅ SupabaseAPI: AI commentary generated successfully:', result);
      return result
    } catch (error: any) {
      console.error('❌ SupabaseAPI: Failed to generate AI commentary:', error);
      throw new Error(`Failed to generate AI commentary: ${error.message || 'Unknown error'}`);
    }
  }

}

// Export a singleton instance
export const supabaseAPI = new SupabaseAPI()
