export async function fetchIngredientSuggestions(query: string) {
  if (!query) {
    return []
  }

  const API_KEY = process.env.NEXT_PUBLIC_SPOONACULAR_API_KEY
  if (!API_KEY) {
    console.error("Spoonacular API key is not defined.")
    return []
  }

  try {
    const response = await fetch(
      `https://api.spoonacular.com/food/ingredients/autocomplete?query=${query}&number=10&apiKey=${API_KEY}`,
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.map((item: any) => item.name)
  } catch (error) {
    console.error("Error fetching ingredient suggestions:", error)
    return []
  }
} 