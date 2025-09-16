"use client"

import React, { useEffect, useState, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Clock, Users, Star, ChefHat, Loader2, Bookmark, BookmarkCheck, Trash, FlaskConical, BookOpen } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from '@/lib/supabase/client'
import { supabaseAPI } from '@/lib/supabase/api' // Import supabaseAPI

interface RecipeDetails {
  id: string;
  title: string;
  description: string;
  cookingTime: number;
  prepTime: number;
  servings: number;
  cuisine: string;
  difficulty: string;
  source: string;
  instructions: string;
  ingredients: string[]; // Changed to string[] as we format them on fetch
  rating: number;
}

function RecipeDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [recipe, setRecipe] = useState<RecipeDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const id = params?.id as string; // Get ID from useParams

  const getBackUrl = () => {
    const referrer = searchParams?.get('from');
    if (referrer === 'history') return '/history';
    if (referrer === 'saved') return '/saved';
    if (referrer === 'recipes') return '/recipes';
    return '/find-recipes';
  };

  const getBackText = () => {
    const referrer = searchParams?.get('from');
    if (referrer === 'history') return 'Back to Cooking History';
    if (referrer === 'saved') return 'Back to Saved Recipes';
    if (referrer === 'recipes') return 'Back to Recipe Results';
    return 'Back to Find Recipes';
  };

  useEffect(() => {
    const fetchRecipe = async (recipeId: string) => {
      setIsLoading(true);
      try {
        console.log('DEBUG: Fetching recipe with ID:', recipeId);
        const recipeData = await supabaseAPI.getRecipeDetails(recipeId);

        if (recipeData) {
          setRecipe({
            id: recipeData.id,
            title: recipeData.title,
            description: recipeData.description || '',
            cookingTime: recipeData.cook_time_minutes || 0,
            prepTime: recipeData.prep_time_minutes || 0,
            servings: recipeData.servings || 0,
            cuisine: recipeData.cuisine || '',
            difficulty: recipeData.difficulty || '',
            source: recipeData.source || '',
            instructions: recipeData.instructions || '',
            ingredients: Array.isArray(recipeData.ingredients) 
              ? recipeData.ingredients.map((ing: any) => 
                  (typeof ing === 'string' ? ing : `${ing.amount || ''} ${ing.unit || ''} ${ing.name || ''}`).trim()
                ) 
              : [],
            rating: recipeData.rating || 4.0,
          });
        } else {
          setError('Recipe not found or failed to load.');
          toast({
            title: "Error",
            description: "Recipe not found.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('DEBUG: Recipe fetch error:', error);
        setError('Failed to load recipe. Please try again.');
        toast({
          title: "Error",
          description: "Failed to load recipe details.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchRecipe(id);
    }
  }, [id, toast]); // Add toast to dependency array

  const handleDeleteRecipe = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to delete recipes.",
          variant: "destructive",
        });
        return;
      }
      
      if (!recipe?.id) {
        toast({
          title: "Error",
          description: "Recipe ID not found.",
          variant: "destructive",
        });
        return;
      }

      // Use Supabase API to remove recipe
      await supabaseAPI.removeRecipe(recipe.id);

      toast({
        title: "Recipe Deleted",
        description: "Recipe has been successfully deleted.",
      });
      router.push(getBackUrl());
    } catch (error) {
      console.error('Error deleting recipe:', error);
      toast({
        title: "Error",
        description: "Failed to delete recipe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen ">
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="flex h-16 items-center px-4 gap-4">
            <Link href={getBackUrl()} className="flex items-center gap-2 text-gray-700 hover:text-orange-600">
              <ArrowLeft className="h-5 w-5" />
              <span className="text-base font-medium">{getBackText()}</span>
            </Link>
            <div className="flex-1"></div>
          </div>
        </header>
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto" />
                <p className="text-lg font-medium text-gray-600">Cooking up the recipe details... 👨‍🍳</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen ">
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="flex h-16 items-center px-4 gap-4">
            <Link href={getBackUrl()} className="flex items-center gap-2 text-gray-700 hover:text-orange-600">
              <ArrowLeft className="h-5 w-5" />
              <span className="text-base font-medium">{getBackText()}</span>
            </Link>
            <div className="flex-1"></div>
          </div>
        </header>
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <ChefHat className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error loading recipe</h2>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="flex flex-col min-h-screen ">
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="flex h-16 items-center px-4 gap-4">
            <Link href={getBackUrl()} className="flex items-center gap-2 text-gray-700 hover:text-orange-600">
              <ArrowLeft className="h-5 w-5" />
              <span className="text-base font-medium">{getBackText()}</span>
            </Link>
            <div className="flex-1"></div>
          </div>
        </header>
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Recipe not found</h2>
              <p className="text-gray-600 mb-4">The recipe you are looking for does not exist.</p>
              <Link href="/find-recipes">
                <Button>
                  <ChefHat className="mr-2 h-4 w-4" />
                  Find New Recipes
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen ">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex h-16 items-center px-4 gap-4">
          <Link href={getBackUrl()} className="flex items-center gap-2 text-gray-700 hover:text-orange-600">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-base font-medium">{getBackText()}</span>
          </Link>
          <div className="flex-1"></div>
          <Button
            variant="destructive"
            onClick={handleDeleteRecipe}
            disabled={isDeleting}
            className="px-4"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash className="h-4 w-4" />
            )}
            <span className="ml-2">Delete Recipe</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-xl">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{recipe.title}</h1>
          <p className="text-lg text-gray-700 mb-6">{recipe.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
              <p className="flex items-center gap-2 text-gray-700"><Clock className="h-5 w-5 text-orange-600" /> Prep Time: {recipe.prepTime} minutes</p>
              <p className="flex items-center gap-2 text-gray-700"><Clock className="h-5 w-5 text-orange-600" /> Cook Time: {recipe.cookingTime} minutes</p>
              <p className="flex items-center gap-2 text-gray-700"><Users className="h-5 w-5 text-orange-600" /> Servings: {recipe.servings}</p>
              <p className="flex items-center gap-2 text-gray-700"><ChefHat className="h-5 w-5 text-orange-600" /> Difficulty: {recipe.difficulty}</p>
              <p className="flex items-center gap-2 text-gray-700"><Star className="h-5 w-5 text-yellow-500 fill-current" /> Rating: {recipe.rating}</p>
              <p className="flex items-center gap-2 text-gray-700"><FlaskConical className="h-5 w-5 text-blue-600" /> Cuisine: {recipe.cuisine}</p>
              <p className="flex items-center gap-2 text-gray-700"><BookOpen className="h-5 w-5 text-purple-600" /> Source: {recipe.source}</p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Ingredients</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index}>{ingredient}</li>
                ))}
              </ul>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Instructions</h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            {recipe.instructions.split('\n').map((step, index) => (
              <li key={index}>{step.trim()}</li>
            ))}
          </ol>
        </div>
      </main>
    </div>
  );
}

export default function RecipeDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        <p className="text-lg font-medium text-gray-600">Loading recipe details...</p>
      </div>
    }>
      <RecipeDetailContent />
    </Suspense>
  );
}