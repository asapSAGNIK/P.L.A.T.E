import 'dotenv/config';
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import { env } from './config/env';
import logger from './config/logger';
import authRoutes from './routes/auth';
import ingredientRoutes from './routes/ingredients';
import recipeRoutes from './routes/recipes';
import rateLimitRoutes from './routes/rateLimit';
import { RequestHandler } from 'express';

const app = express();
const port = env.PORT;

// Defensive check for required env vars
if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.FRONTEND_URL) {
  throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FRONTEND_URL');
}

// CORS middleware
app.use(cors({
  origin: env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Supabase Initialization
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/ingredients', ingredientRoutes);
app.use('/recipes', recipeRoutes);
app.use('/rate-limit', rateLimitRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
app.listen(port, () => {
  logger.info(`Server is running on http://localhost:${port} in ${env.NODE_ENV} mode`);
});
