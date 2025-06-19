import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from '../config/env';
import { findOrCreateUserByGoogle, findUserById } from '../services/userService';

// Serialize user by ID
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user by ID
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await findUserById(id);
    done(null, user);
  } catch (error) {
    done(error, undefined);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID!,
      clientSecret: env.GOOGLE_CLIENT_SECRET!,
      callbackURL: '/auth/google/callback',
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const user = await findOrCreateUserByGoogle(profile);
        return done(null, user);
      } catch (err) {
        return done(err, undefined);
      }
    }
  )
);

export default passport; 