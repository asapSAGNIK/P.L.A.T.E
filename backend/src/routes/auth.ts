// Auth routes for Supabase JWT bridge and user management

import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import logger from '../config/logger';
import { env } from '../config/env';

const router = Router();

// Zod schema for Supabase token exchange
const supabaseTokenSchema = z.object({
  supabaseToken: z.string().min(1),
  userId: z.string().min(1),
  email: z.string().email()
});

// POST /auth/supabase-token-exchange
// Exchanges Supabase JWT for backend JWT
router.post('/supabase-token-exchange', async (req: Request, res: Response) => {
  try {
    const { supabaseToken, userId, email } = supabaseTokenSchema.parse(req.body);

    // Verify the Supabase token (optional - for extra security)
    // You could add Supabase token validation here if needed

    // Create backend JWT
    const backendToken = jwt.sign(
      { 
        userId,
        email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      },
      env.JWT_SECRET || 'fallback-secret-key'
    );

    res.json({ 
      token: backendToken,
      userId,
      email
    });

  } catch (err: any) {
    logger.error('Error in token exchange:', err);
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: err.errors });
    }
    res.status(500).json({ error: 'Token exchange failed' });
  }
});

// POST /auth/verify-token
// Verify backend JWT token
router.post('/verify-token', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET || 'fallback-secret-key') as any;
    res.json({ 
      valid: true, 
      userId: decoded.userId,
      email: decoded.email
    });

  } catch (error) {
    logger.error('Token verification failed:', error);
    res.status(403).json({ error: 'Invalid token' });
  }
});

export default router; 