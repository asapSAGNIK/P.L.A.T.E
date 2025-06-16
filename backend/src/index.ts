import express from 'express';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import { env } from './config/env';
import logger from './config/logger';

const app = express();
const port = env.PORT;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase Initialization
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
  },
});

// Middleware to make Supabase client available to request handlers
app.use((req, res, next) => {
  (req as any).supabase = supabase;
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', environment: env.NODE_ENV });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
app.listen(port, () => {
  logger.info(`Server is running on http://localhost:${port} in ${env.NODE_ENV} mode`);
});
