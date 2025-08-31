"use client"
import React, { useEffect, useState } from 'react'
import { getAuthHeader } from '../lib/utils'

const RecipeList: React.FC = () => {
  const [recipes, setRecipes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const authHeader = getAuthHeader()

  useEffect(() => {
    const fetchRecipes = async () => {
      setIsLoading(true)
      try {
        // Use backend endpoint for fetching recipes
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipes`, {
          headers: authHeader.Authorization ? { 'Content-Type': 'application/json', Authorization: authHeader.Authorization } : { 'Content-Type': 'application/json' },
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
  }, [authHeader])

  return (
    <div>
      {/* Render your recipes here */}
    </div>
  )
}

export default RecipeList 