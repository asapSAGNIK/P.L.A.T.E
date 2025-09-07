"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, Star, Eye, Loader2, Bookmark, BookmarkCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAuthTokenForAPI, ensureAuthenticated } from '../lib/simplified-auth'

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
        const token = await getAuthTokenForAPI();
        if (!token) return;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipes/saved/check/${recipe.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setIsSaved(data.isSaved || false);
        }
      } catch (error) {
        console.error('Error checking if recipe is saved:', error);
      }
    };

    checkIfSaved();
  }, [recipe.id]);


  const handleSaveRecipe = async (e: React.MouseEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const authenticated = await ensureAuthenticated();
      if (!authenticated) {
        toast({
          title: "Authentication required",
          description: "Please log in to save recipes",
          variant: "destructive",
        });
        return;
      }

      const token = await getAuthTokenForAPI();
      if (!token) {
        toast({
          title: "Authentication error",
          description: "Unable to get authentication token",
          variant: "destructive",
        });
        return;
      }

      if (isSaved) {
        // Remove saved recipe
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipes/saved/${recipe.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to remove saved recipe');
        }

        setIsSaved(false);
        toast({
          title: "Recipe removed",
          description: "Recipe has been removed from your saved recipes",
        });
      } else {
        // Save recipe
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

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipes/save`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(recipeData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Save recipe error:', errorData);
          throw new Error(errorData.error || `Failed to save recipe (${response.status})`);
        }

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
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Star className="h-4 w-4 fill-current text-yellow-400" />
              {recipe.rating}
            </div>
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

        {/* Key Ingredients */}
        <div className="flex flex-wrap gap-2 mb-6">
          {recipe.ingredients?.slice(0, 3)?.map((ingredient) => (
            <Badge key={ingredient} variant="outline" className="text-xs bg-gray-50">
              {ingredient}
            </Badge>
          ))}
          {recipe.ingredients?.length > 3 && (
            <Badge variant="outline" className="text-xs bg-gray-50">
              +{recipe.ingredients.length - 3} more
            </Badge>
          )}
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
            onClick={handleSaveRecipe}
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
