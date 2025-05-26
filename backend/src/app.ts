import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { authRoutes, faqRoutes, productRoutes, serviceRoutes } from './routes';
import agentRoutes from './routes/agent.routes';
import chatRoutes from './routes/chat.routes';
import embeddingRoutes from './routes/embedding.routes';
import swaggerSpec from './swagger';

// Load environment variables
dotenv.config();

// Import routes

export function setupServer() {
  // Set up Express app
  const app = express();
  
  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));
  
  // Swagger Documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  
  // Serve Swagger specification as JSON
  app.get('/api-docs.json', (_req, res) => {
    res.json(swaggerSpec);
  });
  
  // API Routes
  app.use('/api/products', productRoutes);
  app.use('/api/faqs', faqRoutes);
  app.use('/api/services', serviceRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/embeddings', embeddingRoutes);
  app.use('/api/agent', agentRoutes);
  app.use('/api/chat', chatRoutes);
  
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