import express from 'express';
import request from 'supertest';
import faqController from '../../src/controllers/faq.controller';
import faqService from '../../src/services/faq.service';
import createMockExpressApp from './mock/express.mock';

// Mock the FAQ service
jest.mock('../../src/services/faq.service');

describe('FAQ API Integration Tests', () => {
  let app: express.Express;
  let testFaqId: string;
  let authToken: string = 'test-token';

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

  beforeAll(() => {
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
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/faqs', () => {
    it('should get all FAQs', async () => {
      const response = await request(app).get('/api/faqs');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(faqService.getFAQs).toHaveBeenCalled();
    });

    it('should get FAQs with pagination', async () => {
      const response = await request(app).get('/api/faqs?page=1&limit=5');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('pagination');
      expect(faqService.getFAQs).toHaveBeenCalled();
    });
  });

  describe('GET /api/faqs/public', () => {
    it('should get public FAQs', async () => {
      const response = await request(app).get('/api/faqs/public');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(faqService.getPublicFAQs).toHaveBeenCalled();
    });
  });

  describe('GET /api/faqs/categories', () => {
    it('should get FAQ categories', async () => {
      const response = await request(app).get('/api/faqs/categories');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(faqService.getCategories).toHaveBeenCalled();
    });
  });

  describe('GET /api/faqs/:id', () => {
    it('should get a specific FAQ by ID', async () => {
      const response = await request(app).get(`/api/faqs/${testFaq.id}`);
      
      expect(response.status).toBe(200);
      expect(faqService.getFAQById).toHaveBeenCalledWith(testFaq.id);
    });

    it('should return 404 for non-existent FAQ ID', async () => {
      const response = await request(app).get('/api/faqs/non-existent-id');
      
      expect(response.status).toBe(404);
      expect(faqService.getFAQById).toHaveBeenCalledWith('non-existent-id');
    });
  });

  describe('POST /api/faqs', () => {
    it('should create a new FAQ', async () => {
      const newFaq = {
        question: 'New Test Question',
        answer: 'New Test Answer',
        category: 'Test Category',
      };

      const response = await request(app)
        .post('/api/faqs')
        .send(newFaq);
      
      expect(response.status).toBe(201);
      expect(faqService.createFAQ).toHaveBeenCalledWith(expect.objectContaining(newFaq));
    });
  });

  describe('PUT /api/faqs/:id', () => {
    it('should update a FAQ', async () => {
      const updatedData = {
        question: 'Updated Question',
        answer: 'Updated Answer',
      };

      const response = await request(app)
        .put(`/api/faqs/${testFaq.id}`)
        .send(updatedData);
      
      expect(response.status).toBe(200);
      expect(faqService.updateFAQ).toHaveBeenCalledWith(
        testFaq.id,
        expect.objectContaining(updatedData)
      );
    });
  });

  describe('PATCH /api/faqs/:id/toggle-status', () => {
    it('should toggle FAQ publication status', async () => {
      const response = await request(app)
        .patch(`/api/faqs/${testFaq.id}/toggle-status`);
      
      expect(response.status).toBe(200);
      expect(faqService.toggleFAQStatus).toHaveBeenCalledWith(testFaq.id);
    });
  });

  describe('DELETE /api/faqs/:id', () => {
    it('should delete a FAQ', async () => {
      const response = await request(app)
        .delete(`/api/faqs/${testFaq.id}`);
      
      expect(response.status).toBe(200);
      expect(faqService.deleteFAQ).toHaveBeenCalledWith(testFaq.id);
    });
  });
}); 