import serviceService from '../../../src/services/service.service';

// Mock Prisma client
jest.mock('@prisma/client', () => {
  const mockFindMany = jest.fn();
  const mockCount = jest.fn();
  const mockFindUnique = jest.fn();
  const mockCreate = jest.fn();
  const mockUpdate = jest.fn();
  const mockDelete = jest.fn();
  
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      service: {
        findMany: mockFindMany,
        count: mockCount,
        findUnique: mockFindUnique,
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
      },
      $disconnect: jest.fn(),
    })),
    mockFindMany,
    mockCount,
    mockFindUnique,
    mockCreate,
    mockUpdate,
    mockDelete,
  };
});

const { mockFindMany, mockCount, mockFindUnique, mockCreate, mockUpdate, mockDelete } = jest.requireMock('@prisma/client');

describe('ServiceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockService = {
    id: '1',
    name: 'Test Service',
    description: 'Test Description',
    price: 9.99,
    isActive: true,
    tagsJson: '[]',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockServiceWithTags = {
    ...mockService,
    tags: [],
  };

  describe('getServices', () => {
    it('should get all services with pagination', async () => {
      // Arrange
      mockFindMany.mockResolvedValue([mockService]);

      // Act
      const result = await serviceService.getServices();

      // Assert
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
      });
      
      expect(result).toEqual({
        data: [mockServiceWithTags],
        pagination: {
          page: 1,
          limit: 1, // Based on the returned array length
          total: 1,
          totalPages: 1,
        },
      });
    });

    it('should apply filters correctly', async () => {
      // Arrange
      mockFindMany.mockResolvedValue([mockService]);
      const filters = {
        search: 'test',
      };

      // Act
      const result = await serviceService.getServices(filters);

      // Assert
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'test' } },
            { description: { contains: 'test' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result.data).toHaveLength(1);
    });

    it('should throw error when database query fails', async () => {
      // Arrange
      mockFindMany.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(serviceService.getServices()).rejects.toThrow('Failed to get services');
    });
  });

  describe('getAllServices', () => {
    it('should get all services', async () => {
      // Arrange
      mockFindMany.mockResolvedValue([mockService]);

      // Act
      const result = await serviceService.getAllServices();

      // Assert
      expect(mockFindMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockServiceWithTags]);
    });

    it('should throw error when database query fails', async () => {
      // Arrange
      mockFindMany.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(serviceService.getAllServices()).rejects.toThrow('Failed to get services');
    });
  });

  describe('getServiceById', () => {
    it('should get a service by ID', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue(mockService);

      // Act
      const result = await serviceService.getServiceById('1');

      // Assert
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual(mockServiceWithTags);
    });

    it('should throw error when service not found', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(serviceService.getServiceById('1')).rejects.toThrow('Service not found');
    });
  });

  describe('createService', () => {
    it('should create a new service', async () => {
      // Arrange
      const newService = {
        name: 'New Service',
        description: 'New Description',
        price: 19.99,
        tags: [],
      };
      
      const newServiceDb = {
        ...newService,
        tagsJson: '[]',
        id: '2',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Create a new object without the tags property instead of using delete
      const newServiceForDb = {
        name: newService.name,
        description: newService.description,
        price: newService.price,
        tagsJson: '[]',
        id: '2',
        isActive: true,
        createdAt: newServiceDb.createdAt,
        updatedAt: newServiceDb.updatedAt,
      };
      
      mockCreate.mockResolvedValue(newServiceForDb);

      // Act
      const result = await serviceService.createService(newService);

      // Assert
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          name: 'New Service',
          description: 'New Description',
          price: 19.99,
          tagsJson: '[]',
        },
      });
      expect(result).toMatchObject({
        ...newServiceDb,
        tags: [],
      });
    });

    it('should throw error when database operation fails', async () => {
      // Arrange
      mockCreate.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(serviceService.createService({
        name: 'Error Service',
        description: 'Error Description',
        price: 29.99,
      })).rejects.toThrow('Failed to create service');
    });
  });

  describe('updateService', () => {
    it('should update an existing service', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue(mockService);
      
      const updateData = {
        name: 'Updated Service',
        price: 29.99,
      };
      
      const updatedService = {
        ...mockService,
        ...updateData,
      };
      
      mockUpdate.mockResolvedValue(updatedService);

      // Act
      const result = await serviceService.updateService('1', updateData);

      // Assert
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateData,
      });
      expect(result).toEqual({
        ...updatedService,
        tags: [],
      });
    });

    it('should update tags correctly', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue(mockService);
      
      const updateData = {
        name: 'Updated Service',
        tags: ['tag1', 'tag2'],
      };
      
      const updatedService = {
        ...mockService,
        name: 'Updated Service',
        tagsJson: '["tag1","tag2"]',
      };
      
      mockUpdate.mockResolvedValue(updatedService);

      // Act
      const result = await serviceService.updateService('1', updateData);

      // Assert
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          name: 'Updated Service',
          tagsJson: '["tag1","tag2"]',
        },
      });
      expect(result).toEqual({
        ...updatedService,
        tags: ['tag1', 'tag2'],
      });
    });

    it('should throw error when service not found', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(serviceService.updateService('999', { name: 'Not Found' })).rejects.toThrow('Service not found');
    });
  });

  describe('deleteService', () => {
    it('should delete a service successfully', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue(mockService);
      mockDelete.mockResolvedValue(mockService);

      // Act
      const result = await serviceService.deleteService('1');

      // Assert
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockDelete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual({ success: true, message: 'Service deleted successfully' });
    });

    it('should throw error when service not found', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(serviceService.deleteService('999')).rejects.toThrow('Service not found');
    });
  });
}); 