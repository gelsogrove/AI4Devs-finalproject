import { expect } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app';

// Mock user for testing
const testUser = {
  email: 'test@example.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'User'
};

describe('Auth API Integration Tests', () => {
  describe('POST /api/auth/login', () => {
    it('should authenticate user with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });
  });
  
  describe('GET /api/auth/profile', () => {
    let authToken: string;
    
    beforeEach(async () => {
      // Login to get token
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      authToken = response.body.token;
    });
    
    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
    });
  });
}); // test
