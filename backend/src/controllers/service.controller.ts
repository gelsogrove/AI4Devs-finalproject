import { Request, Response } from 'express';
import { z } from 'zod';
import serviceService from '../services/service.service';
import logger from '../utils/logger';

// Validation schemas
const createServiceSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.union([
    z.number().positive('Price must be a positive number'),
    z.string().transform((val) => parseFloat(val)),
  ]).refine((val) => !isNaN(val) && val > 0, {
    message: 'Price must be a positive number',
  }),
  tags: z.array(z.string()).optional(),
});

const updateServiceSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  price: z.union([
    z.number().positive('Price must be a positive number'),
    z.string().transform((val) => parseFloat(val)),
  ]).refine((val) => !isNaN(val) && val > 0, {
    message: 'Price must be a positive number',
  }).optional(),
  tags: z.array(z.string()).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

const filtersSchema = z.object({
  search: z.string().optional(),
});

class ServiceController {
  /**
   * Get all services with optional filters
   */
  async getServices(req: Request, res: Response) {
    try {
      // Parse and validate filters
      const { search } = filtersSchema.parse(req.query);
      
      // Get services
      const result = await serviceService.getServices({ search });
      
      return res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid query parameters', details: error.errors });
      }
      
      logger.error('Error in getServices controller:', error);
      return res.status(500).json({ error: 'Failed to get services' });
    }
  }

  /**
   * Get all services
   */
  async getAllServices(req: Request, res: Response) {
    try {
      const services = await serviceService.getAllServices();
      return res.json(services);
    } catch (error) {
      logger.error('Error in getAllServices controller:', error);
      return res.status(500).json({ error: 'Failed to get services' });
    }
  }

  /**
   * Get a service by ID
   */
  async getServiceById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const service = await serviceService.getServiceById(id);
      return res.json(service);
    } catch (error) {
      if (error instanceof Error && error.message === 'Service not found') {
        return res.status(404).json({ error: 'Service not found' });
      }
      
      logger.error(`Error in getServiceById controller for ID ${req.params.id}:`, error);
      return res.status(500).json({ error: 'Failed to get service' });
    }
  }

  /**
   * Create a new service
   */
  async createService(req: Request, res: Response) {
    try {
      // Validate input
      const serviceData = createServiceSchema.parse(req.body);
      
      // Create service
      const service = await serviceService.createService(serviceData);
      
      return res.status(201).json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      
      logger.error('Error in createService controller:', error);
      return res.status(500).json({ error: 'Failed to create service' });
    }
  }

  /**
   * Update a service
   */
  async updateService(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Validate input
      const serviceData = updateServiceSchema.parse(req.body);
      
      // Update service
      const service = await serviceService.updateService(id, serviceData);
      
      return res.json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      
      if (error instanceof Error && error.message === 'Service not found') {
        return res.status(404).json({ error: 'Service not found' });
      }
      
      logger.error(`Error in updateService controller for ID ${req.params.id}:`, error);
      return res.status(500).json({ error: 'Failed to update service' });
    }
  }

  /**
   * Delete a service
   */
  async deleteService(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await serviceService.deleteService(id);
      return res.json(result);
    } catch (error) {
      if (error instanceof Error && error.message === 'Service not found') {
        return res.status(404).json({ error: 'Service not found' });
      }
      
      logger.error(`Error in deleteService controller for ID ${req.params.id}:`, error);
      return res.status(500).json({ error: 'Failed to delete service' });
    }
  }
}

export default new ServiceController(); 