import { Request, Response, NextFunction } from 'express';
import { checkUserRateLimit, incrementUserRateLimit, DEFAULT_RATE_LIMIT } from '../services/rateLimitService';
import logger from '../config/logger';

export interface RateLimitOptions {
  maxRequestsPerDay?: number;
  resetTimeUTC?: number;
  skipIncrement?: boolean; // For read-only endpoints
}

/**
 * Middleware to check and enforce user rate limits
 */
export const userRateLimit = (options: RateLimitOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user is authenticated
      if (!req.user?.userId) {
        return res.status(401).json({ error: 'Authentication required for rate limiting' });
      }

      const userId = req.user.userId;
      const config = {
        maxRequestsPerDay: options.maxRequestsPerDay || DEFAULT_RATE_LIMIT.maxRequestsPerDay,
        resetTimeUTC: options.resetTimeUTC || DEFAULT_RATE_LIMIT.resetTimeUTC
      };

      // Check rate limit
      const { allowed, remaining, resetTime } = await checkUserRateLimit(userId, config);

      if (!allowed) {
        logger.warn('Rate limit exceeded', { 
          userId, 
          endpoint: req.path,
          remaining: 0,
          resetTime: resetTime.toISOString()
        });

        return res.status(429).json({
          error: 'Daily rate limit exceeded',
          message: `You've reached your daily limit of ${config.maxRequestsPerDay} recipe generations. Please try again after ${resetTime.toISOString()}`,
          remaining: 0,
          resetTime: resetTime.toISOString(),
          limit: config.maxRequestsPerDay
        });
      }

      // Add rate limit info to response headers
      res.set({
        'X-RateLimit-Limit': config.maxRequestsPerDay.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': resetTime.toISOString()
      });

      // Store rate limit info in request for later use
      req.rateLimit = {
        allowed,
        remaining,
        resetTime,
        config
      };

      logger.info('Rate limit check passed', { 
        userId, 
        endpoint: req.path,
        remaining,
        resetTime: resetTime.toISOString()
      });

      next();
    } catch (error) {
      logger.error('Rate limit middleware error:', error);
      // In case of error, allow the request but log it
      next();
    }
  };
};

/**
 * Middleware to increment rate limit after successful request
 */
export const incrementRateLimit = (options: RateLimitOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip increment if requested
      if (options.skipIncrement) {
        return next();
      }

      // Check if user is authenticated
      if (!req.user?.userId) {
        return next();
      }

      const userId = req.user.userId;
      const config = {
        maxRequestsPerDay: options.maxRequestsPerDay || DEFAULT_RATE_LIMIT.maxRequestsPerDay,
        resetTimeUTC: options.resetTimeUTC || DEFAULT_RATE_LIMIT.resetTimeUTC
      };

      // Increment rate limit
      await incrementUserRateLimit(userId, config);

      logger.info('Rate limit incremented', { 
        userId, 
        endpoint: req.path 
      });

      next();
    } catch (error) {
      logger.error('Rate limit increment error:', error);
      // Don't fail the request if increment fails
      next();
    }
  };
};

/**
 * Combined middleware for rate limiting
 */
export const enforceRateLimit = (options: RateLimitOptions = {}) => {
  return [userRateLimit(options), incrementRateLimit(options)];
};
