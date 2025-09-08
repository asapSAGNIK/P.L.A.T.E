"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalSupabaseAuth = exports.authenticateSupabaseToken = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const env_1 = require("../config/env");
const logger_1 = __importDefault(require("../config/logger"));
// Create Supabase client for token verification
const supabase = (0, supabase_js_1.createClient)(env_1.env.SUPABASE_URL, env_1.env.SUPABASE_SERVICE_ROLE_KEY);
const authenticateSupabaseToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    try {
        // Verify the Supabase token
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            logger_1.default.error('Supabase token verification failed:', error);
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        // Add user info to request
        req.user = {
            userId: user.id,
            email: user.email || '', // Handle undefined email gracefully
            supabaseUser: user
        };
        next();
    }
    catch (error) {
        logger_1.default.error('Token verification error:', error);
        return res.status(403).json({ error: 'Token verification failed' });
    }
};
exports.authenticateSupabaseToken = authenticateSupabaseToken;
const optionalSupabaseAuth = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
        try {
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (!error && user) {
                req.user = {
                    userId: user.id,
                    email: user.email || '', // Handle undefined email gracefully
                    supabaseUser: user
                };
            }
        }
        catch (error) {
            logger_1.default.warn('Optional auth failed:', error);
            // Continue without user
        }
    }
    next();
};
exports.optionalSupabaseAuth = optionalSupabaseAuth;
//# sourceMappingURL=supabase-auth.js.map