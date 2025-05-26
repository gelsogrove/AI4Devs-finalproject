import { Request, Response } from 'express';
import faqController from '../../src/controllers/faq.controller';
import faqService from '../../src/services/faq.service';

// Mock the FAQ service
jest.mock('../../src/services/faq.service');

describe('FAQ Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: any;

  beforeEach(() => {
    mockRequest = {};
    responseObject = {};
    mockResponse = {
      json: jest.fn().mockImplementation((result) => {
        responseObject = result;
        return mockResponse;
      }),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe('getFAQs', () => {
    it('should return FAQs with pagination', async () => {
      const mockFAQs = {
        data: [
          {
            id: '1',
            question: 'Test Question?',
            answer: 'Test Answer',
            category: 'General',
            isPublished: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      (faqService.getFAQs as jest.Mock).mockResolvedValue(mockFAQs);

      mockRequest.query = {
        page: '1',
        limit: '10',
        category: 'General',
        search: 'test',
      };

      await faqController.getFAQs(mockRequest as Request, mockResponse as Response);

      expect(faqService.getFAQs).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        category: 'General',
        search: 'test',
      });
      expect(responseObject).toEqual(mockFAQs);
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      (faqService.getFAQs as jest.Mock).mockRejectedValue(error);

      await faqController.getFAQs(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject).toEqual({
        error: 'Failed to fetch FAQs',
        details: error.message,
      });
    });
  });

  describe('getPublicFAQs', () => {
    it('should return all FAQs', async () => {
      const mockFAQs = [
        {
          id: '1',
          question: 'Test Question?',
          answer: 'Test Answer',
          category: 'General',
          isPublished: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (faqService.getAllFAQs as jest.Mock).mockResolvedValue(mockFAQs);

      mockRequest.query = {
        category: 'General',
      };

      await faqController.getPublicFAQs(mockRequest as Request, mockResponse as Response);

      expect(faqService.getAllFAQs).toHaveBeenCalledWith('General');
      expect(responseObject).toEqual(mockFAQs);
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      (faqService.getAllFAQs as jest.Mock).mockRejectedValue(error);

      await faqController.getPublicFAQs(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject).toEqual({
        error: 'Failed to get FAQs',
      });
    });
  });

  describe('getFAQById', () => {
    it('should return a single FAQ', async () => {
      const mockFAQ = {
        id: '1',
        question: 'Test Question?',
        answer: 'Test Answer',
        category: 'General',
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (faqService.getFAQById as jest.Mock).mockResolvedValue(mockFAQ);

      mockRequest.params = { id: '1' };

      await faqController.getFAQById(mockRequest as Request, mockResponse as Response);

      expect(faqService.getFAQById).toHaveBeenCalledWith('1');
      expect(responseObject).toEqual(mockFAQ);
    });

    it('should handle not found error', async () => {
      const error = new Error('FAQ not found');
      (faqService.getFAQById as jest.Mock).mockRejectedValue(error);

      mockRequest.params = { id: '999' };

      await faqController.getFAQById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject).toEqual({
        error: 'FAQ not found',
      });
    });

    it('should handle other errors', async () => {
      const error = new Error('Test error');
      (faqService.getFAQById as jest.Mock).mockRejectedValue(error);

      mockRequest.params = { id: '1' };

      await faqController.getFAQById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject).toEqual({
        error: 'Failed to fetch FAQ',
        details: error.message,
      });
    });
  });

  describe('createFAQ', () => {
    it('should create a new FAQ', async () => {
      const mockFAQ = {
        id: '1',
        question: 'Test Question?',
        answer: 'Test Answer',
        category: 'General',
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (faqService.createFAQ as jest.Mock).mockResolvedValue(mockFAQ);

      mockRequest.body = {
        question: 'Test Question?',
        answer: 'Test Answer',
        category: 'General',
      };

      await faqController.createFAQ(mockRequest as Request, mockResponse as Response);

      expect(faqService.createFAQ).toHaveBeenCalledWith(mockRequest.body);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(responseObject).toEqual(mockFAQ);
    });

    it('should handle validation errors', async () => {
      const error = new Error('Validation error');
      (faqService.createFAQ as jest.Mock).mockRejectedValue(error);

      mockRequest.body = {
        question: '', // Invalid empty question
        answer: 'Test Answer',
      };

      await faqController.createFAQ(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject).toEqual({
        error: 'Failed to create FAQ',
        details: error.message,
      });
    });
  });

  describe('updateFAQ', () => {
    it('should update an existing FAQ', async () => {
      const mockFAQ = {
        id: '1',
        question: 'Updated Question?',
        answer: 'Updated Answer',
        category: 'General',
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (faqService.updateFAQ as jest.Mock).mockResolvedValue(mockFAQ);

      mockRequest.params = { id: '1' };
      mockRequest.body = {
        question: 'Updated Question?',
        answer: 'Updated Answer',
      };

      await faqController.updateFAQ(mockRequest as Request, mockResponse as Response);

      expect(faqService.updateFAQ).toHaveBeenCalledWith('1', mockRequest.body);
      expect(responseObject).toEqual(mockFAQ);
    });

    it('should handle not found error', async () => {
      const error = new Error('FAQ not found');
      (faqService.updateFAQ as jest.Mock).mockRejectedValue(error);

      mockRequest.params = { id: '999' };
      mockRequest.body = {
        question: 'Updated Question?',
      };

      await faqController.updateFAQ(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject).toEqual({
        error: 'FAQ not found',
      });
    });

    it('should handle other errors', async () => {
      const error = new Error('Test error');
      (faqService.updateFAQ as jest.Mock).mockRejectedValue(error);

      mockRequest.params = { id: '1' };
      mockRequest.body = {
        question: 'Updated Question?',
      };

      await faqController.updateFAQ(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject).toEqual({
        error: 'Failed to update FAQ',
        details: error.message,
      });
    });
  });

  describe('deleteFAQ', () => {
    it('should delete an existing FAQ', async () => {
      (faqService.deleteFAQ as jest.Mock).mockResolvedValue({
        success: true,
        message: 'FAQ deleted successfully',
      });

      mockRequest.params = { id: '1' };

      await faqController.deleteFAQ(mockRequest as Request, mockResponse as Response);

      expect(faqService.deleteFAQ).toHaveBeenCalledWith('1');
      expect(responseObject).toEqual({
        success: true,
        message: 'FAQ deleted successfully',
      });
    });

    it('should handle not found error', async () => {
      const error = new Error('FAQ not found');
      (faqService.deleteFAQ as jest.Mock).mockRejectedValue(error);

      mockRequest.params = { id: '999' };

      await faqController.deleteFAQ(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject).toEqual({
        error: 'FAQ not found',
      });
    });

    it('should handle other errors', async () => {
      const error = new Error('Test error');
      (faqService.deleteFAQ as jest.Mock).mockRejectedValue(error);

      mockRequest.params = { id: '1' };

      await faqController.deleteFAQ(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject).toEqual({
        error: 'Failed to delete FAQ',
        details: error.message,
      });
    });
  });

  describe('getCategories', () => {
    it('should return all categories', async () => {
      const mockCategories = ['General', 'Products', 'Shipping'];
      (faqService.getCategories as jest.Mock).mockResolvedValue(mockCategories);

      await faqController.getCategories(mockRequest as Request, mockResponse as Response);

      expect(faqService.getCategories).toHaveBeenCalled();
      expect(responseObject).toEqual(mockCategories);
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      (faqService.getCategories as jest.Mock).mockRejectedValue(error);

      await faqController.getCategories(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject).toEqual({
        error: 'Failed to fetch categories',
        details: error.message,
      });
    });
  });
}); 