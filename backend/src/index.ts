import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import setupServer from './app';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

// Set up Express app
const app = setupServer();
const prisma = new PrismaClient();
const port = process.env.PORT || 3003;

// Global error handler for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
  // Application should continue running despite unhandled promise rejections
});

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Keep the application running despite uncaught exceptions
});

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// API Routes
import routes from './routes';
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

// Start server with proper error handling
let server;
try {
  server = app.listen(port, () => {
    logger.info(`Server running on port ${port}`);
    logger.info(`Test the server: http://localhost:${port}/api/health`);

    // Log process info
    logger.info(`Process ID: ${process.pid}`);
    logger.info(`Node.js version: ${process.version}`);
  }).on('error', (err: NodeJS.ErrnoException) => {
    // Handle specific server errors
    if (err.code === 'EADDRINUSE') {
      logger.error(`Port ${port} is already in use`);
      process.exit(1);
    } else {
      logger.error('Server error:', err);
    }
  });
} catch (err) {
  logger.error('Failed to start server:', err);
  process.exit(1);
}

// Keep the process alive with multiple redundant methods
setInterval(() => {
  logger.info(`Server still running on port ${port}... (${new Date().toISOString()})`);
}, 60000); // Log every minute to show it's still running

// Create a strong reference to prevent garbage collection
const keepAlive = server;

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Closing HTTP server and Prisma client...');
  if (server) {
    server.close(() => {
      logger.info('Server closed');
    });
  }
  await prisma.$disconnect();
  process.exit(0);
});

// Also handle SIGINT (Ctrl+C)
process.on('SIGINT', async () => {
  logger.info('SIGINT received. Closing HTTP server and Prisma client...');
  if (server) {
    server.close(() => {
      logger.info('Server closed');
    });
  }
  await prisma.$disconnect();
  process.exit(0);
}); 