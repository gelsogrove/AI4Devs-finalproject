import { PrismaClient } from '@prisma/client';
import { FAQFilters } from '../domain';
import embeddingService from '../services/embedding.service';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Get FAQs with optional filters
 */
export const getFAQs = async (filters: FAQFilters) => {
  try {
    const { search, isActive } = filters;

    // Always use embedding search if search term is provided
    if (search) {
      try {
        logger.info(`Using embedding search for FAQs with query: ${search}`);
        // Use embedding search - we have embeddings in the database
        const faqs = await embeddingService.searchFAQs(search);

        logger.info(`Embedding search found ${faqs.length} FAQs for query: ${search}`);
        
        return {
          total: faqs.length,
          faqs: faqs.map(faq => ({
            id: faq.id,
            question: faq.question,
            answer: faq.answer
          }))
        };
      } catch (embeddingError) {
        logger.error('Embedding search failed completely:', embeddingError);
        // Return empty results instead of falling back to text search
        // This forces the system to use the cascade logic properly
        return {
          total: 0,
          faqs: [],
          error: 'FAQ search temporarily unavailable'
        };
      }
    }

    // If no search term, return all active FAQs
    const where: any = {
      isActive: isActive !== undefined ? isActive : true
    };

    const faqs = await prisma.fAQ.findMany({
      where,
      orderBy: {
        question: 'asc'
      }
    });
    
    return {
      total: faqs.length,
      faqs: faqs.map(faq => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer
      }))
    };
  } catch (error) {
    logger.error('Error getting FAQs:', error);
    return {
      error: 'Failed to fetch FAQs',
      total: 0,
      faqs: []
    };
  }
}; 