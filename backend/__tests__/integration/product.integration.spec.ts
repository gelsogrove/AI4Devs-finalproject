import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

// Importare il controller e il service
import productController from '../../src/controllers/product.controller';
import productService from '../../src/services/product.service';

// Mock del service
jest.mock('../../src/services/product.service');

// Mock JWT verification
jest.mock('jsonwebtoken');

// Mock middleware di autenticazione
jest.mock('../../src/middlewares/auth.middleware', () => ({
  authenticate: jest.fn((req, res, next) => next()),
}));

describe('Product API Integration Tests', () => {
  const mockUserId = 'user123';
  let authToken: string;
  let app: express.Application;
  
  beforeAll(async () => {
    // Create and setup Express app directly
    app = express();
    
    // Middleware
    app.use(express.json());
    
    // Set up product routes manually
    app.get('/api/products', productController.getProducts);
    app.get('/api/products/categories', productController.getCategories);
    app.get('/api/products/:id', productController.getProductById);
    app.post('/api/products', productController.createProduct);
    app.put('/api/products/:id', productController.updateProduct);
    app.delete('/api/products/:id', productController.deleteProduct);
    
    // Debug middleware
    app.use((req, res, next) => {
      console.log(`Route not matched: ${req.method} ${req.path}`);
      next();
    });
    
    // Create a valid JWT token for testing
    authToken = 'Bearer mockToken';
    
    // Mock JWT verify
    (jwt.verify as jest.Mock) = jest.fn().mockImplementation((token, secret) => ({
      userId: mockUserId,
    }));
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/products', () => {
    it('should return a list of products', async () => {
      const mockProducts = [
        {
          id: 'product1',
          name: 'Test Product 1',
          description: 'Description 1',
          price: 99.99,
          imageUrl: 'https://example.com/image1.jpg',
          category: 'Category 1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'product2',
          name: 'Test Product 2',
          description: 'Description 2',
          price: 199.99,
          imageUrl: 'https://example.com/image2.jpg',
          category: 'Category 2',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      
      const mockResult = {
        data: mockProducts,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      };
      
      // Mock the service method
      (productService.getProducts as jest.Mock).mockResolvedValue(mockResult);
      
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', authToken);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.data).toHaveLength(2);
      expect(productService.getProducts).toHaveBeenCalled();
    });
    
    it('should filter products by category', async () => {
      const mockResult = {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };
      
      // Mock the service method
      (productService.getProducts as jest.Mock).mockResolvedValue(mockResult);
      
      await request(app)
        .get('/api/products?category=Electronics')
        .set('Authorization', authToken);
      
      expect(productService.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'Electronics',
        }),
        expect.any(Number),
        expect.any(Number)
      );
    });
  });
  
  describe('GET /api/products/:id', () => {
    it('should return a product by ID', async () => {
      const mockProduct = {
        id: 'product1',
        name: 'Test Product 1',
        description: 'Description 1',
        price: 99.99,
        imageUrl: 'https://example.com/image1.jpg',
        category: 'Category 1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Mock the service method
      (productService.getProductById as jest.Mock).mockResolvedValue(mockProduct);
      
      const response = await request(app)
        .get('/api/products/product1')
        .set('Authorization', authToken);
      
      expect(response.status).toBe(200);
      // Verifica solo le proprietà importanti, non le date
      expect(response.body).toMatchObject({
        id: mockProduct.id,
        name: mockProduct.name,
        description: mockProduct.description,
        price: mockProduct.price,
        imageUrl: mockProduct.imageUrl,
        category: mockProduct.category,
      });
      expect(productService.getProductById).toHaveBeenCalledWith('product1');
    });
    
    it('should return 404 for non-existent product', async () => {
      // Mock the service method to throw an error
      (productService.getProductById as jest.Mock).mockRejectedValue(new Error('Product not found'));
      
      const response = await request(app)
        .get('/api/products/nonexistent')
        .set('Authorization', authToken);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Product not found');
    });
  });
  
  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const newProduct = {
        name: 'New Product',
        description: 'This is a new product description',
        price: 149.99,
        imageUrl: 'https://example.com/newproduct.jpg',
        category: 'New Category',
      };
      
      const createdProduct = {
        id: 'newproductid',
        ...newProduct,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Mock the service method
      (productService.createProduct as jest.Mock).mockResolvedValue(createdProduct);
      
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', authToken)
        .send(newProduct);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('product');
      // Verifica solo le proprietà importanti, non le date
      expect(response.body.product).toMatchObject({
        id: createdProduct.id,
        name: createdProduct.name,
        description: createdProduct.description,
        price: createdProduct.price,
        imageUrl: createdProduct.imageUrl,
        category: createdProduct.category,
      });
      expect(productService.createProduct).toHaveBeenCalledWith(newProduct);
    });
    
    it('should return 400 for invalid product data', async () => {
      const invalidProduct = {
        name: 'A', // Too short
        price: -10, // Negative price
      };
      
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', authToken)
        .send(invalidProduct);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation error');
      expect(productService.createProduct).not.toHaveBeenCalled();
    });
  });
  
  describe('PUT /api/products/:id', () => {
    it('should update an existing product', async () => {
      const updateData = {
        name: 'Updated Product',
        price: 199.99,
      };
      
      const existingProduct = {
        id: 'product1',
        name: 'Test Product 1',
        description: 'Description 1',
        price: 99.99,
        imageUrl: 'https://example.com/image1.jpg',
        category: 'Category 1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const updatedProduct = {
        ...existingProduct,
        ...updateData,
        updatedAt: new Date().toISOString(),
      };
      
      // Mock the service method
      (productService.updateProduct as jest.Mock).mockResolvedValue(updatedProduct);
      
      const response = await request(app)
        .put('/api/products/product1')
        .set('Authorization', authToken)
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('product');
      // Verifica solo le proprietà importanti, non le date
      expect(response.body.product).toMatchObject({
        id: updatedProduct.id,
        name: updatedProduct.name,
        description: updatedProduct.description,
        price: updatedProduct.price,
        imageUrl: updatedProduct.imageUrl,
        category: updatedProduct.category,
      });
      expect(productService.updateProduct).toHaveBeenCalledWith('product1', updateData);
    });
    
    it('should return 404 for non-existent product', async () => {
      // Mock the service method to throw an error
      (productService.updateProduct as jest.Mock).mockRejectedValue(new Error('Product not found'));
      
      const response = await request(app)
        .put('/api/products/nonexistent')
        .set('Authorization', authToken)
        .send({ name: 'Updated Name' });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Product not found');
    });
  });
  
  describe('DELETE /api/products/:id', () => {
    it('should delete a product', async () => {
      const deleteResult = { success: true, message: 'Product deleted successfully' };
      
      // Mock the service method
      (productService.deleteProduct as jest.Mock).mockResolvedValue(deleteResult);
      
      const response = await request(app)
        .delete('/api/products/product1')
        .set('Authorization', authToken);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(productService.deleteProduct).toHaveBeenCalledWith('product1');
    });
    
    it('should return 404 for non-existent product', async () => {
      // Mock the service method to throw an error
      (productService.deleteProduct as jest.Mock).mockRejectedValue(new Error('Product not found'));
      
      const response = await request(app)
        .delete('/api/products/nonexistent')
        .set('Authorization', authToken);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Product not found');
    });
  });
  
  describe('GET /api/products/categories', () => {
    it('should return product categories', async () => {
      const categories = ['Electronics', 'Clothing', 'Books'];
      
      // Mock the service method
      (productService.getCategories as jest.Mock).mockResolvedValue(categories);
      
      const response = await request(app)
        .get('/api/products/categories')
        .set('Authorization', authToken);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toEqual(categories);
    });
  });
}); 