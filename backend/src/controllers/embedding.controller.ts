import { Request, Response } from 'express';
import embeddingService from '../services/embedding.service';
import logger from '../utils/logger';

class EmbeddingController {
  /**
   * Generate embeddings for a specific FAQ
   */
  async generateEmbeddingForFAQ(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await embeddingService.generateEmbeddingsForFAQ(id);
      
      return res.status(200).json({
        success: true,
        message: 'Embeddings generated successfully',
      });
    } catch (error) {
      logger.error('Error generating embeddings for FAQ:', error);
      
      if (error instanceof Error && error.message === 'FAQ not found') {
        return res.status(404).json({ error: 'FAQ not found' });
      }
      
      return res.status(500).json({ error: 'Failed to generate embeddings' });
    }
  }
  
  /**
   * Generate embeddings for all FAQs
   */
  async generateEmbeddingsForAllFAQs(req: Request, res: Response) {
    try {
      await embeddingService.generateEmbeddingsForAllFAQs();
      
      return res.status(200).json({
        success: true,
        message: 'Embeddings generated for all FAQs',
      });
    } catch (error) {
      logger.error('Error generating embeddings for all FAQs:', error);
      return res.status(500).json({ error: 'Failed to generate embeddings for all FAQs' });
    }
  }
  
  /**
   * Search FAQs using semantic similarity
   */
  async searchFAQs(req: Request, res: Response) {
    try {
      const { query } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Search query is required' });
      }
      
      const results = await embeddingService.searchFAQs(query);
      
      return res.status(200).json(results);
    } catch (error) {
      logger.error('Error searching FAQs with embeddings:', error);
      return res.status(500).json({ error: 'Failed to search FAQs' });
    }
  }
}

export default new EmbeddingController(); 