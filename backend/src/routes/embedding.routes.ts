import { Router } from 'express';
import embeddingController from '../controllers/embedding.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Routes that require authentication
router.post('/faqs/generate-all', authenticate, embeddingController.generateEmbeddingsForAllFAQs);
router.post('/faqs/:id/generate', authenticate, embeddingController.generateEmbeddingForFAQ);

// Public route for semantic search
router.get('/faqs/search', embeddingController.searchFAQs);

// Public route for regenerating embeddings (for testing)
router.post('/faqs/regenerate-all', embeddingController.generateEmbeddingsForAllFAQs);
router.post('/faqs/clear-and-regenerate', embeddingController.clearAndRegenerateEmbeddings);

// Debug routes
router.get('/faqs/debug/chunks', embeddingController.debugFAQChunks);
router.get('/faqs/debug/chunks/:faqId', embeddingController.debugFAQChunks);
router.get('/faqs/debug/similarity', embeddingController.debugSimilarity);

export default router; 