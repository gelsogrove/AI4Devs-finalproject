import { PrismaClient } from '@prisma/client';
import { ProductFilters } from '../domain';
import logger from '../utils/logger';

const prisma = new PrismaClient();

// Filter common words that should not be used for search
const stopWords = ['il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', 'the', 'a', 'an', 'di', 'del', 'della', 'dei', 'degli', 'delle'];

/**
 * Get products with optional filters
 */
export const getProducts = async (filters: ProductFilters) => {
  try {
    const { category, search, countOnly, isActive, minPrice, maxPrice } = filters;
    
    logger.info(`getProducts called with filters:`, { category, search, countOnly, isActive, minPrice, maxPrice });
    
    // Base query conditions
    const where: any = {
      isActive: isActive !== undefined ? isActive : true  // Default to true, but allow override
    };
    
    // Add category filter if provided
    if (category) {
      where.category = {
        contains: category
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
                equals: keyword
              }
            },
            // Starts with - high priority
            {
              name: {
                startsWith: keyword
              }
            },
            // Contains in name - medium priority
            {
              name: {
                contains: keyword
              }
            },
            // Contains in description - lower priority
            {
              description: {
                contains: keyword
              }
            },
            // Contains in category - also important
            {
              category: {
                contains: keyword
              }
            }
          ];
        });
      }
    }

    logger.info(`Final query where clause:`, where);

    // Get all products matching basic criteria
    const allProducts = await prisma.product.findMany({
      where,
      orderBy: {
        name: 'asc'
      }
    });

    // If search terms provided, also filter by tags
    let products = allProducts;
    if (search) {
      const rawKeywords = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
      const keywords = rawKeywords.filter(word => !stopWords.includes(word));
      const searchTerms = keywords.length > 0 ? keywords : rawKeywords;
      
      // Get products that match in tags
      const tagMatchedProducts = allProducts.filter(product => {
        try {
          const tags = JSON.parse(product.tagsJson || '[]');
          return searchTerms.some(term => 
            tags.some((tag: string) => 
              tag.toLowerCase().includes(term.toLowerCase())
            )
          );
        } catch {
          return false;
        }
      });
      
      // Combine results and remove duplicates
      const combinedProducts = [...allProducts, ...tagMatchedProducts];
      const uniqueProducts = combinedProducts.filter((product, index, self) => 
        index === self.findIndex(p => p.id === product.id)
      );
      
      products = uniqueProducts;
    }

    // 🔧 Apply price filters AFTER getting products
    if (minPrice !== undefined || maxPrice !== undefined) {
      products = products.filter(product => {
        const price = Number(product.price);
        
        // Check minPrice
        if (minPrice !== undefined && price < minPrice) {
          return false;
        }
        
        // Check maxPrice
        if (maxPrice !== undefined && price > maxPrice) {
          return false;
        }
        
        return true;
      });
      
      logger.info(`After price filtering (min: ${minPrice}, max: ${maxPrice}): ${products.length} products`);
    }

    // If countOnly is true, just return counts and categories
    if (countOnly) {
      const total = products.length;
      
      // Get category counts from filtered products
      const categoryCounts: { [key: string]: number } = {};
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
    
    logger.info(`Found ${products.length} products matching search criteria`);
    if (products.length > 0) {
      logger.info(`First product found:`, { 
        name: products[0].name,
        category: products[0].category,
        price: products[0].price,
        tags: JSON.parse(products[0].tagsJson || '[]')
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
        tags: JSON.parse(p.tagsJson || '[]')
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
}; 