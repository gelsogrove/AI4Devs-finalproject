import { Router } from 'express';
import faqController from '../controllers/faq.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', faqController.getFAQs.bind(faqController));

router.get('/public', faqController.getPublicFAQs.bind(faqController));

router.get('/categories', faqController.getCategories.bind(faqController));

router.get('/:id', faqController.getFAQById.bind(faqController));

router.post('/', authenticate, faqController.createFAQ.bind(faqController));

router.put('/:id', authenticate, faqController.updateFAQ.bind(faqController));

router.delete('/:id', authenticate, faqController.deleteFAQ.bind(faqController));

// Generate embeddings for all FAQs
router.post('/embeddings', faqController.generateEmbeddings.bind(faqController));

// Generate embeddings for a specific FAQ
router.post('/:faqId/embeddings', faqController.generateEmbeddings.bind(faqController));

export default router; 