import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

interface ProductFilters {
  category?: string;
  search?: string;
  countOnly?: boolean;
}

interface ServiceFilters {
  isActive?: boolean;
  search?: string;
}

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
      
      // Base query conditions
      const where: any = {};
      
      // Add category filter if provided
      if (category) {
        where.category = {
          equals: category,
          mode: 'insensitive'
        };
      }
      
      // Add search filter if provided
      if (search) {
        where.OR = [
          {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          },
          {
            description: {
              contains: search,
              mode: 'insensitive'
            }
          }
        ];
      }

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
      
      return {
        total: products.length,
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price.toString(),
          category: p.category,
          imageUrl: p.imageUrl
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
      const { isActive = true, search } = filters;
      
      // Base query conditions
      const where: any = {
        isActive
      };
      
      // Add search filter if provided
      if (search) {
        where.OR = [
          {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          },
          {
            description: {
              contains: search,
              mode: 'insensitive'
            }
          }
        ];
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
  }
}; 