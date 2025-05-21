import { PrismaClient } from '@prisma/client';
import productService from '../../src/services/product.service';

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockProductFindMany = jest.fn();
  const mockProductCount = jest.fn();
  const mockProductCreate = jest.fn();
  const mockProductFindUnique = jest.fn();
  const mockProductUpdate = jest.fn();
  const mockProductDelete = jest.fn();
  
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      product: {
        findMany: mockProductFindMany,
        count: mockProductCount,
        create: mockProductCreate,
        findUnique: mockProductFindUnique,
        update: mockProductUpdate,
        delete: mockProductDelete,
      },
      $disconnect: jest.fn(),
    })),
  };
});

describe('Product Service', () => {
  let prisma: PrismaClient;
  
  beforeEach(() => {
    prisma = new PrismaClient();
    jest.clearAllMocks();
  });
  
  const mockProduct = {
    id: '123',
    name: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    imageUrl: 'https://example.com/image.jpg',
    category: 'Test Category',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      const createData = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        imageUrl: 'https://example.com/image.jpg',
        category: 'Test Category',
      };
      
      (prisma.product.create as jest.Mock).mockResolvedValue(mockProduct);
      
      const result = await productService.createProduct(createData);
      
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: createData,
      });
      
      expect(result).toEqual(mockProduct);
    });
    
    it('should throw an error if creation fails', async () => {
      const createData = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        imageUrl: 'https://example.com/image.jpg',
        category: 'Test Category',
      };
      
      const error = new Error('Database error');
      (prisma.product.create as jest.Mock).mockRejectedValue(error);
      
      await expect(productService.createProduct(createData)).rejects.toThrow('Failed to create product');
    });
  });
  
  describe('getProducts', () => {
    it('should get products with pagination', async () => {
      const mockProducts = [mockProduct];
      const mockTotal = 1;
      
      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (prisma.product.count as jest.Mock).mockResolvedValue(mockTotal);
      
      const result = await productService.getProducts();
      
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      
      expect(prisma.product.count).toHaveBeenCalledWith({ where: {} });
      
      expect(result).toEqual({
        data: mockProducts,
        pagination: {
          page: 1,
          limit: 10,
          total: mockTotal,
          totalPages: Math.ceil(mockTotal / 10),
        },
      });
    });
    
    it('should apply filters correctly', async () => {
      const filters = {
        category: 'Electronics',
        minPrice: 50,
        maxPrice: 200,
        search: 'test',
      };
      
      (prisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);
      (prisma.product.count as jest.Mock).mockResolvedValue(1);
      
      await productService.getProducts(filters);
      
      const expectedWhere = {
        category: 'Electronics',
        price: {
          gte: 50,
          lte: 200,
        },
        OR: [
          { name: { contains: 'test', mode: 'insensitive' } },
          { description: { contains: 'test', mode: 'insensitive' } },
        ],
      };
      
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expectedWhere,
        })
      );
      
      expect(prisma.product.count).toHaveBeenCalledWith({ where: expectedWhere });
    });
  });
  
  describe('getProductById', () => {
    it('should return a product when found', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      
      const result = await productService.getProductById('123');
      
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: '123' },
      });
      
      expect(result).toEqual(mockProduct);
    });
    
    it('should throw an error when product not found', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);
      
      await expect(productService.getProductById('999')).rejects.toThrow('Product not found');
    });
  });
  
  describe('updateProduct', () => {
    it('should update a product successfully', async () => {
      const updateData = {
        name: 'Updated Product',
        price: 129.99,
      };
      
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.product.update as jest.Mock).mockResolvedValue({
        ...mockProduct,
        ...updateData,
      });
      
      const result = await productService.updateProduct('123', updateData);
      
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: '123' },
      });
      
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: updateData,
      });
      
      expect(result).toEqual({
        ...mockProduct,
        ...updateData,
      });
    });
    
    it('should throw an error when product not found', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);
      
      await expect(productService.updateProduct('999', { name: 'Updated' })).rejects.toThrow('Product not found');
      expect(prisma.product.update).not.toHaveBeenCalled();
    });
  });
  
  describe('deleteProduct', () => {
    it('should delete a product successfully', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.product.delete as jest.Mock).mockResolvedValue(mockProduct);
      
      const result = await productService.deleteProduct('123');
      
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: '123' },
      });
      
      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: '123' },
      });
      
      expect(result).toEqual({ success: true, message: 'Product deleted successfully' });
    });
    
    it('should throw an error when product not found', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);
      
      await expect(productService.deleteProduct('999')).rejects.toThrow('Product not found');
      expect(prisma.product.delete).not.toHaveBeenCalled();
    });
  });
  
  describe('getCategories', () => {
    it('should return distinct categories', async () => {
      const categoryResults = [
        { category: 'Electronics' },
        { category: 'Clothing' },
        { category: 'Books' },
      ];
      
      (prisma.product.findMany as jest.Mock).mockResolvedValue(categoryResults);
      
      const result = await productService.getCategories();
      
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        select: { category: true },
        distinct: ['category'],
      });
      
      expect(result).toEqual(['Electronics', 'Clothing', 'Books']);
    });
  });
}); 