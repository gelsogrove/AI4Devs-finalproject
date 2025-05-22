import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import productController from '../../src/controllers/product.controller';
import { Product } from '../../src/domain/entities/Product';
import { Price } from '../../src/domain/valueObjects/Price';
import { ProductId } from '../../src/domain/valueObjects/ProductId';
import { ProductName } from '../../src/domain/valueObjects/ProductName';
import productService from '../../src/services/product.service';

// Mock the product service module
jest.mock('../../src/services/product.service');

// Mock JWT verification
jest.mock('jsonwebtoken');

// Mock middleware di autenticazione
jest.mock('../../src/middlewares/auth.middleware', () => ({
  authenticate: jest.fn((req, res, next) => next()),
}));

// Create a factory function for mocking products
function createMockProduct(id: string, name: string, description: string, price: number, imageUrl: string, category: string) {
  return new Product(
    new ProductId(id),
    new ProductName(name),
    description,
    new Price(price),
    imageUrl,
    category,
    new Date(),
    new Date()
  );
}

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
    app.get('/api/products', productController.getProducts.bind(productController));
    app.get('/api/products/categories', productController.getCategories.bind(productController));
    app.get('/api/products/:id', productController.getProductById.bind(productController));
    app.post('/api/products', productController.createProduct.bind(productController));
    app.put('/api/products/:id', productController.updateProduct.bind(productController));
    app.delete('/api/products/:id', productController.deleteProduct.bind(productController));
    
    // Debug middleware
    app.use((req, res, next) => {
      console.log(`Route not matched: ${req.method} ${req.path}`);
      next();
    });
    
    // Error handling middleware
    app.use((err: any, req: any, res: any, next: any) => {
      console.error('Integration test error:', err);
      res.status(500).json({ error: err.message || 'Internal Server Error' });
    });
    
    // Create a valid JWT token for testing
    authToken = 'Bearer mockToken';
    
    // Mock JWT verify
    (jwt.verify as jest.Mock) = jest.fn().mockImplementation((token, secret) => ({
      userId: mockUserId,
    }));
  });
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock successful authentication
    const product1 = createMockProduct(
      'product1',
      'Test Product 1',
      'Description 1',
      19.99,
      'https://example.com/image1.jpg',
      'Electronics'
    );
    
    const product2 = createMockProduct(
      'product2',
      'Test Product 2',
      'Description 2',
      29.99,
      'https://example.com/image2.jpg',
      'Books'
    );
    
    jest.spyOn(productService, 'getProducts').mockResolvedValue({
      data: [product1, product2],
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1
      }
    });
    
    // Setup auth token
    authToken = 'Bearer test-token';
  });
  
  describe('GET /api/products', () => {
    it('should return a list of products', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', authToken);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
    
    it('should filter products by category', async () => {
      const filteredProduct = createMockProduct(
        'product1',
        'Test Product 1',
        'Description 1',
        19.99,
        'https://example.com/image1.jpg',
        'Electronics'
      );
      
      const mockFilteredProducts = {
        data: [filteredProduct],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1
        }
      };
      
      jest.spyOn(productService, 'getProducts').mockResolvedValue(mockFilteredProducts);
      
      const response = await request(app)
        .get('/api/products?category=Electronics')
        .set('Authorization', authToken);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].category).toBe('Electronics');
    });
  });
  
  describe('GET /api/products/:id', () => {
    it('should return a product by ID', async () => {
      const mockProduct = createMockProduct(
        'product1',
        'Test Product 1',
        'Description 1',
        19.99,
        'https://example.com/image1.jpg',
        'Electronics'
      );
      
      jest.spyOn(productService, 'getProductById').mockResolvedValue(mockProduct);
      
      const response = await request(app)
        .get('/api/products/product1')
        .set('Authorization', authToken);
      
      expect(response.status).toBe(200);
      // Verifica solo le proprietà importanti, non le date
      expect(response.body).toMatchObject({
        id: 'product1',
        name: 'Test Product 1'
      });
    });
    
    it('should return 404 for non-existent product', async () => {
      // Mock with an error
      jest.spyOn(productService, 'getProductById').mockImplementation(() => {
        throw new Error('Product not found');
      });
      
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
        description: 'New product description',
        price: 39.99,
        imageUrl: 'https://example.com/new.jpg',
        category: 'New Category'
      };
      
      const createdProduct = createMockProduct(
        'new-product-id',
        newProduct.name,
        newProduct.description,
        newProduct.price,
        newProduct.imageUrl,
        newProduct.category
      );
      
      jest.spyOn(productService, 'createProduct').mockResolvedValue(createdProduct);
      
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', authToken)
        .send(newProduct);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('product');
      // Verifica solo le proprietà importanti, non le date
      expect(response.body.product).toMatchObject({
        id: 'new-product-id',
        name: 'New Product',
        price: 39.99
      });
    });
    
    it('should return 400 for invalid product data', async () => {
      const invalidProduct = {
        name: 'A', // troppo corto
        price: -10 // prezzo negativo
      };
      
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', authToken)
        .send(invalidProduct);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation error');
    });
  });
  
  describe('PUT /api/products/:id', () => {
    it('should update an existing product', async () => {
      const productId = 'product1';
      const updateData = {
        name: 'Updated Product',
        price: 45.99
      };
      
      const existingProduct = createMockProduct(
        productId,
        'Test Product 1',
        'Description 1',
        19.99,
        'https://example.com/image1.jpg',
        'Electronics'
      );
      
      const updatedProduct = createMockProduct(
        productId,
        updateData.name,
        'Description 1',
        updateData.price,
        'https://example.com/image1.jpg',
        'Electronics'
      );
      
      jest.spyOn(productService, 'getProductById').mockResolvedValue(existingProduct);
      jest.spyOn(productService, 'updateProduct').mockResolvedValue(updatedProduct);
      
      const response = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', authToken)
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('product');
      // Verifica solo le proprietà importanti, non le date
      expect(response.body.product).toMatchObject({
        id: productId,
        name: updateData.name,
        price: updateData.price
      });
    });
    
    it('should return 404 for non-existent product', async () => {
      // Mock with an error
      jest.spyOn(productService, 'updateProduct').mockImplementation(() => {
        throw new Error('Product not found');
      });
      
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
      // Mock the delete method
      const mockResult = { success: true, message: 'Product deleted successfully' };
      jest.spyOn(productService, 'deleteProduct').mockResolvedValue(mockResult);
      
      const response = await request(app)
        .delete('/api/products/product1')
        .set('Authorization', authToken);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
    
    it('should return 404 for non-existent product', async () => {
      // Mock with an error
      jest.spyOn(productService, 'deleteProduct').mockImplementation(() => {
        throw new Error('Product not found');
      });
      
      const response = await request(app)
        .delete('/api/products/nonexistent')
        .set('Authorization', authToken);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Product not found');
    });
  });
  
  describe('GET /api/products/categories', () => {
    it('should return product categories', async () => {
      const categories = ['Electronics', 'Books', 'Clothing'];
      
      jest.spyOn(productService, 'getCategories').mockResolvedValue(categories);
      
      const response = await request(app)
        .get('/api/products/categories')
        .set('Authorization', authToken);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toEqual(categories);
    });
  });
}); 