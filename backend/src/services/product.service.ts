import { PrismaClient } from '@prisma/client';
import { CreateProductDto, ProductFilters, UpdateProductDto } from '../domain/product.interface';
import logger from '../utils/logger';

const prisma = new PrismaClient();

class ProductService {
  /**
   * Create a new product
   */
  async createProduct(productData: CreateProductDto) {
    try {
      const product = await prisma.product.create({
        data: productData,
      });
      return product;
    } catch (error) {
      logger.error('Error creating product:', error);
      throw new Error('Failed to create product');
    }
  }

  /**
   * Get all products with optional filters
   */
  async getProducts(filters?: ProductFilters, page = 1, limit = 10) {
    try {
      const where: any = {};
      
      // Apply category filter if provided
      if (filters?.category) {
        where.category = filters.category;
      }
      
      // Apply price range filters if provided
      if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
        where.price = {};
        if (filters.minPrice !== undefined) {
          where.price.gte = filters.minPrice;
        }
        if (filters.maxPrice !== undefined) {
          where.price.lte = filters.maxPrice;
        }
      }
      
      // Apply search filter if provided
      if (filters?.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ];
      }
      
      // Calculate pagination
      const skip = (page - 1) * limit;
      
      // Get products with pagination
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.product.count({ where }),
      ]);
      
      return {
        data: products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting products:', error);
      throw new Error('Failed to get products');
    }
  }

  /**
   * Get a product by ID
   */
  async getProductById(id: string) {
    try {
      const product = await prisma.product.findUnique({
        where: { id },
      });
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      return product;
    } catch (error) {
      logger.error(`Error getting product with ID ${id}:`, error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to get product');
    }
  }

  /**
   * Update a product
   */
  async updateProduct(id: string, productData: UpdateProductDto) {
    try {
      // First check if the product exists
      const existingProduct = await prisma.product.findUnique({
        where: { id },
      });
      
      if (!existingProduct) {
        throw new Error('Product not found');
      }
      
      // Update the product
      const updatedProduct = await prisma.product.update({
        where: { id },
        data: productData,
      });
      
      return updatedProduct;
    } catch (error) {
      logger.error(`Error updating product with ID ${id}:`, error);
      
      // Handle Prisma errors without using instanceof
      const err = error as any;
      if (err?.code === 'P2025') {
        throw new Error('Product not found');
      }
      
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update product');
    }
  }

  /**
   * Delete a product
   */
  async deleteProduct(id: string) {
    try {
      // First check if the product exists
      const existingProduct = await prisma.product.findUnique({
        where: { id },
      });
      
      if (!existingProduct) {
        throw new Error('Product not found');
      }
      
      // Delete the product
      await prisma.product.delete({
        where: { id },
      });
      
      return { success: true, message: 'Product deleted successfully' };
    } catch (error) {
      logger.error(`Error deleting product with ID ${id}:`, error);
      
      // Handle Prisma errors without using instanceof
      const err = error as any;
      if (err?.code === 'P2025') {
        throw new Error('Product not found');
      }
      
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to delete product');
    }
  }
  
  /**
   * Get distinct product categories
   */
  async getCategories() {
    try {
      const products = await prisma.product.findMany({
        select: { category: true },
        distinct: ['category'],
      });
      
      return products.map(product => product.category);
    } catch (error) {
      logger.error('Error getting product categories:', error);
      throw new Error('Failed to get product categories');
    }
  }
}

export default new ProductService(); 