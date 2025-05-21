import { Request, Response } from 'express';
import faqController from '../../src/controllers/faq.controller';
import faqService from '../../src/services/faq.service';

// Mock the FAQ service
jest.mock('../../src/services/faq.service');

describe('FAQ Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;
  
  beforeEach(() => {
    responseJson = jest.fn().mockReturnThis();
    responseStatus = jest.fn().mockImplementation(() => ({ json: responseJson }));
    
    mockRequest = {
      body: {},
      params: {},
      query: {},
    };
    
    mockResponse = {
      status: responseStatus,
      json: responseJson,
    };
    
    jest.clearAllMocks();
  });
  
  describe('createFAQ', () => {
    const validFAQData = {
      question: 'This is a test question?',
      answer: 'This is a test answer with sufficient length.',
      category: 'Test Category',
    };
    
    it('should create an FAQ successfully', async () => {
      mockRequest.body = validFAQData;
      
      const mockFAQ = { id: '123', ...validFAQData, isPublished: true, createdAt: new Date(), updatedAt: new Date() };
      
      (faqService.createFAQ as jest.Mock).mockResolvedValue(mockFAQ);
      
      await faqController.createFAQ(mockRequest as Request, mockResponse as Response);
      
      expect(faqService.createFAQ).toHaveBeenCalledWith(validFAQData);
      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith({
        message: 'FAQ created successfully',
        faq: mockFAQ,
      });
    });
    
    it('should return 400 for validation errors', async () => {
      mockRequest.body = {
        question: 'Q?', // Too short
        answer: 'A', // Too short
      };
      
      await faqController.createFAQ(mockRequest as Request, mockResponse as Response);
      
      expect(faqService.createFAQ).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation error',
          details: expect.any(Array),
        })
      );
    });
    
    it('should handle service errors', async () => {
      mockRequest.body = validFAQData;
      
      const error = new Error('Database error');
      (faqService.createFAQ as jest.Mock).mockRejectedValue(error);
      
      await faqController.createFAQ(mockRequest as Request, mockResponse as Response);
      
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });
  
  describe('getFAQs', () => {
    it('should get FAQs with default pagination', async () => {
      const mockFAQsResult = {
        data: [{ id: '123', question: 'Test Question?' }],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };
      
      (faqService.getFAQs as jest.Mock).mockResolvedValue(mockFAQsResult);
      
      await faqController.getFAQs(mockRequest as Request, mockResponse as Response);
      
      expect(faqService.getFAQs).toHaveBeenCalledWith(
        { category: undefined, isPublished: undefined, search: undefined },
        1,
        10
      );
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(mockFAQsResult);
    });
    
    it('should apply filters from query', async () => {
      mockRequest.query = {
        category: 'General',
        isPublished: 'true',
        search: 'test',
        page: '2',
        limit: '20',
      };
      
      const mockFAQsResult = {
        data: [],
        pagination: {
          page: 2,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      };
      
      (faqService.getFAQs as jest.Mock).mockResolvedValue(mockFAQsResult);
      
      await faqController.getFAQs(mockRequest as Request, mockResponse as Response);
      
      expect(faqService.getFAQs).toHaveBeenCalledWith(
        {
          category: 'General',
          isPublished: true,
          search: 'test',
        },
        2,
        20
      );
    });
    
    it('should handle service errors', async () => {
      (faqService.getFAQs as jest.Mock).mockRejectedValue(new Error('Service error'));
      
      await faqController.getFAQs(mockRequest as Request, mockResponse as Response);
      
      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Failed to get FAQs' });
    });
  });
  
  describe('getPublicFAQs', () => {
    it('should get public FAQs', async () => {
      const mockFAQs = [{ id: '123', question: 'Test Question?', isPublished: true }];
      
      (faqService.getPublicFAQs as jest.Mock).mockResolvedValue(mockFAQs);
      
      await faqController.getPublicFAQs(mockRequest as Request, mockResponse as Response);
      
      expect(faqService.getPublicFAQs).toHaveBeenCalledWith(undefined);
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(mockFAQs);
    });
    
    it('should filter by category if provided', async () => {
      mockRequest.query = { category: 'General' };
      
      await faqController.getPublicFAQs(mockRequest as Request, mockResponse as Response);
      
      expect(faqService.getPublicFAQs).toHaveBeenCalledWith('General');
    });
    
    it('should handle service errors', async () => {
      (faqService.getPublicFAQs as jest.Mock).mockRejectedValue(new Error('Service error'));
      
      await faqController.getPublicFAQs(mockRequest as Request, mockResponse as Response);
      
      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Failed to get FAQs' });
    });
  });
  
  describe('getFAQById', () => {
    it('should return an FAQ when found', async () => {
      mockRequest.params = { id: '123' };
      
      const mockFAQ = { id: '123', question: 'Test Question?' };
      (faqService.getFAQById as jest.Mock).mockResolvedValue(mockFAQ);
      
      await faqController.getFAQById(mockRequest as Request, mockResponse as Response);
      
      expect(faqService.getFAQById).toHaveBeenCalledWith('123');
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(mockFAQ);
    });
    
    it('should return 404 when FAQ not found', async () => {
      mockRequest.params = { id: '999' };
      
      const error = new Error('FAQ not found');
      (faqService.getFAQById as jest.Mock).mockRejectedValue(error);
      
      await faqController.getFAQById(mockRequest as Request, mockResponse as Response);
      
      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({ error: 'FAQ not found' });
    });
  });
  
  describe('updateFAQ', () => {
    const updateData = {
      question: 'Updated Question?',
      answer: 'This is an updated answer with sufficient length.',
    };
    
    it('should update an FAQ successfully', async () => {
      mockRequest.params = { id: '123' };
      mockRequest.body = updateData;
      
      const mockFAQ = { id: '123', ...updateData };
      (faqService.updateFAQ as jest.Mock).mockResolvedValue(mockFAQ);
      
      await faqController.updateFAQ(mockRequest as Request, mockResponse as Response);
      
      expect(faqService.updateFAQ).toHaveBeenCalledWith('123', updateData);
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        message: 'FAQ updated successfully',
        faq: mockFAQ,
      });
    });
    
    it('should return 400 for validation errors', async () => {
      mockRequest.params = { id: '123' };
      mockRequest.body = {
        question: 'Q?', // Too short
      };
      
      await faqController.updateFAQ(mockRequest as Request, mockResponse as Response);
      
      expect(faqService.updateFAQ).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
    });
    
    it('should return 404 when FAQ not found', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = updateData;
      
      const error = new Error('FAQ not found');
      (faqService.updateFAQ as jest.Mock).mockRejectedValue(error);
      
      await faqController.updateFAQ(mockRequest as Request, mockResponse as Response);
      
      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({ error: 'FAQ not found' });
    });
  });
  
  describe('deleteFAQ', () => {
    it('should delete an FAQ successfully', async () => {
      mockRequest.params = { id: '123' };
      
      const mockResult = { success: true, message: 'FAQ deleted successfully' };
      (faqService.deleteFAQ as jest.Mock).mockResolvedValue(mockResult);
      
      await faqController.deleteFAQ(mockRequest as Request, mockResponse as Response);
      
      expect(faqService.deleteFAQ).toHaveBeenCalledWith('123');
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(mockResult);
    });
    
    it('should return 404 when FAQ not found', async () => {
      mockRequest.params = { id: '999' };
      
      const error = new Error('FAQ not found');
      (faqService.deleteFAQ as jest.Mock).mockRejectedValue(error);
      
      await faqController.deleteFAQ(mockRequest as Request, mockResponse as Response);
      
      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({ error: 'FAQ not found' });
    });
  });
  
  describe('toggleFAQStatus', () => {
    it('should toggle FAQ status successfully', async () => {
      mockRequest.params = { id: '123' };
      
      const mockFAQ = { id: '123', isPublished: true };
      (faqService.toggleFAQStatus as jest.Mock).mockResolvedValue(mockFAQ);
      
      await faqController.toggleFAQStatus(mockRequest as Request, mockResponse as Response);
      
      expect(faqService.toggleFAQStatus).toHaveBeenCalledWith('123');
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        message: 'FAQ published successfully',
        faq: mockFAQ,
      });
    });
    
    it('should customize message based on isPublished value', async () => {
      mockRequest.params = { id: '123' };
      
      const mockFAQ = { id: '123', isPublished: false };
      (faqService.toggleFAQStatus as jest.Mock).mockResolvedValue(mockFAQ);
      
      await faqController.toggleFAQStatus(mockRequest as Request, mockResponse as Response);
      
      expect(responseJson).toHaveBeenCalledWith({
        message: 'FAQ unpublished successfully',
        faq: mockFAQ,
      });
    });
    
    it('should return 404 when FAQ not found', async () => {
      mockRequest.params = { id: '999' };
      
      const error = new Error('FAQ not found');
      (faqService.toggleFAQStatus as jest.Mock).mockRejectedValue(error);
      
      await faqController.toggleFAQStatus(mockRequest as Request, mockResponse as Response);
      
      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({ error: 'FAQ not found' });
    });
  });
  
  describe('getCategories', () => {
    it('should return FAQ categories', async () => {
      const mockCategories = ['General', 'Products', 'Shipping'];
      (faqService.getCategories as jest.Mock).mockResolvedValue(mockCategories);
      
      await faqController.getCategories(mockRequest as Request, mockResponse as Response);
      
      expect(faqService.getCategories).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(mockCategories);
    });
    
    it('should handle service errors', async () => {
      (faqService.getCategories as jest.Mock).mockRejectedValue(new Error('Service error'));
      
      await faqController.getCategories(mockRequest as Request, mockResponse as Response);
      
      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({ error: 'Failed to get categories' });
    });
  });
}); 