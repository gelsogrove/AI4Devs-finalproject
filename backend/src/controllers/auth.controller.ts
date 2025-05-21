import { Request, Response } from 'express';
import { z } from 'zod';
import userService from '../services/user.service';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

class AuthController {
  /**
   * Register a new user
   */
  async register(req: Request, res: Response) {
    try {
      // Validate request body
      const validatedData = registerSchema.parse(req.body);
      
      // Create user
      const user = await userService.createUser(validatedData);
      
      return res.status(201).json({
        message: 'User registered successfully',
        user,
      });
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle validation errors
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      
      // Handle service errors
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      
      return res.status(500).json({ error: 'An unexpected error occurred' });
    }
  }

  /**
   * Login a user
   */
  async login(req: Request, res: Response) {
    try {
      // Validate request body
      const { email, password } = loginSchema.parse(req.body);
      
      // Attempt to login
      const result = await userService.login(email, password);
      
      return res.status(200).json({
        message: 'Login successful',
        ...result,
      });
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle validation errors
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      
      // Handle service errors (invalid credentials, etc.)
      if (error instanceof Error) {
        return res.status(401).json({ error: error.message });
      }
      
      return res.status(500).json({ error: 'An unexpected error occurred' });
    }
  }

  /**
   * Get the current user's profile
   */
  async getProfile(req: Request, res: Response) {
    try {
      // req.user is set by the auth middleware
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      const user = await userService.getUserById(req.user.userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      return res.status(200).json({ user });
    } catch (error) {
      console.error('Get profile error:', error);
      
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      
      return res.status(500).json({ error: 'An unexpected error occurred' });
    }
  }
}

export default new AuthController(); 