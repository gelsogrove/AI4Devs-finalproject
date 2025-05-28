import { Request, Response } from 'express';
import { z } from 'zod';
import embeddingService from '../services/embedding.service';
import faqService from '../services/faq.service';
import logger from '../utils/logger';

// Validation schemas
const createFAQSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters'),
  answer: z.string().min(10, 'Answer must be at least 10 characters'),
});

const updateFAQSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters').optional(),
  answer: z.string().min(10, 'Answer must be at least 10 characters').optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

const filtersSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().positive().optional(),
  limit: z.coerce.number().positive().max(100).optional(),
});

class FAQController {
  /**
   * Create a new FAQ
   */
  async createFAQ(req: Request, res: Response) {
    try {
      // Validate request body
      const validatedData = createFAQSchema.parse(req.body);
      
      // Create FAQ
      const faq = await faqService.createFAQ(validatedData);
      
      return res.status(201).json({
        message: 'FAQ created successfully',
        faq,
      });
    } catch (error) {
      logger.error('Create FAQ error:', error);
      
      // Handle validation errors
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      
      // Handle service errors
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      
      return res.status(500).json({ error: 'An unexpected error occurred' });
    }
  }

  /**
   * Get all FAQs with optional filters (admin view)
   */
  async getFAQs(req: Request, res: Response) {
    try {
      // Validate and extract query parameters
      const { search, page = 1, limit = 10 } = filtersSchema.parse(req.query);
      
      // Get FAQs with filters
      const result = await faqService.getFAQs(
        { search },
        page,
        limit
      );
      
      return res.status(200).json(result);
    } catch (error) {
      logger.error('Get FAQs error:', error);
      
      // Handle validation errors
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      
      return res.status(500).json({ error: 'Failed to get FAQs' });
    }
  }

  /**
   * Get all FAQs (public view)
   */
  async getPublicFAQs(req: Request, res: Response) {
    try {
      const faqs = await faqService.getAllFAQs();
      
      return res.status(200).json(faqs);
    } catch (error) {
      logger.error('Get public FAQs error:', error);
      
      return res.status(500).json({ error: 'Failed to get FAQs' });
    }
  }

  /**
   * Get an FAQ by ID
   */
  async getFAQById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const faq = await faqService.getFAQById(id);
      
      return res.status(200).json(faq);
    } catch (error) {
      logger.error('Get FAQ by ID error:', error);
      
      if (error instanceof Error && error.message === 'FAQ not found') {
        return res.status(404).json({ error: 'FAQ not found' });
      }
      
      return res.status(500).json({ error: 'Failed to get FAQ' });
    }
  }

  /**
   * Update an FAQ
   */
  async updateFAQ(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Validate request body
      const validatedData = updateFAQSchema.parse(req.body);
      
      // Update FAQ
      const faq = await faqService.updateFAQ(id, validatedData);
      
      return res.status(200).json({
        message: 'FAQ updated successfully',
        faq,
      });
    } catch (error) {
      logger.error('Update FAQ error:', error);
      
      // Handle validation errors
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      
      // Handle not found error
      if (error instanceof Error && error.message === 'FAQ not found') {
        return res.status(404).json({ error: 'FAQ not found' });
      }
      
      // Handle other errors
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      
      return res.status(500).json({ error: 'An unexpected error occurred' });
    }
  }

  /**
   * Delete an FAQ
   */
  async deleteFAQ(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const result = await faqService.deleteFAQ(id);
      
      return res.status(200).json(result);
    } catch (error) {
      logger.error('Delete FAQ error:', error);
      
      // Handle not found error
      if (error instanceof Error && error.message === 'FAQ not found') {
        return res.status(404).json({ error: 'FAQ not found' });
      }
      
      return res.status(500).json({ error: 'Failed to delete FAQ' });
    }
  }

  /**
   * Generate embeddings for all FAQs or a specific FAQ
   */
  async generateEmbeddings(req: Request, res: Response) {
    try {
      const { faqId } = req.params;

      if (faqId) {
        // Generate embeddings for a specific FAQ
        await embeddingService.generateEmbeddingsForFAQ(faqId);
        return res.json({ message: `Embeddings generated for FAQ ${faqId}` });
      } else {
        // Get all FAQs
        const faqs = await faqService.getAllFAQs();
        
        // Generate embeddings for each FAQ
        for (const faq of faqs) {
          await embeddingService.generateEmbeddingsForFAQ(faq.id);
        }
        
        return res.json({ message: `Embeddings generated for ${faqs.length} FAQs` });
      }
    } catch (error) {
      logger.error('Error generating embeddings:', error);
      return res.status(500).json({ error: 'Failed to generate embeddings' });
    }
  }

  /**
   * Get all FAQ categories
   */
  async getCategories(req: Request, res: Response) {
    try {
      const categories = await faqService.getCategories();
      return res.json(categories);
    } catch (error) {
      logger.error('Error getting FAQ categories:', error);
      return res.status(500).json({ error: 'Failed to get categories' });
    }
  }
}

export default new FAQController(); 