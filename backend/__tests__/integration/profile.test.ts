import { PrismaClient } from '@prisma/client';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { ProfileController } from '../../src/controllers/profile.controller';
import profileService from '../../src/services/profile.service';

// Mock JWT verification
jest.mock('jsonwebtoken');

// Mock authentication middleware
jest.mock('../../src/middlewares/auth.middleware', () => ({
  authenticate: jest.fn((req, res, next) => next()),
}));

const prisma = new PrismaClient();

describe('Profile API Integration Tests', () => {
  const mockUserId = 'user123';
  let authToken: string;
  let app: express.Application;
  let profileController: ProfileController;

  beforeAll(async () => {
    // Create and setup Express app directly
    app = express();
    
    // Middleware
    app.use(express.json());
    
    // Initialize controller
    profileController = new ProfileController(profileService);
    
    // Set up profile routes manually
    app.get('/api/profile', profileController.getProfile.bind(profileController));
    app.get('/api/profile/:id', profileController.getProfileById.bind(profileController));
    app.post('/api/profile', profileController.createProfile.bind(profileController));
    app.put('/api/profile/:id', profileController.updateProfile.bind(profileController));
    app.delete('/api/profile/:id', profileController.deleteProfile.bind(profileController));
    
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

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Setup auth token
    authToken = 'Bearer test-token';
  });

  describe('GET /api/profile', () => {
    it('should get the company profile', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('username');
      expect(response.body).toHaveProperty('companyName');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('address');
      expect(response.body).toHaveProperty('sector');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });
  });

  describe('GET /api/profile/:id', () => {
    it('should get profile by ID', async () => {
      // First get the profile to get a valid ID
      const profileResponse = await request(app)
        .get('/api/profile')
        .set('Authorization', authToken);
      
      const profileId = profileResponse.body.id;

      const response = await request(app)
        .get(`/api/profile/${profileId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('id', profileId);
      expect(response.body).toHaveProperty('username');
      expect(response.body).toHaveProperty('companyName');
    });

    it('should return 404 for non-existent profile', async () => {
      const response = await request(app)
        .get('/api/profile/non-existent-id')
        .set('Authorization', authToken)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Profile not found');
    });
  });

  describe('PUT /api/profile/:id', () => {
    it('should update profile successfully', async () => {
      // First get the profile to get a valid ID
      const profileResponse = await request(app)
        .get('/api/profile')
        .set('Authorization', authToken);
      
      const profileId = profileResponse.body.id;

      const updateData = {
        companyName: 'Gusto Italiano Updated',
        description: 'Updated description for our Italian food e-commerce platform',
        email: 'updated@gusto-italiano.com',
        website: 'https://www.updated-gusto-italiano.com',
        openingTime: 'Monday-Saturday: 8:00-19:00, Sunday: Closed',
        address: 'Via Roma 456, 00186 Roma, Italy',
        sector: 'Premium Italian Food E-commerce'
      };

      const response = await request(app)
        .put(`/api/profile/${profileId}`)
        .set('Authorization', authToken)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Profile updated successfully');
      expect(response.body.profile).toHaveProperty('companyName', updateData.companyName);
      expect(response.body.profile).toHaveProperty('description', updateData.description);
      expect(response.body.profile).toHaveProperty('email', updateData.email);
      expect(response.body.profile).toHaveProperty('website', updateData.website);
    });

    it('should validate required fields', async () => {
      // First get the profile to get a valid ID
      const profileResponse = await request(app)
        .get('/api/profile')
        .set('Authorization', authToken);
      
      const profileId = profileResponse.body.id;

      const invalidData = {
        companyName: '', // Empty required field
        email: 'invalid-email' // Invalid email format
      };

      const response = await request(app)
        .put(`/api/profile/${profileId}`)
        .set('Authorization', authToken)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation error');
      expect(response.body).toHaveProperty('details');
    });

    it('should return 404 for non-existent profile', async () => {
      const updateData = {
        companyName: 'Test Company'
      };

      const response = await request(app)
        .put('/api/profile/non-existent-id')
        .set('Authorization', authToken)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Profile not found');
    });
  });

  describe('POST /api/profile', () => {
    it('should not create duplicate profile with same username', async () => {
      const profileData = {
        username: 'gusto_italiano', // Same as existing
        companyName: 'Test Company',
        description: 'Test description for our company',
        phoneNumber: '+39 06 9876 5432',
        email: 'test@example.com',
        openingTime: 'Monday-Friday: 9:00-18:00',
        address: 'Test Address, Rome, Italy',
        sector: 'Test Sector'
      };

      const response = await request(app)
        .post('/api/profile')
        .set('Authorization', authToken)
        .send(profileData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Username already exists');
    });

    it('should validate required fields for creation', async () => {
      const invalidData = {
        username: 'test_user',
        companyName: '', // Empty required field
        description: 'short' // Too short
      };

      const response = await request(app)
        .post('/api/profile')
        .set('Authorization', authToken)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation error');
      expect(response.body).toHaveProperty('details');
    });
  });

  describe('DELETE /api/profile/:id', () => {
    it('should return 404 for non-existent profile deletion', async () => {
      const response = await request(app)
        .delete('/api/profile/non-existent-id')
        .set('Authorization', authToken)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Profile not found');
    });

    // Note: We don't actually delete the profile in tests to maintain data integrity
    // In a real scenario, you might want to create a test profile and then delete it
  });
}); 