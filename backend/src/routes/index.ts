import { Router } from 'express';
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

export default router; 