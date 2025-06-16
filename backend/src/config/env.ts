import { config } from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
const envPath = path.join(__dirname, '..', '..', '..', envFile);

const result = config({ path: envPath });

// Optionally log if the .env file wasn't found in development mode, but avoid logging sensitive data.
// For production, this should ideally be handled by robust error monitoring.
if (result.error && process.env.NODE_ENV === 'development') {
  console.error('Warning: .env file not found or could not be loaded.', result.error.message);
} else if (result.parsed && process.env.NODE_ENV === 'development') {
  console.log('Loaded .env keys:', Object.keys(result.parsed));
}

console.log('DEBUG: SUPABASE_URL in process.env:', process.env.SUPABASE_URL);
console.log('DEBUG: SUPABASE_SERVICE_ROLE_KEY in process.env (first 5 chars):', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 5) + '...');

// Define environment variable schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  // Add other API keys with proper validation
  SPOONACULAR_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  AWS_POLLY_ACCESS_KEY_ID: z.string().optional(),
  AWS_POLLY_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
});

// Type for the environment variables
export type Env = z.infer<typeof envSchema>;

// Validate and parse environment variables
const parseEnv = (): Env => {
  try {
    return envSchema.parse(process.env);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err: z.ZodIssue) => err.path.join('.')).join(', ');
      throw new Error(`Missing or invalid environment variables: ${missingVars}`);
    }
    throw error;
  }
};

export const env = parseEnv(); 