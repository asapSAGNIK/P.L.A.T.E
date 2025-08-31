import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        supabaseUser: any;
      };
      rateLimit?: {
        allowed: boolean;
        remaining: number;
        resetTime: Date;
        config: {
          maxRequestsPerDay: number;
          resetTimeUTC: number;
        };
      };
    }
  }
}

export {}; 