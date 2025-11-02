/**
 * Type utilities for ensuring type safety across the application
 */

/**
 * Validates and converts difficulty string to the expected type
 */
export function validateDifficulty(difficulty: string | undefined): 'Easy' | 'Medium' | 'Hard' | undefined {
  if (!difficulty) return undefined;
  
  const normalized = difficulty.toLowerCase().trim();
  
  switch (normalized) {
    case 'easy':
    case 'simple':
    case 'beginner':
      return 'Easy';
    case 'medium':
    case 'intermediate':
    case 'moderate':
      return 'Medium';
    case 'hard':
    case 'difficult':
    case 'advanced':
    case 'expert':
      return 'Hard';
    default:
      // Default to Medium for unknown values to maintain backward compatibility
      console.warn(`Unknown difficulty value: ${difficulty}, defaulting to Medium`);
      return 'Medium';
  }
}

/**
 * Type guard to check if a value is a valid difficulty
 */
export function isValidDifficulty(value: any): value is 'Easy' | 'Medium' | 'Hard' {
  return value === 'Easy' || value === 'Medium' || value === 'Hard';
}

/**
 * Safely converts any value to a valid source type
 */
export function validateSource(source: string | undefined): 'Spoonacular' | 'Gemini' | 'UserGenerated' {
  if (!source) return 'UserGenerated';
  
  const normalized = source.toLowerCase().trim();
  
  switch (normalized) {
    case 'spoonacular':
      return 'Spoonacular';
    case 'gemini':
    case 'ai':
    case 'openai':
      return 'Gemini';
    default:
      return 'UserGenerated';
  }
}












