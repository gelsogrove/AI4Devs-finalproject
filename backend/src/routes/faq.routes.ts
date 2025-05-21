import { Router } from 'express';
import faqController from '../controllers/faq.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Public routes - No authentication required
router.get('/', faqController.getFAQs);
router.get('/public', faqController.getPublicFAQs);
router.get('/categories', faqController.getCategories);
router.get('/:id', faqController.getFAQById);

// Protected routes - Authentication required
router.post('/', authenticate, faqController.createFAQ);
router.put('/:id', authenticate, faqController.updateFAQ);
router.delete('/:id', authenticate, faqController.deleteFAQ);
router.patch('/:id/toggle-status', authenticate, faqController.toggleFAQStatus);

export default router; 