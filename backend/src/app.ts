import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import routes from './routes';
import swaggerSpec from './swagger';

// Load environment variables
dotenv.config();

export function setupServer() {
  // Set up Express app
  const app = express();
  
  // Middleware
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    frameguard: { action: 'sameorigin' }
  }));
  app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true
  }));
  app.use(express.json());
  app.use(morgan('dev'));
  
  // Serve static files from uploads directory
  const uploadsPath = path.join(__dirname, '..', 'uploads');
  app.use('/uploads', express.static(uploadsPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.pdf')) {
        res.setHeader('Content-Type', 'application/pdf');
        // Allow PDFs to be embedded in iframes from any origin
        res.removeHeader('X-Frame-Options');
        res.setHeader('Content-Security-Policy', 'frame-ancestors *;');
      }
    }
  }));
  console.log(`Static files served from: ${uploadsPath}`);
  
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