"use strict";
// Auth routes for Supabase JWT bridge and user management
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const logger_1 = __importDefault(require("../config/logger"));
const env_1 = require("../config/env");
const router = (0, express_1.Router)();
// Zod schema for Supabase token exchange
const supabaseTokenSchema = zod_1.z.object({
    supabaseToken: zod_1.z.string().min(1),
    userId: zod_1.z.string().min(1),
    email: zod_1.z.string().email()
});
// POST /auth/supabase-token-exchange
// Exchanges Supabase JWT for backend JWT
router.post('/supabase-token-exchange', async (req, res) => {
    try {
        const { supabaseToken, userId, email } = supabaseTokenSchema.parse(req.body);
        // Verify the Supabase token (optional - for extra security)
        // You could add Supabase token validation here if needed
        // Create backend JWT
        const backendToken = jsonwebtoken_1.default.sign({
            userId,
            email,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
        }, env_1.env.JWT_SECRET || 'fallback-secret-key');
        res.json({
            token: backendToken,
            userId,
            email
        });
    }
    catch (err) {
        logger_1.default.error('Error in token exchange:', err);
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: err.errors });
        }
        res.status(500).json({ error: 'Token exchange failed' });
    }
});
// POST /auth/verify-token
// Verify backend JWT token
router.post('/verify-token', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET || 'fallback-secret-key');
        res.json({
            valid: true,
            userId: decoded.userId,
            email: decoded.email
        });
    }
    catch (error) {
        logger_1.default.error('Token verification failed:', error);
        res.status(403).json({ error: 'Invalid token' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map