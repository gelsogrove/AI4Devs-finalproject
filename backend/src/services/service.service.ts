import { PrismaClient } from '@prisma/client';
import { CreateServiceDto, ServiceFilters, UpdateServiceDto } from '../domain';
import logger from '../utils/logger';

const prisma = new PrismaClient();

class ServiceService {
  /**
   * Create a new service
   */
  async createService(serviceData: CreateServiceDto) {
    try {
      // Convert tags array to JSON string
      const dataToSave = {
        ...serviceData,
        tagsJson: serviceData.tags ? JSON.stringify(serviceData.tags) : '[]'
      };
      
      // Remove tags field
      delete (dataToSave as any).tags;
      
      const service = await prisma.service.create({
        data: dataToSave,
      });
      
      // Add tags to the result
      return {
        ...service,
        tags: JSON.parse(service.tagsJson || '[]')
      };
    } catch (error) {
      logger.error('Error creating service:', error);
      throw new Error('Failed to create service');
    }
  }

  /**
   * Get all services with optional filters
   */
  async getServices(filters?: ServiceFilters) {
    try {
      const where: any = {};
      
      // Apply search filter if provided
      if (filters?.search) {
        where.OR = [
          { name: { contains: filters.search } },
          { description: { contains: filters.search } },
          // Not possible to search in tags with SQLite
        ];
      }
      
      // Get all services
      const services = await prisma.service.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
      
      // Add tags to each service
      const servicesWithTags = services.map(service => ({
        ...service,
        tags: JSON.parse(service.tagsJson || '[]')
      }));
      
      return {
        data: servicesWithTags,
        pagination: {
          page: 1,
          limit: services.length,
          total: services.length,
          totalPages: 1,
        },
      };
    } catch (error) {
      logger.error('Error getting services:', error);
      throw new Error('Failed to get services');
    }
  }

  /**
   * Get all services
   */
  async getAllServices() {
    try {
      const services = await prisma.service.findMany({
        orderBy: { createdAt: 'desc' },
      });
      
      // Add tags to each service
      return services.map(service => ({
        ...service,
        tags: JSON.parse(service.tagsJson || '[]')
      }));
    } catch (error) {
      logger.error('Error getting all services:', error);
      throw new Error('Failed to get services');
    }
  }

  /**
   * Get a service by ID
   */
  async getServiceById(id: string) {
    try {
      const service = await prisma.service.findUnique({
        where: { id },
      });
      
      if (!service) {
        throw new Error('Service not found');
      }
      
      // Add tags to the result
      return {
        ...service,
        tags: JSON.parse(service.tagsJson || '[]')
      };
    } catch (error) {
      logger.error(`Error getting service with ID ${id}:`, error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to get service');
    }
  }

  /**
   * Update a service
   */
  async updateService(id: string, serviceData: UpdateServiceDto) {
    try {
      // First check if the service exists
      const existingService = await prisma.service.findUnique({
        where: { id },
      });
      
      if (!existingService) {
        throw new Error('Service not found');
      }
      
      // Prepare data for update
      const dataToUpdate = { ...serviceData };
      
      // Convert tags array to JSON string if provided
      if (serviceData.tags) {
        (dataToUpdate as any).tagsJson = JSON.stringify(serviceData.tags);
        delete dataToUpdate.tags;
      }
      
      // Update the service
      const updatedService = await prisma.service.update({
        where: { id },
        data: dataToUpdate,
      });
      
      // Add tags to the result
      return {
        ...updatedService,
        tags: JSON.parse(updatedService.tagsJson || '[]')
      };
    } catch (error) {
      logger.error(`Error updating service with ID ${id}:`, error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update service');
    }
  }

  /**
   * Delete a service
   */
  async deleteService(id: string) {
    try {
      // First check if the service exists
      const existingService = await prisma.service.findUnique({
        where: { id },
      });
      
      if (!existingService) {
        throw new Error('Service not found');
      }
      
      // Delete the service
      await prisma.service.delete({
        where: { id },
      });
      
      return { success: true, message: 'Service deleted successfully' };
    } catch (error) {
      logger.error(`Error deleting service with ID ${id}:`, error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to delete service');
    }
  }
}

export default new ServiceService(); 