import express from 'express';
import request from 'supertest';
import faqController from '../../src/controllers/faq.controller';
import { prisma } from '../../src/lib/prisma';
import faqService from '../../src/services/faq.service';
import { createTestUser, getAuthToken } from '../helpers/auth.helper';
import createMockExpressApp from './mock/express.mock';

// Mock the FAQ service
jest.mock('../../src/services/faq.service');

describe('FAQ API Integration Tests', () => {
  let app: express.Express;
  let testFaqId: string;
  let authToken: string;

  const testFaq = {
    id: '123-test-faq',
    question: 'Test Question',
    answer: 'Test Answer',
    category: 'Test Category',
    isPublished: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const faqListResponse = {
    data: [testFaq],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1
    }
  };

  beforeAll(async () => {
    // Create a mock Express app
    app = createMockExpressApp();

    // Setup FAQ routes
    app.get('/api/faqs', faqController.getFAQs);
    app.get('/api/faqs/public', faqController.getPublicFAQs);
    app.get('/api/faqs/categories', faqController.getCategories);
    app.get('/api/faqs/:id', faqController.getFAQById);
    app.post('/api/faqs', faqController.createFAQ);
    app.put('/api/faqs/:id', faqController.updateFAQ);
    app.delete('/api/faqs/:id', faqController.deleteFAQ);
    app.patch('/api/faqs/:id/toggle-status', faqController.toggleFAQStatus);

    // Mock the service methods
    (faqService.getFAQs as jest.Mock).mockResolvedValue(faqListResponse);
    (faqService.getPublicFAQs as jest.Mock).mockResolvedValue([testFaq]);
    (faqService.getFAQById as jest.Mock).mockImplementation((id) => {
      if (id === testFaq.id || id === 'new-faq-id') {
        return Promise.resolve(testFaq);
      }
      throw new Error('FAQ not found');
    });
    (faqService.createFAQ as jest.Mock).mockResolvedValue({...testFaq, id: 'new-faq-id'});
    (faqService.updateFAQ as jest.Mock).mockImplementation((id, data) => {
      return Promise.resolve({ ...testFaq, ...data });
    });
    (faqService.deleteFAQ as jest.Mock).mockResolvedValue({ id: testFaq.id });
    (faqService.toggleFAQStatus as jest.Mock).mockResolvedValue({ ...testFaq, isPublished: !testFaq.isPublished });
    (faqService.getCategories as jest.Mock).mockResolvedValue(['Test Category', 'Another Category']);

    // Create test user and get auth token
    const testUser = await createTestUser();
    authToken = await getAuthToken(testUser.email, 'password123');

    // Create a test FAQ
    const testFaq = await prisma.fAQ.create({
      data: {
        question: 'Test Question?',
        answer: 'This is a test answer.',
        category: 'Test Category',
        isPublished: true,
      },
    });
    testFaqId = testFaq.id;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.fAQ.deleteMany({
      where: {
        category: 'Test Category',
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: 'test@example.com',
      },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/faqs', () => {
    it('should get all FAQs with pagination', async () => {
      const response = await request(app)
        .get('/api/faqs')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter FAQs by category', async () => {
      const response = await request(app)
        .get('/api/faqs')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ category: 'Test Category' });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: 'Test Category',
          }),
        ])
      );
    });

    it('should search FAQs by text', async () => {
      const response = await request(app)
        .get('/api/faqs')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'Test Question' });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            question: 'Test Question?',
          }),
        ])
      );
    });
  });

  describe('GET /api/faqs/public', () => {
    it('should get all public FAQs', async () => {
      const response = await request(app)
        .get('/api/faqs/public');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            isPublished: true,
          }),
        ])
      );
    });

    it('should filter public FAQs by category', async () => {
      const response = await request(app)
        .get('/api/faqs/public')
        .query({ category: 'Test Category' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: 'Test Category',
            isPublished: true,
          }),
        ])
      );
    });
  });

  describe('GET /api/faqs/:id', () => {
    it('should get a specific FAQ', async () => {
      const response = await request(app)
        .get(`/api/faqs/${testFaqId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: testFaqId,
        question: 'Test Question?',
        answer: 'This is a test answer.',
        category: 'Test Category',
      });
    });

    it('should return 404 for non-existent FAQ', async () => {
      const response = await request(app)
        .get('/api/faqs/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'FAQ not found');
    });
  });

  describe('POST /api/faqs', () => {
    it('should create a new FAQ', async () => {
      const newFaq = {
        question: 'New Test Question?',
        answer: 'This is a new test answer.',
        category: 'Test Category',
      };

      const response = await request(app)
        .post('/api/faqs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newFaq);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        message: 'FAQ created successfully',
        faq: expect.objectContaining(newFaq),
      });
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/faqs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation error');
    });
  });

  describe('PUT /api/faqs/:id', () => {
    it('should update an existing FAQ', async () => {
      const updateData = {
        question: 'Updated Test Question?',
        answer: 'This is an updated test answer.',
      };

      const response = await request(app)
        .put(`/api/faqs/${testFaqId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        message: 'FAQ updated successfully',
        faq: expect.objectContaining(updateData),
      });
    });

    it('should return 404 for non-existent FAQ', async () => {
      const response = await request(app)
        .put('/api/faqs/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ question: 'Updated Question?' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'FAQ not found');
    });
  });

  describe('DELETE /api/faqs/:id', () => {
    it('should delete an existing FAQ', async () => {
      const response = await request(app)
        .delete(`/api/faqs/${testFaqId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: 'FAQ deleted successfully',
      });
    });

    it('should return 404 for non-existent FAQ', async () => {
      const response = await request(app)
        .delete('/api/faqs/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'FAQ not found');
    });
  });

  describe('GET /api/faqs/categories', () => {
    it('should get all FAQ categories', async () => {
      const response = await request(app)
        .get('/api/faqs/categories')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toContain('Test Category');
    });
  });
}); 