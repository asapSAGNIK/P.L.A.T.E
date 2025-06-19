import { JwtUser } from '../jwtUser';

declare global {
  namespace Express {
    interface Request {
      user?: JwtUser;
    }
  }
} 