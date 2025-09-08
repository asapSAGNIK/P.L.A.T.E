"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enforceRateLimit = exports.incrementRateLimit = exports.userRateLimit = void 0;
const rateLimitService_1 = require("../services/rateLimitService");
const logger_1 = __importDefault(require("../config/logger"));
/**
 * Middleware to check and enforce user rate limits
 */
const userRateLimit = (options = {}) => {
    return async (req, res, next) => {
        try {
            // Check if user is authenticated
            if (!req.user?.userId) {
                return res.status(401).json({ error: 'Authentication required for rate limiting' });
            }
            const userId = req.user.userId;
            const config = {
                maxRequestsPerDay: options.maxRequestsPerDay || rateLimitService_1.DEFAULT_RATE_LIMIT.maxRequestsPerDay,
                resetTimeUTC: options.resetTimeUTC || rateLimitService_1.DEFAULT_RATE_LIMIT.resetTimeUTC
            };
            // Check rate limit
            const { allowed, remaining, resetTime } = await (0, rateLimitService_1.checkUserRateLimit)(userId, config);
            if (!allowed) {
                logger_1.default.warn('Rate limit exceeded', {
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
            logger_1.default.info('Rate limit check passed', {
                userId,
                endpoint: req.path,
                remaining,
                resetTime: resetTime.toISOString()
            });
            next();
        }
        catch (error) {
            logger_1.default.error('Rate limit middleware error:', error);
            // In case of error, allow the request but log it
            next();
        }
    };
};
exports.userRateLimit = userRateLimit;
/**
 * Middleware to increment rate limit after successful request
 */
const incrementRateLimit = (options = {}) => {
    return async (req, res, next) => {
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
                maxRequestsPerDay: options.maxRequestsPerDay || rateLimitService_1.DEFAULT_RATE_LIMIT.maxRequestsPerDay,
                resetTimeUTC: options.resetTimeUTC || rateLimitService_1.DEFAULT_RATE_LIMIT.resetTimeUTC
            };
            // Increment rate limit
            await (0, rateLimitService_1.incrementUserRateLimit)(userId, config);
            logger_1.default.info('Rate limit incremented', {
                userId,
                endpoint: req.path
            });
            next();
        }
        catch (error) {
            logger_1.default.error('Rate limit increment error:', error);
            // Don't fail the request if increment fails
            next();
        }
    };
};
exports.incrementRateLimit = incrementRateLimit;
/**
 * Combined middleware for rate limiting
 */
const enforceRateLimit = (options = {}) => {
    return [(0, exports.userRateLimit)(options), (0, exports.incrementRateLimit)(options)];
};
exports.enforceRateLimit = enforceRateLimit;
//# sourceMappingURL=rateLimit.js.map