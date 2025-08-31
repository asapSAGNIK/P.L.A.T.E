import { Router, Request, Response } from 'express';
import { authenticateSupabaseToken } from '../middleware/supabase-auth';
import { getUserRateLimitStatus } from '../services/rateLimitService';
import logger from '../config/logger';

const router = Router();

// GET /rate-limit/status - Get user's current rate limit status
router.get('/status', authenticateSupabaseToken, async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = req.user.userId;
    const status = await getUserRateLimitStatus(userId);

    logger.info('Rate limit status requested', { 
      userId, 
      currentCount: status.currentCount,
      remaining: status.remaining 
    });

    res.json({
      currentCount: status.currentCount,
      maxRequests: status.maxRequests,
      remaining: status.remaining,
      resetTime: status.resetTime.toISOString(),
      percentageUsed: Math.round((status.currentCount / status.maxRequests) * 100)
    });

  } catch (error) {
    logger.error('Error getting rate limit status:', error);
    res.status(500).json({ error: 'Failed to get rate limit status' });
  }
});

export default router;
