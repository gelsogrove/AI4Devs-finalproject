import { PrismaClient } from '@prisma/client';
import { FAQFilters, ProductFilters, ServiceFilters } from '../domain';
import logger from '../utils/logger';

const prisma = new PrismaClient();

// Filter common words that should not be used for search
const stopWords = ['il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', 'the', 'a', 'an', 'di', 'del', 'della', 'dei', 'degli', 'delle'];

/**
 * Available functions for the chat agent to call
 */
export const availableFunctions = {
  /**
   * Get products with optional filters
   */
  getProducts: async (filters: ProductFilters) => {
    try {
      const { category, search, countOnly } = filters;
      
      logger.info(`getProducts called with filters:`, { category, search, countOnly });
      
      // Base query conditions
      const where: any = {};
      
      // Add category filter if provided
      if (category) {
        where.category = {
          contains: category,
          mode: 'insensitive'
        };
      }
      
      // Add search filter if provided
      if (search) {
        // Split search into keywords for better matching
        const rawKeywords = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
        
        // Filter out stop words
        const keywords = rawKeywords.filter(word => !stopWords.includes(word));
        
        // If all words were stop words, use the original keywords
        const searchTerms = keywords.length > 0 ? keywords : rawKeywords;
        
        logger.info(`Search terms extracted:`, { original: search, processed: searchTerms });
        
        if (searchTerms.length > 0) {
          // Create OR conditions for each keyword
          where.OR = searchTerms.flatMap(keyword => {
            logger.info(`Processing search term: ${keyword}`);
            
            return [
              // Exact match - highest priority
              {
                name: {
                  equals: keyword,
                  mode: 'insensitive'
                }
              },
              // Starts with - high priority
              {
                name: {
                  startsWith: keyword,
                  mode: 'insensitive'
                }
              },
              // Contains in name - medium priority
              {
                name: {
                  contains: keyword,
                  mode: 'insensitive'
                }
              },
              // Contains in description - lower priority
              {
                description: {
                  contains: keyword,
                  mode: 'insensitive'
                }
              },
              // Contains in category - also important
              {
                category: {
                  contains: keyword,
                  mode: 'insensitive'
                }
              },
              // Check if any tag contains the keyword - high priority
              // This uses the 'has' operator for arrays in Prisma
              {
                tags: {
                  has: keyword
                }
              }
            ];
          });
        }
      }

      logger.info(`Final query where clause:`, where);

      // If countOnly is true, just return counts and categories
      if (countOnly) {
        const total = await prisma.product.count({ where });
        
        // Get category counts - in this schema, category is just a string field
        const categoryCounts: { [key: string]: number } = {};
        const products = await prisma.product.findMany({
          select: {
            category: true
          }
        });
        
        products.forEach(product => {
          if (product.category) {
            categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
          }
        });
        
        const categories = Object.entries(categoryCounts).map(([name, count]) => ({
          name,
          count
        }));
        
        return {
          total,
          categories
        };
      }
      
      // Otherwise return product details
      const products = await prisma.product.findMany({
        where,
        orderBy: {
          name: 'asc'
        }
      });
      
      logger.info(`Found ${products.length} products matching search criteria`);
      if (products.length > 0) {
        logger.info(`First product found:`, { 
          name: products[0].name,
          category: products[0].category,
          tags: (products[0] as any).tags || []
        });
      }
      
      return {
        total: products.length,
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price.toString(),
          category: p.category,
          imageUrl: p.imageUrl,
          tags: (p as any).tags || []
        }))
      };
    } catch (error) {
      logger.error('Error getting products:', error);
      return {
        error: 'Failed to fetch products',
        total: 0,
        products: []
      };
    }
  },
  
  /**
   * Get services with optional filters
   */
  getServices: async (filters: ServiceFilters) => {
    try {
      const { search, tags, isActive } = filters;
      
      // Base query conditions
      const where: any = {};
      
      // Add isActive filter if provided
      if (typeof isActive === 'boolean') {
        where.isActive = isActive;
      }
      
      // Add tags filter if provided
      if (tags && tags.length > 0) {
        // Filter services that have at least one of the provided tags
        where.tags = {
          hasSome: tags
        };
      }
      
      // Add search filter if provided
      if (search) {
        // Split search into keywords for better matching
        const rawKeywords = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
        
        // Filter out stop words
        const keywords = rawKeywords.filter(word => !stopWords.includes(word));
        
        // If all words were stop words, use the original keywords
        const searchTerms = keywords.length > 0 ? keywords : rawKeywords;
        
        if (searchTerms.length > 0) {
          // Create OR conditions for each keyword
          where.OR = searchTerms.flatMap(keyword => [
            // Exact match - highest priority
            {
              name: {
                equals: keyword,
                mode: 'insensitive'
              }
            },
            // Contains in name - medium priority
            {
              name: {
                contains: keyword,
                mode: 'insensitive'
              }
            },
            // Contains in description - lower priority
            {
              description: {
                contains: keyword,
                mode: 'insensitive'
              }
            },
            // Check if any tag contains the keyword - high priority
            {
              tags: {
                has: keyword
              }
            }
          ]);
        }
      }
      
      const services = await prisma.service.findMany({
        where,
        orderBy: {
          name: 'asc'
        }
      });
      
      return {
        total: services.length,
        services: services.map(s => ({
          id: s.id,
          name: s.name,
          description: s.description,
          price: s.price.toString(),
          isActive: s.isActive,
          tags: (s as any).tags || []
        }))
      };
    } catch (error) {
      logger.error('Error getting services:', error);
      return {
        error: 'Failed to fetch services',
        total: 0,
        services: []
      };
    }
  },
  
  /**
   * Get FAQs with optional filters
   */
  getFAQs: async (filters: FAQFilters) => {
    try {
      const { category, search, tags } = filters;
      
      // Base query conditions
      const where: any = {};
      
      // Add category filter if provided
      if (category) {
        where.category = {
          contains: category,
          mode: 'insensitive'
        };
      }
      
      // Add tags filter if provided
      if (tags && tags.length > 0) {
        // Filter FAQs that have at least one of the provided tags
        where.tags = {
          hasSome: tags
        };
      }
      
      // Add search filter if provided
      if (search) {
        // Split search into keywords for better matching
        const rawKeywords = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
        
        // Filter out stop words
        const keywords = rawKeywords.filter(word => !stopWords.includes(word));
        
        // If all words were stop words, use the original keywords
        const searchTerms = keywords.length > 0 ? keywords : rawKeywords;
        
        if (searchTerms.length > 0) {
          // Create OR conditions for each keyword
          where.OR = searchTerms.flatMap(keyword => [
            // Contains in question - high priority
            {
              question: {
                contains: keyword,
                mode: 'insensitive'
              }
            },
            // Contains in answer - medium priority
            {
              answer: {
                contains: keyword,
                mode: 'insensitive'
              }
            },
            // Contains in category - lower priority
            {
              category: {
                contains: keyword,
                mode: 'insensitive'
              }
            },
            // Check if any tag contains the keyword - high priority
            {
              tags: {
                has: keyword
              }
            }
          ]);
        }
      }
      
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
          answer: faq.answer,
          category: faq.category || '',
          tags: (faq as any).tags || []
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
  }
}; 