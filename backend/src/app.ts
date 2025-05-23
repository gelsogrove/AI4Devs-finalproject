import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger';

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
  
  // Swagger Documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  
  // Serve Swagger specification as JSON
  app.get('/api-docs.json', (_req, res) => {
    res.json(swaggerSpec);
  });
  
  // API Routes
  app.use('/api', routes);
  
  // Ping endpoint for simple tests
  app.get('/ping', (_req, res) => {
    res.send('pong');
  });
  
  // Root endpoint for direct browser testing
  app.get('/', (_req, res) => {
    res.send('Backend is running! Visit <a href="/api-docs">API Documentation</a>');
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

/**
 * Creates an Express app for testing purposes
 * This function is used by integration tests
 */
export async function createApp() {
  // Simply return the configured Express app
  return setupServer();
}

// Create and export the app instance
const app = setupServer();
export default app; 