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
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('getServices', () => {
    it('should get all services with pagination', async () => {
      // Arrange
      mockFindMany.mockResolvedValue([mockService]);
      mockCount.mockResolvedValue(1);

      // Act
      const result = await serviceService.getServices({}, 1, 10);

      // Assert
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      expect(mockCount).toHaveBeenCalledWith({ where: {} });
      expect(result).toEqual({
        data: [mockService],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });
    });

    it('should apply filters correctly', async () => {
      // Arrange
      mockFindMany.mockResolvedValue([mockService]);
      mockCount.mockResolvedValue(1);
      const filters = {
        isActive: true,
        search: 'test',
      };

      // Act
      const result = await serviceService.getServices(filters, 1, 10);

      // Assert
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          OR: [
            { name: { contains: 'test', mode: 'insensitive' } },
            { description: { contains: 'test', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 10,
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

  describe('getActiveServices', () => {
    it('should get all active services', async () => {
      // Arrange
      mockFindMany.mockResolvedValue([mockService]);

      // Act
      const result = await serviceService.getActiveServices();

      // Assert
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockService]);
    });

    it('should throw error when database query fails', async () => {
      // Arrange
      mockFindMany.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(serviceService.getActiveServices()).rejects.toThrow('Failed to get active services');
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
      expect(result).toEqual(mockService);
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
      };
      
      mockCreate.mockResolvedValue({
        ...newService,
        id: '2',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await serviceService.createService(newService);

      // Assert
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          ...newService,
          isActive: true,
        },
      });
      expect(result).toMatchObject({
        ...newService,
        id: '2',
        isActive: true,
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
      expect(result).toEqual(updatedService);
    });

    it('should throw error when service not found', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(serviceService.updateService('999', { name: 'Not Found' })).rejects.toThrow('Service not found');
    });
  });

  describe('deleteService', () => {
    it('should delete an existing service', async () => {
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