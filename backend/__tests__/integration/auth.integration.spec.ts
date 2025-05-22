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
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body).toHaveProperty('message', 'Login successful');
    });
    
    it('should return 401 with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);
      
      expect(response.body).toHaveProperty('error', 'Invalid email or password');
    });
    
    it('should return 400 with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: testUser.password
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('error', 'Validation error');
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
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', testUser.email);
    });
    
    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      
      expect(response.body).toHaveProperty('error', 'Invalid token');
    });
    
    it('should return 401 with missing token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);
      
      expect(response.body).toHaveProperty('error', 'Authentication required');
    });
  });
}); 