import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

// Load environment variables
dotenv.config();

// Import routes
import routes from './routes';

function setupServer() {
  // Set up Express app
  const app = express();
  
  // Middleware
  app.use(express.json());
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }));
  
  // API Routes
  app.use('/api', routes);
  
  // Ping endpoint for simple tests
  app.get('/ping', (_req, res) => {
    res.send('pong');
  });
  
  // Root endpoint for direct browser testing
  app.get('/', (_req, res) => {
    res.send('Backend is running!');
  });
  
  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development'
    });
  });
  
  // Add a direct login endpoint to verify our auth system
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    // Simple validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // For demo/testing - use fixed credentials
    if (email === 'test@example.com' && password === 'password123') {
      // Generate a simple token - in production use proper JWT
      const token = 'demo-token-' + Date.now();
      
      return res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User'
        }
      });
    }
    
    return res.status(401).json({ error: 'Invalid email or password' });
  });
  
  return app;
}

export default setupServer; 