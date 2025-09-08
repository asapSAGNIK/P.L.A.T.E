"use client"
import React, { useEffect, useState } from 'react'
import { getAuthHeader } from '../lib/utils'

const RecipeList: React.FC = () => {
  const [recipes, setRecipes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecipes = async () => {
      setIsLoading(true)
      try {
        // Get auth header
        const authHeader = await getAuthHeader()
        
        // Use backend endpoint for fetching recipes
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipes`, {
          headers: {
            'Content-Type': 'application/json',
            ...(('Authorization' in authHeader) ? { Authorization: authHeader.Authorization } : {})
          },
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Failed to fetch recipes')
        setRecipes(data)
      } catch (error) {
        setError('Failed to load recipes. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchRecipes()
  }, [])

  return (
    <div>
      {/* Render your recipes here */}
    </div>
  )
}

export default RecipeList 