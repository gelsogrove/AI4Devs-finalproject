import { PrismaClient } from '@prisma/client';
import faqService from '../../src/services/faq.service';

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockFAQFindMany = jest.fn();
  const mockFAQCount = jest.fn();
  const mockFAQCreate = jest.fn();
  const mockFAQFindUnique = jest.fn();
  const mockFAQUpdate = jest.fn();
  const mockFAQDelete = jest.fn();
  
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      fAQ: {
        findMany: mockFAQFindMany,
        count: mockFAQCount,
        create: mockFAQCreate,
        findUnique: mockFAQFindUnique,
        update: mockFAQUpdate,
        delete: mockFAQDelete,
      },
      $disconnect: jest.fn(),
    })),
  };
});

describe('FAQ Service', () => {
  let prisma: PrismaClient;
  
  beforeEach(() => {
    prisma = new PrismaClient();
    jest.clearAllMocks();
  });
  
  const mockFAQ = {
    id: '123',
    question: 'Test Question?',
    answer: 'This is a test answer.',
    category: 'Test Category',
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  describe('createFAQ', () => {
    it('should create an FAQ successfully', async () => {
      const createData = {
        question: 'Test Question?',
        answer: 'This is a test answer.',
        category: 'Test Category',
      };
      
      (prisma.fAQ.create as jest.Mock).mockResolvedValue(mockFAQ);
      
      const result = await faqService.createFAQ(createData);
      
      expect(prisma.fAQ.create).toHaveBeenCalledWith({
        data: {
          ...createData,
          isPublished: true,
        },
      });
      
      expect(result).toEqual(mockFAQ);
    });
    
    it('should set isPublished based on provided value', async () => {
      const createData = {
        question: 'Test Question?',
        answer: 'This is a test answer.',
        category: 'Test Category',
        isPublished: false,
      };
      
      (prisma.fAQ.create as jest.Mock).mockResolvedValue({
        ...mockFAQ,
        isPublished: false,
      });
      
      await faqService.createFAQ(createData);
      
      expect(prisma.fAQ.create).toHaveBeenCalledWith({
        data: createData,
      });
    });
    
    it('should throw an error if creation fails', async () => {
      const createData = {
        question: 'Test Question?',
        answer: 'This is a test answer.',
      };
      
      const error = new Error('Database error');
      (prisma.fAQ.create as jest.Mock).mockRejectedValue(error);
      
      await expect(faqService.createFAQ(createData)).rejects.toThrow('Failed to create FAQ');
    });
  });
  
  describe('getFAQs', () => {
    it('should get FAQs with pagination', async () => {
      const mockFAQs = [mockFAQ];
      const mockTotal = 1;
      
      (prisma.fAQ.findMany as jest.Mock).mockResolvedValue(mockFAQs);
      (prisma.fAQ.count as jest.Mock).mockResolvedValue(mockTotal);
      
      const result = await faqService.getFAQs();
      
      expect(prisma.fAQ.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      
      expect(prisma.fAQ.count).toHaveBeenCalledWith({ where: {} });
      
      expect(result).toEqual({
        data: mockFAQs,
        pagination: {
          page: 1,
          limit: 10,
          total: mockTotal,
          totalPages: Math.ceil(mockTotal / 10),
        },
      });
    });
    
    it('should apply filters correctly', async () => {
      const filters = {
        category: 'General',
        isPublished: true,
        search: 'test',
      };
      
      (prisma.fAQ.findMany as jest.Mock).mockResolvedValue([mockFAQ]);
      (prisma.fAQ.count as jest.Mock).mockResolvedValue(1);
      
      await faqService.getFAQs(filters);
      
      const expectedWhere = {
        category: 'General',
        isPublished: true,
        OR: [
          { question: { contains: 'test', mode: 'insensitive' } },
          { answer: { contains: 'test', mode: 'insensitive' } },
        ],
      };
      
      expect(prisma.fAQ.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expectedWhere,
        })
      );
      
      expect(prisma.fAQ.count).toHaveBeenCalledWith({ where: expectedWhere });
    });
  });
  
  describe('getAllFAQs', () => {
    it('should return all FAQs', async () => {
      (prisma.fAQ.findMany as jest.Mock).mockResolvedValue([mockFAQ]);
      
      const result = await faqService.getAllFAQs();
      
      expect(prisma.fAQ.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
      });
      
      expect(result).toEqual([mockFAQ]);
    });
    
    it('should filter by category if provided', async () => {
      (prisma.fAQ.findMany as jest.Mock).mockResolvedValue([mockFAQ]);
      
      await faqService.getAllFAQs('General');
      
      expect(prisma.fAQ.findMany).toHaveBeenCalledWith({
        where: { category: 'General' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });
  
  describe('getFAQById', () => {
    it('should return an FAQ when found', async () => {
      (prisma.fAQ.findUnique as jest.Mock).mockResolvedValue(mockFAQ);
      
      const result = await faqService.getFAQById('123');
      
      expect(prisma.fAQ.findUnique).toHaveBeenCalledWith({
        where: { id: '123' },
      });
      
      expect(result).toEqual(mockFAQ);
    });
    
    it('should throw an error when FAQ not found', async () => {
      (prisma.fAQ.findUnique as jest.Mock).mockResolvedValue(null);
      
      await expect(faqService.getFAQById('999')).rejects.toThrow('FAQ not found');
    });
  });
  
  describe('updateFAQ', () => {
    it('should update an FAQ successfully', async () => {
      const updateData = {
        question: 'Updated Question?',
        answer: 'Updated answer.',
      };
      
      (prisma.fAQ.findUnique as jest.Mock).mockResolvedValue(mockFAQ);
      (prisma.fAQ.update as jest.Mock).mockResolvedValue({
        ...mockFAQ,
        ...updateData,
      });
      
      const result = await faqService.updateFAQ('123', updateData);
      
      expect(prisma.fAQ.findUnique).toHaveBeenCalledWith({
        where: { id: '123' },
      });
      
      expect(prisma.fAQ.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: updateData,
      });
      
      expect(result).toEqual({
        ...mockFAQ,
        ...updateData,
      });
    });
    
    it('should throw an error when FAQ not found', async () => {
      (prisma.fAQ.findUnique as jest.Mock).mockResolvedValue(null);
      
      await expect(faqService.updateFAQ('999', { question: 'Updated' })).rejects.toThrow('FAQ not found');
      expect(prisma.fAQ.update).not.toHaveBeenCalled();
    });
  });
  
  describe('deleteFAQ', () => {
    it('should delete an FAQ successfully', async () => {
      (prisma.fAQ.findUnique as jest.Mock).mockResolvedValue(mockFAQ);
      (prisma.fAQ.delete as jest.Mock).mockResolvedValue(mockFAQ);
      
      const result = await faqService.deleteFAQ('123');
      
      expect(prisma.fAQ.findUnique).toHaveBeenCalledWith({
        where: { id: '123' },
      });
      
      expect(prisma.fAQ.delete).toHaveBeenCalledWith({
        where: { id: '123' },
      });
      
      expect(result).toEqual({ success: true, message: 'FAQ deleted successfully' });
    });
    
    it('should throw an error when FAQ not found', async () => {
      (prisma.fAQ.findUnique as jest.Mock).mockResolvedValue(null);
      
      await expect(faqService.deleteFAQ('999')).rejects.toThrow('FAQ not found');
      expect(prisma.fAQ.delete).not.toHaveBeenCalled();
    });
  });
  
  describe('getCategories', () => {
    it('should return distinct categories', async () => {
      const categoryResults = [
        { category: 'General' },
        { category: 'Products' },
        { category: 'Shipping' },
      ];
      
      (prisma.fAQ.findMany as jest.Mock).mockResolvedValue(categoryResults);
      
      const result = await faqService.getCategories();
      
      expect(prisma.fAQ.findMany).toHaveBeenCalledWith({
        select: { category: true },
        distinct: ['category'],
        where: { 
          category: { not: null },
        },
      });
      
      expect(result).toEqual(['General', 'Products', 'Shipping']);
    });
    
    it('should filter out null categories', async () => {
      const categoryResults = [
        { category: 'General' },
        { category: null },
        { category: 'Shipping' },
      ];
      
      (prisma.fAQ.findMany as jest.Mock).mockResolvedValue(categoryResults);
      
      const result = await faqService.getCategories();
      
      expect(result).toEqual(['General', 'Shipping']);
    });
  });
}); 