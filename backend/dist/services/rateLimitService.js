"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_RATE_LIMIT = void 0;
exports.checkUserRateLimit = checkUserRateLimit;
exports.incrementUserRateLimit = incrementUserRateLimit;
exports.getUserRateLimitStatus = getUserRateLimitStatus;
const supabase_js_1 = require("@supabase/supabase-js");
const env_1 = require("../config/env");
const logger_1 = __importDefault(require("../config/logger"));
const supabase = (0, supabase_js_1.createClient)(env_1.env.SUPABASE_URL, env_1.env.SUPABASE_SERVICE_ROLE_KEY);
exports.DEFAULT_RATE_LIMIT = {
    maxRequestsPerDay: 20,
    resetTimeUTC: 0 // Midnight UTC
};
/**
 * Check if user has exceeded daily rate limit
 */
async function checkUserRateLimit(userId, config = exports.DEFAULT_RATE_LIMIT) {
    try {
        const today = new Date();
        const resetTime = new Date(today);
        resetTime.setUTCHours(config.resetTimeUTC, 0, 0, 0);
        // If we're past reset time today, use today's date
        // If we're before reset time, use yesterday's date
        if (today.getUTCHours() < config.resetTimeUTC) {
            resetTime.setUTCDate(resetTime.getUTCDate() - 1);
        }
        const requestDate = resetTime.toISOString().split('T')[0]; // YYYY-MM-DD format
        // Get or create rate limit record for today
        const { data: rateLimit, error: fetchError } = await supabase
            .from('user_rate_limits')
            .select('*')
            .eq('user_id', userId)
            .eq('request_date', requestDate)
            .single();
        if (fetchError && fetchError.code !== 'PGRST116') {
            logger_1.default.error('Error fetching rate limit:', fetchError);
            throw fetchError;
        }
        let currentCount = 0;
        let recordId = null;
        if (rateLimit) {
            currentCount = rateLimit.request_count;
            recordId = rateLimit.id;
        }
        const allowed = currentCount < config.maxRequestsPerDay;
        const remaining = Math.max(0, config.maxRequestsPerDay - currentCount);
        // Calculate next reset time
        const nextReset = new Date(resetTime);
        nextReset.setUTCDate(nextReset.getUTCDate() + 1);
        logger_1.default.info('Rate limit check', {
            userId,
            currentCount,
            maxRequests: config.maxRequestsPerDay,
            allowed,
            remaining,
            requestDate
        });
        return {
            allowed,
            remaining,
            resetTime: nextReset
        };
    }
    catch (error) {
        logger_1.default.error('Error checking rate limit:', error);
        // In case of error, allow the request but log it
        return {
            allowed: true,
            remaining: config.maxRequestsPerDay,
            resetTime: new Date()
        };
    }
}
/**
 * Increment user's daily request count
 */
async function incrementUserRateLimit(userId, config = exports.DEFAULT_RATE_LIMIT) {
    try {
        const today = new Date();
        const resetTime = new Date(today);
        resetTime.setUTCHours(config.resetTimeUTC, 0, 0, 0);
        if (today.getUTCHours() < config.resetTimeUTC) {
            resetTime.setUTCDate(resetTime.getUTCDate() - 1);
        }
        const requestDate = resetTime.toISOString().split('T')[0];
        // Upsert the rate limit record
        const { error: upsertError } = await supabase
            .from('user_rate_limits')
            .upsert({
            user_id: userId,
            request_date: requestDate,
            request_count: 1,
            last_request_at: new Date().toISOString()
        }, {
            onConflict: 'user_id,request_date',
            ignoreDuplicates: false
        });
        if (upsertError) {
            // If upsert fails, try to increment existing record
            const { error: incrementError } = await supabase.rpc('increment_rate_limit', {
                p_user_id: userId,
                p_request_date: requestDate
            });
            if (incrementError) {
                logger_1.default.error('Error incrementing rate limit:', incrementError);
                throw incrementError;
            }
        }
        logger_1.default.info('Rate limit incremented', { userId, requestDate });
    }
    catch (error) {
        logger_1.default.error('Error incrementing rate limit:', error);
        // Don't throw error to avoid breaking the main flow
    }
}
/**
 * Get user's current rate limit status
 */
async function getUserRateLimitStatus(userId, config = exports.DEFAULT_RATE_LIMIT) {
    try {
        const today = new Date();
        const resetTime = new Date(today);
        resetTime.setUTCHours(config.resetTimeUTC, 0, 0, 0);
        if (today.getUTCHours() < config.resetTimeUTC) {
            resetTime.setUTCDate(resetTime.getUTCDate() - 1);
        }
        const requestDate = resetTime.toISOString().split('T')[0];
        const { data: rateLimit, error } = await supabase
            .from('user_rate_limits')
            .select('request_count')
            .eq('user_id', userId)
            .eq('request_date', requestDate)
            .single();
        const currentCount = rateLimit?.request_count || 0;
        const remaining = Math.max(0, config.maxRequestsPerDay - currentCount);
        const nextReset = new Date(resetTime);
        nextReset.setUTCDate(nextReset.getUTCDate() + 1);
        return {
            currentCount,
            maxRequests: config.maxRequestsPerDay,
            remaining,
            resetTime: nextReset
        };
    }
    catch (error) {
        logger_1.default.error('Error getting rate limit status:', error);
        return {
            currentCount: 0,
            maxRequests: config.maxRequestsPerDay,
            remaining: config.maxRequestsPerDay,
            resetTime: new Date()
        };
    }
}
//# sourceMappingURL=rateLimitService.js.map