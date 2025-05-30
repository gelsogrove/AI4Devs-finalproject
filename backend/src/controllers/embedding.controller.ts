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

  /**
   * Debug endpoint to check FAQ chunks and embeddings
   */
  async debugFAQChunks(req: Request, res: Response) {
    try {
      const { faqId } = req.params;
      
      if (faqId) {
        // Get chunks for specific FAQ
        const chunks = await embeddingService.getFAQChunks(faqId);
        return res.status(200).json({
          faqId,
          chunks: chunks.map(chunk => ({
            id: chunk.id,
            content: chunk.content,
            hasEmbedding: !!chunk.embedding,
            embeddingLength: chunk.embedding ? JSON.parse(chunk.embedding).length : 0
          }))
        });
      } else {
        // Get all chunks
        const allChunks = await embeddingService.getAllFAQChunks();
        return res.status(200).json({
          total: allChunks.length,
          chunks: allChunks.map(chunk => ({
            id: chunk.id,
            faqId: chunk.faqId,
            content: chunk.content.substring(0, 100) + '...',
            hasEmbedding: !!chunk.embedding,
            embeddingLength: chunk.embedding ? JSON.parse(chunk.embedding).length : 0,
            faqQuestion: chunk.faq?.question || 'Unknown'
          }))
        });
      }
    } catch (error) {
      logger.error('Error debugging FAQ chunks:', error);
      return res.status(500).json({ error: 'Failed to debug FAQ chunks' });
    }
  }

  /**
   * Debug endpoint to test similarity calculation
   */
  async debugSimilarity(req: Request, res: Response) {
    try {
      const { query } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Search query is required' });
      }
      
      const results = await embeddingService.debugSearchFAQs(query);
      
      return res.status(200).json(results);
    } catch (error) {
      logger.error('Error debugging similarity:', error);
      return res.status(500).json({ error: 'Failed to debug similarity' });
    }
  }

  /**
   * Clear all FAQ chunks and regenerate embeddings
   */
  async clearAndRegenerateEmbeddings(req: Request, res: Response) {
    try {
      await embeddingService.clearAllFAQChunks();
      await embeddingService.generateEmbeddingsForAllFAQs();
      
      return res.status(200).json({
        success: true,
        message: 'All FAQ chunks cleared and embeddings regenerated',
      });
    } catch (error) {
      logger.error('Error clearing and regenerating embeddings:', error);
      return res.status(500).json({ error: 'Failed to clear and regenerate embeddings' });
    }
  }
}

export default new EmbeddingController(); 