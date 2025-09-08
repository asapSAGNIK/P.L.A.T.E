"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_auth_1 = require("../middleware/supabase-auth");
const rateLimitService_1 = require("../services/rateLimitService");
const logger_1 = __importDefault(require("../config/logger"));
const router = (0, express_1.Router)();
// GET /rate-limit/status - Get user's current rate limit status
router.get('/status', supabase_auth_1.authenticateSupabaseToken, async (req, res) => {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const userId = req.user.userId;
        const status = await (0, rateLimitService_1.getUserRateLimitStatus)(userId);
        logger_1.default.info('Rate limit status requested', {
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
    }
    catch (error) {
        logger_1.default.error('Error getting rate limit status:', error);
        res.status(500).json({ error: 'Failed to get rate limit status' });
    }
});
exports.default = router;
//# sourceMappingURL=rateLimit.js.map