"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, Star, Eye, MessageCircle, Sparkles, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAuthTokenForAPI, ensureAuthenticated } from '../lib/simplified-auth'

interface Recipe {
  id: string
  title: string
  image: string
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
}

export function RecipeCard({ recipe, desiredServings }: RecipeCardProps) {
  const [isLoadingCommentary, setIsLoadingCommentary] = useState(false)
  const [isLoadingTwist, setIsLoadingTwist] = useState(false)
  const { toast } = useToast()

  const handleGetCommentary = async (e: React.MouseEvent) => {
    e.preventDefault()
    setIsLoadingCommentary(true)

    try {
      const authenticated = await ensureAuthenticated();
      if (!authenticated) {
        toast({
          title: "Authentication required",
          description: "Please log in to get chef commentary",
          variant: "destructive",
        });
        return;
      }

      const token = await getAuthTokenForAPI();
      if (!token) {
        toast({
          title: "Token unavailable",
          description: "Please try logging in again",
          variant: "destructive",
        });
        return;
      }

      // Use backend endpoint for AI commentary
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipes/ai/commentary`, {
        method: "POST",
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          recipeTitle: recipe.title, 
          ingredients: recipe.ingredients, 
          instructions: recipe.instructions || "No instructions provided"
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to get commentary")
      toast({
        title: "Chef's Commentary Ready! 👨‍🍳",
        description: data.commentary || "Click 'View Details' to see my professional insights!",
      })
    } catch (error) {
      toast({
        title: "Failed to get commentary",
        variant: "destructive",
      })
    } finally {
      setIsLoadingCommentary(false)
    }
  }

  const handleGetTwist = async (e: React.MouseEvent) => {
    e.preventDefault()
    setIsLoadingTwist(true)

    try {
      const authenticated = await ensureAuthenticated();
      if (!authenticated) {
        toast({
          title: "Authentication required",
          description: "Please log in to get creative twists",
          variant: "destructive",
        });
        return;
      }

      const token = await getAuthTokenForAPI();
      if (!token) {
        toast({
          title: "Token unavailable",
          description: "Please try logging in again",
          variant: "destructive",
        });
        return;
      }

      // Use backend endpoint for AI twist
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipes/ai/twist`, {
        method: "POST",
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          recipeTitle: recipe.title, 
          ingredients: recipe.ingredients, 
          instructions: recipe.instructions || "No instructions provided"
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to generate twist")
      toast({
        title: "Creative Twist Generated! ✨",
        description: data.twist || "I've got some exciting variations for you!",
      })
    } catch (error) {
      toast({
        title: "Failed to generate twist",
        variant: "destructive",
      })
    } finally {
      setIsLoadingTwist(false)
    }
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden bg-white/90 backdrop-blur-sm">
      <div className="relative overflow-hidden">
        <img
          src={recipe.image || "/placeholder.svg"}
          alt={recipe.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="bg-white/90 text-gray-800">
            {recipe.difficulty}
          </Badge>
        </div>
        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 text-white px-2 py-1 rounded text-sm">
          <Star className="h-3 w-3 fill-current text-yellow-400" />
          {recipe.rating}
        </div>
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-gray-900 line-clamp-2">{recipe.title}</CardTitle>
        <CardDescription className="text-sm text-gray-600 line-clamp-2">{recipe.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-orange-600" />
            <span>{recipe.cookingTime} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-orange-600" />
            <span>{recipe.servings} servings</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {recipe.ingredients?.slice(0, 3)?.map((ingredient) => (
            <Badge key={ingredient} variant="outline" className="text-xs">
              {ingredient}
            </Badge>
          ))}
          {recipe.ingredients?.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{recipe.ingredients.length - 3} more
            </Badge>
          )}
          {(!recipe.ingredients || recipe.ingredients.length === 0) && (
            <Badge variant="outline" className="text-xs">
              Ingredients list coming soon
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <Link href={`/recipe/${recipe.id}?servings=${desiredServings}`}>
            <Button className="w-full bg-orange-600 hover:bg-orange-700">
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Button>
          </Link>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGetCommentary}
              disabled={isLoadingCommentary}
              className="text-xs"
            >
              {isLoadingCommentary ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <MessageCircle className="mr-1 h-3 w-3" />
                  Chef Tips
                </>
              )}
            </Button>

            <Button variant="outline" size="sm" onClick={handleGetTwist} disabled={isLoadingTwist} className="text-xs">
              {isLoadingTwist ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-1 h-3 w-3" />
                  Get Twist
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
