import axios from 'axios';
import { CreateServiceDto, Service, ServiceFilters, UpdateServiceDto } from '../types/service';

const API_URL = import.meta.env.VITE_API_URL || '';
const SERVICES_ENDPOINT = API_URL ? `${API_URL}/api/services` : '/api/services';

// Get authentication token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const serviceApi = {
  // Get all services with optional filters
  async getServices(
    filters?: ServiceFilters,
    page = 1,
    limit = 10
  ) {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    
    if (filters?.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString());
    if (filters?.search) queryParams.append('search', filters.search);
    
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    
    const response = await axios.get(`${SERVICES_ENDPOINT}?${queryParams.toString()}`);
    return response.data;
  },
  
  // Get all active services
  async getActiveServices() {
    const response = await axios.get(`${SERVICES_ENDPOINT}/active`);
    return response.data as Service[];
  },
  
  // Get a service by ID
  async getServiceById(id: string) {
    const response = await axios.get(`${SERVICES_ENDPOINT}/${id}`);
    return response.data as Service;
  },
  
  // Create a new service
  async createService(data: CreateServiceDto) {
    const response = await axios.post(SERVICES_ENDPOINT, data, getAuthHeader());
    return response.data as Service;
  },
  
  // Update a service
  async updateService(id: string, data: UpdateServiceDto) {
    const response = await axios.put(`${SERVICES_ENDPOINT}/${id}`, data, getAuthHeader());
    return response.data as Service;
  },
  
  // Delete a service
  async deleteService(id: string) {
    const response = await axios.delete(`${SERVICES_ENDPOINT}/${id}`, getAuthHeader());
    return response.data;
  },
  
  // Toggle service active status
  async toggleServiceStatus(id: string) {
    const service = await this.getServiceById(id);
    return this.updateService(id, { isActive: !service.isActive });
  }
}; 