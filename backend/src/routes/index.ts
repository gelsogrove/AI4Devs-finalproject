import { Router } from 'express';
import agentRoutes from './agent.routes';
import authRoutes from './auth.routes';
import chatRoutes from './chat.routes';
import embeddingRoutes from './embedding.routes';
import faqRoutes from './faq.routes';
import productRoutes from './product.routes';
import serviceRoutes from './service.routes';

const router = Router();

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

// Chat routes
router.use('/chat', chatRoutes);

export default router;

export {
    authRoutes, embeddingRoutes, faqRoutes,
    productRoutes,
    serviceRoutes
};
