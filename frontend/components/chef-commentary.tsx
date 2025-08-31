"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCircle, Loader2, ChefHat } from "lucide-react"
import { getAuthHeader } from '../lib/utils'

interface ChefCommentaryProps {
  recipeId: string
}

export function ChefCommentary({ recipeId }: ChefCommentaryProps) {
  const [commentary, setCommentary] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  const loadCommentary = async () => {
    setIsLoading(true)

    try {
      const authHeader = getAuthHeader()
      // Use backend endpoint for AI commentary
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipes/ai/commentary`, {
        method: "POST",
        headers: authHeader.Authorization ? { 'Content-Type': 'application/json', Authorization: authHeader.Authorization } : { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to load chef commentary")
      setCommentary(data.commentary)
      setHasLoaded(true)
    } catch (error) {
      console.error("Failed to load commentary:", error)
      setCommentary("Failed to load chef commentary. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-orange-600" />
          Chef's Commentary
        </CardTitle>
        <CardDescription>Get professional insights and tips from your AI chef</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasLoaded && !isLoading && (
          <div className="text-center py-8">
            <ChefHat className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Want some professional cooking insights?</p>
            <Button onClick={loadCommentary} variant="outline">
              <MessageCircle className="mr-2 h-4 w-4" />
              Get Chef Commentary
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-4" />
            <p className="text-gray-600">Chef is analyzing the recipe... 👨‍🍳</p>
          </div>
        )}

        {hasLoaded && commentary && (
          <div className="space-y-4">
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
              <div className="flex items-start gap-3">
                <div className="bg-orange-100 p-2 rounded-full flex-shrink-0">
                  <ChefHat className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-orange-900 mb-2">Chef's Professional Take:</h4>
                  <div className="text-sm text-orange-800 whitespace-pre-line leading-relaxed">{commentary}</div>
                </div>
              </div>
            </div>
            <Button
              onClick={loadCommentary}
              variant="ghost"
              size="sm"
              className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50"
            >
              Get Fresh Commentary
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
