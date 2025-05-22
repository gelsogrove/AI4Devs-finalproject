import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

// Load environment variables
dotenv.config();

// Import routes
import routes from './routes';

export function setupServer() {
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
  
  return app;
}

// Create and export the app instance
const app = setupServer();
export default app; 