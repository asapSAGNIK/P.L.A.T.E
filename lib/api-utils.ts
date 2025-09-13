// API utilities for external service calls
export async function callGeminiAPI(prompt: string): Promise<string> {
  const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY

  if (!GEMINI_API_KEY) {
    console.warn('Gemini API key not configured - AI features disabled')
    throw new Error('AI_SERVICE_UNAVAILABLE')
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'P.L.A.T.E-App/1.0'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      throw new Error('No response from Gemini API')
    }

    return text
  } catch (error) {
    console.error('Error calling Gemini API:', error)
    throw error
  }
}

export async function callSpoonacularAPI(endpoint: string, params: Record<string, string>): Promise<any> {
  const API_KEY = process.env.NEXT_PUBLIC_SPOONACULAR_API_KEY

  if (!API_KEY) {
    throw new Error('Spoonacular API key not configured')
  }

  const urlParams = new URLSearchParams({ ...params, apiKey: API_KEY })
  const url = `https://api.spoonacular.com/${endpoint}?${urlParams}`

  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Spoonacular API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error calling Spoonacular API:', error)
    throw error
  }
}
