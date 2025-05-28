import { Router } from 'express';
import agentRoutes from './agent.routes';
import authRoutes from './auth.routes';
import chatRoutes from './chat.routes';
import embeddingRoutes from './embedding.routes';
import faqRoutes from './faq.routes';
import langchainChatRoutes from './langchain-chat.routes';
import productRoutes from './product.routes';
import serviceRoutes from './service.routes';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Auth routes
router.use('/auth', authRoutes);

// Product routes
router.use('/products', productRoutes);

// FAQ routes
router.use('/faqs', faqRoutes);

// Agent routes
router.use('/agent', agentRoutes);

// Service routes
router.use('/services', serviceRoutes);

// Chat routes (original OpenAI implementation)
router.use('/chat', chatRoutes);

// LangChain chat routes (new enhanced implementation)
router.use('/langchain', langchainChatRoutes);

export default router;

export {
    authRoutes, embeddingRoutes, faqRoutes,
    langchainChatRoutes,
    productRoutes,
    serviceRoutes
};
