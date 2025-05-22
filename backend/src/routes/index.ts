import { Router } from 'express';
import agentRoutes from './agent.routes';
import authRoutes from './auth.routes';
import faqRoutes from './faq.routes';
import productRoutes from './product.routes';

const router = Router();

// Auth routes
router.use('/auth', authRoutes);

// Product routes
router.use('/products', productRoutes);

// FAQ routes
router.use('/faqs', faqRoutes);

// Agent routes
router.use('/agent', agentRoutes);

export default router; 