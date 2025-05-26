import { Router } from 'express';
import embeddingController from '../controllers/embedding.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Routes that require authentication
router.post('/faqs/generate-all', authenticate, embeddingController.generateEmbeddingsForAllFAQs);
router.post('/faqs/:id/generate', authenticate, embeddingController.generateEmbeddingForFAQ);

// Public route for semantic search
router.get('/faqs/search', embeddingController.searchFAQs);

export default router; 