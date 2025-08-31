import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import logger from '../config/logger';

// Create Supabase client for token verification
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

export const authenticateSupabaseToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Verify the Supabase token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.error('Supabase token verification failed:', error);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Add user info to request
    req.user = {
      userId: user.id,
      email: user.email,
      supabaseUser: user
    };

    next();
  } catch (error) {
    logger.error('Token verification error:', error);
    return res.status(403).json({ error: 'Token verification failed' });
  }
};

export const optionalSupabaseAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        req.user = {
          userId: user.id,
          email: user.email,
          supabaseUser: user
        };
      }
    } catch (error) {
      logger.warn('Optional auth failed:', error);
      // Continue without user
    }
  }

  next();
};
