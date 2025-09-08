import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  JWT_SECRET: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  ALLOWED_ORIGINS: z.string().optional(),
  SPOONACULAR_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  AWS_POLLY_ACCESS_KEY_ID: z.string().optional(),
  AWS_POLLY_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_POLLY_REGION: z.string().optional(),
  // Vercel URL for production
  VERCEL_URL: z.string().optional(),
});

export const env = envSchema.parse(process.env); 