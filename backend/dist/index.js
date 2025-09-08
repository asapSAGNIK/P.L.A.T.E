"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const supabase_js_1 = require("@supabase/supabase-js");
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const logger_1 = __importDefault(require("./config/logger"));
const auth_1 = __importDefault(require("./routes/auth"));
const ingredients_1 = __importDefault(require("./routes/ingredients"));
const recipes_1 = __importDefault(require("./routes/recipes"));
const rateLimit_1 = __importDefault(require("./routes/rateLimit"));
const app = (0, express_1.default)();
const port = env_1.env.PORT;
// Defensive check for required env vars
if (!env_1.env.SUPABASE_URL || !env_1.env.SUPABASE_SERVICE_ROLE_KEY || !env_1.env.FRONTEND_URL) {
    throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FRONTEND_URL');
}
// CORS middleware - handle both development and production
const allowedOrigins = env_1.env.ALLOWED_ORIGINS?.split(',') || [];
if (env_1.env.NODE_ENV === 'production') {
    // In production, allow the Vercel frontend URL
    if (process.env.VERCEL_URL) {
        allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
    }
    // Also allow common localhost ports for development
    allowedOrigins.push('http://localhost:3000', 'http://localhost:3001');
}
else {
    // In development, allow localhost
    allowedOrigins.push('http://localhost:3000', 'http://localhost:3001');
}
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express_1.default.json());
// Supabase Initialization
const supabase = (0, supabase_js_1.createClient)(env_1.env.SUPABASE_URL, env_1.env.SUPABASE_SERVICE_ROLE_KEY);
// Request logging middleware
app.use((req, res, next) => {
    logger_1.default.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });
    next();
});
// Routes
app.use('/auth', auth_1.default);
app.use('/ingredients', ingredients_1.default);
app.use('/recipes', recipes_1.default);
app.use('/rate-limit', rateLimit_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        environment: env_1.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
// Error handling middleware
app.use((err, req, res, next) => {
    logger_1.default.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});
// Start the server
app.listen(port, () => {
    logger_1.default.info(`Server is running on http://localhost:${port} in ${env_1.env.NODE_ENV} mode`);
});
//# sourceMappingURL=index.js.map