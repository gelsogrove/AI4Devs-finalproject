import { PrismaClient } from '@prisma/client';
import { ServiceFilters } from '../domain';
import embeddingService from '../services/embedding.service';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Get services with optional filters
 */
export const getServices = async (filters: ServiceFilters) => {
  try {
    const { search, isActive } = filters;
    
    // Always use embedding search if search term is provided
    if (search) {
      try {
        logger.info(`Using embedding search for services with query: ${search}`);
        // Use ServiceChunk embedding search - we have chunks in the database
        const services = await embeddingService.searchServiceChunks(search);

        logger.info(`Embedding search found ${services.length} services for query: ${search}`);
        
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
        logger.error('Service embedding search failed completely:', embeddingError);
        // Return empty results instead of falling back to text search
        // This forces the system to use the cascade logic properly
        return {
          total: 0,
          services: [],
          error: 'Service search temporarily unavailable'
        };
      }
    }

    // If no search term, return all services
    const where: any = {
      isActive: isActive !== undefined ? isActive : true
    };
    
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
}; 