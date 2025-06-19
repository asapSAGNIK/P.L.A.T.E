import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import logger from '../config/logger';
import passport from '../middleware/passport';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
  cooking_skill_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  dietary_preferences: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  preferred_cuisines: z.array(z.string()).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Register endpoint
router.post('/register', async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const supabase = (req as any).supabase;

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', validatedData.email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      logger.error('Error checking existing user:', checkError);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(validatedData.password, saltRounds);

    // Create user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email: validatedData.email,
        password_hash: passwordHash,
        name: validatedData.name,
        cooking_skill_level: validatedData.cooking_skill_level,
        dietary_preferences: validatedData.dietary_preferences,
        allergies: validatedData.allergies,
        preferred_cuisines: validatedData.preferred_cuisines,
      })
      .select('id, email, name, cooking_skill_level, created_at')
      .single();

    if (insertError) {
      logger.error('Error creating user:', insertError);
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Create user settings
    const { error: settingsError } = await supabase
      .from('user_settings')
      .insert({
        user_id: newUser.id,
        voice_enabled: false,
        notifications: true,
        theme: 'light',
      });

    if (settingsError) {
      logger.error('Error creating user settings:', settingsError);
      // Don't fail the registration, but log the error
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    logger.info('User registered successfully:', { userId: newUser.id, email: newUser.email });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        cooking_skill_level: newUser.cooking_skill_level,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const supabase = (req as any).supabase;

    // Find user by email
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, email, password_hash, name, cooking_skill_level')
      .eq('email', validatedData.email)
      .single();

    if (findError || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    logger.info('User logged in successfully:', { userId: user.id, email: user.email });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        cooking_skill_level: user.cooking_skill_level,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Google OAuth: Start authentication
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth: Callback
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  async (req: Request, res: Response) => {
    // User is attached to req.user
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ error: 'Google authentication failed' });
    }
    // Issue JWT for frontend
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );
    // Redirect or respond with token (customize as needed)
    // For API: res.json({ token });
    // For web: res.redirect(`/auth/success?token=${token}`);
    res.json({
      message: 'Google login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        google_id: user.google_id,
      },
      token,
    });
  }
);

export default router; 