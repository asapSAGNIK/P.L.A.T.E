"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, Star, Eye, Loader2, Bookmark, BookmarkCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabaseAPI } from '../lib/supabase/api' // Import supabaseAPI

interface Recipe {
  id: string
  title: string
  cookingTime: number
  difficulty: string
  ingredients: string[]
  description: string
  rating: number
  servings: number
  instructions?: string
}

interface RecipeCardProps {
  recipe: Recipe
  desiredServings: number
  referrer?: string // Add referrer prop to track where the card is used
}

export function RecipeCard({ recipe, desiredServings, referrer }: RecipeCardProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const { toast } = useToast()

  // Check if recipe is saved on component mount
  useEffect(() => {
    const checkIfSaved = async () => {
      try {
        const isRecipeSaved = await supabaseAPI.checkIfRecipeIsSaved(recipe.id);
        setIsSaved(isRecipeSaved);
      } catch (error) {
        console.error('Error checking if recipe is saved:', error);
      }
    };

    checkIfSaved();
  }, [recipe.id]); // Dependency on recipe.id

  const handleSaveToggle = async () => {
    if (isSaving) return;

    setIsSaving(true);

    try {
      if (isSaved) {
        // Remove saved recipe using Supabase API
        await supabaseAPI.removeRecipe(recipe.id);

        setIsSaved(false);
        toast({
          title: "Recipe removed",
          description: "Recipe has been removed from your saved recipes",
        });
      } else {
        // Save recipe using Supabase API
        const recipeData = {
          title: recipe.title,
          description: recipe.description,
          cook_time_minutes: recipe.cookingTime,
          servings: recipe.servings,
          difficulty: recipe.difficulty,
          source: 'Gemini',
          original_recipe_id: recipe.id,
          instructions: Array.isArray(recipe.instructions) ? recipe.instructions.join('\n') : recipe.instructions,
          ingredients: recipe.ingredients,
          rating: recipe.rating
        };

        await supabaseAPI.saveRecipe(recipeData);

        setIsSaved(true);
        toast({
          title: "Recipe saved!",
          description: "Recipe has been added to your saved recipes",
        });
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      toast({
        title: "Error",
        description: "Failed to save recipe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-sm">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{recipe.title}</h3>
            <p className="text-gray-600 text-sm">{recipe.description}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              {recipe.difficulty}
            </Badge>
          </div>
        </div>

        {/* Time and Servings */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-orange-600" />
            <span>{recipe.cookingTime} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-orange-600" />
            <span>{recipe.servings} servings</span>
          </div>
        </div>

        {/* Instruction Preview */}
        <div className="mb-6">
          <div className="relative">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                Quick Preview
              </h4>
              <div className="relative">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {recipe.instructions ? 
                    (typeof recipe.instructions === 'string' 
                      ? recipe.instructions.split('\n')[0]?.substring(0, 120) + (recipe.instructions.split('\n')[0]?.length > 120 ? '...' : '')
                      : 'Get ready to cook this delicious recipe!'
                    ) : 
                    'Get ready to cook this delicious recipe!'
                  }
                </p>
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent pointer-events-none"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Link href={`/recipe/${recipe.id}?servings=${desiredServings}${referrer ? `&from=${referrer}` : ''}`} className="flex-1">
            <Button className="w-full bg-orange-600 hover:bg-orange-700">
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Button>
          </Link>
          
          <Button
            variant={isSaved ? "default" : "outline"}
            onClick={handleSaveToggle}
            disabled={isSaving}
            className={`px-4 ${isSaved ? 'bg-green-600 hover:bg-green-700' : ''}`}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSaved ? (
              <BookmarkCheck className="h-4 w-4" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
