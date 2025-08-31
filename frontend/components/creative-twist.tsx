"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Loader2, Lightbulb } from "lucide-react"
import { getAuthHeader } from '../lib/utils'

interface CreativeTwistProps {
  recipeId: string
}

export function CreativeTwist({ recipeId }: CreativeTwistProps) {
  const [twist, setTwist] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  const loadTwist = async () => {
    setIsLoading(true)

    try {
      const authHeader = getAuthHeader()

      // Use backend endpoint for AI twist
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipes/ai/twist`, {
        method: "POST",
        headers: authHeader.Authorization ? { 'Content-Type': 'application/json', Authorization: authHeader.Authorization } : { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to generate creative twist")
      setTwist(data.twist)
      setHasLoaded(true)
    } catch (error) {
      console.error("Failed to load twist:", error)
      setTwist({ error: "Failed to generate creative twist. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          Creative Twist
        </CardTitle>
        <CardDescription>Discover exciting variations and fusion ideas</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasLoaded && !isLoading && (
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Ready to get creative with this recipe?</p>
            <Button
              onClick={loadTwist}
              variant="outline"
              className="border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Get Creative Twist
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Generating creative ideas... ✨</p>
          </div>
        )}

        {hasLoaded && twist && !twist.error && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="bg-purple-100 p-2 rounded-full flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-purple-900 mb-1">{twist.title}</h4>
                  <p className="text-sm text-purple-700 mb-3">{twist.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {twist.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                        {tag}
                      </Badge>
                    ))}
                    <Badge variant="outline" className="text-xs">
                      +{twist.additionalTime} min
                    </Badge>
                  </div>

                  <div>
                    <h5 className="font-medium text-purple-900 mb-2">Creative Changes:</h5>
                    <ul className="space-y-1">
                      {twist.changes.map((change: string, index: number) => (
                        <li key={index} className="text-sm text-purple-800 flex items-start gap-2">
                          <span className="text-purple-600 mt-1">•</span>
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <Button
              onClick={loadTwist}
              variant="ghost"
              size="sm"
              className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            >
              Generate Another Twist
            </Button>
          </div>
        )}

        {hasLoaded && twist?.error && (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{twist.error}</p>
            <Button onClick={loadTwist} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
