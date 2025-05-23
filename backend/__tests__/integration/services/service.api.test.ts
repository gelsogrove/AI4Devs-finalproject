import { PrismaClient } from '@prisma/client';
import { Express } from 'express';
import request from 'supertest';
import { createApp } from '../../../src/app';
import { generateJwtToken } from '../../../src/utils/jwt';

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockService = {
    id: 'test-service-id',
    name: 'Integration Test Service',
    description: 'Service created for integration testing',
    price: 29.99,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    password: 'hashed-password',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    lastLogin: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: {
        findFirst: jest.fn().mockResolvedValue(mockUser),
        findUnique: jest.fn().mockResolvedValue(mockUser)
      },
      service: {
        findMany: jest.fn().mockResolvedValue([mockService]),
        findUnique: jest.fn().mockImplementation((args) => {
          if (args.where.id === 'test-service-id' || args.where.id === mockService.id) {
            return Promise.resolve(mockService);
          }
          return Promise.resolve(null);
        }),
        create: jest.fn().mockResolvedValue({
          id: 'new-service-id',
          name: 'Created Service',
          description: 'This service was created during integration testing',
          price: 39.99,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }),
        update: jest.fn().mockResolvedValue({
          ...mockService,
          name: 'Updated Service Name',
          price: 49.99
        }),
        delete: jest.fn().mockResolvedValue(mockService),
        count: jest.fn().mockResolvedValue(1)
      },
      $disconnect: jest.fn()
    }))
  };
});

let app: Express;
let prisma: PrismaClient;
let authToken: string = 'demo-token-test-user'; // Using the format expected by the auth middleware
let serviceId: string = 'test-service-id';

beforeAll(async () => {
  app = await createApp();
  prisma = new PrismaClient();
  
  // Create a test user and generate JWT token
  const testUser = await prisma.user.findFirst();
  if (testUser) {
    // Using generateJwtToken for JWT tests, but also setting our pre-defined token
    generateJwtToken(testUser);
    // We're keeping our simple token for the middleware which validates 'demo-token-' prefix
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Service API', () => {
  describe('GET /services', () => {
    it('should return a list of services', async () => {
      const response = await request(app).get('/api/services');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
    
    it('should apply filters correctly', async () => {
      const response = await request(app)
        .get('/api/services')
        .query({ isActive: 'true', search: 'integration' });
      
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].name).toContain('Integration');
    });
    
    it('should handle pagination', async () => {
      const response = await request(app)
        .get('/api/services')
        .query({ page: 1, limit: 5 });
      
      expect(response.status).toBe(200);
      expect(response.body.pagination).toEqual(expect.objectContaining({
        page: 1,
        limit: 5,
      }));
    });
  });
  
  describe('GET /services/active', () => {
    it('should return only active services', async () => {
      const response = await request(app).get('/api/services/active');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        expect(response.body[0].isActive).toBe(true);
      }
    });
  });
  
  describe('GET /services/:id', () => {
    it('should return a service by ID', async () => {
      const response = await request(app).get(`/api/services/${serviceId}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', serviceId);
      expect(response.body).toHaveProperty('name', 'Integration Test Service');
    });
    
    it('should return 404 for non-existent service', async () => {
      const response = await request(app).get('/api/services/nonexistent-id');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('POST /services', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/services')
        .send({
          name: 'New Service',
          description: 'Service description',
          price: 19.99,
        });
      
      expect(response.status).toBe(401);
    });
    
    it('should create a new service when authenticated', async () => {
      const newService = {
        name: 'Created Service',
        description: 'This service was created during integration testing',
        price: 39.99,
      };
      
      const response = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newService);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', newService.name);
      expect(response.body).toHaveProperty('price', newService.price);
    });
    
    it('should validate input data', async () => {
      const invalidService = {
        name: 'A', // too short
        description: 'Short', // too short
        price: -10, // negative price
      };
      
      const response = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidService);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('PUT /services/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/services/${serviceId}`)
        .send({
          name: 'Updated Name',
        });
      
      expect(response.status).toBe(401);
    });
    
    it('should update a service when authenticated', async () => {
      const updateData = {
        name: 'Updated Service Name',
        price: 49.99,
      };
      
      const response = await request(app)
        .put(`/api/services/${serviceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', updateData.name);
      expect(response.body).toHaveProperty('price', updateData.price);
    });
    
    it('should return 404 for non-existent service', async () => {
      const response = await request(app)
        .put('/api/services/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Should Fail' });
      
      expect(response.status).toBe(404);
    });
  });
  
  describe('DELETE /services/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app).delete(`/api/services/${serviceId}`);
      
      expect(response.status).toBe(401);
    });
    
    it('should delete a service when authenticated', async () => {
      const response = await request(app)
        .delete(`/api/services/${serviceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send();
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
    
    it('should return 404 for non-existent service', async () => {
      const response = await request(app)
        .delete('/api/services/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send();
      
      expect(response.status).toBe(404);
    });
  });
}); 