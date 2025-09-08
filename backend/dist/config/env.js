"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().transform(Number).default('5000'),
    JWT_SECRET: zod_1.z.string().min(1),
    SUPABASE_URL: zod_1.z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: zod_1.z.string().min(1),
    FRONTEND_URL: zod_1.z.string().url().default('http://localhost:3000'),
    ALLOWED_ORIGINS: zod_1.z.string().optional(),
    SPOONACULAR_API_KEY: zod_1.z.string().optional(),
    GEMINI_API_KEY: zod_1.z.string().optional(),
    AWS_POLLY_ACCESS_KEY_ID: zod_1.z.string().optional(),
    AWS_POLLY_SECRET_ACCESS_KEY: zod_1.z.string().optional(),
    AWS_POLLY_REGION: zod_1.z.string().optional(),
    // Vercel URL for production
    VERCEL_URL: zod_1.z.string().optional(),
});
exports.env = envSchema.parse(process.env);
//# sourceMappingURL=env.js.map