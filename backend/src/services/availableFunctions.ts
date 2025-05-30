import { PrismaClient } from '@prisma/client';
import { FAQFilters, ProductFilters, ServiceFilters } from '../domain';
import logger from '../utils/logger';
import embeddingService from './embedding.service';

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
      const { category, search, countOnly, isActive } = filters;
      
      logger.info(`getProducts called with filters:`, { category, search, countOnly, isActive });
      
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
  },
  
  /**
   * Get services with optional filters
   */
  getServices: async (filters: ServiceFilters) => {
    try {
      const { search, isActive } = filters;
      
      if (search) {
        try {
          // Use embedding search if search term is provided
          const services = await embeddingService.searchServices(search);

          // Filter by isActive if specified
          const filteredServices = typeof isActive === 'boolean' 
            ? services.filter(s => s.isActive === isActive)
            : services;

          return {
            total: filteredServices.length,
            services: filteredServices.map(s => ({
              id: s.id,
              name: s.name,
              description: s.description,
              price: s.price.toString(),
              isActive: s.isActive
            }))
          };
        } catch (embeddingError) {
          // Log error and fall back to regular search
          logger.error('Service embedding search failed, falling back to text search:', embeddingError);
          
          // Continue with regular search below
        }
      }

      // If no search term or embedding search failed, use regular filtering
      const where: any = {};
      
      // Add isActive filter if provided
      if (typeof isActive === 'boolean') {
        where.isActive = isActive;
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
                equals: keyword
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
          isActive: s.isActive
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
      const { search, isActive } = filters;

      if (search) {
        try {
          // Use embedding search if search term is provided
          const faqs = await embeddingService.searchFAQs(search);

          // Check if embedding search found relevant results
          // Only use embedding results if we have good quality results
          if (faqs && faqs.length > 0) {
            // For now, always fall back to text search due to API key issues
            // This ensures we get reliable results
            logger.info('Embedding search returned results, but falling back to text search for reliability');
          }
        } catch (embeddingError) {
          // Log error and fall back to regular search
          logger.error('Embedding search failed, falling back to text search:', embeddingError);
        }
      }

      // Always use text search for now (due to embedding API key issues)
      const where: any = {
        isActive: isActive !== undefined ? isActive : true  // Default to true, but allow override
      };
      
      // Add text search if search term is provided
      if (search) {
        where.OR = [
          {
            question: {
              contains: search,
              mode: 'insensitive'
            }
          },
          {
            answer: {
              contains: search,
              mode: 'insensitive'
            }
          }
        ];
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
  },

  /**
   * Get company profile information
   * Used when customers ask about company location, website, opening hours, etc.
   * Note: Phone number is excluded as it's used for WhatsApp configuration
   */
  getProfile: async () => {
    try {
      logger.info('getProfile called');
      
      const profile = await prisma.profile.findFirst();
      
      if (!profile) {
        logger.warn('No profile found in database');
        return {
          error: 'Company profile not found'
        };
      }
      
      // Return profile information excluding phone number for privacy
      return {
        companyName: profile.companyName,
        description: profile.description,
        website: profile.website,
        email: profile.email,
        openingTime: profile.openingTime,
        address: profile.address,
        sector: profile.sector
      };
    } catch (error) {
      logger.error('Error getting profile:', error);
      return {
        error: 'Failed to fetch company profile'
      };
    }
  },

  /**
   * Get company information (alias for getProfile)
   * Used when customers ask about company name, phone, email, address, timing, business sector, description
   */
  getCompanyInfo: async () => {
    try {
      logger.info('getCompanyInfo called (alias for getProfile)');
      
      const profile = await prisma.profile.findFirst();
      
      if (!profile) {
        logger.warn('No profile found in database');
        return {
          error: 'Company profile not found'
        };
      }
      
      // Return profile information excluding phone number for privacy
      return {
        companyName: profile.companyName,
        description: profile.description,
        website: profile.website,
        email: profile.email,
        openingTime: profile.openingTime,
        address: profile.address,
        sector: profile.sector,
        total: 1 // For consistency with other functions
      };
    } catch (error) {
      logger.error('Error getting company info:', error);
      return {
        error: 'Failed to fetch company information',
        total: 0
      };
    }
  },

  /**
   * Get documents with optional filters
   */
  getDocuments: async (filters: { search?: string; path?: string; limit?: number; isActive?: boolean }) => {
    try {
      const { search, path, limit = 5, isActive } = filters;
      
      logger.info(`getDocuments called with filters:`, { search, path, limit, isActive });
      
      // If we have a search query, try embedding search first
      if (search) {
        try {
          // Use embedding search for documents
          const documents = await embeddingService.searchDocuments(search, limit);
          
          // Filter by isActive if specified
          let filteredDocuments = documents;
          if (typeof isActive === 'boolean') {
            filteredDocuments = documents.filter(doc => doc.isActive === isActive);
          }
          
          // Filter by path if provided
          if (path) {
            filteredDocuments = filteredDocuments.filter(doc =>
              doc.title?.toLowerCase().includes(path.toLowerCase()) ||
              doc.originalName?.toLowerCase().includes(path.toLowerCase())
            );
          }

          return {
            documents: filteredDocuments.map(doc => ({
              id: doc.id,
              title: doc.title || doc.originalName,
              originalName: doc.originalName,
              filename: doc.filename,
              content: doc.content?.substring(0, 300) + '...' || 'No content available',
              similarity: doc.similarity || 0,
              status: doc.status,
              createdAt: doc.createdAt,
              updatedAt: doc.updatedAt
            })),
            total: filteredDocuments.length,
            searchType: 'embedding',
            query: search,
            path: path || ''
          };
        } catch (embeddingError) {
          logger.error('Document embedding search failed, falling back to text search:', embeddingError);
          // Continue with fallback below
        }
      }

      // Fallback: Get documents from database with text search
      try {
        const where: any = {
          status: 'COMPLETED',
          isActive: isActive !== undefined ? isActive : true  // Default to true, but allow override
        };

        if (search) {
          where.OR = [
            { title: { contains: search } },
            { originalName: { contains: search } },
            { metadata: { contains: search } }
          ];
        }

        const documents = await prisma.document.findMany({
          where,
          take: limit,
          orderBy: { createdAt: 'desc' }
        });

        // Filter by path if provided (using title/originalName as path indicator)
        let filteredDocuments = documents;
        if (path) {
          filteredDocuments = documents.filter(doc =>
            doc.title?.toLowerCase().includes(path.toLowerCase()) ||
            doc.originalName?.toLowerCase().includes(path.toLowerCase())
          );
        }

        logger.info(`Found ${filteredDocuments.length} documents using database search`);

        return {
          documents: filteredDocuments.map(doc => ({
            id: doc.id,
            title: doc.title || doc.originalName,
            originalName: doc.originalName,
            filename: doc.filename,
            content: doc.metadata?.substring(0, 300) + '...' || 'No content available',
            similarity: 0.5, // Default similarity for text search
            status: doc.status,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt
          })),
          total: filteredDocuments.length,
          searchType: 'text',
          query: search || '',
          path: path || ''
        };

      } catch (dbError) {
        logger.error('Database document search failed:', dbError);
        
        // Final fallback: return empty results
        return {
          documents: [],
          total: 0,
          error: 'Failed to retrieve documents',
          searchType: 'failed',
          query: search || '',
          path: path || ''
        };
      }

    } catch (error) {
      logger.error('Error in getDocuments:', error);
      return {
        documents: [],
        total: 0,
        error: 'Failed to retrieve documents'
      };
    }
  },

  /**
   * Complete an order and generate confirmation details
   * Used when customer confirms they want to complete their order
   */
  OrderCompleted: async (orderData?: {
    cartItems?: Array<{product: string, quantity: number}>;
    customerInfo?: {
      name?: string;
      address?: string;
      email?: string;
      phone?: string;
    };
  }) => {
    try {
      logger.info('OrderCompleted called with data:', orderData);
      
      // Generate unique order number
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
      
      let total = 0;
      const orderItems: Array<{product: string, quantity: number, price: number, subtotal: number}> = [];
      
      if (orderData?.cartItems) {
        // Get real product prices from database
        const productNames = orderData.cartItems.map(item => item.product);
        const products = await prisma.product.findMany({
          where: {
            name: { in: productNames },
            isActive: true
          }
        });
        
        // Group by product and sum quantities
        const cartSummary = new Map<string, number>();
        orderData.cartItems.forEach(item => {
          const existing = cartSummary.get(item.product) || 0;
          cartSummary.set(item.product, existing + item.quantity);
        });
        
        // Calculate totals with real prices from database
        Array.from(cartSummary.entries()).forEach(([productName, quantity]) => {
          const product = products.find(p => p.name === productName);
          if (product) {
            const price = parseFloat(product.price.toString());
            const subtotal = price * quantity;
            total += subtotal;
            
            orderItems.push({
              product: productName,
              quantity,
              price,
              subtotal
            });
          } else {
            logger.warn(`Product not found in database: ${productName}`);
            // Add item with 0 price if product not found
            orderItems.push({
              product: productName,
              quantity,
              price: 0,
              subtotal: 0
            });
          }
        });
      }
      
      // Generate estimated delivery date (3-5 business days)
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + Math.floor(Math.random() * 3) + 3);
      
      const orderConfirmation = {
        orderNumber,
        status: 'CONFIRMED',
        items: orderItems,
        total: parseFloat(total.toFixed(2)),
        currency: 'EUR',
        estimatedDelivery: deliveryDate.toLocaleDateString('it-IT', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        customerInfo: orderData?.customerInfo || {
          name: 'Cliente',
          address: 'Da specificare',
          email: 'da.specificare@email.com'
        },
        paymentMethod: 'Pagamento alla consegna',
        shippingMethod: 'Corriere espresso',
        notes: 'Ordine confermato! Riceverai una email di conferma a breve.',
        timestamp: new Date().toISOString()
      };
      
      logger.info(`Order completed successfully: ${orderNumber}`);
      
      return {
        success: true,
        total: 1, // Indicate one order was created
        order: orderConfirmation,
        message: `Ordine ${orderNumber} confermato con successo!`
      };
      
    } catch (error) {
      logger.error('Error completing order:', error);
      return {
        success: false,
        error: 'Failed to complete order',
        message: 'Si è verificato un errore durante la conferma dell\'ordine. Riprova.'
      };
    }
  }
}; 