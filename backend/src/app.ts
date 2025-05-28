import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import routes from './routes';
import swaggerSpec from './swagger';

// Load environment variables
dotenv.config();

export function setupServer() {
  // Set up Express app
  const app = express();
  
  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));
  
  // Debug logging
  console.log('Setting up routes...');
  console.log('Routes object:', typeof routes);
  
  // Swagger Documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  
  // Serve Swagger specification as JSON
  app.get('/api-docs.json', (_req, res) => {
    res.json(swaggerSpec);
  });
  
  // API Routes - Use the main router
  app.use('/api', routes);
  console.log('Routes registered at /api');
  
  // Ping endpoint for simple tests
  app.get('/ping', (_req, res) => {
    res.send('pong');
  });
  
  // Root endpoint for direct browser testing
  app.get('/', (_req, res) => {
    res.send('Backend is running! Visit <a href="/api-docs">API Documentation</a>');
  });
  
  // Debug: List all registered routes
  (app as any)._router.stack.forEach((middleware: any, index: number) => {
    if (middleware.route) {
      console.log(`Route ${index}: ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      console.log(`Router ${index}: ${middleware.regexp}`);
    }
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