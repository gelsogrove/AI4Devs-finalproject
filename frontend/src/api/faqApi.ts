import axios from 'axios';
import { CreateFAQDto, FAQ, FAQFilters, UpdateFAQDto } from '../types/faq';

const API_URL = import.meta.env.VITE_API_URL || '';
const FAQS_ENDPOINT = API_URL ? `${API_URL}/api/faqs` : '/api/faqs';
const EMBEDDINGS_ENDPOINT = API_URL ? `${API_URL}/api/embeddings` : '/api/embeddings';

// Get authentication token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const faqApi = {
  // Get all FAQs with optional filters
  async getFAQs(
    filters?: FAQFilters,
    page = 1,
    limit = 10
  ) {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    
    if (filters?.category) queryParams.append('category', filters.category);
    if (filters?.search) queryParams.append('search', filters.search);
    
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    
    const response = await axios.get(`${FAQS_ENDPOINT}?${queryParams.toString()}`, getAuthHeader());
    return response.data;
  },
  
  // Get public FAQs
  async getPublicFAQs(category?: string) {
    const queryParams = new URLSearchParams();
    if (category) queryParams.append('category', category);
    
    const response = await axios.get(`${FAQS_ENDPOINT}/public?${queryParams.toString()}`);
    return response.data as FAQ[];
  },
  
  // Get a FAQ by ID
  async getFAQById(id: string) {
    const response = await axios.get(`${FAQS_ENDPOINT}/${id}`, getAuthHeader());
    return response.data as FAQ;
  },
  
  // Create a new FAQ
  async createFAQ(faq: CreateFAQDto) {
    const response = await axios.post(FAQS_ENDPOINT, faq, getAuthHeader());
    return response.data;
  },
  
  // Update an existing FAQ
  async updateFAQ(id: string, faq: UpdateFAQDto) {
    const response = await axios.put(`${FAQS_ENDPOINT}/${id}`, faq, getAuthHeader());
    return response.data;
  },
  
  // Delete a FAQ
  async deleteFAQ(id: string) {
    const response = await axios.delete(`${FAQS_ENDPOINT}/${id}`, getAuthHeader());
    return response.data;
  },
  
  // Get all FAQ categories
  async getCategories() {
    const response = await axios.get(`${FAQS_ENDPOINT}/categories`, getAuthHeader());
    return response.data as string[];
  },
  
  // Generate embeddings for a specific FAQ
  async generateEmbeddingsForFAQ(faqId: string) {
    const response = await axios.post(`${FAQS_ENDPOINT}/embeddings/${faqId}`, {}, getAuthHeader());
    return response.data;
  },
  
  // Generate embeddings for all FAQs
  async generateEmbeddingsForAllFAQs() {
    const response = await axios.post(`${FAQS_ENDPOINT}/embeddings`, {}, getAuthHeader());
    return response.data;
  },
  
  // Search FAQs using semantic similarity
  async searchFAQSemanticly(query: string) {
    const queryParams = new URLSearchParams();
    queryParams.append('query', query);
    
    const response = await axios.get(`${EMBEDDINGS_ENDPOINT}/faqs/search?${queryParams.toString()}`);
    return response.data as FAQ[];
  }
}; 